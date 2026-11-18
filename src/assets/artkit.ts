import type { AssetManifest } from '../game/rendering/AssetLoader';

// Only the first route's separated artwork is loaded. Original sources stay in assets/inbox.
export const artUrl = (file: string): string => `${import.meta.env.BASE_URL}assets/artkit/${file}`;
export const ART = {
  scooter: 'scooter.png',
  wheel: 'wheel.png',
  coffee: 'coffee.png',
  courier: 'courier.png',
  sky: 'yard-sky.webp',
  far: 'yard-far.webp',
  mid: 'yard-mid.webp',
  near: 'yard-near.webp',
  road: 'road.png',
  gravel: 'gravel.png',
} as const;
export const artManifest: AssetManifest = {
  images: Object.entries(ART).map(([key, file]) => ({ key, url: artUrl(file) })),
};
