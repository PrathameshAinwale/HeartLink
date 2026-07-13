import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const login = (userData) => {
    setUser(userData || {
      id: '1',
      name: 'Alex Rivera',
      username: '@alex_rivera',
      age: 26,
      bio: 'Designer focused on creating impactful, user-centered digital experiences.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      coverImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=800',
      followers: 412,
      following: 278,
      likes: 1043,
      interests: ['Design', 'Photography', 'Travel', 'Coffee', 'Music'],
    });
    setIsAuthenticated(true);
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
