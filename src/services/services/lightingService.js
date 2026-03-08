// Lighting Service - Quản lý dữ liệu Lighting Scenes từ Firestore
import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    orderBy,
    query,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const COLLECTION_NAME = 'lighting_scenes';

// Lấy tất cả scenes
export const getScenes = async () => {
    try {
        const scenesRef = collection(db, COLLECTION_NAME);
        const q = query(scenesRef, orderBy('updatedAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
        }));
    } catch (error) {
        console.error('Error getting scenes:', error);
        throw error;
    }
};

// Lấy 1 scene theo ID
export const getScene = async (id) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            throw new Error('Scene not found');
        }

        return { id: docSnap.id, ...docSnap.data() };
    } catch (error) {
        console.error('Error getting scene:', error);
        throw error;
    }
};

// Lưu scene mới
export const saveScene = async (sceneData) => {
    try {
        const scenesRef = collection(db, COLLECTION_NAME);
        const docRef = await addDoc(scenesRef, {
            ...sceneData,
            createdBy: 'admin',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        return { id: docRef.id, ...sceneData };
    } catch (error) {
        console.error('Error saving scene:', error);
        throw error;
    }
};

// Cập nhật scene
export const updateScene = async (id, sceneData) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            ...sceneData,
            updatedAt: serverTimestamp(),
        });

        return { id, ...sceneData };
    } catch (error) {
        console.error('Error updating scene:', error);
        throw error;
    }
};

// Xóa scene
export const deleteScene = async (id) => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await deleteDoc(docRef);
        return id;
    } catch (error) {
        console.error('Error deleting scene:', error);
        throw error;
    }
};

export const lightingService = {
    saveScene,
    getScenes,
    getScene,
    updateScene,
    deleteScene,
};
