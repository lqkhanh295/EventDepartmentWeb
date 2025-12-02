// MembersPage - Redirect to default semester
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const MembersPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to fall semester by default (vì đã vào /eventleader, tự động có quyền admin)
    navigate('/eventleader/fall', { replace: true });
  }, [navigate]);

  return null;
};

export default MembersPage;
