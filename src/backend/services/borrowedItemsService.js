// Borrowed Items Service - Quản lý vật phẩm đã mượn
import { db } from '../firebase/config';
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  where,
  Timestamp
} from 'firebase/firestore';
import { updateInventoryItem } from './inventoryService';

const BORROWED_ITEMS_COL = 'borrowed_items';

/**
 * Lấy danh sách vật phẩm đã mượn
 * @param {Object} options - Tùy chọn
 * @returns {Promise<Array>} - Danh sách vật phẩm đã mượn
 */
export async function listBorrowedItems(options = {}) {
  try {
    const colRef = collection(db, BORROWED_ITEMS_COL);
    let q = query(colRef, orderBy('borrowedAt', 'desc'));
    
    // Có thể thêm filter theo status nếu cần
    if (options.status) {
      q = query(colRef, where('status', '==', options.status), orderBy('borrowedAt', 'desc'));
    }
    
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ 
      id: d.id, 
      ...d.data(),
      borrowedAt: d.data().borrowedAt?.toDate?.() || new Date(d.data().borrowedAt || Date.now())
    }));
  } catch (error) {
    console.error('Error listing borrowed items:', error);
    throw error;
  }
}

/**
 * Thêm vật phẩm vào danh sách đã mượn
 * @param {Object} borrowData - Thông tin mượn
 * @param {string} borrowData.inventoryId - ID vật phẩm trong inventory
 * @param {string} borrowData.item - Tên vật phẩm
 * @param {string} borrowData.type - Loại vật phẩm
 * @param {number} borrowData.quantity - Số lượng mượn
 * @param {string} borrowData.unit - Đơn vị
 * @param {string} borrowData.borrowedBy - Người mượn (optional)
 * @returns {Promise<Object>} - Vật phẩm đã mượn
 */
export async function addBorrowedItem(borrowData) {
  try {
    const colRef = collection(db, BORROWED_ITEMS_COL);
    const payload = {
      inventoryId: borrowData.inventoryId,
      item: borrowData.item,
      type: borrowData.type || '',
      quantity: Number(borrowData.quantity) || 1,
      unit: borrowData.unit || 'cái',
      borrowedBy: borrowData.borrowedBy || '',
      status: 'borrowed', // 'borrowed' hoặc 'returned'
      borrowedAt: Timestamp.now(),
      returnedAt: null,
      note: borrowData.note || ''
    };
    
    const res = await addDoc(colRef, payload);
    return { id: res.id, ...payload };
  } catch (error) {
    console.error('Error adding borrowed item:', error);
    throw error;
  }
}

/**
 * Trả lại vật phẩm vào kho
 * @param {string} borrowedItemId - ID vật phẩm đã mượn
 * @param {string} inventoryId - ID vật phẩm trong inventory
 * @param {number} quantity - Số lượng trả lại
 * @returns {Promise<void>}
 */
export async function returnBorrowedItem(borrowedItemId, inventoryId, quantity) {
  try {
    // 1. Xóa khỏi danh sách borrowed_items
    const borrowedRef = doc(db, BORROWED_ITEMS_COL, borrowedItemId);
    await deleteDoc(borrowedRef);
    
    // 2. Cộng lại số lượng vào inventory
    // Lấy thông tin hiện tại của inventory item
    const { listInventory } = await import('./inventoryService');
    const items = await listInventory();
    const inventoryItem = items.find(i => i.id === inventoryId);
    
    if (inventoryItem) {
      const currentQty = Number(inventoryItem.currentQty || 0);
      const newQty = currentQty + Number(quantity);
      
      await updateInventoryItem(inventoryId, {
        'Current Quantity': String(newQty)
      });
    }
  } catch (error) {
    console.error('Error returning borrowed item:', error);
    throw error;
  }
}

/**
 * Xóa vật phẩm đã mượn (không trả lại vào kho)
 * @param {string} borrowedItemId - ID vật phẩm đã mượn
 * @returns {Promise<void>}
 */
export async function deleteBorrowedItem(borrowedItemId) {
  try {
    const ref = doc(db, BORROWED_ITEMS_COL, borrowedItemId);
    await deleteDoc(ref);
  } catch (error) {
    console.error('Error deleting borrowed item:', error);
    throw error;
  }
}

