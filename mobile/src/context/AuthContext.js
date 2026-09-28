import React, { createContext, useState, useEffect, useContext } from 'react';
import api, { setAuthToken } from '../api/client';

const AuthContext = createContext();

export const DEMO_ACCOUNTS = {
  SUNITA: {
    label: 'Sunita Soren (Post-Matric Student)',
    identifier: '20268839201941',
    password: 'Student@123',
    role: 'STUDENT',
    desc: 'Active Post-Matric application at District Verification stage with deficiency alert.'
  },
  RAJESH: {
    label: 'Rajesh Munda (Pre-Matric Disbursed)',
    identifier: '20267711442290',
    password: 'Student@123',
    role: 'STUDENT',
    desc: 'Pre-Matric completed & ₹7,000 DBT credited with live UTR.'
  },
  ANJALI: {
    label: 'Anjali Kerketta (NFST Fellowship)',
    identifier: '20265533119933',
    password: 'Student@123',
    role: 'STUDENT',
    desc: 'Ph.D. scholar with application routed to Officer Review Queue.'
  },
  OFFICER: {
    label: 'Dr. R. C. Meena (Nodal Officer)',
    identifier: 'officer@mota.gov.in',
    password: 'Officer@123',
    role: 'OFFICER',
    desc: 'Tribal Welfare Officer with access to Review Queue & Outreach Engine.'
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // By default, auto-login as Sunita Soren for instant preview
    autoLoginDefault();
  }, []);

  const autoLoginDefault = async () => {
    try {
      await login(DEMO_ACCOUNTS.SUNITA.identifier, DEMO_ACCOUNTS.SUNITA.password);
    } catch (err) {
      console.log('Auto-login notice:', err.message);
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { identifier, password });
      const { user: userData, token: userToken } = res.data;
      setUser(userData);
      setToken(userToken);
      setAuthToken(userToken);
      setLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.error || err.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', formData);
      const { user: userData, token: userToken } = res.data;
      setUser(userData);
      setToken(userToken);
      setAuthToken(userToken);
      setLoading(false);
      return { success: true, user: userData };
    } catch (err) {
      setLoading(false);
      const msg = err.response?.data?.error || err.message || 'Registration failed';
      throw new Error(msg);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isOfficer: user?.role === 'OFFICER' || user?.role === 'ADMIN'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
