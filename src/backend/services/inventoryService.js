// Firestore Inventory Service
import { db } from '../firebase/config';
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch
} from 'firebase/firestore';

const INVENTORY_COL = 'inventory';

export async function listInventory({ onlyRemaining = false } = {}) {
  try {
    const colRef = collection(db, INVENTORY_COL);
    const q = query(colRef, orderBy('item', 'asc'));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return onlyRemaining ? items.filter(i => Number(i.currentQty || 0) > 0) : items;
  } catch (error) {
    // If collection doesn't exist yet, return empty array
    // Firestore will create collection automatically on first document add
    console.log('Inventory collection may not exist yet:', error);
    return [];
  }
}

export async function addInventoryItem(item) {
  const colRef = collection(db, INVENTORY_COL);
  const payload = normalizeItem(item);
  // Remove undefined fields (Firestore doesn't allow undefined values)
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });
  const res = await addDoc(colRef, payload);
  return { id: res.id, ...payload };
}

export async function updateInventoryItem(id, updates) {
  const ref = doc(db, INVENTORY_COL, id);
  const payload = normalizeItem(updates, true);
  // Remove undefined fields (Firestore doesn't allow undefined values)
  Object.keys(payload).forEach(key => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });
  await updateDoc(ref, payload);
}

export async function deleteInventoryItem(id) {
  const ref = doc(db, INVENTORY_COL, id);
  await deleteDoc(ref);
}

export async function bulkImport(rows = []) {
  try {
    // First, delete all existing items (if any)
    try {
      const existingItems = await listInventory();
      if (existingItems.length > 0) {
        console.log(`Deleting ${existingItems.length} existing items...`);
        // Process deletions in batches of 500 (Firestore limit)
        const batchSize = 500;
        for (let i = 0; i < existingItems.length; i += batchSize) {
          const batchChunk = existingItems.slice(i, i + batchSize);
          const currentDeleteBatch = writeBatch(db);
          batchChunk.forEach(item => {
            if (item.id) {
              const ref = doc(db, INVENTORY_COL, item.id);
              currentDeleteBatch.delete(ref);
            }
          });
          await currentDeleteBatch.commit();
          console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}`);
        }
        console.log('All existing items deleted');
      }
    } catch (deleteError) {
      // If collection doesn't exist, that's okay - we'll create it
      console.log('No existing items to delete or collection does not exist:', deleteError.message);
    }

    // Then, add all new items
    const colRef = collection(db, INVENTORY_COL);
    let count = 0;
    let skipped = 0;
    
    // Process in batches of 500 (Firestore limit)
    const batchSize = 500;
    const totalBatches = Math.ceil(rows.length / batchSize);
    
    for (let i = 0; i < rows.length; i += batchSize) {
      const batchChunk = rows.slice(i, i + batchSize);
      const currentBatch = writeBatch(db);
      let batchCount = 0;
      
      for (const r of batchChunk) {
        try {
          const item = normalizeItem(r);
          if (!item.item || item.item.trim() === '') {
            skipped++;
            continue; // skip empty names
          }
          
          // Validate required fields
          if (item.currentQty === undefined) item.currentQty = 0;
          if (item.totalQty === undefined) item.totalQty = 0;
          
          // Remove undefined fields (Firestore doesn't allow undefined values)
          Object.keys(item).forEach(key => {
            if (item[key] === undefined) {
              delete item[key];
            }
          });
          
          const newRef = doc(colRef);
          currentBatch.set(newRef, item);
          batchCount++;
          count++;
        } catch (itemError) {
          console.error('Error normalizing item:', r, itemError);
          skipped++;
        }
      }
      
      if (batchCount > 0) {
        await currentBatch.commit();
        console.log(`Imported batch ${Math.floor(i / batchSize) + 1}/${totalBatches} (${batchCount} items)`);
      }
    }
    
    console.log(`Import complete: ${count} items imported, ${skipped} skipped`);
    return count;
  } catch (error) {
    console.error('Error in bulkImport:', error);
    throw new Error(`Lỗi khi import vào Firebase: ${error.message}`);
  }
}

function normalizeItem(r, partial = false) {
  const parseNum = (v) => {
    if (v == null || v === '' || v === '-') return partial ? undefined : 0;
    const str = String(v).trim();
    if (str === '' || str === '-') return partial ? undefined : 0;
    // Remove all non-numeric characters except decimal point and minus sign
    const cleaned = str.replace(/[^\d.-]/g, '');
    if (cleaned === '' || cleaned === '-') return partial ? undefined : 0;
    const n = Number(cleaned);
    return isNaN(n) ? (partial ? undefined : 0) : n;
  };
  const parseStr = (v) => {
    if (v == null || v === '') return undefined;
    const s = String(v).trim();
    return s === '' || s === '-' ? undefined : s;
  };
  
  try {
    const cleaned = {
      type: parseStr(r.Type ?? r.type ?? r['Loại']),
      item: parseStr(r.Item ?? r.item ?? r['Tên vật phẩm'] ?? r.name),
      currentQty: parseNum(r['Current Quantity'] ?? r['Current Qty'] ?? r['Qty'] ?? r['Số lượng tồn'] ?? r.currentQty),
      totalQty: parseNum(r['Total Quantity'] ?? r['Total Qty'] ?? r['Tổng số lượng'] ?? r.totalQty),
      unit: parseStr(r.Unit ?? r.unit ?? r['Đơn vị']),
      // Unit Price: only parse if value exists and is not empty or "-"
      unitPrice: (() => {
        const val = r['Unit Price'] ?? r['unit price'] ?? r['UnitPrice'] ?? r['Giá đơn vị'] ?? r.unitPrice;
        if (val == null || val === '' || val === '-') return undefined;
        const parsed = parseNum(val);
        return parsed === 0 && partial ? undefined : parsed;
      })(),
      pic: parseStr(r['P.I.C'] ?? r['PIC'] ?? r['Phụ trách']),
      note: parseStr(r.Note ?? r['Ghi chú'] ?? r.note),
      updatedAt: Date.now()
    };
    
    // Remove undefined for partial updates
    if (partial) {
      Object.keys(cleaned).forEach(k => cleaned[k] === undefined && delete cleaned[k]);
    } else {
      // For new items, ensure required fields have defaults
      if (!cleaned.item) cleaned.item = '';
      if (cleaned.currentQty === undefined) cleaned.currentQty = 0;
      if (cleaned.totalQty === undefined) cleaned.totalQty = 0;
    }
    
    return cleaned;
  } catch (error) {
    console.error('Error normalizing item:', r, error);
    // Return minimal valid item
    return {
      type: '',
      item: String(r.Item ?? r.item ?? r['Tên vật phẩm'] ?? r.name ?? '').trim() || 'Unknown',
      currentQty: 0,
      totalQty: 0,
      updatedAt: Date.now()
    };
  }
}
