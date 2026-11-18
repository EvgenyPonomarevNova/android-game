import { createServer } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve, extname } from 'node:path';

const [command, ...args] = process.argv.slice(2);
if (!['new', 'check'].includes(command)) {
  console.log(
    'Create: npm run level:new -- --id yard_draft --title "Новый двор" --seed 42 --preset trial --sections 4',
  );
  console.log('Validate: npm run level:check -- .local/levels/yard_draft.json');
  console.log('Browser workshop: http://127.0.0.1:5183/?editor=1');
  process.exit(command ? 1 : 0);
}
const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
});
try {
  const { generateLevel, parseLevelDocument, serializeLevel, levelBounds } =
    await server.ssrLoadModule('/src/game/authoring/LevelAuthoring.ts');
  if (command === 'check') {
    if (args.length !== 1) throw new Error('Укажи один путь к JSON.');
    const doc = parseLevelDocument(await readFile(resolve(args[0]), 'utf8'));
    console.log(
      `VALID ${doc.level.id}: ${doc.level.ground.length} points; status=${doc.status}. Geometry only; playtest is required.`,
    );
  } else {
    const flags = {};
    for (let i = 0; i < args.length; i += 2) {
      if (
        !['--id', '--title', '--seed', '--preset', '--sections', '--fork', '--out'].includes(
          args[i],
        ) ||
        !args[i + 1] ||
        args[i + 1].startsWith('--')
      )
        throw new Error(`Неизвестный или незавершённый параметр: ${args[i]}`);
      flags[args[i].slice(2)] = args[i + 1];
    }
    if (flags.fork && !['true', 'false'].includes(flags.fork))
      throw new Error('--fork: true или false');
    const doc = generateLevel({
      id: flags.id ?? 'yard_draft',
      title: flags.title ?? 'Новый двор',
      seed: flags.seed ?? '42',
      preset: flags.preset ?? 'trial',
      sections: Number(flags.sections ?? 4),
      fork: flags.fork === 'true',
    });
    const output = resolve(flags.out ?? `.local/levels/${doc.level.id}.json`);
    if (extname(output).toLowerCase() !== '.json')
      throw new Error('--out должен оканчиваться на .json');
    await mkdir(dirname(output), { recursive: true });
    // Exclusive creation protects manually edited routes from an accidental regeneration.
    await writeFile(output, serializeLevel(doc), { flag: 'wx', encoding: 'utf8' });
    const bounds = levelBounds(doc.level);
    const x = (value) => 20 + ((value - bounds.from) / (bounds.to - bounds.from)) * 1160;
    const y = (value) => 240 - ((value - bounds.low) / Math.max(4, bounds.high - bounds.low)) * 150;
    const points = doc.level.ground.map(([px, py]) => `${x(px)},${y(py)}`).join(' ');
    const title = doc.level.name.replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c],
    );
    const platforms = (doc.level.platforms ?? [])
      .map(
        (platform) =>
          `<polyline points="${platform.points.map(([px, py]) => `${x(px)},${y(py)}`).join(' ')}" fill="none" stroke="#79dda4" stroke-width="4"/>`,
      )
      .join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 300"><rect width="1200" height="300" fill="#142437"/><text x="20" y="40" font-family="sans-serif" font-size="24" fill="#eef4ff">${title} — DRAFT</text><polyline points="${points}" fill="none" stroke="#ffd12b" stroke-width="4"/>${platforms}</svg>`;
    const preview = output.replace(/\.json$/i, '.svg');
    try {
      await writeFile(preview, svg, { flag: 'wx', encoding: 'utf8' });
      console.log(`Preview: ${preview}`);
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      console.log('Existing preview preserved.');
    }
    console.log(
      `Draft: ${output}\nOpen it in ?editor=1, playtest, tune, then publish explicitly. No level was added to normal play.`,
    );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await server.close();
}
