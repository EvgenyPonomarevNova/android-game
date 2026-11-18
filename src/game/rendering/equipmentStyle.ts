import type { VehicleSetup } from '../../shared/Progression';

/** Appearance only; all mechanical values come from Tuning.ts. */
export function equipmentStyle(setup: VehicleSetup) {
  return {
    engine:
      setup.parts.engine === 'torque_engine'
        ? '#ee9d49'
        : setup.parts.engine === 'speed_engine'
          ? '#6bbfe4'
          : null,
    suspension:
      setup.parts.suspension === 'soft_suspension'
        ? '#79dda4'
        : setup.parts.suspension === 'sport_suspension'
          ? '#ec866d'
          : null,
    tire:
      setup.parts.tires === 'allweather_tires'
        ? '#83b4d0'
        : setup.parts.tires === 'city_tires'
          ? '#dec270'
          : null,
    mount: setup.parts.cargo_mount === 'reinforced_mount',
  };
}
