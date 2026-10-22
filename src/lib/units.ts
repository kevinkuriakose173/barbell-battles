export type WeightUnit = 'lb' | 'kg';

const POUNDS_PER_KILOGRAM = 2.2046226218;

export function kilogramsToUnit(weightKg: number, unit: WeightUnit) {
  return unit === 'lb' ? weightKg * POUNDS_PER_KILOGRAM : weightKg;
}

export function unitToKilograms(weight: number, unit: WeightUnit) {
  return unit === 'lb' ? weight / POUNDS_PER_KILOGRAM : weight;
}

export function formatWeight(weightKg: number, unit: WeightUnit) {
  const converted = kilogramsToUnit(weightKg, unit);
  return `${Number(converted.toFixed(1))} ${unit}`;
}
