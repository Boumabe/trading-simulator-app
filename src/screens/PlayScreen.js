import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { View, Text, TouchableOpacity, Pressable, StyleSheet } from "react-native";
import Svg, { Rect, Line, Circle, Text as SvgText, Defs, Pattern, Polyline } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import COLORS from "../constants/palette";
import { STRATEGY_DATA, LEVELS } from "../data/levels";
import TourOverlay from "../components/TourOverlay";
import { useLang } from "../i18n";
import { localizedLevelName } from "../i18n/levelNames";
import { getCompletedIds, markLevelComplete } from "../utils/progress";

const PENALTY = 15;
const BONUS = 5;
const TICK_MS = 200;
const TICKS_PER_CANDLE = 300;
const WINDOW_SIZE = 12;
const TOUR_KEY = "seen_trading_tour";

function pathPrice(path, frac) {
  const segs = path.length - 1;
  const scaled = Math.min(frac, 1) * segs;
  const segIdx = Math.min(Math.floor(scaled), segs - 1);
  const segFrac = scaled - segIdx;
  const a = path[segIdx], b = path[segIdx + 1];
  return a + (b - a) * segFrac;
}

function computeRSI(closes, period) {
  if (closes.length < period + 1) return null;
  const slice = closes.slice(-(period + 1));
  let gains = 0, losses = 0;
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i] - slice[i - 1];
    if (diff >= 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function computeEMASeries(values, period) {
  const k = 2 / (period + 1);
  const out = [];
  values.forEach((v, i) => { out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)); });
  return out;
}

function computeMACD(closes, shortP, longP, sigP) {
  if (closes.length < 2) return { macdLine: [], signalLine: [] };
  const emaShort = computeEMASeries(closes, shortP);
  const emaLong = computeEMASeries(closes, longP);
  const macdLine = closes.map((_, i) => emaShort[i] - emaLong[i]);
  const signalLine = computeEMASeries(macdLine, sigP);
  return { macdLine, signalLine };
}

function computeStochastic(candlesArr, period, dPeriod) {
  const kSeries = candlesArr.map((_, i) => {
    if (i < period - 1) return null;
    const window = candlesArr.slice(i - period + 1, i + 1);
    const hh = Math.max(...window.map((c) => c.high));
    const ll = Math.min(...window.map((c) => c.low));
    return hh === ll ? 50 : (100 * (candlesArr[i].close - ll)) / (hh - ll);
  });
  const dSeries = kSeries.map((_, i) => {
    const w = kSeries.slice(Math.max(0, i - dPeriod + 1), i + 1).filter((v) => v !== null);
    if (w.length < dPeriod) return null;
    return w.reduce((a, b) => a + b, 0) / w.length;
  });
  return { kSeries, dSeries };
}

function computeBollinger(closes, period, mult) {
  const sma = [], upper = [], lower = [];
  closes.forEach((_, i) => {
    if (i < period - 1) { sma.push(null); upper.push(null); lower.push(null); return; }
    const window = closes.slice(i - period + 1, i + 1);
    const mean = window.reduce((a, b) => a + b, 0) / period;
    const variance = window.reduce((a, b) => a + (b - mean) ** 2, 0) / period;
    const sd = Math.sqrt(variance);
    sma.push(mean); upper.push(mean + mult * sd); lower.push(mean - mult * sd);
  });
  return { sma, upper, lower };
}

function computeVWAP(candlesArr) {
  let cumPV = 0, cumV = 0;
  return candlesArr.map((c) => {
    const vol = c.vol || 1;
    cumPV += c.close * vol;
    cumV += vol;
    return cumPV / cumV;
  });
}

function fmt(str, params) {
  let out = str;
  Object.keys(params).forEach((k) => { out = out.replace(`{${k}}`, params[k]); });
  return out;
}

function BracketFrame({ children, color = COLORS.blue, style }) {
  return (
    <View style={[{ position: "relative" }, style]}>
      {children}
      <View style={[brk.base, brk.tl, { borderColor: color }]} />
      <View style={[brk.base, brk.tr, { borderColor: color }]} />
      <View style={[brk.base, brk.bl, { borderColor: color }]} />
      <View style={[brk.base, brk.br, { borderColor: color }]} />
    </View>
  );
}

