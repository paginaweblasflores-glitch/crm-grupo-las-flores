// PRNG determinístico (mulberry32) para que los datos simulados sean estables
// entre el render de servidor y el de cliente (evita mismatches de hidratación).

export function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260825);

export function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

export function pickMany<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rand() * copy.length);
    out.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return out;
}

export function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function randFloat(min: number, max: number, decimals = 0): number {
  const v = rand() * (max - min) + min;
  const f = Math.pow(10, decimals);
  return Math.round(v * f) / f;
}

export function randBool(probTrue = 0.5): boolean {
  return rand() < probTrue;
}

export function daysAgoISO(days: number): string {
  const d = new Date(BASE_DATE);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function daysAheadISO(days: number): string {
  return daysAgoISO(-days);
}

export const BASE_DATE = new Date(2026, 7, 25); // 25 de agosto de 2026 (hoy, según contexto del proyecto)

export function randPhone(): string {
  return "9" + Array.from({ length: 8 }, () => randInt(0, 9)).join("");
}

export function randRuc(): string {
  return "20" + Array.from({ length: 9 }, () => randInt(0, 9)).join("");
}

export function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}
