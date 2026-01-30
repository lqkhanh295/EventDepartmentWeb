import {
    collection,
    getDocs,
    doc,
    writeBatch
} from 'firebase/firestore';
import { db } from '../firebase/config';

const ANALYSIS_COLLECTION = 'analysis_events';

// Get all analysis events
export const getEvents = async () => {
    try {
        const eventsRef = collection(db, ANALYSIS_COLLECTION);
        const snapshot = await getDocs(eventsRef);
        return snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        }));
    } catch (error) {
        console.error('Error getting analysis events:', error);
        throw error;
    }
};

// Clear all events and save new ones
export const saveEvents = async (events) => {
    try {
        // 1. Clear existing events
        await clearEvents();

        // 2. Add new events
        // Note: Firestore batch has a limit of 500 operations. 
        // For larger datasets, we might need multiple batches.
        const batch = writeBatch(db);
        const eventsRef = collection(db, ANALYSIS_COLLECTION);

        events.forEach((event) => {
            const docRef = doc(eventsRef); // Create a new doc reference with auto-ID
            batch.set(docRef, event);
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error('Error saving analysis events:', error);
        throw error;
    }
};

// Add new events (Append - do not clear)
export const addEvents = async (events) => {
    try {
        const batch = writeBatch(db);
        const eventsRef = collection(db, ANALYSIS_COLLECTION);

        events.forEach((event) => {
            const docRef = doc(eventsRef);
            batch.set(docRef, event);
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error('Error adding analysis events:', error);
        throw error;
    }
};

// Clear all events
export const clearEvents = async () => {
    try {
        const eventsRef = collection(db, ANALYSIS_COLLECTION);
        const snapshot = await getDocs(eventsRef);

        const batch = writeBatch(db);
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error('Error clearing analysis events:', error);
        throw error;
    }
};
