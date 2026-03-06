import { useState, useCallback } from 'react';
import { authenticate } from '../utils/api';

export function useAuth() {
  const [password, setPassword] = useState(() => sessionStorage.getItem('admin_pw') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!sessionStorage.getItem('admin_pw'));

  const login = useCallback(async (pw) => {
    await authenticate(pw);
    sessionStorage.setItem('admin_pw', pw);
    setPassword(pw);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('admin_pw');
    setPassword('');
    setIsAuthenticated(false);
  }, []);

  return { password, isAuthenticated, login, logout };
}
