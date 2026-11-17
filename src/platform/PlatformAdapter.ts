import { Capacitor } from '@capacitor/core';
import type { StorageAdapter } from './SaveService';

/** Future ads/auth/payments/cloud integrations belong here, outside gameplay. */
export interface PlatformAdapter {
  readonly kind: 'web' | 'android';
  readonly storage: StorageAdapter;
  listen(onSuspend: () => void, onBack: () => void): Promise<() => void>;
}

export function createPlatform(): PlatformAdapter {
  const native = Capacitor.getPlatform() === 'android';
  return {
    kind: native ? 'android' : 'web',
    storage: native
      ? {
          async get(key) {
            const { Preferences } = await import('@capacitor/preferences');
            return (await Preferences.get({ key })).value;
          },
          async set(key, value) {
            const { Preferences } = await import('@capacitor/preferences');
            await Preferences.set({ key, value });
          },
        }
      : {
          async get(key) {
            return localStorage.getItem(key);
          },
          async set(key, value) {
            localStorage.setItem(key, value);
          },
        },
    async listen(onSuspend, onBack) {
      const abort = new AbortController();
      document.addEventListener(
        'visibilitychange',
        () => {
          if (document.hidden) onSuspend();
        },
        { signal: abort.signal },
      );
      window.addEventListener('blur', onSuspend, { signal: abort.signal });
      if (!native) return () => abort.abort();
      const { App } = await import('@capacitor/app');
      const handles = await Promise.all([
        App.addListener('appStateChange', ({ isActive }) => {
          if (!isActive) onSuspend();
        }),
        App.addListener('backButton', onBack),
      ]);
      return () => {
        abort.abort();
        handles.forEach((handle) => void handle.remove());
      };
    },
  };
}
