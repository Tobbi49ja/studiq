import { writable } from 'svelte/store';

const storedUser = typeof localStorage !== 'undefined' ? localStorage.getItem('studiq_user') : null;
const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('studiq_token') : null;

export const user = writable(storedUser ? JSON.parse(storedUser) : null);
export const token = writable(storedToken || null);

user.subscribe((value) => {
  if (typeof localStorage !== 'undefined') {
    if (value) localStorage.setItem('studiq_user', JSON.stringify(value));
    else localStorage.removeItem('studiq_user');
  }
});

token.subscribe((value) => {
  if (typeof localStorage !== 'undefined') {
    if (value) localStorage.setItem('studiq_token', value);
    else localStorage.removeItem('studiq_token');
  }
});

export function setAuth(authData) {
  // Normalise role so older tokens/accounts default to student
  const u = { ...authData.user, role: authData.user?.role || 'student' };
  user.set(u);
  token.set(authData.token);
}

export function logout() {
  user.set(null);
  token.set(null);
  localStorage.removeItem('studiq_user');
  localStorage.removeItem('studiq_token');
}

export function clearAuth() {
  user.set(null);
  token.set(null);
}
