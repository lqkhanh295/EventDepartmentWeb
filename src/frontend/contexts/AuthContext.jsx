// Auth Context - Quản lý đăng nhập
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../backend/firebase/config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Kiểm tra email có trong whitelist không
  const checkAllowedEmail = async (email) => {
    try {
      const docRef = doc(db, 'allowedUsers', 'pYweKqx4GoFn5s0DEjNC');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const emailArray = data.email || [];
        
        // Tất cả email nằm trong 1 string (index 0), cách nhau bởi xuống dòng
        const emailString = emailArray[0] || '';
        const emailList = emailString
          .split(/[\n\r]+/)
          .map(e => e.toLowerCase().trim())
          .filter(e => e);
        
        return emailList.includes(email.toLowerCase());
      }
      return false;
    } catch (err) {
      console.error('Error checking allowed emails:', err);
      return false;
    }
  };

  // Đăng nhập Google
  const loginWithGoogle = async () => {
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;

      // Kiểm tra whitelist
      const isAllowed = await checkAllowedEmail(email);
      
      if (!isAllowed) {
        await signOut(auth);
        setError('Email của bạn không có quyền truy cập hệ thống.');
        return false;
      }

      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError('Đăng nhập thất bại. Vui lòng thử lại.');
      return false;
    }
  };

  // Đăng xuất
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Theo dõi trạng thái đăng nhập
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const isAllowed = await checkAllowedEmail(firebaseUser.email);
        if (isAllowed) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL
          });
        } else {
          await signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    error,
    loginWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

