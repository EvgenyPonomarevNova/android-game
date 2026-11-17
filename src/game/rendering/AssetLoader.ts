import { Loader, type Scene } from 'phaser';

export interface AssetManifest {
  images?: Array<{ key: string; url: string }>;
  atlases?: Array<{ key: string; texture: string; data: string }>;
  fonts?: Array<{ family: string; url: string }>;
}
export function queueAssets(
  scene: Scene,
  manifest: AssetManifest,
  onError: (key: string) => void,
): void {
  const failed = (file: Loader.File) => onError(file.key);
  scene.load.on('loaderror', failed);
  scene.events.once('shutdown', () => scene.load.off('loaderror', failed));
  manifest.images?.forEach((a) => scene.load.image(a.key, a.url));
  manifest.atlases?.forEach((a) => scene.load.atlas(a.key, a.texture, a.data));
}
export async function loadFonts(manifest: AssetManifest): Promise<void> {
  await Promise.all(
    (manifest.fonts ?? []).map(async ({ family, url }) => {
      const face = new FontFace(family, `url(${JSON.stringify(url)})`);
      await face.load();
      document.fonts.add(face);
    }),
  );
}
export function textureOrFallback(scene: Scene, key: string): string {
  return scene.textures.exists(key) ? key : '__MISSING';
}
