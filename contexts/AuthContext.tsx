import CookieManager from '@react-native-cookies/cookies';
import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../models/user';
import { login as apiLogin, logout as apiLogout, getToken, getUserInfo } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => false,
  logout: async () => {},
  checkAuthState: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    console.log("✅ AuthProvider mounted");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuthState = async () => {
    console.log('Checking auth state...');
    setLoading(true);
    try {
      const token = await getToken();
      console.log('Retrieved token:', token);
      if (token) {
        // Try to get user info to validate token
        try {
          const userInfo = await getUserInfo();
          console.log('Fetched user info:', userInfo);
          if (userInfo) {
            setUser({
              id: userInfo.id,
              name: userInfo.name,
              email: userInfo.mail || userInfo.email,
              profilePicture: userInfo.profile_picture,
              birthDate: userInfo.birth_date,
              sex: userInfo.sex
            });
            setIsAuthenticated(true);
          } else {
            await apiLogout();
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (error) {
          await apiLogout();
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    console.log('Context Logging in...');
    try {
      await CookieManager.clearAll();
      console.log("✓ All cookies cleared");
      const success = await apiLogin(email, password);
      if (success) {
        await checkAuthState();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await apiLogout();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        login: handleLogin,
        logout: handleLogout,
        checkAuthState
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);