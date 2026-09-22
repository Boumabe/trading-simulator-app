export type Num = number | null;

export function rsiAt(closes: number[], period: number): Num {
  if (closes.length < period + 1) return null;
  const slice = closes.slice(-(period + 1));
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i] - slice[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return 100 - 100 / (1 + avgGain / avgLoss);
}

/** Série alignée sur les bougies : la valeur i n'utilise que les clôtures 0..i. */
export function rsiSeries(closes: number[], period: number): Num[] {
  return closes.map((_, i) => rsiAt(closes.slice(0, i + 1), period));
}

export function emaSeries(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  values.forEach((v, i) => out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)));
  return out;
}

export function macd(closes: number[], shortP: number, longP: number, sigP: number) {
  if (closes.length < 2) return { macdLine: [] as number[], signalLine: [] as number[] };
  const emaShort = emaSeries(closes, shortP);
  const emaLong = emaSeries(closes, longP);
  const macdLine = closes.map((_, i) => emaShort[i] - emaLong[i]);
  return { macdLine, signalLine: emaSeries(macdLine, sigP) };
}

interface HL { high: number; low: number; close: number }

export function stochastic(candles: HL[], period: number, dPeriod: number) {
  const k: Num[] = candles.map((_, i) => {
    if (i < period - 1) return null;
    const win = candles.slice(i - period + 1, i + 1);
    const hh = Math.max(...win.map((c) => c.high));
    const ll = Math.min(...win.map((c) => c.low));
    return hh === ll ? 50 : (100 * (candles[i].close - ll)) / (hh - ll);
  });
  const d: Num[] = k.map((_, i) => {
    const w = k.slice(Math.max(0, i - dPeriod + 1), i + 1).filter((v): v is number => v !== null);
    if (w.length < dPeriod) return null;
    return w.reduce((a, b) => a + b, 0) / w.length;
  });
  return { k, d };
}

export function bollinger(closes: number[], period: number, mult: number) {
  const sma: Num[] = [];
  const upper: Num[] = [];
  const lower: Num[] = [];
  closes.forEach((_, i) => {
    if (i < period - 1) {
      sma.push(null);
      upper.push(null);
      lower.push(null);
      return;
    }
    const win = closes.slice(i - period + 1, i + 1);
    const mean = win.reduce((a, b) => a + b, 0) / period;
    const sd = Math.sqrt(win.reduce((a, b) => a + (b - mean) ** 2, 0) / period);
    sma.push(mean);
    upper.push(mean + mult * sd);
    lower.push(mean - mult * sd);
  });
  return { sma, upper, lower };
}

export function vwap(candles: { close: number; vol?: number }[]): number[] {
  let pv = 0;
  let v = 0;
  return candles.map((c) => {
    const vol = c.vol || 1;
    pv += c.close * vol;
    v += vol;
    return pv / v;
  });
}
