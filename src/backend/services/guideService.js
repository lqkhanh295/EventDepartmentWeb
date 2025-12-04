// Guide Service - Quản lý Event Guide từ Firebase Storage
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { storage, db } from '../firebase/config';

const STORAGE_PATH = 'guides';
const COLLECTION_NAME = 'guides';

// Lấy tất cả guides từ Firestore
export const getAllGuides = async () => {
  try {
    const guidesRef = collection(db, COLLECTION_NAME);
    const q = query(guidesRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting guides:', error);
    throw error;
  }
};

// Upload guide file lên Storage
export const uploadGuideFile = async (file, metadata) => {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${STORAGE_PATH}/${fileName}`);
    
    // Upload file
    await uploadBytes(storageRef, file);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Save metadata to Firestore
    const guidesRef = collection(db, COLLECTION_NAME);
    const docRef = await addDoc(guidesRef, {
      ...metadata,
      fileName: fileName,
      originalName: file.name,
      downloadURL: downloadURL,
      fileType: file.type,
      fileSize: file.size,
      createdAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      fileName,
      downloadURL,
      ...metadata
    };
  } catch (error) {
    console.error('Error uploading guide:', error);
    throw error;
  }
};

// Xóa guide
export const deleteGuide = async (guideId, fileName) => {
  try {
    // Delete from Storage
    if (fileName) {
      const storageRef = ref(storage, `${STORAGE_PATH}/${fileName}`);
      await deleteObject(storageRef);
    }
    
    // Delete from Firestore
    const guideRef = doc(db, COLLECTION_NAME, guideId);
    await deleteDoc(guideRef);
    
    return guideId;
  } catch (error) {
    console.error('Error deleting guide:', error);
    throw error;
  }
};

// Chuyển đổi DOCX sang HTML (client-side)
export const convertDocxToHtml = async (file) => {
  try {
    // Sử dụng mammoth.js để convert DOCX
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error('Error converting DOCX:', error);
    throw error;
  }
};

// Lấy nội dung guide từ URL
export const getGuideContent = async (downloadURL, fileType) => {
  try {
    const response = await fetch(downloadURL);
    
    if (fileType?.includes('document') || downloadURL.endsWith('.docx')) {
      const blob = await response.blob();
      const mammoth = await import('mammoth');
      const arrayBuffer = await blob.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer });
      return result.value;
    }
    
    // For text/html files
    return await response.text();
  } catch (error) {
    console.error('Error getting guide content:', error);
    throw error;
  }
};

