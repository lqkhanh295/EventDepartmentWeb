import { useState, useCallback } from 'react';
import {
    getAllVendors,
    addVendor as apiAddVendor,
    updateVendor as apiUpdateVendor,
    deleteVendor as apiDeleteVendor
} from '../../services/services/vendorService';

export const useVendors = () => {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchVendors = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllVendors();
            setVendors(data);
            return data;
        } catch (err) {
            console.error('Error fetching vendors:', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const addVendor = async (vendorData) => {
        try {
            await apiAddVendor(vendorData);
            await fetchVendors(); // Refresh list
        } catch (err) {
            console.error('Error adding vendor:', err);
            throw err;
        }
    };

    const updateVendor = async (id, vendorData) => {
        try {
            await apiUpdateVendor(id, vendorData);
            await fetchVendors(); // Refresh list
        } catch (err) {
            console.error('Error updating vendor:', err);
            throw err;
        }
    };

    const deleteVendor = async (id) => {
        try {
            await apiDeleteVendor(id);
            await fetchVendors(); // Refresh list
        } catch (err) {
            console.error('Error deleting vendor:', err);
            throw err;
        }
    };

    return {
        vendors,
        loading,
        error,
        fetchVendors,
        addVendor,
        updateVendor,
        deleteVendor
    };
};
