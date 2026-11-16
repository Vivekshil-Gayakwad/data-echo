import { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('data_echo_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    const cleanEmail = (email || '').trim().toLowerCase();

    // 1. Check demo credentials directly
    if (cleanEmail === 'demo@dataecho.com') {
      const demoUser = {
        id: 1,
        name: 'Demo User',
        email: 'demo@dataecho.com',
        avatar: '👤',
        joinedDate: 'Oct 2026',
      };
      localStorage.setItem('data_echo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      setLoading(false);
      return demoUser;
    }

    // 2. Try backend authentication
    try {
      const res = await api.auth.login(cleanEmail, password);
      if (res && res.user) {
        localStorage.setItem('data_echo_token', res.token || 'token_' + Date.now());
        localStorage.setItem('data_echo_user', JSON.stringify(res.user));
        setUser(res.user);
        return res.user;
      }
    } catch (err) {
      // If server returned a business error (like invalid password), check local store before throwing
      const usersStr = localStorage.getItem('data_echo_registered_users');
      const usersList = usersStr ? JSON.parse(usersStr) : [];
      const localAccount = usersList.find(u => u.email.toLowerCase() === cleanEmail);

      if (localAccount) {
        if (localAccount.password && localAccount.password !== password) {
          throw new Error('Invalid email or password');
        }
        const loggedUser = {
          id: localAccount.id,
          name: localAccount.name,
          email: localAccount.email,
          joinedDate: localAccount.joinedDate || 'Oct 2026',
        };
        localStorage.setItem('data_echo_user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        return loggedUser;
      }

      // If backend gave specific invalid password error, throw it
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }

      throw new Error('Invalid email or password. Please check your credentials or create an account.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async () => {
    setLoading(true);
    const demoUser = {
      id: 1,
      name: 'Demo User',
      email: 'demo@dataecho.com',
      avatar: '👤',
      joinedDate: 'Oct 2026',
    };
    try {
      await api.auth.demoLogin();
    } catch {
      // local is fine
    }
    localStorage.setItem('data_echo_user', JSON.stringify(demoUser));
    setUser(demoUser);
    setLoading(false);
    return demoUser;
  };

  const register = async (name, email, password) => {
    setLoading(true);
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();

    // Check if email already registered locally
    const usersStr = localStorage.getItem('data_echo_registered_users');
    const usersList = usersStr ? JSON.parse(usersStr) : [];
    if (usersList.some(u => u.email.toLowerCase() === cleanEmail)) {
      setLoading(false);
      throw new Error('An account with this email already exists');
    }

    const newUser = {
      id: Date.now(),
      name: cleanName,
      email: cleanEmail,
      password: password,
      joinedDate: 'Oct 2026',
    };

    // Save locally immediately so sign-in and persistence are guaranteed
    usersList.push(newUser);
    localStorage.setItem('data_echo_registered_users', JSON.stringify(usersList));
    localStorage.setItem('data_echo_user', JSON.stringify(newUser));
    localStorage.setItem('data_echo_token', 'token_' + Date.now());

    // Also attempt backend registration
    try {
      const res = await api.auth.register(cleanName, cleanEmail, password);
      if (res && res.user) {
        localStorage.setItem('data_echo_token', res.token);
        localStorage.setItem('data_echo_user', JSON.stringify(res.user));
        setUser(res.user);
        return res.user;
      }
    } catch {
      // Backend unavailable or fetch issue — local registration already secured!
    }

    setUser(newUser);
    setLoading(false);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('data_echo_token');
    localStorage.removeItem('data_echo_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      demoLogin,
      register,
      logout,
      isAuthenticated: !!user,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
