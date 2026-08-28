import { writable, derived } from 'svelte/store';

function createNetworkStore() {
  const { subscribe, set } = writable(typeof navigator !== 'undefined' ? navigator.onLine : true);

  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => set(true));
    window.addEventListener('offline', () => set(false));
  }

  return {
    subscribe,
    forceCheck: () => set(navigator.onLine)
  };
}

export const networkStatus = createNetworkStore();

export const isOnline = derived(networkStatus, ($n) => $n);

export const isOffline = derived(networkStatus, ($n) => !$n);