export default function PlayScreen({ onBack, balance, onApplyDelta, strategyId, onLiveDeltaChange }) {
  const { t, lang } = useLang();
  const config = STRATEGY_DATA[strategyId] || STRATEGY_DATA.support;
  const isPattern = config.mode === "pattern";
  const isIndicator = config.mode === "indicator";
  const isBand = config.mode === "band";
  const isMA = config.mode === "ma";
  const isVWAP = config.mode === "vwap";
  const isTrendZone = config.mode === "trendzone";
  const isTimeWindow = config.mode === "timewindow";
  const isZoneMode = !isPattern && !isIndicator && !isBand && !isMA && !isVWAP && !isTrendZone && !isTimeWindow;
  const { candles: CANDLES, zones: ZONES, label, touchesRequired } = config;
  const levelEntry = LEVELS.find((l) => l.strategyId === strategyId);
  const displayLabel = levelEntry ? localizedLevelName(levelEntry.id, lang) : label;
  const sniperEligible = (isZoneMode && ZONES && ZONES.length === 1) || isTrendZone;

  const [running, setRunning] = useState(false);
  const [candles, setCandles] = useState([]);
  const [forming, setForming] = useState(null);
  const [position, setPosition] = useState(null);
  const [trades, setTrades] = useState([]);
  const [validTouches, setValidTouches] = useState(0);
  const [patternDeadlineIdx, setPatternDeadlineIdx] = useState(null);
  const [indicatorSeriesA, setIndicatorSeriesA] = useState([]);
  const [indicatorSeriesB, setIndicatorSeriesB] = useState(null);
  const [signalDeadlineIdx, setSignalDeadlineIdx] = useState(null);
  const [bandSeries, setBandSeries] = useState({ sma: [], upper: [], lower: [] });
  const [bandTouchIndices, setBandTouchIndices] = useState([]);
  const [showInfo, setShowInfo] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const [sniperActive, setSniperActive] = useState(false);
  const [drawStep, setDrawStep] = useState("idle");
  const [drawPoint1, setDrawPoint1] = useState(null);
  const [playerZone, setPlayerZone] = useState(null);
  const [playerTrendAnchors, setPlayerTrendAnchors] = useState(null);

  const st = useRef({ idx: 0, tick: 0 });
  const velRef = useRef(0);
  const prevRsiRef = useRef(null);
  const canTrade = (balance ?? 0) > 0;

  const priceRange = useMemo(() => {
    const all = CANDLES.flatMap((c) => c.path);
    return { min: Math.min(...all) - 1.2, max: Math.max(...all) + 1.2 };
  }, [CANDLES]);

  const chartW = 340;
  const rulerW = 36;
  const plotW = chartW - rulerW;
  const scaleRowH = 16;
  const chartH = isIndicator ? 180 : 220;
  const svgH = scaleRowH + chartH;
  const indicatorPanelH = 70;
  const volumePanelH = 50;
  const showVolumePanel = (isPattern && config.showVolume) || isVWAP;

  const cutCount = useMemo(() => Math.max(3, Math.min(WINDOW_SIZE, Math.floor(CANDLES.length * 0.25))), [CANDLES]);
  const previewCandles = useMemo(() => CANDLES.slice(0, cutCount).map((c) => {
    const vals = c.path;
    return { open: vals[0], close: vals[vals.length - 1], high: Math.max(...vals), low: Math.min(...vals), touch: false, pattern: false, vol: c.vol };
  }), [CANDLES, cutCount]);

  const yBase = useCallback((p) => chartH - ((p - priceRange.min) / (priceRange.max - priceRange.min)) * chartH, [priceRange]);
  const yAbs = useCallback((p) => yBase(p) + scaleRowH, [yBase]);

  const trendZoneAt = useCallback((idx) => {
    const anchors = (sniperActive && (drawStep === "confirm" || drawStep === "done") && playerTrendAnchors)
      ? playerTrendAnchors : (config.trendAnchors || [{ idx: 0, price: 0 }, { idx: 1, price: 0 }]);
    const [a, b] = anchors;
    const slope = (b.price - a.price) / (b.idx - a.idx);
    const expected = a.price + slope * (idx - a.idx);
    const tol = config.tolerance || 1.5;
    return { low: expected - tol, high: expected + tol };
  }, [config, sniperActive, drawStep, playerTrendAnchors]);

  const effectiveZones = (sniperActive && (drawStep === "confirm" || drawStep === "done") && playerZone) ? [playerZone] : ZONES;

  const maybeEnterSniper = async () => {
    if (sniperEligible && levelEntry) {
      const completed = await getCompletedIds();
      if (completed.includes(levelEntry.id)) {
        setSniperActive(true);
        setDrawStep("intro");
        return;
      }
    }
    setRunning(true);
  };

  useEffect(() => {
    (async () => {
      const seen = await AsyncStorage.getItem(TOUR_KEY);
      if (!seen) { setShowTour(true); return; }
      await maybeEnterSniper();
    })();
  }, []);

  const handleTourFinish = async () => {
    await AsyncStorage.setItem(TOUR_KEY, "1");
    setShowTour(false);
    await maybeEnterSniper();
  };

  const resetAll = () => {
    st.current = { idx: 0, tick: 0 };
    velRef.current = 0;
    prevRsiRef.current = null;
    setCandles([]); setForming(null); setPosition(null); setTrades([]);
    setValidTouches(0); setPatternDeadlineIdx(null);
    setIndicatorSeriesA([]); setIndicatorSeriesB(null); setSignalDeadlineIdx(null);
    setBandSeries({ sma: [], upper: [], lower: [] }); setBandTouchIndices([]);
    setSessionEnded(false);
    setSniperActive(false); setDrawStep("idle"); setDrawPoint1(null); setPlayerZone(null); setPlayerTrendAnchors(null);
    onLiveDeltaChange?.(0);
    maybeEnterSniper();
  };

  useEffect(() => {
    if (!running) return;
    const iv = setInterval(() => {
      const s = st.current;
      if (s.idx >= CANDLES.length) {
        clearInterval(iv); setRunning(false); setSessionEnded(true);
        if (levelEntry) markLevelComplete(levelEntry.id);
        return;
      }
      s.tick += 1;
      const c = CANDLES[s.idx];
      const frac = s.tick / TICKS_PER_CANDLE;
      const targetBase = pathPrice(c.path, frac);
      const burst = Math.random() < 0.04 ? 3 : 1;
      velRef.current = velRef.current * 0.82 + (Math.random() - 0.5) * 0.22 * burst;
      const live = targetBase + velRef.current;

      setForming((prev) => {
        const open = c.path[0];
        const hi = Math.max(prev?.high ?? open, live);
        const lo = Math.min(prev?.low ?? open, live);
        return { open, high: hi, low: lo, close: live };
      });

      if (s.tick >= TICKS_PER_CANDLE) {
        setForming((prev) => {
          const finished = {
            open: c.path[0], high: prev.high, low: prev.low, close: c.path[c.path.length - 1],
            touch: !!c.touch, pattern: !!c.pattern, vol: c.vol,
          };
          setCandles((cs) => {
            const next = [...cs, finished];
            if (finished.touch) setValidTouches((n) => n + 1);
            if (finished.pattern) setPatternDeadlineIdx(next.length + (config.windowCandles || 3));
            return next;
          });
          return null;
        });
        s.idx += 1; s.tick = 0;
      }
    }, TICK_MS);
    return () => clearInterval(iv);
  }, [running, CANDLES]);

  useEffect(() => {
    if (!isIndicator) return;
    const closes = candles.map((c) => c.close);

    if (config.indicator === "macd") {
      const { macdLine, signalLine } = computeMACD(closes, config.shortPeriod || 3, config.longPeriod || 6, config.signalPeriod || 3);
      setIndicatorSeriesA(macdLine);
      setIndicatorSeriesB(signalLine);
      const len = macdLine.length;
      if (len >= 2) {
        const prevDiff = macdLine[len - 2] - signalLine[len - 2];
        const currDiff = macdLine[len - 1] - signalLine[len - 1];
        if (config.direction === "buy" && prevDiff < 0 && currDiff >= 0) setSignalDeadlineIdx(candles.length + (config.windowCandles || 3));
        if (config.direction === "sell" && prevDiff > 0 && currDiff <= 0) setSignalDeadlineIdx(candles.length + (config.windowCandles || 3));
      }
    } else if (config.indicator === "stoch") {
      const { kSeries, dSeries } = computeStochastic(candles, config.period || 6, config.dPeriod || 3);
      setIndicatorSeriesA(kSeries);
      setIndicatorSeriesB(dSeries);
      const len = kSeries.length;
      if (len >= 2 && kSeries[len - 1] !== null && dSeries[len - 1] !== null && kSeries[len - 2] !== null && dSeries[len - 2] !== null) {
        const prevDiff = kSeries[len - 2] - dSeries[len - 2];
        const currDiff = kSeries[len - 1] - dSeries[len - 1];
        if (config.direction === "buy" && prevDiff < 0 && currDiff >= 0 && kSeries[len - 1] < 50) setSignalDeadlineIdx(candles.length + (config.windowCandles || 3));
        if (config.direction === "sell" && prevDiff > 0 && currDiff <= 0 && kSeries[len - 1] > 50) setSignalDeadlineIdx(candles.length + (config.windowCandles || 3));
      }
    } else {
      const val = computeRSI(closes, config.period || 6);
      setIndicatorSeriesA((h) => [...h, val]);
      setIndicatorSeriesB(null);
      const prev = prevRsiRef.current;
      if (val !== null && prev !== null) {
        const oversold = config.oversold ?? 30;
        const overbought = config.overbought ?? 70;
        if (config.direction === "buy" && prev < oversold && val >= oversold) setSignalDeadlineIdx(candles.length + (config.windowCandles || 3));
        if (config.direction === "sell" && prev > overbought && val <= overbought) setSignalDeadlineIdx(candles.length + (config.windowCandles || 3));
      }
      prevRsiRef.current = val;
    }
  }, [candles.length, isIndicator]);

  useEffect(() => {
    if (!isBand) return;
    const closes = candles.map((c) => c.close);
    const { sma, upper, lower } = computeBollinger(closes, config.period || 6, config.stdMult || 2);
    setBandSeries({ sma, upper, lower });
    const lastIdx = candles.length - 1;
    if (lastIdx >= 0 && lower[lastIdx] !== null) {
      const c = candles[lastIdx];
      if (config.direction === "buy" && c.low <= lower[lastIdx] && c.close > lower[lastIdx]) {
        setSignalDeadlineIdx(candles.length + (config.windowCandles || 3));
        setBandTouchIndices((p) => (p.includes(lastIdx) ? p : [...p, lastIdx]));
      }
      if (config.direction === "sell" && c.high >= upper[lastIdx] && c.close < upper[lastIdx]) {
        setSignalDeadlineIdx(candles.length + (config.windowCandles || 3));
        setBandTouchIndices((p) => (p.includes(lastIdx) ? p : [...p, lastIdx]));
      }
    }
  }, [candles.length, isBand]);

  useEffect(() => {
    if (!isMA) return;
    const closes = candles.map((c) => c.close);
    const emaShort = computeEMASeries(closes, config.shortPeriod || 3);
    const emaLong = computeEMASeries(closes, config.longPeriod || 6);
    setIndicatorSeriesA(emaShort);
    setIndicatorSeriesB(emaLong);
    const len = emaShort.length;
    if (len >= 2) {
      const prevDiff = emaShort[len - 2] - emaLong[len - 2];
      const currDiff = emaShort[len - 1] - emaLong[len - 1];
      if (config.direction === "buy" && prevDiff < 0 && currDiff >= 0) setSignalDeadlineIdx(candles.length + (config.windowCandles || 3));
      if (config.direction === "sell" && prevDiff > 0 && currDiff <= 0) setSignalDeadlineIdx(candles.length + (config.windowCandles || 3));
    }
  }, [candles.length, isMA]);

  useEffect(() => {
    if (!isVWAP) return;
    const series = computeVWAP(candles);
    setIndicatorSeriesA(series);
    const lastIdx = candles.length - 1;
    if (lastIdx >= 0) {
      const v = series[lastIdx];
      const c = candles[lastIdx];
      if (config.direction === "buy" && c.low <= v && c.close > v) {
        setSignalDeadlineIdx(candles.length + (config.windowCandles || 3));
        setBandTouchIndices((p) => (p.includes(lastIdx) ? p : [...p, lastIdx]));
      }
      if (config.direction === "sell" && c.high >= v && c.close < v) {
        setSignalDeadlineIdx(candles.length + (config.windowCandles || 3));
        setBandTouchIndices((p) => (p.includes(lastIdx) ? p : [...p, lastIdx]));
      }
    }
  }, [candles.length, isVWAP]);

  const showingPreview = sniperActive && drawStep !== "done" && drawStep !== "idle";
  const currentPrice = showingPreview
    ? (previewCandles[previewCandles.length - 1]?.close ?? CANDLES[0].path[0])
    : (forming ? forming.close : (candles[candles.length - 1]?.close ?? CANDLES[0].path[0]));

  const activeZone = !isPattern && !isIndicator && !isBand && !isMA && !isVWAP && !isTrendZone && !isTimeWindow
    ? effectiveZones.find((z) => currentPrice >= z.low && currentPrice <= z.high) : null;
  const patternWindowOpen = isPattern && patternDeadlineIdx !== null && candles.length <= patternDeadlineIdx;
  const signalWindowOpen = (isIndicator || isBand || isMA || isVWAP) && signalDeadlineIdx !== null && candles.length <= signalDeadlineIdx;
  const trendZoneNow = isTrendZone ? trendZoneAt(candles.length) : null;
  const trendInZoneNow = trendZoneNow ? currentPrice >= trendZoneNow.low && currentPrice <= trendZoneNow.high : false;
  const windowActive = isTimeWindow && config.windowRange && candles.length >= config.windowRange[0] && candles.length <= config.windowRange[1];

  const inZone = isPattern ? patternWindowOpen
    : isTimeWindow ? windowActive
      : isTrendZone ? trendInZoneNow
        : (isIndicator || isBand || isMA || isVWAP) ? signalWindowOpen
          : !!activeZone;

  const openPosition = (type) => {
    if (position || !canTrade || showingPreview) return;
    setPosition({ type, entryPrice: currentPrice, entryCandleIdx: candles.length });
  };

  const closePosition = () => {
    if (!position) return;
    const dir = position.type === "buy" ? 1 : -1;
    const rawPnl = (currentPrice - position.entryPrice) * dir * 10;

    let compliant;
    if (isPattern) {
      compliant = position.type === config.patternDirection && patternDeadlineIdx !== null && position.entryCandleIdx <= patternDeadlineIdx;
    } else if (isTrendZone) {
      const z = trendZoneAt(position.entryCandleIdx);
      compliant = position.type === config.direction && position.entryPrice >= z.low - 0.3 && position.entryPrice <= z.high + 0.3;
    } else if (isTimeWindow) {
      if (config.timewindowType === "avoid") {
        const exitIdx = candles.length;
        const overlap = !(exitIdx < config.windowRange[0] || position.entryCandleIdx > config.windowRange[1]);
        compliant = !overlap;
      } else {
        compliant = position.type === config.direction && position.entryCandleIdx >= config.windowRange[0] && position.entryCandleIdx <= config.windowRange[1];
      }
    } else if (isIndicator || isBand || isMA || isVWAP) {
      compliant = position.type === config.direction && signalDeadlineIdx !== null && position.entryCandleIdx <= signalDeadlineIdx;
    } else {
      const matchedZone = effectiveZones.find((z) => position.entryPrice >= z.low - 0.3 && position.entryPrice <= z.high + 0.3);
      compliant = !!matchedZone && position.type === matchedZone.direction;
    }

    let delta = rawPnl;
    if (compliant && rawPnl > 0) delta += BONUS;
    if (!compliant) delta -= PENALTY;
    setTrades((t2) => [...t2, { ...position, exitPrice: currentPrice, pnl: rawPnl, compliant, netDelta: delta }]);
    onApplyDelta(delta);
    setPosition(null);
  };

  const floatingPnl = position ? (currentPrice - position.entryPrice) * (position.type === "buy" ? 1 : -1) * 10 : 0;

  useEffect(() => { onLiveDeltaChange?.(position ? floatingPnl : 0); }, [floatingPnl, position, onLiveDeltaChange]);
  useEffect(() => () => onLiveDeltaChange?.(0), []);

  const total = showingPreview ? previewCandles.length : candles.length + (forming ? 1 : 0);
  const startIdx = showingPreview ? 0 : Math.max(0, total - WINDOW_SIZE);
  const visible = showingPreview ? previewCandles : candles.slice(startIdx);
  const spacing = plotW / WINDOW_SIZE;
  const reticleX = visible.length * spacing + spacing / 2;

  const handleChartTap = (evt) => {
    if (drawStep !== "point1" && drawStep !== "point2") return;
    const { locationX, locationY } = evt.nativeEvent;
    const price = priceRange.max - ((locationY - scaleRowH) / chartH) * (priceRange.max - priceRange.min);
    const relIdx = Math.max(0, Math.min(cutCount - 1, Math.round((locationX - spacing / 2) / spacing)));
    if (drawStep === "point1") {
      setDrawPoint1({ idx: relIdx, price });
      setDrawStep("point2");
    } else {
      const p2 = { idx: relIdx, price };
      if (isTrendZone) {
        let anchors = drawPoint1.idx <= p2.idx ? [drawPoint1, p2] : [p2, drawPoint1];
        if (anchors[0].idx === anchors[1].idx) anchors = [anchors[0], { ...anchors[1], idx: anchors[1].idx + 1 }];
        setPlayerTrendAnchors(anchors);
      } else {
        setPlayerZone({ low: Math.min(drawPoint1.price, p2.price), high: Math.max(drawPoint1.price, p2.price), direction: ZONES[0].direction });
      }
      setDrawStep("confirm");
    }
  };

  const latestRsi = config.indicator === "rsi" && indicatorSeriesA.length ? indicatorSeriesA[indicatorSeriesA.length - 1] : null;
  const latestMacdDiff = config.indicator === "macd" && indicatorSeriesA.length && indicatorSeriesB
    ? indicatorSeriesA[indicatorSeriesA.length - 1] - indicatorSeriesB[indicatorSeriesB.length - 1] : null;
  const latestK = config.indicator === "stoch" && indicatorSeriesA.length ? indicatorSeriesA[indicatorSeriesA.length - 1] : null;

  const actionWord = (dir) => (dir === "buy" ? t("action_buy") : t("action_sell"));
  const n = config.windowCandles || 3;

  let rulesLabel;
  if (isPattern) {
    rulesLabel = fmt(t(config.showVolume ? "rule_pattern_volume" : "rule_pattern_generic"), { action: actionWord(config.patternDirection), n });
  } else if (isTrendZone) {
    rulesLabel = fmt(t("rule_trendzone"), { action: actionWord(config.direction) });
  } else if (isTimeWindow) {
    rulesLabel = config.timewindowType === "avoid"
      ? t("rule_timewindow_avoid")
      : fmt(t("rule_timewindow_favor"), { action: actionWord(config.direction) });
  } else if (isVWAP) {
    rulesLabel = fmt(t("rule_vwap"), { action: actionWord(config.direction), n });
  } else if (isMA) {
    rulesLabel = fmt(t("rule_ma"), { action: actionWord(config.direction), n });
  } else if (isBand) {
    rulesLabel = fmt(t("rule_band"), { action: actionWord(config.direction), n });
  } else if (isIndicator) {
    if (config.indicator === "macd") {
      rulesLabel = fmt(t("rule_macd"), { action: actionWord(config.direction), n, trend: config.direction === "buy" ? t("trend_bullish") : t("trend_bearish") });
    } else if (config.indicator === "stoch") {
      rulesLabel = fmt(t("rule_stoch"), { action: actionWord(config.direction), n, zone: config.direction === "buy" ? t("zone_low") : t("zone_high") });
    } else {
      rulesLabel = fmt(t("rule_rsi"), { action: actionWord(config.direction), n, rsizone: config.direction === "buy" ? t("rsi_oversold") : t("rsi_overbought") });
    }
  } else {
    rulesLabel = ZONES.length > 1
      ? t("rule_zone_multi")
      : fmt(t("rule_zone_single"), { action: actionWord(ZONES[0].direction), side: ZONES[0].direction === "buy" ? t("side_below") : t("side_above") });
  }

  const hudLabel = isPattern
    ? (patternDeadlineIdx === null ? t("hud_pattern_none") : patternWindowOpen ? t("hud_pattern_active") : t("hud_window_closed"))
    : isTrendZone
      ? (trendInZoneNow ? t("hud_on_line") : t("hud_off_line"))
      : isTimeWindow
        ? (config.timewindowType === "avoid" ? t("hud_avoid_window") : windowActive ? t("hud_favor_window") : t("hud_out_window"))
        : isVWAP
          ? (signalDeadlineIdx === null ? t("hud_no_vwap_touch") : signalWindowOpen ? t("hud_vwap_touch") : t("hud_window_closed"))
          : isMA
            ? (signalDeadlineIdx === null ? t("hud_no_cross") : signalWindowOpen ? t("hud_cross_active") : t("hud_window_closed"))
            : isBand
              ? (signalDeadlineIdx === null ? t("hud_no_band_touch") : signalWindowOpen ? t("hud_band_touch") : t("hud_window_closed"))
              : isIndicator
                ? config.indicator === "macd" ? `MACD ${latestMacdDiff !== null ? latestMacdDiff.toFixed(2) : "—"}`
                  : config.indicator === "stoch" ? `%K ${latestK !== null ? latestK.toFixed(0) : "—"}`
                    : `RSI ${latestRsi !== null ? latestRsi.toFixed(0) : "—"}`
                : `${t("hud_touches")} ${validTouches}/${touchesRequired || 2}`;

  const disciplinePct = trades.length ? Math.round((trades.filter((tr) => tr.compliant).length / trades.length) * 100) : 0;
  const totalNet = trades.reduce((sum, tr) => sum + (tr.netDelta ?? tr.pnl), 0);
  const showSummary = sessionEnded && !position;

  const chartSvg = (
    <Svg width={chartW} height={svgH} style={{ backgroundColor: COLORS.bg }}>
      <Defs>
        <Pattern id="hazardHatch" patternUnits="userSpaceOnUse" width={8} height={8} patternTransform="rotate(45)">
          <Rect width={8} height={8} fill={COLORS.blue} opacity={0.1} />
          <Line x1={0} y1={0} x2={0} y2={8} stroke={COLORS.blue} strokeWidth={1.4} opacity={0.4} />
        </Pattern>
      </Defs>

      {visible.map((_, i) =>
        i % 3 === 0 ? (
          <SvgText key={`t${i}`} x={i * spacing + spacing / 2} y={11} fill={COLORS.dim} fontSize={8} textAnchor="middle">
            {startIdx + i + 1}
          </SvgText>
        ) : null
      )}
      <Line x1={0} y1={scaleRowH} x2={plotW} y2={scaleRowH} stroke={COLORS.line} strokeWidth={0.6} />

      {[0.2, 0.4, 0.6, 0.8].map((f) => (
        <Line key={f} x1={0} y1={scaleRowH + chartH * f} x2={plotW} y2={scaleRowH + chartH * f} stroke={COLORS.line} strokeWidth={0.5} opacity={0.4} />
      ))}

      {isTimeWindow && config.windowRange && (() => {
        const [ws, we] = config.windowRange;
        const relStart = Math.max(0, ws - startIdx);
        const relEnd = Math.min(WINDOW_SIZE, we - startIdx + 1);
        if (relEnd <= 0 || relStart >= WINDOW_SIZE) return null;
        return (
          <Rect x={relStart * spacing} y={scaleRowH} width={(relEnd - relStart) * spacing} height={chartH - scaleRowH}
            fill={config.timewindowType === "avoid" ? COLORS.bear : COLORS.gold} opacity={0.12} />
        );
      })()}

      {isTrendZone && (
        <Polyline
          points={visible.map((_, i) => {
            const idx = startIdx + i + 1;
            const z = trendZoneAt(idx);
            return `${i * spacing + spacing / 2},${yAbs((z.low + z.high) / 2)}`;
          }).join(" ")}
          fill="none" stroke={COLORS.blue} strokeWidth={1.4} strokeDasharray="4,3"
        />
      )}

      {!isPattern && !isIndicator && !isBand && !isMA && !isVWAP && !isTrendZone && !isTimeWindow && effectiveZones && effectiveZones.map((z, zi) => (
        <React.Fragment key={zi}>
          <Rect x={0} y={yAbs(z.high)} width={plotW} height={yAbs(z.low) - yAbs(z.high)} fill="url(#hazardHatch)" />
          <Line x1={0} y1={yAbs(z.high)} x2={plotW} y2={yAbs(z.high)} stroke={COLORS.blue} strokeWidth={1} />
          <Line x1={0} y1={yAbs(z.low)} x2={plotW} y2={yAbs(z.low)} stroke={COLORS.blue} strokeWidth={1} />
        </React.Fragment>
      ))}

      {!isPattern && !isIndicator && !isBand && !isMA && !isVWAP && !isTrendZone && !isTimeWindow && config.fiboLevels && config.fiboLevels.map((lv, li) => (
        <React.Fragment key={`fib${li}`}>
          <Line x1={0} y1={yAbs(lv.price)} x2={plotW} y2={yAbs(lv.price)}
            stroke={lv.highlight ? COLORS.gold : COLORS.blue} strokeWidth={lv.highlight ? 1.4 : 0.8}
            strokeDasharray={lv.highlight ? undefined : "3,3"} opacity={lv.highlight ? 0.9 : 0.45} />
          <SvgText x={4} y={yAbs(lv.price) - 3} fill={lv.highlight ? COLORS.gold : COLORS.dim} fontSize={8}>{lv.pct}</SvgText>
        </React.Fragment>
      ))}

      {isBand && (() => {
        const pts = (arr) => visible.map((_, i) => {
          const idx = startIdx + i;
          const v = arr[idx];
          return v == null ? null : `${i * spacing + spacing / 2},${yAbs(v)}`;
        }).filter(Boolean).join(" ");
        return (
          <React.Fragment>
            <Polyline points={pts(bandSeries.upper)} fill="none" stroke={COLORS.blue} strokeWidth={1} opacity={0.7} />
            <Polyline points={pts(bandSeries.sma)} fill="none" stroke={COLORS.dim} strokeWidth={1} strokeDasharray="3,3" />
            <Polyline points={pts(bandSeries.lower)} fill="none" stroke={COLORS.blue} strokeWidth={1} opacity={0.7} />
          </React.Fragment>
        );
      })()}

      {isMA && (() => {
        const pts = (arr) => visible.map((_, i) => {
          const idx = startIdx + i;
          const v = arr[idx];
          return v == null ? null : `${i * spacing + spacing / 2},${yAbs(v)}`;
        }).filter(Boolean).join(" ");
        return (
          <React.Fragment>
            <Polyline points={pts(indicatorSeriesA)} fill="none" stroke={COLORS.gold} strokeWidth={1.6} />
            <Polyline points={pts(indicatorSeriesB || [])} fill="none" stroke={COLORS.blue} strokeWidth={1.4} />
          </React.Fragment>
        );
      })()}

      {isVWAP && (() => {
        const pts = visible.map((_, i) => {
          const idx = startIdx + i;
          const v = indicatorSeriesA[idx];
          return v == null ? null : `${i * spacing + spacing / 2},${yAbs(v)}`;
        }).filter(Boolean).join(" ");
        return <Polyline points={pts} fill="none" stroke={COLORS.gold} strokeWidth={1.8} />;
      })()}

      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const py = scaleRowH + chartH * f;
        const priceAtY = priceRange.max - f * (priceRange.max - priceRange.min);
        return (
          <React.Fragment key={f}>
            <Line x1={plotW} y1={py} x2={plotW + 6} y2={py} stroke={COLORS.dim} strokeWidth={1} />
            <SvgText x={plotW + 8} y={py + 3} fill={COLORS.dim} fontSize={8}>{priceAtY.toFixed(1)}</SvgText>
          </React.Fragment>
        );
      })}

      {visible.map((c, i) => {
        const idx = startIdx + i;
        const bull = c.close >= c.open;
        const cx = i * spacing + spacing / 2;
        const color = bull ? COLORS.bull : COLORS.bear;
        return (
          <React.Fragment key={i}>
            <Line x1={cx} y1={yAbs(c.high)} x2={cx} y2={yAbs(c.low)} stroke={color} strokeWidth={1.3} />
            <Rect x={cx - spacing * 0.2} y={yAbs(Math.max(c.open, c.close))} width={spacing * 0.4}
              height={Math.max(2, Math.abs(yAbs(c.open) - yAbs(c.close)))} fill={color} />
            {c.touch && <Circle cx={cx} cy={yAbs(c.low)} r={4} stroke={COLORS.gold} strokeWidth={1.2} fill="none" />}
            {(isBand || isVWAP) && bandTouchIndices.includes(idx) && (
              <Circle cx={cx} cy={yAbs(config.direction === "buy" ? c.low : c.high)} r={4} stroke={COLORS.gold} strokeWidth={1.2} fill="none" />
            )}
            {c.pattern && (
              <React.Fragment>
                <Circle cx={cx} cy={yAbs(c.low)} r={4} stroke={COLORS.gold} strokeWidth={1.2} fill="none" />
                <SvgText x={cx - 20} y={yAbs(c.low) + 16} fill={COLORS.gold} fontSize={8}>{config.patternName}</SvgText>
              </React.Fragment>
            )}
          </React.Fragment>
        );
      })}

      {!showingPreview && forming && (() => {
        const i = visible.length;
        const bull = forming.close >= forming.open;
        const cx = i * spacing + spacing / 2;
        return (
          <React.Fragment>
            <Line x1={cx} y1={yAbs(forming.high)} x2={cx} y2={yAbs(forming.low)} stroke={bull ? COLORS.bull : COLORS.bear} strokeWidth={1.3} />
            <Rect x={cx - spacing * 0.2} y={yAbs(Math.max(forming.open, forming.close))} width={spacing * 0.4}
              height={Math.max(2, Math.abs(yAbs(forming.open) - yAbs(forming.close)))} fill={bull ? COLORS.bull : COLORS.bear} opacity={0.92} />
          </React.Fragment>
        );
      })()}

      {position && (
        <Line x1={0} y1={yAbs(position.entryPrice)} x2={plotW} y2={yAbs(position.entryPrice)} stroke={COLORS.text} strokeWidth={1} strokeDasharray="5,3" />
      )}
      {inZone && !showingPreview && (
        <Line x1={0} y1={yAbs(currentPrice)} x2={reticleX - 10} y2={yAbs(currentPrice)} stroke={COLORS.gold} strokeWidth={1} strokeDasharray="2,4" />
      )}
      {!showingPreview && <Reticle x={reticleX} yPos={yAbs(currentPrice)} locked={inZone} lockedLabel={t("hud_target_locked")} />}
    </Svg>
  );

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.symbol}>XAU/USD · 1M · {displayLabel}</Text>
      </View>

      {!canTrade && (
        <View style={styles.brokeBanner}>
          <Text style={styles.brokeBannerText}>{t("play_broke_banner")}</Text>
        </View>
      )}

      {sniperActive && (drawStep === "point1" || drawStep === "point2") && (
        <View style={styles.sniperBanner}>
          <Text style={styles.sniperBannerText}>
            {isTrendZone
              ? (drawStep === "point1" ? t("sniper_step1_trend") : t("sniper_step2_trend"))
              : (drawStep === "point1" ? t("sniper_step1_zone") : t("sniper_step2_zone"))}
          </Text>
        </View>
      )}

      <View style={styles.priceRow}>
        <Text style={styles.priceValue}>{currentPrice.toFixed(2)}</Text>
        <View style={[styles.priceBar, { width: inZone && !showingPreview ? 40 : 14, backgroundColor: inZone && !showingPreview ? COLORS.gold : COLORS.line }]} />
      </View>

      <View style={styles.hudRow}>
        <Text style={styles.hudChip}>{hudLabel}</Text>
        <Text style={[styles.hudChip, inZone && !showingPreview && { color: COLORS.gold, borderColor: COLORS.gold }]}>
          {inZone && !showingPreview ? t("hud_target_locked") : t("hud_out_of_zone")}
        </Text>
        {sniperActive && <Text style={[styles.hudChip, { color: COLORS.gold, borderColor: COLORS.gold }]}>{t("sniper_badge")}</Text>}
      </View>

      <BracketFrame style={{ alignSelf: "center" }}>
        {sniperActive && (drawStep === "point1" || drawStep === "point2") ? (
          <Pressable onPress={handleChartTap}>{chartSvg}</Pressable>
        ) : chartSvg}

        {showVolumePanel && !showingPreview && (() => {
          const vols = visible.map((c) => c.vol || 0);
          const maxVol = Math.max(1, ...vols);
          return (
            <Svg width={chartW} height={volumePanelH} style={{ backgroundColor: COLORS.panel }}>
              {visible.map((c, i) => {
                const cx = i * spacing + spacing / 2;
                const h = ((c.vol || 0) / maxVol) * (volumePanelH - 10);
                return (
                  <Rect key={i} x={cx - spacing * 0.2} y={volumePanelH - 6 - h} width={spacing * 0.4} height={h}
                    fill={c.pattern ? COLORS.gold : COLORS.blue} opacity={0.75} />
                );
              })}
              <SvgText x={4} y={12} fill={COLORS.dim} fontSize={8}>VOLUME</SvgText>
            </Svg>
          );
        })()}

        {isIndicator && !showingPreview && config.indicator === "rsi" && (
          <Svg width={chartW} height={indicatorPanelH} style={{ backgroundColor: COLORS.panel }}>
            <Line x1={0} y1={indicatorPanelH * (1 - (config.overbought ?? 70) / 100)} x2={plotW} y2={indicatorPanelH * (1 - (config.overbought ?? 70) / 100)} stroke={COLORS.bear} strokeDasharray="3,3" strokeWidth={1} />
            <Line x1={0} y1={indicatorPanelH * (1 - (config.oversold ?? 30) / 100)} x2={plotW} y2={indicatorPanelH * (1 - (config.oversold ?? 30) / 100)} stroke={COLORS.bull} strokeDasharray="3,3" strokeWidth={1} />
            <Polyline points={indicatorSeriesA.slice(startIdx).map((v, i) => `${i * spacing + spacing / 2},${v === null ? indicatorPanelH / 2 : indicatorPanelH * (1 - v / 100)}`).join(" ")} fill="none" stroke={COLORS.gold} strokeWidth={1.8} />
            <SvgText x={plotW + 8} y={indicatorPanelH * (1 - (config.overbought ?? 70) / 100) + 3} fill={COLORS.bear} fontSize={8}>{config.overbought ?? 70}</SvgText>
            <SvgText x={plotW + 8} y={indicatorPanelH * (1 - (config.oversold ?? 30) / 100) + 3} fill={COLORS.bull} fontSize={8}>{config.oversold ?? 30}</SvgText>
          </Svg>
        )}

        {isIndicator && !showingPreview && config.indicator === "stoch" && (
          <Svg width={chartW} height={indicatorPanelH} style={{ backgroundColor: COLORS.panel }}>
            <Line x1={0} y1={indicatorPanelH * (1 - (config.overbought ?? 80) / 100)} x2={plotW} y2={indicatorPanelH * (1 - (config.overbought ?? 80) / 100)} stroke={COLORS.bear} strokeDasharray="3,3" strokeWidth={1} />
            <Line x1={0} y1={indicatorPanelH * (1 - (config.oversold ?? 20) / 100)} x2={plotW} y2={indicatorPanelH * (1 - (config.oversold ?? 20) / 100)} stroke={COLORS.bull} strokeDasharray="3,3" strokeWidth={1} />
            <Polyline points={indicatorSeriesA.slice(startIdx).map((v, i) => `${i * spacing + spacing / 2},${v == null ? indicatorPanelH / 2 : indicatorPanelH * (1 - v / 100)}`).join(" ")} fill="none" stroke={COLORS.gold} strokeWidth={1.8} />
            <Polyline points={(indicatorSeriesB || []).slice(startIdx).map((v, i) => `${i * spacing + spacing / 2},${v == null ? indicatorPanelH / 2 : indicatorPanelH * (1 - v / 100)}`).join(" ")} fill="none" stroke={COLORS.blue} strokeWidth={1.4} />
            <SvgText x={plotW + 4} y={12} fill={COLORS.gold} fontSize={8}>%K</SvgText>
            <SvgText x={plotW + 4} y={24} fill={COLORS.blue} fontSize={8}>%D</SvgText>
          </Svg>
        )}

        {isIndicator && !showingPreview && config.indicator === "macd" && (() => {
          const macdVals = indicatorSeriesA.slice(startIdx);
          const sigVals = (indicatorSeriesB || []).slice(startIdx);
          const all = [...macdVals, ...sigVals].filter((v) => v !== null && v !== undefined);
          const maxAbs = Math.max(0.6, ...all.map((v) => Math.abs(v)));
          const yFor = (v) => indicatorPanelH / 2 - (v / maxAbs) * (indicatorPanelH / 2 - 6);
          const macdPts = macdVals.map((v, i) => `${i * spacing + spacing / 2},${yFor(v)}`).join(" ");
          const sigPts = sigVals.map((v, i) => `${i * spacing + spacing / 2},${yFor(v)}`).join(" ");
          return (
            <Svg width={chartW} height={indicatorPanelH} style={{ backgroundColor: COLORS.panel }}>
              <Line x1={0} y1={indicatorPanelH / 2} x2={plotW} y2={indicatorPanelH / 2} stroke={COLORS.line} strokeWidth={1} />
              <Polyline points={macdPts} fill="none" stroke={COLORS.gold} strokeWidth={1.8} />
              <Polyline points={sigPts} fill="none" stroke={COLORS.blue} strokeWidth={1.4} />
              <SvgText x={plotW + 4} y={12} fill={COLORS.gold} fontSize={8}>MACD</SvgText>
              <SvgText x={plotW + 4} y={24} fill={COLORS.blue} fontSize={8}>signal</SvgText>
            </Svg>
          );
        })()}
      </BracketFrame>

      <View style={{ flex: 1 }} />

      {position && (
        <Text style={[styles.pnlText, { color: floatingPnl >= 0 ? COLORS.bull : COLORS.bear }]}>
          {position.type === "buy" ? t("play_buy") : t("play_sell")} · {floatingPnl >= 0 ? "+" : ""}{floatingPnl.toFixed(2)} $
        </Text>
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.infoBtn} onPress={() => setShowInfo((v) => !v)} hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
          <Text style={{ color: COLORS.text }}>ⓘ</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tradeBtn, { backgroundColor: COLORS.bull, opacity: canTrade && !showingPreview ? 1 : 0.4 }]} disabled={!!position || !canTrade || showingPreview} onPress={() => openPosition("buy")}>
          <Text style={styles.tradeBtnText}>{t("play_buy")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tradeBtn, { backgroundColor: COLORS.bear, opacity: canTrade && !showingPreview ? 1 : 0.4 }]} disabled={!!position || !canTrade || showingPreview} onPress={() => openPosition("sell")}>
          <Text style={styles.tradeBtnText}>{t("play_sell")}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.closeBtn} disabled={!position} onPress={closePosition}>
          <Text style={{ color: COLORS.text, fontSize: 12 }}>{t("play_close_trade")}</Text>
        </TouchableOpacity>
      </View>

      {showInfo && (
        <View style={styles.infoSheet}>
          <Text style={styles.panelTitle}>{t("play_rules")}</Text>
          <Text style={styles.ruleLine}>• {rulesLabel}</Text>
          {!isPattern && !isIndicator && !isBand && !isMA && !isVWAP && !isTrendZone && !isTimeWindow && (
            <Text style={styles.ruleLine}>• {fmt(t("rule_touches"), { n: touchesRequired || 2 })}</Text>
          )}
          <Text style={styles.panelTitle}>{t("play_trades")} ({trades.length})</Text>
          {trades.map((tr, i) => (
            <Text key={i} style={{ color: tr.compliant ? COLORS.bull : COLORS.bear, fontSize: 12, marginBottom: 3 }}>
              {tr.compliant ? "✓" : "✕"}  {tr.pnl >= 0 ? "+" : ""}{tr.pnl.toFixed(2)} $
            </Text>
          ))}
          <TouchableOpacity style={styles.closeInfoBtn} onPress={() => setShowInfo(false)}>
            <Text style={{ color: "#0A0E17", fontWeight: "700" }}>{t("play_close")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {showSummary && (
        <View style={styles.overlay}>
          <View style={styles.summaryCard}>
            <Text style={styles.panelTitle}>{t("play_session_over")}</Text>
            <Text style={styles.summaryTitle}>{displayLabel}</Text>
            <View style={styles.summaryRow}>
              <View>
                <Text style={styles.summaryLabel}>{t("play_discipline")}</Text>
                <Text style={[styles.summaryValue, { color: COLORS.gold }]}>{disciplinePct}%</Text>
              </View>
              <View>
                <Text style={styles.summaryLabel}>{t("play_result")}</Text>
                <Text style={[styles.summaryValue, { color: totalNet >= 0 ? COLORS.bull : COLORS.bear }]}>
                  {totalNet >= 0 ? "+" : ""}{totalNet.toFixed(2)} $
                </Text>
              </View>
              <View>
                <Text style={styles.summaryLabel}>{t("play_trades_count")}</Text>
                <Text style={styles.summaryValue}>{trades.length}</Text>
              </View>
            </View>
            <Text style={styles.summaryNote}>{t("play_discipline_note")}</Text>
            <TouchableOpacity style={styles.closeInfoBtn} onPress={resetAll}>
              <Text style={{ color: "#0A0E17", fontWeight: "700" }}>{t("play_replay")}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
              <Text style={{ color: COLORS.text }}>{t("play_back_to_map")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showTour && <TourOverlay onFinish={handleTourFinish} />}

      {sniperActive && drawStep === "intro" && (
        <View style={styles.overlay}>
          <View style={styles.summaryCard}>
            <Text style={styles.panelTitle}>{t("sniper_intro_title")}</Text>
            <Text style={styles.summaryTitle}>{displayLabel}</Text>
            <Text style={styles.summaryNote}>{t("sniper_intro_text")}</Text>
            <TouchableOpacity style={styles.closeInfoBtn} onPress={() => setDrawStep("point1")}>
              <Text style={{ color: "#0A0E17", fontWeight: "700" }}>{t("sniper_intro_button")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {sniperActive && drawStep === "confirm" && (
        <View style={styles.confirmBar}>
          <Text style={styles.confirmText}>{t("sniper_confirm_text")}</Text>
          <TouchableOpacity style={styles.confirmBtn} onPress={() => { setDrawStep("done"); setRunning(true); }}>
            <Text style={{ color: "#0A0E17", fontWeight: "700" }}>{t("sniper_confirm_button")}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function Reticle({ x, yPos, locked, lockedLabel }) {
  const color = locked ? COLORS.gold : COLORS.dim;
  return (
    <React.Fragment>
      <Circle cx={x} cy={yPos} r={locked ? 3.5 : 2} fill={color} />
      {locked && <SvgText x={x - 100} y={yPos - 14} fill={COLORS.gold} fontSize={9}>{lockedLabel}</SvgText>}
    </React.Fragment>
  );
}

const brk = StyleSheet.create({
  base: { position: "absolute", width: 14, height: 14 },
  tl: { top: -1, left: -1, borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: -1, right: -1, borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: -1, left: -1, borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: -1, right: -1, borderBottomWidth: 2, borderRightWidth: 2 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingTop: 12, paddingBottom: 6, gap: 10 },
  back: { color: COLORS.text, fontSize: 22 },
  symbol: { color: COLORS.dim, fontSize: 11, letterSpacing: 1 },
  brokeBanner: { backgroundColor: "#1F1420", borderColor: COLORS.bear, borderWidth: 1, marginHorizontal: 14, borderRadius: 8, padding: 8, marginBottom: 10 },
  brokeBannerText: { color: COLORS.bear, fontSize: 11, textAlign: "center" },
  sniperBanner: { backgroundColor: COLORS.panel, borderColor: COLORS.gold, borderWidth: 1, marginHorizontal: 14, borderRadius: 8, padding: 8, marginBottom: 10 },
  sniperBannerText: { color: COLORS.gold, fontSize: 11, textAlign: "center" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  priceValue: { color: COLORS.dim, fontSize: 15, fontWeight: "600" },
  priceBar: { height: 2, borderRadius: 1 },
  hudRow: { flexDirection: "row", gap: 8, paddingHorizontal: 14, marginBottom: 8, flexWrap: "wrap" },
  hudChip: { color: COLORS.dim, fontSize: 10, borderWidth: 1, borderColor: COLORS.line, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  pnlText: { textAlign: "center", fontSize: 13, marginBottom: 6 },
  bottomBar: { flexDirection: "row", gap: 6, padding: 10, borderTopWidth: 1, borderTopColor: COLORS.line, backgroundColor: COLORS.panel },
  infoBtn: { width: 38, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.line, borderRadius: 8 },
  tradeBtn: { flex: 1, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingVertical: 12 },
  tradeBtnText: { color: "#0A0E17", fontWeight: "700", fontSize: 12 },
  closeBtn: { flex: 1, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.line },
  infoSheet: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: COLORS.panel, padding: 16, borderTopWidth: 1, borderTopColor: COLORS.line },
  panelTitle: { color: COLORS.dim, fontSize: 10, letterSpacing: 1, marginTop: 8, marginBottom: 6 },
  ruleLine: { color: COLORS.text, fontSize: 12, marginBottom: 4 },
  closeInfoBtn: { backgroundColor: COLORS.gold, borderRadius: 8, padding: 12, alignItems: "center", marginTop: 10 },
  overlay: { position: "absolute", inset: 0, backgroundColor: "rgba(10,14,23,0.92)", alignItems: "center", justifyContent: "center", padding: 24 },
  summaryCard: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: 16, padding: 24, width: "100%" },
  summaryTitle: { color: COLORS.text, fontSize: 18, fontWeight: "700", marginBottom: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  summaryLabel: { color: COLORS.dim, fontSize: 10, letterSpacing: 1 },
  summaryValue: { color: COLORS.text, fontSize: 20, fontWeight: "800", marginTop: 4 },
  summaryNote: { color: COLORS.dim, fontSize: 12, lineHeight: 17, marginBottom: 16 },
  cancelBtn: { alignItems: "center", padding: 10, marginTop: 6 },
  confirmBar: { position: "absolute", left: 14, right: 14, bottom: 90, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.gold, borderRadius: 12, padding: 14, alignItems: "center" },
  confirmText: { color: COLORS.text, fontSize: 12, textAlign: "center", marginBottom: 10 },
  confirmBtn: { backgroundColor: COLORS.gold, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 20 },
});