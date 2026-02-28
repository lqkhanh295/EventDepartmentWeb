import { useState, useCallback } from 'react';
import {
    getAllMembers,
    getAllProjects,
    addMember as apiAddMember,
    updateMemberScore as apiUpdateScore,
    deleteMember as apiDeleteMember,
    addProject as apiAddProject,
    deleteProject as apiDeleteProject
} from '../../services/services/memberService';

export const useMembers = () => {
    const [members, setMembers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async (semester) => {
        setLoading(true);
        setError(null);
        try {
            if (semester === 'year') {
                const [membersData, springProjects, summerProjects, fallProjects] = await Promise.all([
                    getAllMembers(),
                    getAllProjects('spring'),
                    getAllProjects('summer'),
                    getAllProjects('fall')
                ]);
                setMembers(membersData);
                const allProjects = [
                    ...springProjects.map(p => ({ ...p, semester: 'spring', displayName: `[Sp] ${p.Name || p.key}` })),
                    ...summerProjects.map(p => ({ ...p, semester: 'summer', displayName: `[Su] ${p.Name || p.key}` })),
                    ...fallProjects.map(p => ({ ...p, semester: 'fall', displayName: `[Fa] ${p.Name || p.key}` }))
                ];
                setProjects(allProjects);
                return { members: membersData, projects: allProjects };
            } else {
                const [membersData, projectsData] = await Promise.all([
                    getAllMembers(),
                    getAllProjects(semester)
                ]);
                setMembers(membersData);
                setProjects(projectsData);
                return { members: membersData, projects: projectsData };
            }
        } catch (err) {
            console.error('Error loading members data:', err);
            setError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const addMember = async (memberData) => {
        try {
            await apiAddMember(memberData);
        } catch (err) {
            console.error('Error adding member:', err);
            throw err;
        }
    };

    const updateMemberScore = async (memberId, projectKey, score, semester) => {
        try {
            await apiUpdateScore(memberId, projectKey, score, semester);
        } catch (err) {
            console.error('Error updating score:', err);
            throw err;
        }
    };

    const deleteMember = async (id) => {
        try {
            await apiDeleteMember(id);
        } catch (err) {
            console.error('Error deleting member:', err);
            throw err;
        }
    };

    const addProject = async (projectData, semester) => {
        try {
            await apiAddProject(projectData, semester);
        } catch (err) {
            console.error('Error adding project:', err);
            throw err;
        }
    };

    const deleteProject = async (id, semester) => {
        try {
            await apiDeleteProject(id, semester);
        } catch (err) {
            console.error('Error deleting project:', err);
            throw err;
        }
    };

    return {
        members,
        setMembers, // Expose setMembers for optimistic updates in UI
        projects,
        loading,
        error,
        fetchData,
        addMember,
        updateMemberScore,
        deleteMember,
        addProject,
        deleteProject
    };
};
