/** Pure configuration for both React and the simulation. No physics-engine imports. */
import { SCOOTER, type VehicleConfig } from '../../config/game';
import { SURFACES, type SurfaceType } from '../levels/testLevel';
import {
  defaultVehicleSetup,
  STOCK_PARTS,
  type VehicleSetup,
  type PartDefinition,
  type VehicleDefinition,
  type TuningStat,
} from '../../shared/Progression';

export const PART_CATALOG: PartDefinition[] = [
  {
    id: 'standard_engine',
    slot: 'engine',
    name: 'Штатный двигатель',
    benefit: 'Знакомая тяга и скорость.',
    tradeoff: 'Без специализации.',
  },
  {
    id: 'torque_engine',
    slot: 'engine',
    name: 'Тяговитый двигатель',
    benefit: 'Момент +25%, легче подъёмы.',
    tradeoff: 'Обороты −12%, выше риск поднять переднее колесо.',
  },
  {
    id: 'speed_engine',
    slot: 'engine',
    name: 'Скоростной двигатель',
    benefit: 'Обороты +18%, выше предел тяги.',
    tradeoff: 'Момент −18%, слабее разгон и подъём.',
  },
  {
    id: 'standard_suspension',
    slot: 'suspension',
    name: 'Штатная подвеска',
    benefit: 'Универсальные 4,5 Гц.',
    tradeoff: 'Без специализации.',
  },
  {
    id: 'soft_suspension',
    slot: 'suspension',
    name: 'Мягкая грузовая',
    benefit: '3,8 Гц: мягче отрабатывает неровности.',
    tradeoff: 'Больше ход и раскачка, ниже рама под нагрузкой.',
  },
  {
    id: 'sport_suspension',
    slot: 'suspension',
    name: 'Спортивная подвеска',
    benefit: '6,5 Гц: быстрый отклик.',
    tradeoff: 'Более жёсткая передача удара.',
  },
  {
    id: 'standard_tires',
    slot: 'tires',
    name: 'Штатные шины',
    benefit: 'Универсальное сцепление.',
    tradeoff: 'Ограниченное сцепление после дождя.',
  },
  {
    id: 'city_tires',
    slot: 'tires',
    name: 'Городские шины',
    benefit: 'Сцепление на сухом асфальте +20%.',
    tradeoff: 'На гравии −20%, на мокром асфальте −25%.',
  },
  {
    id: 'allweather_tires',
    slot: 'tires',
    name: 'Всепогодные шины',
    benefit: 'Мокрый асфальт +55%, гравий +15%.',
    tradeoff: 'Сухой асфальт −8%.',
  },
  {
    id: 'standard_mount',
    slot: 'cargo_mount',
    name: 'Обычный короб',
    benefit: 'Лёгкое штатное крепление.',
    tradeoff: 'Без дополнительной изоляции.',
  },
  {
    id: 'reinforced_mount',
    slot: 'cargo_mount',
    name: 'Усиленный термокороб',
    benefit: 'Демпфированное крепление, еда медленнее остывает.',
    tradeoff: '+0,9 кг над рамой, больше инерция.',
  },
];
export const VEHICLE_MODELS: VehicleDefinition[] = [
  {
    id: 'dvorik_50',
    name: 'Дворик-50',
    description: 'Базовый скутер: лёгкий, отзывчивый, знакомая физика.',
  },
  {
    id: 'tyagach_80',
    name: 'Тягач-80',
    description: 'Тяжелее и тяговитее, ниже скорость, медленнее вращение.',
  },
];
export interface CargoMountSettings {
  addedMass: number;
  frequencyHz: number;
  dampingRatio: number;
  insulation: number;
}
export interface ResolvedVehicleSetup {
  setup: VehicleSetup;
  vehicle: VehicleConfig;
  tireGrip: Record<SurfaceType, number>;
  cargoMount: CargoMountSettings;
}

