// MembersPage - Redirect to default semester
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MembersPage = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isAdmin) {
        // Nếu không phải admin, redirect về trang chủ
        navigate('/', { replace: true });
      } else {
        // Redirect to fall semester by default
        navigate('/members/fall', { replace: true });
      }
    }
  }, [navigate, isAdmin, loading]);

  // Early return nếu không phải admin
  if (!loading && !isAdmin) {
    return null;
  }

  return null;
};

export default MembersPage;
