// Auth Context - Quản lý authentication và chế độ admin
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Mock data cho users
const MOCK_USERS = {
  admin: {
    uid: 'mock-admin-001',
    email: 'admin@csg.com',
    displayName: 'Admin User',
    photoURL: null,
    isAdmin: true
  },
  member: {
    uid: 'mock-member-001',
    email: 'member@csg.com',
    displayName: 'Member User',
    photoURL: null,
    isAdmin: false
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  // Mock login function
  const loginWithMock = (userType) => {
    setLoading(true);
    // Simulate async login
    setTimeout(() => {
      const mockUser = MOCK_USERS[userType];
      setUser(mockUser);
      setIsAdminMode(mockUser.isAdmin);
      setLoading(false);
    }, 300);
  };

  // Mock Google login (tạm thời dùng mock)
  const loginWithGoogle = async () => {
    setLoading(true);
    // Tạm thời return false để không làm gì
    // Có thể thay bằng mock login nếu cần
    setTimeout(() => {
      setLoading(false);
    }, 300);
    return false;
  };

  // Logout
  const logout = () => {
    setUser(null);
    setIsAdminMode(false);
  };

  // Toggle admin mode (chỉ cho phép nếu user là admin)
  const toggleAdminMode = () => {
    if (user?.isAdmin) {
      setIsAdminMode(prev => !prev);
    }
  };

  // Tự động bật chế độ admin khi ở các route admin
  useEffect(() => {
    if (user) {
      const adminRoutes = ['/members'];
      const isAdminRoute = adminRoutes.some(route => 
        location.pathname.startsWith(route)
      );
      // Chỉ set admin mode nếu user là admin
      if (user.isAdmin) {
        setIsAdminMode(user.isAdmin || isAdminRoute);
      } else {
        setIsAdminMode(false);
      }
    } else {
      setIsAdminMode(false);
    }
  }, [location.pathname, user]);

  const value = {
    user,
    loading,
    isAdminMode,
    isAdmin: user?.isAdmin || false,
    loginWithGoogle,
    loginWithMock,
    logout,
    toggleAdminMode,
    error: ''
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

