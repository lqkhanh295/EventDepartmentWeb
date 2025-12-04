// Vendor Service - Quản lý dữ liệu Vendor từ Firestore
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';

// Collection name phải khớp với tên trong Firebase (chữ V hoa)
const COLLECTION_NAME = 'Vendor';

// Lấy tất cả vendors
export const getAllVendors = async () => {
  try {
    const vendorsRef = collection(db, COLLECTION_NAME);
    // Dùng 'Name' thay vì 'name' để khớp với field trong Firebase
    const snapshot = await getDocs(vendorsRef);
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Mapping từ field Firebase sang field app
      return {
        id: doc.id,
        name: data.Name || data.name || '',
        contact: data.Contact || data.contact || '',
        phone: data.Contact || data.phone || '',
        email: data.email || '',
        feedback: data.Feedback || data.feedback || '',
        description: data.Feedback || data.description || '',
        buyDetail: data.BuyDetail || data.buyDetail || '',
        services: data.BuyDetail ? [data.BuyDetail] : (data.services || []),
        vat: data.VAT || data.vat || '',
        stt: data.STT || data.stt || 0,
        event: data.Event || data.event || '',
        address: data.address || '',
        rating: data.rating || null,
        priceRange: data.priceRange || '',
        notes: data.notes || '',
        ...data
      };
    });
  } catch (error) {
    console.error('Error getting vendors:', error);
    throw error;
  }
};

// Tìm kiếm vendors theo tên hoặc danh mục
export const searchVendors = async (searchTerm, category = null) => {
  try {
    const vendors = await getAllVendors();
    
    let filtered = vendors;
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(vendor => 
        vendor.name?.toLowerCase().includes(lowerSearch) ||
        vendor.description?.toLowerCase().includes(lowerSearch) ||
        vendor.services?.some(s => s.toLowerCase().includes(lowerSearch))
      );
    }
    
    if (category && category !== 'all') {
      filtered = filtered.filter(vendor => vendor.category === category);
    }
    
    return filtered;
  } catch (error) {
    console.error('Error searching vendors:', error);
    throw error;
  }
};

// Thêm vendor mới
export const addVendor = async (vendorData) => {
  try {
    const vendorsRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(vendorsRef, {
      ...vendorData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return { id: docRef.id, ...vendorData };
  } catch (error) {
    console.error('Error adding vendor:', error);
    throw error;
  }
};

// Cập nhật vendor
export const updateVendor = async (vendorId, vendorData) => {
  try {
    const vendorRef = doc(db, COLLECTION_NAME, vendorId);
    await updateDoc(vendorRef, {
      ...vendorData,
      updatedAt: serverTimestamp()
    });
    
    return { id: vendorId, ...vendorData };
  } catch (error) {
    console.error('Error updating vendor:', error);
    throw error;
  }
};

// Xóa vendor
export const deleteVendor = async (vendorId) => {
  try {
    const vendorRef = doc(db, COLLECTION_NAME, vendorId);
    await deleteDoc(vendorRef);
    return vendorId;
  } catch (error) {
    console.error('Error deleting vendor:', error);
    throw error;
  }
};

// Lấy danh sách categories
export const getCategories = async () => {
  try {
    const vendors = await getAllVendors();
    const categories = [...new Set(vendors.map(v => v.category).filter(Boolean))];
    return categories.sort();
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

