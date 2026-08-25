import { writable } from 'svelte/store';

const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('studiq-theme') || 'dark' : 'dark';
export const theme = writable(stored);
theme.subscribe((v) => {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', v);
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('studiq-theme', v);
  }
});