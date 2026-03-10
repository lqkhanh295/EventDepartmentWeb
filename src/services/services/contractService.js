// Contract Service - Quản lý hồ sơ & mẫu hợp đồng từ Firestore
import {
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  doc,
  orderBy,
  query
} from 'firebase/firestore';
import { db } from '../firebase/config';

const PROFILES_COLLECTION = 'contractProfiles';
const TEMPLATES_COLLECTION = 'contractTemplates';

// --- PROFILES ---

export const getAllContractProfiles = async () => {
  try {
    const q = query(collection(db, PROFILES_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    // Fallback nếu chưa có index
    const snapshot = await getDocs(collection(db, PROFILES_COLLECTION));
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return docs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }
};

export const saveContractProfile = async (profile) => {
  try {
    const profileRef = doc(db, PROFILES_COLLECTION, profile.id);
    await setDoc(profileRef, profile);
    return profile;
  } catch (error) {
    console.error('Error saving contract profile:', error);
    throw error;
  }
};

export const updateContractProfile = async (profile) => {
  try {
    const profileRef = doc(db, PROFILES_COLLECTION, profile.id);
    await setDoc(profileRef, profile, { merge: true });
    return profile;
  } catch (error) {
    console.error('Error updating contract profile:', error);
    throw error;
  }
};

export const deleteContractProfile = async (profileId) => {
  try {
    await deleteDoc(doc(db, PROFILES_COLLECTION, profileId));
  } catch (error) {
    console.error('Error deleting contract profile:', error);
    throw error;
  }
};

// --- GLOBAL TEMPLATES (admin only) ---

export const getContractTemplates = async () => {
  try {
    const snapshot = await getDocs(collection(db, TEMPLATES_COLLECTION));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching contract templates:', error);
    return [];
  }
};

export const saveContractTemplate = async (id, name, base64, updatedBy) => {
  try {
    const templateRef = doc(db, TEMPLATES_COLLECTION, id);
    await setDoc(templateRef, {
      id,
      name,
      base64,
      updatedAt: Date.now(),
      updatedBy
    });
  } catch (error) {
    console.error('Error saving contract template:', error);
    throw error;
  }
};

export const deleteContractTemplate = async (id) => {
  try {
    await deleteDoc(doc(db, TEMPLATES_COLLECTION, id));
  } catch (error) {
    console.error('Error deleting contract template:', error);
    throw error;
  }
};
