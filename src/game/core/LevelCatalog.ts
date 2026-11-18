import { testLevel } from '../levels/testLevel';
import { parseLevelDocument, type LevelDocument } from '../authoring/LevelAuthoring';

/** JSON files are discoverable without editing scenes. Drafts never enter the public catalogue. */
const files = import.meta.glob('../../content/levels/*.json', {
  query: '?raw',
  import: 'default',
  eager: true,
});
export function buildLevelCatalog(sources: Record<string, unknown>): {
  levels: LevelDocument[];
  errors: string[];
} {
  const levels: LevelDocument[] = [{ schemaVersion: 1, status: 'published', level: testLevel }];
  const errors: string[] = [];
  for (const [path, raw] of Object.entries(sources)) {
    try {
      const doc = parseLevelDocument(String(raw));
      if (levels.some((existing) => existing.level.id === doc.level.id))
        throw new Error('Повтор ID');
      if (doc.status === 'published') levels.push(doc);
    } catch (error) {
      errors.push(`${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { levels, errors };
}
export function getLevelCatalog() {
  return buildLevelCatalog(files);
}
