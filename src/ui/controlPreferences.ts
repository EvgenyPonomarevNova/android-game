import type { Settings } from '../platform/SaveService';

export function controlPreferences(settings?: Pick<Settings, 'leftHanded' | 'controlScale'>) {
  const raw = settings?.controlScale ?? 1;
  return {
    leftHanded: settings?.leftHanded ?? false,
    scale: Number.isFinite(raw) ? Math.max(0.85, Math.min(1.2, raw)) : 1,
  };
}
