import type { ScenarioConfig } from '../types';

export const SCENARIOS: Record<string, ScenarioConfig> = {
  support: {
    label: "Support", mode: "zone", touchesRequired: 2,
    zones: [{ low: 99.0, high: 100.2, direction: "buy" }],
    candles: [
      { path: [110, 108] }, { path: [108, 105] }, { path: [105, 102] }, { path: [102, 100.9] },
      { path: [100.9, 99.3, 100.6], touch: true },
      { path: [100.6, 103] }, { path: [103, 106] }, { path: [106, 109] }, { path: [109, 107] },
      { path: [107, 104] }, { path: [104, 101.4] },
      { path: [101.4, 99.4, 100.9], touch: true },
      { path: [100.9, 104] }, { path: [104, 108] }, { path: [108, 112] }, { path: [112, 116] },
      { path: [116, 119] }, { path: [119, 122] }, { path: [122, 120] }, { path: [120, 123] },
      { path: [123, 121] }, { path: [121, 125] },
    ],
  },
  resistance: {
    label: "Résistance", mode: "zone", touchesRequired: 2,
    zones: [{ low: 119.0, high: 120.2, direction: "sell" }],
    candles: [
      { path: [90, 93] }, { path: [93, 96] }, { path: [96, 99] }, { path: [99, 102] },
      { path: [102, 105] }, { path: [105, 108] }, { path: [108, 111] }, { path: [111, 114] },
      { path: [114, 117] }, { path: [117, 118.9] },
      { path: [118.9, 120.9, 118.4], touch: true },
      { path: [118.4, 115] }, { path: [115, 112] }, { path: [112, 109] }, { path: [109, 111.5] },
      { path: [111.5, 114] }, { path: [114, 117] }, { path: [117, 118.8] },
      { path: [118.8, 120.7, 118.6], touch: true },
      { path: [118.6, 115] }, { path: [115, 111] }, { path: [111, 107] },
    ],
  },
  breakout: {
    label: "Breakout & Retest", mode: "zone", touchesRequired: 1,
    zones: [{ low: 109.0, high: 110.2, direction: "buy" }],
    candles: [
      { path: [95, 98] }, { path: [98, 101] }, { path: [101, 104] }, { path: [104, 107] },
      { path: [107, 110.8] },
      { path: [110.8, 113] }, { path: [113, 116] }, { path: [116, 114] }, { path: [114, 111.5] },
      { path: [111.5, 109.4, 110.7], touch: true },
      { path: [110.7, 114] }, { path: [114, 118] }, { path: [118, 121] }, { path: [121, 119] },
      { path: [119, 123] }, { path: [123, 126] }, { path: [126, 124] }, { path: [124, 128] },
    ],
  },
  range: {
    label: "Zones de range", mode: "zone", touchesRequired: 2,
    zones: [
      { low: 99.3, high: 100.5, direction: "buy" },
      { low: 118.5, high: 119.7, direction: "sell" },
    ],
    candles: [
      { path: [110, 106] }, { path: [106, 102] }, { path: [102, 100.6] },
      { path: [100.6, 99.4, 100.7], touch: true },
      { path: [100.7, 104] }, { path: [104, 108] }, { path: [108, 112] }, { path: [112, 116] },
      { path: [116, 118.3] },
      { path: [118.3, 119.9, 118.1], touch: true },
      { path: [118.1, 115] }, { path: [115, 111] }, { path: [111, 107] }, { path: [107, 103] },
      { path: [103, 100.8] },
      { path: [100.8, 99.5, 100.6], touch: true },
      { path: [100.6, 104] }, { path: [104, 108] },
    ],
  },
  pinbar: {
    label: "Pin bar / Marteau", mode: "pattern", patternName: "Pin bar", patternDirection: "buy", windowCandles: 3,
    candles: [
      { path: [108, 105] }, { path: [105, 102] }, { path: [102, 99] }, { path: [99, 96] }, { path: [96, 93] },
      { path: [93, 88, 94], pattern: true },
      { path: [94, 97] }, { path: [97, 101] }, { path: [101, 105] }, { path: [105, 108] },
      { path: [108, 111] }, { path: [111, 109] }, { path: [109, 113] }, { path: [113, 116] },
      { path: [116, 114] }, { path: [114, 118] },
    ],
  },
  engulfing: {
    label: "Engulfing", mode: "pattern", patternName: "Engulfing", patternDirection: "buy", windowCandles: 3,
    candles: [
      { path: [108, 105] }, { path: [105, 102] }, { path: [102, 99] }, { path: [99, 97] },
      { path: [97, 101], pattern: true },
      { path: [101, 104] }, { path: [104, 107] }, { path: [107, 105] }, { path: [105, 109] },
      { path: [109, 112] }, { path: [112, 110] }, { path: [110, 114] },
    ],
  },
  doji: {
    label: "Doji", mode: "pattern", patternName: "Doji", patternDirection: "sell", windowCandles: 3,
    candles: [
      { path: [95, 98] }, { path: [98, 102] }, { path: [102, 106] }, { path: [106, 110] },
      { path: [110, 110.3], pattern: true },
      { path: [110.3, 107] }, { path: [107, 103] }, { path: [103, 99] }, { path: [99, 102] },
      { path: [102, 105] },
    ],
  },
  morningstar: {
    label: "Étoile du matin / du soir", mode: "pattern", patternName: "Étoile du matin", patternDirection: "buy", windowCandles: 3,
    candles: [
      { path: [112, 108] }, { path: [108, 104] }, { path: [104, 100] }, { path: [100, 99.2] },
      { path: [99.2, 104], pattern: true },
      { path: [104, 108] }, { path: [108, 112] }, { path: [112, 110] }, { path: [110, 114] },
      { path: [114, 117] },
    ],
  },
  insidebar: {
    label: "Inside bar", mode: "pattern", patternName: "Inside bar", patternDirection: "buy", windowCandles: 3,
    candles: [
      { path: [95, 99] }, { path: [99, 103] }, { path: [103, 107] },
      { path: [105, 106], pattern: true },
      { path: [106, 110] }, { path: [110, 114] }, { path: [114, 111] }, { path: [111, 115] },
      { path: [115, 118] },
    ],
  },
  threesoldiers: {
    label: "Trois soldats / corbeaux", mode: "pattern", patternName: "3 soldats", patternDirection: "buy", windowCandles: 3,
    candles: [
      { path: [100, 98] }, { path: [98, 96] }, { path: [96, 99] }, { path: [99, 103] },
      { path: [103, 107], pattern: true },
      { path: [107, 110] }, { path: [110, 113] }, { path: [113, 111] }, { path: [111, 115] },
      { path: [115, 118] },
    ],
  },
  headshoulders: {
    label: "Tête-épaules", mode: "zone", touchesRequired: 1,
    zones: [{ low: 99.0, high: 100.2, direction: "sell" }],
    candles: [
      { path: [100, 104] }, { path: [104, 100.6] }, { path: [100.6, 108] }, { path: [108, 100.4] },
      { path: [100.4, 105] }, { path: [105, 100.8] },
      { path: [100.8, 97] },
      { path: [97, 94] }, { path: [94, 91] }, { path: [91, 93.5] },
      { path: [93.5, 100.6, 92], touch: true },
      { path: [92, 89] }, { path: [89, 86] }, { path: [86, 83] },
    ],
  },
  doubletop: {
    label: "Double top / bottom", mode: "zone", touchesRequired: 1,
    zones: [{ low: 97.0, high: 98.2, direction: "sell" }],
    candles: [
      { path: [95, 103] }, { path: [103, 98] }, { path: [98, 104] }, { path: [104, 98.5] },
      { path: [98.5, 95] },
      { path: [95, 92] }, { path: [92, 89] }, { path: [89, 91.5] },
      { path: [91.5, 98.4, 90], touch: true },
      { path: [90, 87] }, { path: [87, 84] },
    ],
  },
  triangle: {
    label: "Triangle", mode: "zone", touchesRequired: 1,
    zones: [{ low: 104.0, high: 105.2, direction: "buy" }],
    candles: [
      { path: [100, 106] }, { path: [106, 98] }, { path: [98, 104] }, { path: [104, 100] },
      { path: [100, 103] }, { path: [103, 101] },
      { path: [101, 105.5] },
      { path: [105.5, 108] }, { path: [108, 111] }, { path: [111, 109] },
      { path: [109, 104.3, 110], touch: true },
      { path: [110, 113] }, { path: [113, 116] },
    ],
  },
  flag: {
    label: "Drapeau et fanion", mode: "zone", touchesRequired: 1,
    zones: [{ low: 109.3, high: 110.5, direction: "buy" }],
    candles: [
      { path: [95, 110] }, { path: [110, 107] }, { path: [107, 109] }, { path: [109, 106.8] },
      { path: [106.8, 108.8] },
      { path: [108.8, 111.2] },
      { path: [111.2, 114] }, { path: [114, 117] }, { path: [117, 115] },
      { path: [115, 109.6, 116], touch: true },
      { path: [116, 119] }, { path: [119, 122] },
    ],
  },
  wedge: {
    label: "Biseau (wedge)", mode: "zone", touchesRequired: 1,
    zones: [{ low: 99.0, high: 100.2, direction: "sell" }],
    candles: [
      { path: [90, 97] }, { path: [97, 93] }, { path: [93, 100] }, { path: [100, 96] },
      { path: [96, 102] }, { path: [102, 99.8] },
      { path: [99.8, 96] },
      { path: [96, 93] }, { path: [93, 90] }, { path: [90, 92.5] },
      { path: [92.5, 99.4, 91], touch: true },
      { path: [91, 88] }, { path: [88, 85] },
    ],
  },
  cuphandle: {
    label: "Cup and handle", mode: "zone", touchesRequired: 1,
    zones: [{ low: 99.5, high: 100.7, direction: "buy" }],
    candles: [
      { path: [100, 90] }, { path: [90, 85] }, { path: [85, 92] }, { path: [92, 99] },
      { path: [99, 100.4] }, { path: [100.4, 97] }, { path: [97, 99.6] },
      { path: [99.6, 101.2] },
      { path: [101.2, 104] }, { path: [104, 107] }, { path: [107, 105] },
      { path: [105, 99.9, 106], touch: true },
      { path: [106, 109] }, { path: [109, 112] },
    ],
  },
  ma: {
    label: "Moyennes mobiles", mode: "ma", shortPeriod: 3, longPeriod: 6, direction: "buy", windowCandles: 3,
    candles: [
      { path: [110, 106] }, { path: [106, 102] }, { path: [102, 98] }, { path: [98, 95] },
      { path: [95, 93] },
      { path: [93, 96] }, { path: [96, 100] }, { path: [100, 104] }, { path: [104, 108] },
      { path: [108, 112] }, { path: [112, 110] }, { path: [110, 114] }, { path: [114, 117] },
    ],
  },
  rsi: {
    label: "RSI", mode: "indicator", indicator: "rsi", period: 6, oversold: 30, overbought: 70, direction: "buy", windowCandles: 3,
    candles: [
      { path: [112, 110] }, { path: [110, 107] }, { path: [107, 104] }, { path: [104, 101] },
      { path: [101, 98] }, { path: [98, 95] }, { path: [95, 93] },
      { path: [93, 97] }, { path: [97, 102] }, { path: [102, 107] }, { path: [107, 112] },
      { path: [112, 115] }, { path: [115, 118] }, { path: [118, 121] }, { path: [121, 119] },
      { path: [119, 123] },
    ],
  },
  macd: {
    label: "MACD", mode: "indicator", indicator: "macd", shortPeriod: 3, longPeriod: 6, signalPeriod: 3, direction: "buy", windowCandles: 3,
    candles: [
      { path: [115, 112] }, { path: [112, 109] }, { path: [109, 106] }, { path: [106, 103] },
      { path: [103, 100] }, { path: [100, 98] },
      { path: [98, 101] }, { path: [101, 105] }, { path: [105, 109] }, { path: [109, 113] },
      { path: [113, 116] }, { path: [116, 119] }, { path: [119, 117] }, { path: [117, 121] },
      { path: [121, 124] },
    ],
  },
  bollinger: {
    label: "Bandes de Bollinger", mode: "band", period: 6, stdMult: 2, direction: "buy", windowCandles: 3,
    candles: [
      { path: [105, 102] }, { path: [102, 99] }, { path: [99, 97] }, { path: [97, 96] }, { path: [96, 95.5] },
      { path: [95.5, 91, 96] },
      { path: [96, 99] }, { path: [99, 103] }, { path: [103, 107] }, { path: [107, 110] },
      { path: [110, 108] }, { path: [108, 112] }, { path: [112, 115] },
    ],
  },
  stoch: {
    label: "Stochastique", mode: "indicator", indicator: "stoch", period: 6, dPeriod: 3, oversold: 20, overbought: 80, direction: "buy", windowCandles: 3,
    candles: [
      { path: [108, 104] }, { path: [104, 100] }, { path: [100, 96] }, { path: [96, 93] },
      { path: [93, 90] }, { path: [90, 88] },
      // Rebond lent puis croisement %K/%D en zone basse (avant : jamais de croisement, niveau injouable).
      { path: [88, 88.6] }, { path: [88.6, 88] }, { path: [88, 91] }, { path: [91, 95] },
      { path: [95, 99] }, { path: [99, 103] }, { path: [103, 106] }, { path: [106, 104] },
      { path: [104, 108] }, { path: [108, 111] },
    ],
  },
  fibo: {
    label: "Retracements de Fibonacci", mode: "zone", touchesRequired: 1,
    zones: [{ low: 103.2, high: 104.4, direction: "buy" }],
    fiboLevels: [
      { pct: "0%", price: 126 }, { pct: "23.6%", price: 117.5 }, { pct: "38.2%", price: 112.2 },
      { pct: "50%", price: 108 }, { pct: "61.8%", price: 103.8, highlight: true },
      { pct: "78.6%", price: 97.7 }, { pct: "100%", price: 90 },
    ],
    candles: [
      { path: [90, 96] }, { path: [96, 102] }, { path: [102, 108] }, { path: [108, 114] },
      { path: [114, 118] }, { path: [118, 122] }, { path: [122, 126] },
      { path: [126, 120] }, { path: [120, 114] }, { path: [114, 108] }, { path: [108, 104.6] },
      { path: [104.6, 103.0, 104.9], touch: true },
      { path: [104.9, 109] }, { path: [109, 113] }, { path: [113, 117] }, { path: [117, 121] },
      { path: [121, 125] },
    ],
  },
  fiboext: {
    label: "Extensions de Fibonacci", mode: "zone", touchesRequired: 1,
    zones: [{ low: 105.7, high: 106.7, direction: "sell" }],
    fiboLevels: [
      { pct: "0%", price: 90 }, { pct: "100%", price: 100 }, { pct: "127.2%", price: 102.7 },
      { pct: "161.8%", price: 106.2, highlight: true }, { pct: "200%", price: 110 },
    ],
    candles: [
      { path: [90, 93] }, { path: [93, 96] }, { path: [96, 100] },
      { path: [100, 97] },
      { path: [97, 102] }, { path: [102, 105.5] },
      { path: [105.5, 106.9, 105.2], touch: true },
      { path: [105.2, 102] }, { path: [102, 99] }, { path: [99, 96] },
    ],
  },
  volume: {
    label: "Volume basique", mode: "pattern", patternName: "Pic de volume", patternDirection: "buy", windowCandles: 3, showVolume: true,
    candles: [
      { path: [100, 102], vol: 5 }, { path: [102, 101], vol: 6 }, { path: [101, 103], vol: 5 },
      { path: [103, 102], vol: 7 }, { path: [102, 104], vol: 6 },
      { path: [104, 110], vol: 24, pattern: true },
      { path: [110, 113], vol: 12 }, { path: [113, 116], vol: 9 }, { path: [116, 114], vol: 8 },
      { path: [114, 118], vol: 10 },
    ],
  },
  vwap: {
    label: "VWAP", mode: "vwap", direction: "buy", windowCandles: 3,
    candles: [
      { path: [100, 98], vol: 8 }, { path: [98, 96], vol: 9 }, { path: [96, 94], vol: 7 },
      { path: [94, 92], vol: 10 },
      { path: [92, 89, 95], vol: 14 },
      { path: [95, 97], vol: 9 }, { path: [97, 101], vol: 8 }, { path: [101, 105], vol: 7 },
      { path: [105, 103], vol: 9 }, { path: [103, 107], vol: 8 },
    ],
  },
  volumeprofile: {
    label: "Volume Profile", mode: "zone", touchesRequired: 1,
    zones: [{ low: 103.3, high: 104.5, direction: "buy" }],
    candles: [
      { path: [95, 99] }, { path: [99, 104] }, { path: [104, 108] }, { path: [108, 105] },
      { path: [105, 109] }, { path: [109, 106] }, { path: [106, 110] },
      { path: [110, 107] }, { path: [107, 104.7] },
      { path: [104.7, 103.1, 104.9], touch: true },
      { path: [104.9, 108] }, { path: [108, 112] },
    ],
  },
  liquidityzones: {
    label: "Zones de liquidité", mode: "zone", touchesRequired: 1,
    zones: [{ low: 118.8, high: 120.0, direction: "sell" }],
    candles: [
      { path: [100, 106] }, { path: [106, 110] }, { path: [110, 115] }, { path: [115, 118.6] },
      { path: [118.6, 121.4, 118.3], touch: true },
      { path: [118.3, 115] }, { path: [115, 111] }, { path: [111, 107] }, { path: [107, 104] },
    ],
  },
  trend: {
    label: "Tendance haussière/baissière", mode: "zone", touchesRequired: 1,
    zones: [{ low: 104.6, high: 105.8, direction: "buy" }],
    candles: [
      { path: [95, 99] }, { path: [99, 103] }, { path: [103, 107] }, { path: [107, 105.2] },
      { path: [105.2, 104.7, 105.6], touch: true },
      { path: [105.6, 109] }, { path: [109, 113] }, { path: [113, 117] }, { path: [117, 115] },
      { path: [115, 119] },
    ],
  },
  channel: {
    label: "Canaux de prix", mode: "zone", touchesRequired: 2,
    zones: [
      { low: 99.4, high: 100.6, direction: "buy" },
      { low: 114.5, high: 115.7, direction: "sell" },
    ],
    candles: [
      { path: [108, 104] }, { path: [104, 101] },
      { path: [101, 100.1, 100.8], touch: true },
      { path: [100.8, 104] }, { path: [104, 108] }, { path: [108, 112] },
      { path: [112, 115.9, 114.8], touch: true },
      { path: [114.8, 111] }, { path: [111, 107] }, { path: [107, 103] },
      { path: [103, 100.2, 100.9], touch: true },
      { path: [100.9, 104] }, { path: [104, 108] },
    ],
  },
  orderblock: {
    label: "Order blocks (ICT)", mode: "zone", touchesRequired: 1,
    zones: [{ low: 99.2, high: 100.4, direction: "buy" }],
    candles: [
      { path: [112, 108] }, { path: [108, 104] }, { path: [104, 100.6] },
      { path: [100.6, 99.5, 100.2], touch: true },
      { path: [100.2, 105] }, { path: [105, 110] }, { path: [110, 115] }, { path: [115, 113] },
      { path: [113, 117] }, { path: [117, 120] },
    ],
  },
  fvg: {
    label: "Fair Value Gap", mode: "zone", touchesRequired: 1,
    zones: [{ low: 103.0, high: 104.2, direction: "buy" }],
    candles: [
      { path: [95, 99] }, { path: [99, 104] }, { path: [104, 110] }, { path: [110, 114] },
      { path: [114, 111] }, { path: [111, 107] },
      { path: [107, 103.5, 104.6], touch: true },
      { path: [104.6, 109] }, { path: [109, 113] }, { path: [113, 117] },
    ],
  },
  liquiditysweep: {
    label: "Liquidity sweep", mode: "zone", touchesRequired: 1,
    zones: [{ low: 118.8, high: 120.0, direction: "sell" }],
    candles: [
      { path: [100, 105] }, { path: [105, 110] }, { path: [110, 115] }, { path: [115, 118.6] },
      { path: [118.6, 121.5, 118.2], touch: true },
      { path: [118.2, 114] }, { path: [114, 110] }, { path: [110, 106] }, { path: [106, 102] },
    ],
  },
  breakerblock: {
    label: "Breaker block", mode: "zone", touchesRequired: 1,
    zones: [{ low: 104.8, high: 106.0, direction: "sell" }],
    candles: [
      { path: [112, 108] }, { path: [108, 105.4] }, { path: [105.4, 102] }, { path: [102, 98] },
      { path: [98, 101] }, { path: [101, 104.6] },
      { path: [104.6, 106.1, 105.0], touch: true },
      { path: [105.0, 101] }, { path: [101, 97] }, { path: [97, 93] },
    ],
  },
  chochbos: {
    label: "CHoCH / BOS", mode: "zone", touchesRequired: 1,
    zones: [{ low: 107.0, high: 108.2, direction: "buy" }],
    candles: [
      { path: [100, 97] }, { path: [97, 94] }, { path: [94, 98] }, { path: [98, 102] },
      { path: [102, 108.5] },
      { path: [108.5, 111] }, { path: [111, 109] },
      { path: [109, 107.3, 108.6], touch: true },
      { path: [108.6, 112] }, { path: [112, 116] },
    ],
  },
  premiumdiscount: {
    label: "Zones premium/discount", mode: "zone", touchesRequired: 2,
    zones: [
      { low: 99.5, high: 100.7, direction: "buy" },
      { low: 113.5, high: 114.7, direction: "sell" },
    ],
    candles: [
      { path: [107, 103] }, { path: [103, 100.9] },
      { path: [100.9, 99.6, 100.5], touch: true },
      { path: [100.5, 104] }, { path: [104, 108] }, { path: [108, 112] },
      { path: [112, 113.9, 113.2], touch: true },
      { path: [113.2, 110] }, { path: [110, 106] }, { path: [106, 102] },
    ],
  },
  ote: {
    label: "Optimal Trade Entry", mode: "zone", touchesRequired: 1,
    zones: [{ low: 98.4, high: 103.8, direction: "buy" }],
    fiboLevels: [
      { pct: "0%", price: 126 }, { pct: "50%", price: 108 },
      { pct: "61.8%", price: 103.8, highlight: true }, { pct: "79%", price: 98.4, highlight: true },
      { pct: "100%", price: 90 },
    ],
    candles: [
      { path: [90, 96] }, { path: [96, 102] }, { path: [102, 108] }, { path: [108, 114] },
      { path: [114, 120] }, { path: [120, 126] },
      { path: [126, 120] }, { path: [120, 114] }, { path: [114, 108] }, { path: [108, 102.5] },
      { path: [102.5, 99.0, 101.8], touch: true },
      { path: [101.8, 106] }, { path: [106, 111] }, { path: [111, 116] }, { path: [116, 121] },
    ],
  },
  confluencesr: {
    label: "S/R + chandelier", mode: "zone", touchesRequired: 1,
    zones: [{ low: 99.0, high: 100.2, direction: "buy" }],
    candles: [
      { path: [108, 104] }, { path: [104, 101] },
      { path: [101, 99.6, 100.5], touch: true },
      { path: [100.5, 104] }, { path: [104, 108] }, { path: [108, 112] },
      { path: [112, 116] }, { path: [116, 120] },
    ],
  },
  confluenceictfibo: {
    label: "ICT + Fibonacci", mode: "zone", touchesRequired: 1,
    zones: [{ low: 100.0, high: 101.4, direction: "buy" }],
    fiboLevels: [
      { pct: "50%", price: 108 }, { pct: "61.8%", price: 101.4, highlight: true },
      { pct: "79%", price: 96, highlight: true },
    ],
    candles: [
      { path: [90, 98] }, { path: [98, 106] }, { path: [106, 114] }, { path: [114, 122] },
      { path: [122, 126] },
      { path: [126, 118] }, { path: [118, 110] }, { path: [110, 103] },
      { path: [103, 100.6, 102.0], touch: true },
      { path: [102.0, 107] }, { path: [107, 112] }, { path: [112, 117] },
    ],
  },
    trendline: {
    label: "Lignes de tendance", mode: "trendzone", direction: "buy", tolerance: 2,
    trendAnchors: [{ idx: 2, price: 100 }, { idx: 11, price: 120 }],
    candles: [
      { path: [104, 101] }, { path: [101, 99] }, { path: [99, 102] }, { path: [102, 105] },
      { path: [105, 108] }, { path: [108, 111] }, { path: [111, 109] }, { path: [109, 113] },
      { path: [113, 116] }, { path: [116, 119] }, { path: [119, 122] }, { path: [122, 125] },
    ],
  },
  killzones: {
    label: "Kill zones", mode: "timewindow", timewindowType: "favor", direction: "buy", windowRange: [4, 7],
    candles: [
      { path: [100, 102] }, { path: [102, 104] }, { path: [104, 103] }, { path: [103, 106] },
      { path: [106, 110] }, { path: [110, 114] }, { path: [114, 118] }, { path: [118, 116] },
      { path: [116, 120] }, { path: [120, 123] },
    ],
  },
  sessions: {
    label: "Sessions de trading", mode: "timewindow", timewindowType: "favor", direction: "sell", windowRange: [4, 7],
    candles: [
      { path: [120, 118] }, { path: [118, 116] }, { path: [116, 117] }, { path: [117, 114] },
      { path: [114, 110] }, { path: [110, 106] }, { path: [106, 103] }, { path: [103, 105] },
      { path: [105, 101] }, { path: [101, 98] },
    ],
  },
  news: {
    label: "News économiques", mode: "timewindow", timewindowType: "avoid", direction: "buy", windowRange: [5, 6],
    candles: [
      { path: [100, 101] }, { path: [101, 100] }, { path: [100, 102] }, { path: [102, 101] },
      { path: [101, 103] },
      { path: [103, 115] },
      { path: [115, 98] },
      { path: [98, 104] }, { path: [104, 106] }, { path: [106, 105] }, { path: [105, 108] },
      { path: [108, 110] },
    ],
  },
};