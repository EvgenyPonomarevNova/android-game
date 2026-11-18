# Route catalogue

Each `*.json` here is a `LevelDocument` with `schemaVersion: 1`, `status: "draft" | "published"` and `level: LevelData`.
The workshop imports published documents automatically. The first contract remains the default game mission; adding a file never silently replaces it.

Generate candidates with `npm run level:new -- --id yard_draft --seed 42 --preset trial --sections 4`.
Files are created under `.local/levels` and never overwrite existing files. Import into `?editor=1`, edit, drive, export, validate with `npm run level:check -- PATH`.
Only after both routes/tactics and failures have been reviewed should an author set `status` to `published` and copy the JSON here. Unique IDs preserve independent records.
Geometry validation does not certify difficulty or playability. No second production mission is included in P0.
