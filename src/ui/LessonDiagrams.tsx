import React from 'react';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { COLORS } from './theme';

/** Convention : y vers le bas, donc une valeur y PETITE = un prix HAUT. */
function Candle({ x, o, c, h, l, w = 18 }: { x: number; o: number; c: number; h: number; l: number; w?: number }) {
  const bull = c < o; // clôture plus haute que l'ouverture
  const color = bull ? COLORS.bull : COLORS.bear;
  return (
    <>
      <Line x1={x} y1={h} x2={x} y2={l} stroke={color} strokeWidth={3} />
      <Rect x={x - w / 2} y={Math.min(o, c)} width={w} height={Math.max(Math.abs(c - o), 2)} fill={color} rx={2} />
    </>
  );
}

export function AnatomyDiagram({ high, close, open, low }: { high: string; close: string; open: string; low: string }) {
  const rows: [number, string][] = [[22, high], [58, close], [128, open], [168, low]];
  return (
    <Svg width="100%" height={200} viewBox="0 0 300 200" accessibilityLabel={`${high} / ${close} / ${open} / ${low}`}>
      <Candle x={90} o={128} c={58} h={22} l={168} w={44} />
      {rows.map(([y, label]) => (
        <React.Fragment key={label}>
          <Line x1={120} y1={y} x2={168} y2={y} stroke={COLORS.dim} strokeWidth={1.5} strokeDasharray="4 4" />
          <SvgText x={176} y={y + 5} fill={COLORS.text} fontSize={15} fontWeight="bold">{label}</SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );
}

export function BullBearDiagram({ bull, bear }: { bull: string; bear: string }) {
  return (
    <Svg width="100%" height={200} viewBox="0 0 300 200" accessibilityLabel={`${bull} / ${bear}`}>
      <Candle x={85} o={118} c={52} h={28} l={150} w={44} />
      <SvgText x={34} y={123} fill={COLORS.dim} fontSize={13}>O</SvgText>
      <SvgText x={34} y={57} fill={COLORS.dim} fontSize={13}>C</SvgText>
      <SvgText x={85} y={186} fill={COLORS.bull} fontSize={14} fontWeight="bold" textAnchor="middle">{bull}</SvgText>

      <Candle x={215} o={52} c={118} h={28} l={150} w={44} />
      <SvgText x={164} y={57} fill={COLORS.dim} fontSize={13}>O</SvgText>
      <SvgText x={164} y={123} fill={COLORS.dim} fontSize={13}>C</SvgText>
      <SvgText x={215} y={186} fill={COLORS.bear} fontSize={14} fontWeight="bold" textAnchor="middle">{bear}</SvgText>
    </Svg>
  );
}

const SUPPORT_CANDLES = [
  { x: 30, o: 35, c: 55, h: 30, l: 60 },
  { x: 72, o: 55, c: 80, h: 50, l: 85 },
  { x: 114, o: 80, c: 105, h: 75, l: 110 },
  { x: 156, o: 105, c: 120, h: 100, l: 126 },
  { x: 198, o: 120, c: 95, h: 90, l: 126 },
  { x: 240, o: 95, c: 70, h: 65, l: 100 },
  { x: 282, o: 70, c: 45, h: 40, l: 75 },
];

export function SupportDiagram({ label }: { label: string }) {
  return (
    <Svg width="100%" height={190} viewBox="0 0 310 190" accessibilityLabel={label}>
      <Line x1={6} y1={126} x2={304} y2={126} stroke={COLORS.gold} strokeWidth={2} strokeDasharray="6 5" />
      {SUPPORT_CANDLES.map((c) => <Candle key={c.x} {...c} />)}
      <SvgText x={155} y={160} fill={COLORS.gold} fontSize={15} fontWeight="bold" textAnchor="middle">{label}</SvgText>
    </Svg>
  );
}