export function resolveVehicleSetup(
  input: VehicleSetup = defaultVehicleSetup(),
): ResolvedVehicleSetup {
  const setup = defaultVehicleSetup();
  if (VEHICLE_MODELS.some((v) => v.id === input?.vehicleId)) setup.vehicleId = input.vehicleId;
  if (input?.paint && ['yellow', 'mint', 'coral'].includes(input.paint)) setup.paint = input.paint;
  for (const slot of Object.keys(STOCK_PARTS) as Array<keyof typeof STOCK_PARTS>) {
    const id = input?.parts?.[slot];
    if (PART_CATALOG.some((p) => p.id === id && p.slot === slot)) setup.parts[slot] = id;
  }
  setup.skills = [
    ...new Set(
      (input?.skills ?? []).filter((id) => id === 'soft_landing' || id === 'balance_sense'),
    ),
  ];
  const vehicle: VehicleConfig = {
    ...SCOOTER,
    chassis: { ...SCOOTER.chassis },
    wheel: { ...SCOOTER.wheel },
    suspension: { ...SCOOTER.suspension },
    motor: { ...SCOOTER.motor },
  };
  if (setup.vehicleId === 'tyagach_80') {
    vehicle.id = 'tyagach_80';
    vehicle.chassis.mass = 82;
    vehicle.motor.torque = 105;
    vehicle.motor.speed = 28;
    vehicle.motor.brakeTorque = 120;
    vehicle.maxSpeed = 9;
  }
  if (setup.parts.engine === 'torque_engine') {
    vehicle.motor.torque *= 1.25;
    vehicle.motor.speed *= 0.88;
    vehicle.maxSpeed *= 0.9;
    vehicle.motor.torqueRise *= 1.1;
  } else if (setup.parts.engine === 'speed_engine') {
    vehicle.motor.torque *= 0.82;
    vehicle.motor.speed *= 1.18;
    vehicle.maxSpeed *= 1.15;
    vehicle.motor.torqueRise *= 0.9;
  }
  if (setup.parts.suspension === 'soft_suspension')
    vehicle.suspension = { frequencyHz: 3.8, dampingRatio: 0.9 };
  else if (setup.parts.suspension === 'sport_suspension')
    vehicle.suspension = { frequencyHz: 6.5, dampingRatio: 0.75 };
  const tireGrip: Record<SurfaceType, number> = { asphalt: 1, gravel: 1, 'wet-asphalt': 1 };
  if (setup.parts.tires === 'city_tires')
    Object.assign(tireGrip, { asphalt: 1.2, gravel: 0.8, 'wet-asphalt': 0.75 });
  else if (setup.parts.tires === 'allweather_tires')
    Object.assign(tireGrip, { asphalt: 0.92, gravel: 1.15, 'wet-asphalt': 1.55 });
  const cargoMount: CargoMountSettings =
    setup.parts.cargo_mount === 'reinforced_mount'
      ? { addedMass: 0.9, frequencyHz: 5.5, dampingRatio: 1, insulation: 1.12 }
      : { addedMass: 0, frequencyHz: 5, dampingRatio: 0.8, insulation: 1 };
  if (setup.skills.includes('balance_sense')) vehicle.leanTorque *= 1.05;
  return { setup, vehicle, tireGrip, cargoMount };
}

export function describeVehicleSetup(setup: VehicleSetup): TuningStat[] {
  const { vehicle: v, tireGrip, cargoMount: m } = resolveVehicleSetup(setup);
  return [
    { id: 'frameMass', label: 'Масса рамы', value: v.chassis.mass, unit: 'кг' },
    { id: 'torque', label: 'Крутящий момент', value: v.motor.torque, unit: 'Н·м' },
    { id: 'driveLimit', label: 'Предел тяги', value: v.maxSpeed * 3.6, unit: 'км/ч' },
    { id: 'frequency', label: 'Жёсткость подвески', value: v.suspension.frequencyHz, unit: 'Гц' },
    { id: 'damping', label: 'Демпфирование', value: v.suspension.dampingRatio, unit: '' },
    {
      id: 'dryGrip',
      label: 'Сцепление: сухо',
      value: Math.sqrt(SURFACES.asphalt.friction * v.wheel.friction) * tireGrip.asphalt,
      unit: '',
    },
    {
      id: 'wetGrip',
      label: 'Сцепление: мокро',
      value:
        Math.sqrt(SURFACES['wet-asphalt'].friction * v.wheel.friction) * tireGrip['wet-asphalt'],
      unit: '',
    },
    { id: 'mountMass', label: 'Добавочный вес короба', value: m.addedMass, unit: 'кг' },
    { id: 'mountFrequency', label: 'Крепление груза', value: m.frequencyHz, unit: 'Гц' },
    { id: 'insulation', label: 'Теплоизоляция', value: m.insulation, unit: '×' },
    { id: 'controlledLean', label: 'Управляемый наклон', value: v.leanTorque, unit: 'Н·м' },
  ];
}
