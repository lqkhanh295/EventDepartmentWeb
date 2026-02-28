// Config Service - Quản lý cấu hình hệ thống từ Firestore
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const CONFIG_COLLECTION = 'config';
const CONFIG_DOC_ID = 'system';

/**
 * Lấy API key của remove.bg từ Firebase
 * @returns {Promise<string|null>} - API key hoặc null nếu chưa có
 */
export const getRemoveBgApiKey = async () => {
  try {
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      const data = configSnap.data();
      const apiKey = data.removeBgApiKey;
      
      if (apiKey && typeof apiKey === 'string' && apiKey.trim() !== '') {
        return apiKey.trim();
      }
      
      console.warn('API key exists but is empty or invalid');
      return null;
    }
    
    console.warn('Config document does not exist in Firebase');
    return null;
  } catch (error) {
    console.error('Error getting remove.bg API key:', error);
    throw error;
  }
};

/**
 * Lưu API key của remove.bg vào Firebase (chỉ admin)
 * @param {string} apiKey - API key từ remove.bg
 * @returns {Promise<void>}
 */
export const setRemoveBgApiKey = async (apiKey) => {
  try {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key không được để trống');
    }

    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    await setDoc(configRef, {
      removeBgApiKey: apiKey.trim(),
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error setting remove.bg API key:', error);
    throw error;
  }
};

/**
 * Lấy tất cả config
 * @returns {Promise<Object>} - Object chứa tất cả config
 */
export const getAllConfig = async () => {
  try {
    const configRef = doc(db, CONFIG_COLLECTION, CONFIG_DOC_ID);
    const configSnap = await getDoc(configRef);
    
    if (configSnap.exists()) {
      return configSnap.data();
    }
    
    return {};
  } catch (error) {
    console.error('Error getting config:', error);
    throw error;
  }
};

