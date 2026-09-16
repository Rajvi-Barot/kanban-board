import { useCallback, useState } from 'react';
import { AuthContext } from './auth';
import { API_URL } from '../config';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('kanban_token'));
  const [username, setUsername] = useState(() => localStorage.getItem('kanban_username'));

  const saveSession = useCallback((newToken, newUsername) => {
    localStorage.setItem('kanban_token', newToken);
    localStorage.setItem('kanban_username', newUsername);
    setToken(newToken);
    setUsername(newUsername);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('kanban_token');
    localStorage.removeItem('kanban_username');
    setToken(null);
    setUsername(null);
  }, []);

  async function login(usernameInput, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    saveSession(data.token, data.username);
  }

  async function register(usernameInput, password) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: usernameInput, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    saveSession(data.token, data.username);
  }

  // Wraps fetch to attach the Authorization header and log the user out
  // automatically if the token is missing/expired (401 from the server).
  const authFetch = useCallback(
    async (url, options = {}) => {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.status === 401) {
        logout();
      }
      return res;
    },
    [token, logout]
  );

  return (
    <AuthContext.Provider value={{ token, username, login, register, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}
