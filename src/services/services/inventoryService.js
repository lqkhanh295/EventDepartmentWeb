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
  const colRef = collection(db, INVENTORY_COL);
  const q = query(colRef, orderBy('item', 'asc'));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return onlyRemaining ? items.filter(i => Number(i.currentQty || 0) > 0) : items;
}

export async function addInventoryItem(item) {
  const colRef = collection(db, INVENTORY_COL);
  const payload = normalizeItem(item);
  const res = await addDoc(colRef, payload);
  return { id: res.id, ...payload };
}

export async function updateInventoryItem(id, updates) {
  const ref = doc(db, INVENTORY_COL, id);
  const payload = normalizeItem(updates, true);
  await updateDoc(ref, payload);
}

export async function deleteInventoryItem(id) {
  const ref = doc(db, INVENTORY_COL, id); 
  await deleteDoc(ref);
}

export async function bulkImport(rows = []) {
  const batch = writeBatch(db);
  const colRef = collection(db, INVENTORY_COL);
  let count = 0;
  for (const r of rows) {
    const item = normalizeItem(r);
    if (!item.item) continue; // skip empty names
    const newRef = doc(colRef);
    batch.set(newRef, item);
    count++;
  }
  await batch.commit();
  return count;
}

function normalizeItem(r, partial = false) {
  const parseNum = (v) => {
    if (v == null || v === '') return partial ? undefined : 0;
    const n = Number(String(v).replace(/[^\d.-]/g, ''));
    return isNaN(n) ? (partial ? undefined : 0) : n;
  };
  const cleaned = {
    type: r.Type ?? r.type ?? r['Loại'] ?? r.type ?? undefined,
    item: r.Item ?? r.item ?? r['Tên vật phẩm'] ?? r.name ?? undefined,
    currentQty: parseNum(r['Current Quantity'] ?? r['Current Qty'] ?? r['Qty'] ?? r['Số lượng tồn'] ?? r.currentQty),
    totalQty: parseNum(r['Total Quantity'] ?? r['Total Qty'] ?? r['Tổng số lượng'] ?? r.totalQty),
    unit: r.Unit ?? r.unit ?? r['Đơn vị'] ?? undefined,
    unitPrice: r['Unit Price'] ?? r['unit price'] ?? r['UnitPrice'] ?? r['Giá đơn vị'] ?? undefined,
    pic: r['P.I.C'] ?? r['PIC'] ?? r['Phụ trách'] ?? undefined,
    note: r.Note ?? r['Ghi chú'] ?? r.note ?? undefined,
    updatedAt: Date.now()
  };
  // Remove undefined for partial updates
  if (partial) {
    Object.keys(cleaned).forEach(k => cleaned[k] === undefined && delete cleaned[k]);
  }
  return cleaned;
}
