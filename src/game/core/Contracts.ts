import records from '../../content/contracts.json';
import type { LevelData } from '../levels/testLevel';
export interface ContractDefinition {
  levelId: string;
  number: string;
  title: string;
  customer: string;
  cargoLabel: string;
  description: string;
  dispatcher: string;
  difficultyLabel: string;
  rewardCoins: number;
  rewardXp: number;
  unlockAfter: string | null;
  theme: string;
}
export const CONTRACTS: readonly ContractDefinition[] = records;
export const FIRST_CONTRACT_ID = 'contract_001_surprise_fifth';
export const SECOND_CONTRACT_ID = 'contract_002_while_hot';
export function contractForLevel(level: LevelData): ContractDefinition {
  return (
    CONTRACTS.find((c) => c.levelId === level.id) ?? {
      levelId: level.id,
      number: '—',
      title: level.name,
      customer: 'Точка доставки',
      cargoLabel: 'Заказ',
      description: 'Новый маршрут через район. Береги заказ и контролируй баланс.',
      dispatcher: 'Заказ ждёт курьера.',
      difficultyLabel: 'Авторский маршрут',
      rewardCoins: 0,
      rewardXp: 0,
      unlockAfter: null,
      theme: 'day',
    }
  );
}
