// Member Service - Quản lý dữ liệu Members từ Firestore
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

// Members dùng chung 1 collection
const MEMBERS_COLLECTION = 'member';

// Projects chia theo semester
const getProjectsCollection = (semester) => `project_${semester || 'fall'}`;

// Lấy tất cả projects theo semester
export const getAllProjects = async (semester) => {
  try {
    const collectionName = getProjectsCollection(semester);
    const projectsRef = collection(db, collectionName);
    const snapshot = await getDocs(projectsRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (error) {
    console.error('Error getting projects:', error);
    throw error;
  }
};

// Thêm project mới
export const addProject = async (projectData, semester) => {
  try {
    const collectionName = getProjectsCollection(semester);
    const projectsRef = collection(db, collectionName);
    const docRef = await addDoc(projectsRef, {
      ...projectData,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...projectData };
  } catch (error) {
    console.error('Error adding project:', error);
    throw error;
  }
};

// Xóa project
export const deleteProject = async (projectId, semester) => {
  try {
    const collectionName = getProjectsCollection(semester);
    const projectRef = doc(db, collectionName, projectId);
    await deleteDoc(projectRef);
    return projectId;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Lấy tất cả members (dùng chung)
export const getAllMembers = async () => {
  try {
    const membersRef = collection(db, MEMBERS_COLLECTION);
    const snapshot = await getDocs(membersRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting members:', error);
    throw error;
  }
};

// Thêm member mới
export const addMember = async (memberData) => {
  try {
    const membersRef = collection(db, MEMBERS_COLLECTION);
    const docRef = await addDoc(membersRef, {
      ...memberData,
      createdAt: serverTimestamp()
    });
    return { id: docRef.id, ...memberData };
  } catch (error) {
    console.error('Error adding member:', error);
    throw error;
  }
};

// Cập nhật member
export const updateMember = async (memberId, memberData) => {
  try {
    const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
    await updateDoc(memberRef, {
      ...memberData,
      updatedAt: serverTimestamp()
    });
    return { id: memberId, ...memberData };
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
};

// Cập nhật điểm của member cho 1 project (scores theo semester)
// scores structure: { spring: { HXLC: 100 }, summer: { ABC: 50 }, fall: { XYZ: 80 } }
export const updateMemberScore = async (memberId, projectKey, score, semester) => {
  try {
    const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
    await updateDoc(memberRef, {
      [`scores.${semester}.${projectKey}`]: score,
      updatedAt: serverTimestamp()
    });
    return { memberId, projectKey, score };
  } catch (error) {
    console.error('Error updating score:', error);
    throw error;
  }
};

// Xóa member
export const deleteMember = async (memberId) => {
  try {
    const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
    await deleteDoc(memberRef);
    return memberId;
  } catch (error) {
    console.error('Error deleting member:', error);
    throw error;
  }
};

// Xóa tất cả projects của 1 semester
export const deleteAllProjects = async (semester) => {
  try {
    const collectionName = getProjectsCollection(semester);
    const projectsRef = collection(db, collectionName);
    const snapshot = await getDocs(projectsRef);
    
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    return snapshot.docs.length;
  } catch (error) {
    console.error('Error deleting all projects:', error);
    throw error;
  }
};

// Xóa điểm của semester cho tất cả members
export const clearAllScores = async (semester) => {
  try {
    const membersRef = collection(db, MEMBERS_COLLECTION);
    const snapshot = await getDocs(membersRef);
    
    const updatePromises = snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const newScores = { ...data.scores };
      delete newScores[semester];
      return updateDoc(docSnap.ref, { scores: newScores });
    });
    
    await Promise.all(updatePromises);
    return snapshot.docs.length;
  } catch (error) {
    console.error('Error clearing scores:', error);
    throw error;
  }
};
