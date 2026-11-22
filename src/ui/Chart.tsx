import React, { memo, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Polygon, Polyline, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { SESSION } from '../core/constants';
import { activeZones, trendBandAt, type Position, type RuleOpts } from '../core/engine/rules';
import type { Runtime } from '../core/engine/scenario';
import { currentPrice, formingCandle, type SessionState } from '../core/engine/session';
import type { Anchor, Zone } from '../core/types';
import type { Num } from '../core/engine/indicators';
import { COLORS } from './theme';

const WIN = SESSION.WINDOW_SIZE;
const SCALE_H = 16;
const RULER_W = 46;

export interface Geo {
  W: number; H: number; plotW: number; spacing: number; min: number; max: number;
  y: (p: number) => number; x: (slot: number) => number;
}

export function makeGeo(rt: Runtime, width: number, height: number): Geo {
  const plotW = width - RULER_W;
  const spacing = plotW / WIN;
  const min = rt.priceMin;
  const max = rt.priceMax;
  return {
    W: width, H: height, plotW, spacing, min, max,
    y: (p) => SCALE_H + height - ((p - min) / (max - min)) * height,
    x: (slot) => slot * spacing + spacing / 2,
  };
}

const bodyW = (g: Geo) => Math.min(g.spacing * 0.62, 26);
/** Largeur approximative d'un texte gras (pour dessiner l'étiquette derrière). */
const textW = (s: string, size: number) => s.length * size * 0.62 + 10;

/** Dégradés réutilisés par toutes les couches (déclarés une seule fois). */
const Gradients = memo(function Gradients() {
  return (
    <Defs>
      <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#171B3B" />
        <Stop offset="0.55" stopColor="#0F1229" />
        <Stop offset="1" stopColor="#0A0B16" />
      </LinearGradient>
      <LinearGradient id="bullGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#62F2C2" />
        <Stop offset="1" stopColor="#1DB386" />
      </LinearGradient>
      <LinearGradient id="bearGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FF7D99" />
        <Stop offset="1" stopColor="#CF2B52" />
      </LinearGradient>
      <LinearGradient id="zoneGrad" x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#7077E0" stopOpacity={0.5} />
        <Stop offset="1" stopColor="#7077E0" stopOpacity={0.2} />
      </LinearGradient>
    </Defs>
  );
});

const Grid = memo(function Grid({ g }: { g: Geo }) {
  return (
    <G>
      <Rect x={g.plotW} y={SCALE_H} width={RULER_W} height={g.H} fill="#FFFFFF" opacity={0.025} />
      <Line x1={g.plotW} y1={SCALE_H} x2={g.plotW} y2={SCALE_H + g.H} stroke={COLORS.line} strokeWidth={1} />
      <Line x1={0} y1={SCALE_H} x2={g.plotW} y2={SCALE_H} stroke={COLORS.line} strokeWidth={0.6} />
      {[0.2, 0.4, 0.6, 0.8].map((f) => (
        <Line key={f} x1={0} y1={SCALE_H + g.H * f} x2={g.plotW} y2={SCALE_H + g.H * f} stroke={COLORS.blue} strokeWidth={0.6} strokeDasharray="2,6" opacity={0.35} />
      ))}
      {[0, 0.25, 0.5, 0.75, 1].map((f) => {
        const py = SCALE_H + g.H * f;
        return (
          <G key={f}>
            <Line x1={g.plotW} y1={py} x2={g.plotW + 5} y2={py} stroke={COLORS.dim} strokeWidth={1} />
            <SvgText x={g.plotW + 8} y={py + 3.5} fill={COLORS.dim} fontSize={10}>{(g.max - f * (g.max - g.min)).toFixed(1)}</SvgText>
          </G>
        );
      })}
    </G>
  );
});

/** Filigrane de marque : discret, mais visible quand le jeu est filmé et partagé. */
const Watermark = memo(function Watermark({ g }: { g: Geo }) {
  return (
    <SvgText x={g.plotW / 2} y={SCALE_H + g.H * 0.62} fill="#FFFFFF" opacity={0.05} fontSize={g.plotW > 300 ? 48 : 34} fontWeight="bold" letterSpacing={10} textAnchor="middle">SIMTRA</SvgText>
  );
});

interface ZoneProps {
  g: Geo; rt: Runtime; startIdx: number; opts: RuleOpts; hideAnswer: boolean; zoneLabel?: string;
  playerZone?: Zone | null; playerAnchors?: [Anchor, Anchor] | null; point1?: { idx: number; price: number } | null;
}

const Overlays = memo(function Overlays({ g, rt, startIdx, opts, hideAnswer, zoneLabel, playerZone, playerAnchors, point1 }: ZoneProps) {
  const cfg = rt.cfg;
  const zones = cfg.mode === 'zone' ? (hideAnswer ? (playerZone ? [playerZone] : []) : activeZones(rt, opts)) : [];
  return (
    <G>
      {cfg.mode === 'timewindow' && cfg.windowRange && (() => {
        const [ws, we] = cfg.windowRange;
        const a = Math.max(0, ws - startIdx);
        const b = Math.min(WIN, we - startIdx + 1);
        if (b <= 0 || a >= WIN) return null;
        return <Rect x={a * g.spacing} y={SCALE_H} width={(b - a) * g.spacing} height={g.H} fill={cfg.timewindowType === 'avoid' ? COLORS.bear : COLORS.gold} opacity={0.13} />;
      })()}
      {cfg.mode === 'trendzone' && !hideAnswer && (
        <Polyline
          points={Array.from({ length: WIN }, (_, i) => `${g.x(i)},${g.y(trendBandAt(rt, startIdx + i, opts).mid)}`).join(' ')}
          fill="none" stroke={COLORS.blue} strokeWidth={1.5} strokeDasharray="4,3"
        />
      )}
      {cfg.mode === 'trendzone' && playerAnchors && (
        <Polyline
          points={Array.from({ length: WIN }, (_, i) => {
            const [a, b] = playerAnchors;
            const p = a.price + ((b.price - a.price) / (b.idx - a.idx)) * (startIdx + i - a.idx);
            return `${g.x(i)},${g.y(p)}`;
          }).join(' ')}
          fill="none" stroke={COLORS.gold} strokeWidth={1.6} strokeDasharray="5,3"
        />
      )}
      {zones.map((z, i) => {
        const edge = hideAnswer ? COLORS.gold : '#8D93E6';
        const top = g.y(z.high);
        return (
          <G key={i}>
            <Rect x={0} y={top} width={g.plotW} height={Math.max(1, g.y(z.low) - top)} fill="url(#zoneGrad)" />
            <Line x1={0} y1={top} x2={g.plotW} y2={top} stroke={edge} strokeWidth={1.2} />
            <Line x1={0} y1={g.y(z.low)} x2={g.plotW} y2={g.y(z.low)} stroke={edge} strokeWidth={1.2} />
            {!hideAnswer && zoneLabel && i === 0 && (
              <G>
                <Rect x={g.plotW - textW(zoneLabel, 9) - 6} y={top + 4} width={textW(zoneLabel, 9)} height={14} rx={7} fill={COLORS.blue} opacity={0.9} />
                <SvgText x={g.plotW - textW(zoneLabel, 9) / 2 - 6} y={top + 14} fill={COLORS.text} fontSize={9} fontWeight="bold" textAnchor="middle">{zoneLabel}</SvgText>
              </G>
            )}
          </G>
        );
      })}
      {!hideAnswer && cfg.fiboLevels?.map((lv, i) => (
        <G key={`f${i}`}>
          <Line x1={0} y1={g.y(lv.price)} x2={g.plotW} y2={g.y(lv.price)} stroke={lv.highlight ? COLORS.gold : COLORS.blue} strokeWidth={lv.highlight ? 1.4 : 0.8} strokeDasharray={lv.highlight ? undefined : '3,3'} opacity={lv.highlight ? 0.9 : 0.5} />
          <SvgText x={4} y={g.y(lv.price) - 3} fill={lv.highlight ? COLORS.gold : COLORS.dim} fontSize={9}>{lv.pct}</SvgText>
        </G>
      ))}
      {point1 && <Circle cx={g.x(point1.idx - startIdx)} cy={g.y(point1.price)} r={5} fill={COLORS.gold} />}
    </G>
  );
});

const pts = (g: Geo, arr: Num[] | undefined, startIdx: number, endIdx: number) => {
  if (!arr) return '';
  const out: string[] = [];
  for (let i = startIdx; i < endIdx && i < arr.length; i++) {
    const v = arr[i];
    if (v != null) out.push(`${g.x(i - startIdx)},${g.y(v)}`);
  }
  return out.join(' ');
};

const Series = memo(function Series({ g, rt, startIdx, endIdx }: { g: Geo; rt: Runtime; startIdx: number; endIdx: number }) {
  const m = rt.cfg.mode;
  const s = rt.series;
  if (m === 'band') {
    return (
      <G>
        <Polyline points={pts(g, s.upper, startIdx, endIdx)} fill="none" stroke={COLORS.blue} strokeWidth={1.2} opacity={0.85} />
        <Polyline points={pts(g, s.sma, startIdx, endIdx)} fill="none" stroke={COLORS.dim} strokeWidth={1} strokeDasharray="3,3" />
        <Polyline points={pts(g, s.lower, startIdx, endIdx)} fill="none" stroke={COLORS.blue} strokeWidth={1.2} opacity={0.85} />
      </G>
    );
  }
  if (m === 'ma') {
    return (
      <G>
        <Polyline points={pts(g, s.a, startIdx, endIdx)} fill="none" stroke={COLORS.gold} strokeWidth={2} strokeLinejoin="round" />
        <Polyline points={pts(g, s.b, startIdx, endIdx)} fill="none" stroke="#8D93E6" strokeWidth={1.7} strokeLinejoin="round" />
      </G>
    );
  }
  if (m === 'vwap') return <Polyline points={pts(g, s.a, startIdx, endIdx)} fill="none" stroke={COLORS.gold} strokeWidth={2.1} strokeLinejoin="round" />;
  return null;
});

const Candles = memo(function Candles({ g, rt, startIdx, endIdx, patternLabel }: { g: Geo; rt: Runtime; startIdx: number; endIdx: number; patternLabel: string }) {
  const marks = useMemo(() => new Set(rt.signals.filter((s) => s.markIdx !== null).map((s) => s.markIdx as number)), [rt]);
  const bandLike = rt.cfg.mode === 'band' || rt.cfg.mode === 'vwap';
  const bw = bodyW(g);
  const items = [];
  for (let idx = startIdx; idx < endIdx; idx++) {
    const c = rt.candles[idx];
    const slot = idx - startIdx;
    const cx = g.x(slot);
    const up = c.close >= c.open;
    const color = up ? COLORS.bull : COLORS.bear;
    const top = g.y(Math.max(c.open, c.close));
    const bodyH = Math.max(2, Math.abs(g.y(c.open) - g.y(c.close)));
    items.push(
      <G key={idx}>
        <Line x1={cx} y1={g.y(c.high)} x2={cx} y2={g.y(c.low)} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        <Rect x={cx - bw / 2} y={top} width={bw} height={bodyH} rx={2.5} fill={up ? 'url(#bullGrad)' : 'url(#bearGrad)'} />
        {c.touch && <Circle cx={cx} cy={g.y(c.low)} r={4.5} stroke={COLORS.gold} strokeWidth={1.4} fill="none" />}
        {bandLike && marks.has(idx) && <Circle cx={cx} cy={g.y(rt.dir === 'buy' ? c.low : c.high)} r={4.5} stroke={COLORS.gold} strokeWidth={1.4} fill="none" />}
        {c.pattern && (
          <G>
            <Circle cx={cx} cy={g.y(c.low)} r={4.5} stroke={COLORS.gold} strokeWidth={1.4} fill="none" />
            <SvgText x={cx} y={g.y(c.low) + 16} fill={COLORS.gold} fontSize={9} textAnchor="middle">{patternLabel}</SvgText>
          </G>
        )}
      </G>,
    );
  }
  return <G>{items}</G>;
});

interface FormingProps { g: Geo; rt: Runtime; state: SessionState; startIdx: number; locked: boolean; label: string; position: Position | null; buyLabel: string; sellLabel: string }

function Forming({ g, rt, state, startIdx, locked, label, position, buyLabel, sellLabel }: FormingProps) {
  const f = formingCandle(rt, state);
  const price = currentPrice(rt, state);
  const slot = Math.min(WIN - 1, state.closed - startIdx);
  const cx = g.x(slot);
  const up = f ? f.close >= f.open : true;
  const color = up ? COLORS.bull : COLORS.bear;
  const tagColor = locked ? COLORS.gold : color;
  const py = g.y(price);
  const bw = bodyW(g);
  const pos = position;
  const ey = pos ? g.y(pos.entryPrice) : 0;
  const ex = pos ? g.x(Math.max(0, Math.min(WIN - 1, pos.entryClosed - startIdx))) : 0;
  const profit = pos ? (pos.type === 'buy' ? price >= pos.entryPrice : price <= pos.entryPrice) : true;
  const sideColor = pos?.type === 'buy' ? COLORS.bull : COLORS.bear;
  const entryText = pos ? `${pos.type === 'buy' ? buyLabel : sellLabel} ${pos.entryPrice.toFixed(2)}` : '';
  const pillW = textW(entryText, 9.5);
  const pillY = ey - 18 >= SCALE_H ? ey - 18 : ey + 4;
  const lockW = textW(label, 10);
  const lockX = Math.max(lockW + 6, cx - 14);
  return (
    <G>
      {pos && (
        <G>
          <Rect x={ex} y={Math.min(ey, py)} width={Math.max(0, cx - ex)} height={Math.max(1, Math.abs(py - ey))} fill={profit ? COLORS.bull : COLORS.bear} opacity={0.15} />
          <Line x1={0} y1={ey} x2={g.plotW} y2={ey} stroke={COLORS.text} strokeWidth={1} strokeDasharray="5,3" opacity={0.85} />
          <Polygon points={pos.type === 'buy' ? `${ex},${ey + 1} ${ex - 6},${ey + 11} ${ex + 6},${ey + 11}` : `${ex},${ey - 1} ${ex - 6},${ey - 11} ${ex + 6},${ey - 11}`} fill={sideColor} />
          <Rect x={4} y={pillY} width={pillW} height={14} rx={7} fill={sideColor} />
          <SvgText x={4 + pillW / 2} y={pillY + 10} fill={COLORS.ink} fontSize={9.5} fontWeight="bold" textAnchor="middle">{entryText}</SvgText>
        </G>
      )}
      {f && (
        <G>
          <Rect x={cx - bw * 0.85} y={g.y(f.high) - 2} width={bw * 1.7} height={Math.max(4, g.y(f.low) - g.y(f.high) + 4)} rx={5} fill={color} opacity={0.14} />
          <Line x1={cx} y1={g.y(f.high)} x2={cx} y2={g.y(f.low)} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
          <Rect x={cx - bw / 2} y={g.y(Math.max(f.open, f.close))} width={bw} height={Math.max(2, Math.abs(g.y(f.open) - g.y(f.close)))} rx={2.5} fill={up ? 'url(#bullGrad)' : 'url(#bearGrad)'} />
        </G>
      )}
      <Line x1={cx} y1={py} x2={g.plotW} y2={py} stroke={tagColor} strokeWidth={1} strokeDasharray="3,3" opacity={0.9} />
      <Circle cx={cx} cy={py} r={locked ? 7 : 5.5} fill={tagColor} opacity={0.28} />
      <Circle cx={cx} cy={py} r={locked ? 3.8 : 2.8} fill={tagColor} />
      <Rect x={g.plotW + 1} y={py - 8} width={RULER_W - 2} height={16} rx={4} fill={tagColor} />
      <SvgText x={g.plotW + RULER_W / 2} y={py + 3.7} fill={COLORS.ink} fontSize={10} fontWeight="bold" textAnchor="middle">{price.toFixed(2)}</SvgText>
      {locked && (
        <G>
          <Rect x={lockX - lockW} y={py - 26} width={lockW} height={17} rx={8.5} fill={COLORS.gold} />
          <SvgText x={lockX - lockW / 2} y={py - 14} fill={COLORS.ink} fontSize={10} fontWeight="bold" textAnchor="middle">{label}</SvgText>
        </G>
      )}
    </G>
  );
}

export interface ChartProps {
  rt: Runtime; state: SessionState; width: number; height?: number; preview?: boolean; hideAnswer?: boolean; opts: RuleOpts;
  locked: boolean; lockedLabel: string; patternLabel: string;
  /** Libellés (traduits) : étiquette d'entrée et de zone. Valeurs par défaut en anglais. */
  buyLabel?: string; sellLabel?: string; zoneLabel?: string;
  playerZone?: Zone | null; playerAnchors?: [Anchor, Anchor] | null; point1?: { idx: number; price: number } | null;
}

/** Graphique en couches : les bougies terminées ne sont redessinées qu'à chaque clôture, pas à chaque tick. */
export function Chart(p: ChartProps) {
  const { rt, state, width, height = 220, preview = false } = p;
  const g = useMemo(() => makeGeo(rt, width, height), [rt, width, height]);
  const closed = state.closed;
  const total = preview ? rt.cutCount : closed + (closed < rt.n ? 1 : 0);
  const startIdx = preview ? 0 : Math.max(0, total - WIN);
  const endIdx = preview ? rt.cutCount : closed;

  return (
    <Svg width={width} height={SCALE_H + height} style={{ backgroundColor: COLORS.bg }}>
      <Gradients />
      <Rect x={0} y={0} width={width} height={SCALE_H + height} fill="url(#bgGrad)" />
      <Watermark g={g} />
      {Array.from({ length: Math.min(WIN, Math.max(0, total - startIdx)) }, (_, i) =>
        i % 3 === 0 ? <SvgText key={i} x={g.x(i)} y={11} fill={COLORS.dim} fontSize={9} opacity={0.8} textAnchor="middle">{startIdx + i + 1}</SvgText> : null,
      )}
      <Grid g={g} />
      <Overlays g={g} rt={rt} startIdx={startIdx} opts={p.opts} hideAnswer={!!p.hideAnswer} zoneLabel={p.zoneLabel} playerZone={p.playerZone} playerAnchors={p.playerAnchors} point1={p.point1} />
      {!preview && <Series g={g} rt={rt} startIdx={startIdx} endIdx={endIdx} />}
      <Candles g={g} rt={rt} startIdx={startIdx} endIdx={endIdx} patternLabel={p.patternLabel} />
      {!preview && <Forming g={g} rt={rt} state={state} startIdx={startIdx} locked={p.locked} label={p.lockedLabel} position={state.position} buyLabel={p.buyLabel ?? 'BUY'} sellLabel={p.sellLabel ?? 'SELL'} />}
    </Svg>
  );
}

/* ---------- Panneaux sous le graphique : RSI, Stochastique, MACD, volume ---------- */

const PANEL_H = 70;
const VOL_H = 50;

export const IndicatorPanel = memo(function IndicatorPanel({ rt, closed, width }: { rt: Runtime; closed: number; width: number }) {
  const g = makeGeo(rt, width, 0);
  const startIdx = Math.max(0, closed + (closed < rt.n ? 1 : 0) - WIN);
  const cfg = rt.cfg;
  if (cfg.mode !== 'indicator') return null;
  const yPct = (v: number) => PANEL_H * (1 - v / 100);
  const line = (arr: Num[] | undefined, map: (v: number) => number) => {
    const out: string[] = [];
    if (arr) for (let i = startIdx; i < closed && i < arr.length; i++) { const v = arr[i]; if (v != null) out.push(`${g.x(i - startIdx)},${map(v)}`); }
    return out.join(' ');
  };
  if (cfg.indicator === 'macd') {
    const all: number[] = [];
    for (let i = startIdx; i < closed; i++) { const a = rt.series.a?.[i]; const b = rt.series.b?.[i]; if (a != null) all.push(a); if (b != null) all.push(b); }
    const maxAbs = Math.max(0.6, ...all.map(Math.abs));
    const yFor = (v: number) => PANEL_H / 2 - (v / maxAbs) * (PANEL_H / 2 - 6);
    return (
      <Svg width={width} height={PANEL_H} style={{ backgroundColor: COLORS.panel }}>
        <Line x1={0} y1={PANEL_H / 2} x2={g.plotW} y2={PANEL_H / 2} stroke={COLORS.line} strokeWidth={1} />
        <Polyline points={line(rt.series.a, yFor)} fill="none" stroke={COLORS.gold} strokeWidth={1.8} />
        <Polyline points={line(rt.series.b, yFor)} fill="none" stroke={COLORS.blue} strokeWidth={1.4} />
        <SvgText x={g.plotW + 4} y={12} fill={COLORS.gold} fontSize={9}>MACD</SvgText>
        <SvgText x={g.plotW + 4} y={24} fill={COLORS.blue} fontSize={9}>sig</SvgText>
      </Svg>
    );
  }
  const stoch = cfg.indicator === 'stoch';
  const ob = cfg.overbought ?? (stoch ? 80 : 70);
  const os = cfg.oversold ?? (stoch ? 20 : 30);
  return (
    <Svg width={width} height={PANEL_H} style={{ backgroundColor: COLORS.panel }}>
      <Line x1={0} y1={yPct(ob)} x2={g.plotW} y2={yPct(ob)} stroke={COLORS.bear} strokeDasharray="3,3" strokeWidth={1} />
      <Line x1={0} y1={yPct(os)} x2={g.plotW} y2={yPct(os)} stroke={COLORS.bull} strokeDasharray="3,3" strokeWidth={1} />
      <Polyline points={line(rt.series.a, yPct)} fill="none" stroke={COLORS.gold} strokeWidth={1.8} />
      {stoch && <Polyline points={line(rt.series.b, yPct)} fill="none" stroke={COLORS.blue} strokeWidth={1.4} />}
      <SvgText x={g.plotW + 4} y={yPct(ob) + 3} fill={COLORS.bear} fontSize={9}>{ob}</SvgText>
      <SvgText x={g.plotW + 4} y={yPct(os) + 3} fill={COLORS.bull} fontSize={9}>{os}</SvgText>
      <SvgText x={g.plotW + 4} y={12} fill={COLORS.gold} fontSize={9}>{stoch ? '%K' : 'RSI'}</SvgText>
    </Svg>
  );
});

export const VolumePanel = memo(function VolumePanel({ rt, closed, width }: { rt: Runtime; closed: number; width: number }) {
  const g = makeGeo(rt, width, 0);
  const startIdx = Math.max(0, closed + (closed < rt.n ? 1 : 0) - WIN);
  const vis = rt.candles.slice(startIdx, closed);
  const maxVol = Math.max(1, ...vis.map((c) => c.vol ?? 0));
  return (
    <Svg width={width} height={VOL_H} style={{ backgroundColor: COLORS.panel }}>
      {vis.map((c, i) => {
        const h = ((c.vol ?? 0) / maxVol) * (VOL_H - 12);
        return <Rect key={i} x={g.x(i) - g.spacing * 0.2} y={VOL_H - 6 - h} width={g.spacing * 0.4} height={h} fill={c.pattern ? COLORS.gold : COLORS.blue} opacity={0.8} />;
      })}
      <SvgText x={4} y={12} fill={COLORS.dim} fontSize={9}>VOL</SvgText>
    </Svg>
  );
});

export function ChartFrame({ children, width }: { children: React.ReactNode; width: number }) {
  return <View style={{ width, alignSelf: 'center' }}>{children}</View>;
}
