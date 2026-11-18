import { expect, it } from 'vitest';
import {
  generateLevel,
  parseLevelDocument,
  serializeLevel,
} from '../src/game/authoring/LevelAuthoring';
import { buildLevelCatalog } from '../src/game/core/LevelCatalog';

const options = {
  id: 'test_draft',
  title: 'Тестовый двор',
  seed: 'same-seed',
  preset: 'trial' as const,
  sections: 4,
};
it('generates reproducible serializable drafts without modifying the public mission', () => {
  const first = generateLevel(options);
  expect(generateLevel(options)).toEqual(first);
  expect(first.status).toBe('draft');
  expect(parseLevelDocument(serializeLevel(first))).toEqual(first);
  expect(generateLevel({ ...options, preset: 'courtyard' }).level.ground).not.toEqual(
    first.level.ground,
  );
  expect(first.level.sections).toHaveLength(6);
});
it('rejects invalid authoring input and malformed imported geometry', () => {
  expect(() => generateLevel({ ...options, id: '../escape' })).toThrow();
  expect(() => generateLevel({ ...options, sections: Infinity })).toThrow();
  const draft = generateLevel(options);
  draft.level.ground[2] = [-20, 0];
  expect(() => parseLevelDocument(serializeLevel(draft))).toThrow();
  expect(() => parseLevelDocument('{"schemaVersion":2}')).toThrow();
});
it('requires explicit publication and keeps a malformed import from breaking the mission catalogue', () => {
  const draft = generateLevel({ ...options, fork: true });
  expect(draft.level.platforms?.length).toBeGreaterThan(0);
  expect(draft.level.checkpoint).toBeDefined();
  expect(parseLevelDocument(serializeLevel(draft)).level.fork).toEqual(draft.level.fork);
  expect(buildLevelCatalog({ 'draft.json': serializeLevel(draft) }).levels).toHaveLength(2);
  draft.status = 'published';
  const catalog = buildLevelCatalog({ 'new.json': serializeLevel(draft), 'bad.json': '{}' });
  expect(catalog.levels).toHaveLength(3);
  expect(catalog.errors).toHaveLength(1);
});
