import React, { useState, useEffect, useRef, type ComponentType } from "react";
import Svg, { Line, Rect, Circle, Text as SvgText, Path, Polyline } from "react-native-svg";
import { COLORS } from './theme';
import { useI18n } from '../core/i18n';

function useLoopedT(durationMs = 2400, pauseMs = 700) {
  const [t, setT] = useState(0);
  const rafRef = useRef(0);
  useEffect(() => {
    let start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      if (elapsed < durationMs) setT(Math.min(1, elapsed / durationMs));
      else if (elapsed < durationMs + pauseMs) setT(1);
      else start = Date.now();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [durationMs, pauseMs]);
  return t;
}

function revealPath(points: number[][], t: number) {
  const totalSegs = points.length - 1;
  const raw = t * totalSegs;
  const segIdx = Math.min(Math.floor(raw), totalSegs - 1);
  const segFrac = raw - segIdx;
  const [ax, ay] = points[segIdx];
  const [bx, by] = points[segIdx + 1];
  const curX = ax + (bx - ax) * segFrac;
  const curY = ay + (by - ay) * segFrac;
  const visible = points.slice(0, segIdx + 1);
  const pointsStr = [...visible, [curX, curY]].map((p) => p.join(",")).join(" ");
  return { pointsStr, curX, curY };
}

function barProgress(t: number, n: number, i: number) {
  return Math.max(0, Math.min(1, t * n - i));
}

/* ---------- déjà animées — inchangées ---------- */
export function CandleDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2400, 700);
  const cx = 150;
  const openY = 70;
  const dipY = 135;
  const finalY = 40;
  let closeY, lowSeen;
  if (t < 0.5) {
    const p = t / 0.5;
    closeY = openY + p * (dipY - openY);
    lowSeen = closeY;
  } else {
    const p = (t - 0.5) / 0.5;
    closeY = dipY + p * (finalY - dipY);
    lowSeen = dipY;
  }
  const bull = closeY < openY;
  const color = bull ? COLORS.bull : COLORS.bear;
  const bodyTop = Math.min(openY, closeY);
  const bodyBottom = Math.max(openY, closeY);
  const highSeen = Math.min(openY, closeY, finalY);

  return (
    <Svg width="100%" height={190} viewBox="0 0 300 190">
      <Line x1={cx} y1={highSeen - 15} x2={cx} y2={bodyTop} stroke={color} strokeWidth={1.6} />
      <Rect x={cx - 14} y={bodyTop} width={28} height={Math.max(2, bodyBottom - bodyTop)} fill={color} />
      <Line x1={cx} y1={bodyBottom} x2={cx} y2={lowSeen + 15} stroke={color} strokeWidth={1.6} />
      <SvgText x={10} y={20} fill={COLORS.dim} fontSize={10}>{tr('dg_00')}</SvgText>
      <Line x1={cx - 14} y1={openY} x2={40} y2={openY} stroke={COLORS.dim} strokeWidth={1} strokeDasharray="2,2" />
      <SvgText x={10} y={172} fill={COLORS.gold} fontSize={10}>
        {t < 0.5 ? "Les vendeurs poussent le prix vers le bas..." : "...puis les acheteurs reprennent le contrôle"}
      </SvgText>
    </Svg>
  );
}

export function SupportDiagram() {
  const { t: tr } = useI18n();
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={10} y1={100} x2={290} y2={100} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Path d="M20,40 L70,95 L120,50 L170,95 L220,45 L270,60" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Circle cx={70} cy={95} r={4} stroke={COLORS.gold} strokeWidth={1.5} fill="none" />
      <Circle cx={170} cy={95} r={4} stroke={COLORS.gold} strokeWidth={1.5} fill="none" />
      <SvgText x={10} y={120} fill={COLORS.text} fontSize={11}>{tr('dg_01')}</SvgText>
      <SvgText x={10} y={135} fill={COLORS.gold} fontSize={10}>{tr('dg_02')}</SvgText>
    </Svg>
  );
}

export function ResistanceDiagram() {
  const { t: tr } = useI18n();
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={10} y1={40} x2={290} y2={40} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Path d="M20,100 L70,45 L120,90 L170,45 L220,95 L270,80" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Circle cx={70} cy={45} r={4} stroke={COLORS.gold} strokeWidth={1.5} fill="none" />
      <Circle cx={170} cy={45} r={4} stroke={COLORS.gold} strokeWidth={1.5} fill="none" />
      <SvgText x={10} y={120} fill={COLORS.text} fontSize={11}>{tr('dg_03')}</SvgText>
      <SvgText x={10} y={135} fill={COLORS.gold} fontSize={10}>{tr('dg_04')}</SvgText>
    </Svg>
  );
}

const SR_POINTS = [[20, 40], [70, 95], [100, 55], [140, 95], [170, 72], [200, 112], [240, 97], [270, 130]];
const SR_BREAK_INDEX = 5;

export function PolarityDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(3200, 800);
  const { pointsStr, curX, curY } = revealPath(SR_POINTS, t);
  const segIdx = Math.min(Math.floor(t * (SR_POINTS.length - 1)), SR_POINTS.length - 2);
  const isResistanceNow = segIdx >= SR_BREAK_INDEX;
  const lineColor = isResistanceNow ? COLORS.gold : COLORS.blue;

  return (
    <Svg width="100%" height={150} viewBox="0 0 300 150">
      <Line x1={10} y1={95} x2={290} y2={95} stroke={lineColor} strokeDasharray="4,3" strokeWidth={1.4} />
      <SvgText x={10} y={88} fill={lineColor} fontSize={10}>{isResistanceNow ? "RÉSISTANCE (ex-support)" : "SUPPORT"}</SvgText>
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Circle cx={curX} cy={curY} r={3.5} fill={COLORS.gold} />
      <SvgText x={10} y={140} fill={COLORS.dim} fontSize={10}>{tr('dg_05')}</SvgText>
    </Svg>
  );
}

export function PinbarDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2200, 600);
  const openY = 45;
  const dipY = 130;
  const closeY = 55;
  let curY;
  if (t < 0.6) curY = openY + (t / 0.6) * (dipY - openY);
  else { const p = (t - 0.6) / 0.4; curY = dipY + p * (closeY - dipY); }
  const bodyTop = Math.min(openY, curY);
  const bodyBottom = Math.max(openY, curY);

  return (
    <Svg width="100%" height={150} viewBox="0 0 300 150">
      <Line x1={150} y1={20} x2={150} y2={bodyTop} stroke={COLORS.bull} strokeWidth={1.6} />
      <Rect x={138} y={bodyTop} width={24} height={Math.max(2, bodyBottom - bodyTop)} fill={COLORS.bull} />
      <Line x1={150} y1={bodyBottom} x2={150} y2={Math.max(curY, dipY) + 10} stroke={COLORS.bull} strokeWidth={1.6} />
      <SvgText x={10} y={140} fill={COLORS.gold} fontSize={10}>
        {t < 0.6 ? "Le prix plonge, testant les vendeurs..." : "...puis rejeté violemment vers le haut"}
      </SvgText>
    </Svg>
  );
}

export function EngulfingDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2200, 600);
  const growW = 20 + t * 40;
  const growH = 30 + t * 60;

  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={90} y={55} width={20} height={30} fill={COLORS.bear} />
      <Rect x={140 - (growW - 20) / 2} y={70 - growH / 2} width={growW} height={growH} fill={COLORS.bull} opacity={0.92} />
      <SvgText x={68} y={100} fill={COLORS.dim} fontSize={9}>{tr('dg_06')}</SvgText>
      <SvgText x={10} y={128} fill={COLORS.gold} fontSize={10}>{tr('dg_07')}</SvgText>
    </Svg>
  );
}

export function DojiDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2400, 700);
  const openY = 65;
  const upTestY = 30;
  const downTestY = 100;
  let curY, highSeen, lowSeen;
  if (t < 0.33) {
    const p = t / 0.33;
    curY = openY + p * (upTestY - openY);
    highSeen = curY; lowSeen = openY;
  } else if (t < 0.66) {
    const p = (t - 0.33) / 0.33;
    curY = upTestY + p * (downTestY - upTestY);
    highSeen = upTestY; lowSeen = curY;
  } else {
    const p = (t - 0.66) / 0.34;
    curY = downTestY + p * (openY - downTestY);
    highSeen = upTestY; lowSeen = downTestY;
  }
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={150} y1={highSeen} x2={150} y2={lowSeen} stroke={COLORS.dim} strokeWidth={1.6} />
      <Rect x={138} y={openY - 1.5} width={24} height={3} fill={COLORS.text} />
      <Circle cx={150} cy={curY} r={3} fill={COLORS.gold} />
      <SvgText x={170} y={openY + 4} fill={COLORS.text} fontSize={11}>{tr('dg_08')}</SvgText>
      <SvgText x={10} y={130} fill={COLORS.gold} fontSize={10}>{tr('dg_09')}</SvgText>
    </Svg>
  );
}

export function MorningStarDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(3000, 800);
  const h1 = t < 0.34 ? Math.min(50, (t / 0.34) * 50) : 50;
  const h2 = t < 0.34 ? 0 : t < 0.67 ? Math.min(8, ((t - 0.34) / 0.33) * 8) : 8;
  const h3 = t < 0.67 ? 0 : Math.min(55, ((t - 0.67) / 0.33) * 55);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={60} y={40} width={26} height={h1} fill={COLORS.bear} />
      <Rect x={137} y={82} width={26} height={h2} fill={COLORS.dim} />
      <Rect x={214} y={90 - h3} width={26} height={h3} fill={COLORS.bull} />
      <SvgText x={44} y={100} fill={COLORS.text} fontSize={9}>{tr('dg_10')}</SvgText>
      <SvgText x={122} y={108} fill={COLORS.text} fontSize={9}>{tr('dg_11')}</SvgText>
      <SvgText x={190} y={100} fill={COLORS.text} fontSize={9}>{tr('dg_12')}</SvgText>
      <SvgText x={10} y={130} fill={COLORS.gold} fontSize={10}>{tr('dg_13')}</SvgText>
    </Svg>
  );
}

/* ---------- Palier 1 restants ---------- */
export function TrendDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pts = [[20, 110], [80, 80], [100, 90], [160, 50], [180, 60], [240, 20]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Polyline points={pointsStr} fill="none" stroke={COLORS.bull} strokeWidth={1.8} />
      <SvgText x={70} y={72} fill={COLORS.gold} fontSize={9}>{tr('dg_14')}</SvgText>
      <SvgText x={150} y={42} fill={COLORS.gold} fontSize={9}>{tr('dg_14')}</SvgText>
      <SvgText x={10} y={130} fill={COLORS.text} fontSize={11}>{tr('dg_15')}</SvgText>
    </Svg>
  );
}

export function TrendlineDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pts = [[20, 110], [80, 80], [140, 95], [200, 50], [260, 65]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={108} x2={260} y2={55} stroke={COLORS.blue} strokeWidth={1.4} />
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Circle cx={80} cy={80} r={3.5} stroke={COLORS.gold} strokeWidth={1.3} fill="none" />
      <Circle cx={200} cy={50} r={3.5} stroke={COLORS.gold} strokeWidth={1.3} fill="none" />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_16')}</SvgText>
    </Svg>
  );
}

export function ChannelDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pts = [[30, 55], [70, 90], [110, 45], [150, 80], [190, 35], [230, 65]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={100} x2={280} y2={50} stroke={COLORS.blue} strokeWidth={1.4} />
      <Line x1={20} y1={60} x2={280} y2={10} stroke={COLORS.blue} strokeWidth={1.4} />
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_17')}</SvgText>
    </Svg>
  );
}

export function BreakoutDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pts = [[30, 90], [70, 65], [110, 80], [150, 58], [170, 75], [210, 30]];
  const { pointsStr, curX, curY } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={60} x2={280} y2={60} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Circle cx={curX} cy={curY} r={3} fill={COLORS.gold} />
      <SvgText x={155} y={50} fill={COLORS.gold} fontSize={8}>{tr('dg_18')}</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_19')}</SvgText>
    </Svg>
  );
}

/* ---------- Palier 2 restants ---------- */
export function InsideBarDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2200, 600);
  const growH = Math.min(1, t * 1.3) * 20;
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={100} y1={20} x2={100} y2={110} stroke={COLORS.bear} strokeWidth={1.6} />
      <Rect x={85} y={40} width={30} height={50} fill={COLORS.bear} />
      <Line x1={160} y1={65 - growH / 2} x2={160} y2={65 + growH / 2} stroke={COLORS.bull} strokeWidth={1.6} />
      <Rect x={148} y={65 - growH / 2.6} width={24} height={growH / 1.3} fill={COLORS.bull} />
      <SvgText x={10} y={130} fill={COLORS.gold} fontSize={10}>{tr('dg_20')}</SvgText>
    </Svg>
  );
}

export function ThreeSoldiersDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2400, 700);
  const h1 = barProgress(t, 3, 0) * 35;
  const h2 = barProgress(t, 3, 1) * 40;
  const h3 = barProgress(t, 3, 2) * 45;
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={70} y={105 - h1} width={22} height={h1} fill={COLORS.bull} />
      <Rect x={130} y={85 - h2} width={22} height={h2} fill={COLORS.bull} />
      <Rect x={190} y={65 - h3} width={22} height={h3} fill={COLORS.bull} />
      <SvgText x={10} y={130} fill={COLORS.gold} fontSize={10}>{tr('dg_21')}</SvgText>
    </Svg>
  );
}

/* ---------- Palier 3 ---------- */
export function HeadShouldersDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(3000, 700);
  const pts = [[20, 100], [60, 50], [100, 100], [140, 20], [180, 100], [220, 55], [260, 100]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={40} y1={100} x2={260} y2={100} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={40} y={35} fill={COLORS.gold} fontSize={9}>{tr('dg_22')}</SvgText>
      <SvgText x={10} y={122} fill={COLORS.text} fontSize={10}>{tr('dg_23')}</SvgText>
      <SvgText x={10} y={135} fill={COLORS.gold} fontSize={10}>{tr('dg_24')}</SvgText>
    </Svg>
  );
}

export function DoubleTopDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pts = [[20, 110], [70, 30], [120, 80], [170, 30], [220, 100]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={40} y1={30} x2={220} y2={30} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Circle cx={70} cy={30} r={4} stroke={COLORS.gold} strokeWidth={1.5} fill="none" />
      <Circle cx={170} cy={30} r={4} stroke={COLORS.gold} strokeWidth={1.5} fill="none" />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_25')}</SvgText>
    </Svg>
  );
}

export function TriangleDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2800, 700);
  const pts = [[30, 90], [60, 40], [90, 85], [120, 55], [150, 80], [180, 60], [210, 75]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={20} x2={260} y2={70} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Line x1={20} y1={110} x2={260} y2={70} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_26')}</SvgText>
    </Svg>
  );
}

export function FlagDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2800, 700);
  const pts = [[20, 120], [60, 20], [60, 30], [90, 45], [120, 55], [150, 65], [180, 60], [230, 15]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={60} y1={20} x2={180} y2={55} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Line x1={60} y1={40} x2={180} y2={75} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Polyline points={pointsStr} fill="none" stroke={COLORS.bull} strokeWidth={2} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_27')}</SvgText>
    </Svg>
  );
}

export function WedgeDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2800, 700);
  const pts = [[25, 110], [60, 80], [95, 100], [130, 70], [165, 90], [200, 60], [235, 75]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={95} x2={260} y2={35} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Line x1={20} y1={120} x2={260} y2={45} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={10} y={135} fill={COLORS.gold} fontSize={10}>{tr('dg_28')}</SvgText>
    </Svg>
  );
}

export function CupHandleDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(3000, 700);
  const pts = [[20, 40], [50, 70], [80, 108], [110, 108], [140, 40], [160, 40], [175, 58], [190, 45], [235, 15]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={50} y={122} fill={COLORS.dim} fontSize={9}>{tr('dg_29')}</SvgText>
      <SvgText x={155} y={75} fill={COLORS.dim} fontSize={9}>{tr('dg_30')}</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_31')}</SvgText>
    </Svg>
  );
}

/* ---------- Palier 4 ---------- */
export function RSIDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pts = [[20, 70], [60, 40], [100, 25], [140, 60], [180, 100], [220, 80], [260, 50]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={30} x2={280} y2={30} stroke={COLORS.bear} strokeDasharray="4,3" strokeWidth={1} />
      <SvgText x={224} y={26} fill={COLORS.bear} fontSize={9}>{tr('dg_32')}</SvgText>
      <Line x1={20} y1={95} x2={280} y2={95} stroke={COLORS.bull} strokeDasharray="4,3" strokeWidth={1} />
      <SvgText x={20} y={110} fill={COLORS.bull} fontSize={9}>{tr('dg_33')}</SvgText>
      <Polyline points={pointsStr} fill="none" stroke={COLORS.gold} strokeWidth={1.8} />
    </Svg>
  );
}

export function MADiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pts = [[20, 100], [60, 95], [100, 90], [140, 75], [180, 65], [220, 50], [260, 42]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,110 L60,90 L100,100 L140,60 L180,70 L220,30 L260,40" fill="none" stroke={COLORS.text} strokeWidth={1.6} opacity={0.6} />
      <Polyline points={pointsStr} fill="none" stroke={COLORS.gold} strokeWidth={2} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_34')}</SvgText>
    </Svg>
  );
}

export function MACDDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2800, 700);
  const heights = [10, 18, 22, 14, -8, -16, -10, 6];
  const sigPts = [[30, 50], [80, 42], [130, 55], [180, 68], [230, 60]];
  const { pointsStr } = revealPath(sigPts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={70} x2={280} y2={70} stroke={COLORS.dim} strokeWidth={1} />
      {heights.map((h, i) => {
        const p = barProgress(t, heights.length, i);
        const hh = Math.abs(h) * p;
        return <Rect key={i} x={40 + i * 30} y={h >= 0 ? 70 - hh : 70} width={14} height={hh} fill={h >= 0 ? COLORS.bull : COLORS.bear} />;
      })}
      <Polyline points={pointsStr} fill="none" stroke={COLORS.gold} strokeWidth={1.5} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_35')}</SvgText>
    </Svg>
  );
}

export function BollingerDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pts = [[20, 80], [60, 65], [100, 88], [140, 55], [180, 82], [220, 55], [260, 72]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,50 L60,30 L100,60 L140,20 L180,55 L220,25 L260,45" fill="none" stroke={COLORS.blue} strokeWidth={1.2} opacity={0.7} />
      <Path d="M20,110 L60,105 L100,115 L140,95 L180,110 L220,90 L260,100" fill="none" stroke={COLORS.blue} strokeWidth={1.2} opacity={0.7} />
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_36')}</SvgText>
    </Svg>
  );
}

export function StochDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pts = [[20, 80], [60, 30], [100, 40], [140, 90], [180, 105], [220, 60], [260, 35]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={25} x2={280} y2={25} stroke={COLORS.bear} strokeDasharray="4,3" strokeWidth={1} />
      <Line x1={20} y1={100} x2={280} y2={100} stroke={COLORS.bull} strokeDasharray="4,3" strokeWidth={1} />
      <Path d="M20,85 L60,45 L100,35 L140,80 L180,100 L220,75 L260,45" fill="none" stroke={COLORS.text} strokeWidth={1.2} opacity={0.6} />
      <Polyline points={pointsStr} fill="none" stroke={COLORS.gold} strokeWidth={1.6} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_37')}</SvgText>
    </Svg>
  );
}

export function ATRDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2400, 700);
  const heights = [8, 14, 22, 35, 28, 16, 10];
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      {heights.map((h, i) => {
        const p = barProgress(t, heights.length, i);
        return <Rect key={i} x={30 + i * 34} y={110 - h * p} width={18} height={h * p} fill={COLORS.blue} opacity={0.7} />;
      })}
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_38')}</SvgText>
    </Svg>
  );
}

export function FiboDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const levels = [
    { y: 25, l: "0%" }, { y: 45, l: "23.6%" }, { y: 62, l: "38.2%" },
    { y: 75, l: "50%" }, { y: 88, l: "61.8%" }, { y: 110, l: "100%" },
  ];
  const pts = [[30, 110], [90, 25], [160, 88]];
  const { pointsStr, curX, curY } = revealPath(pts, t);
  return (
    <Svg width="100%" height={150} viewBox="0 0 300 150">
      {levels.map((lv, i) => (
        <React.Fragment key={i}>
          <Line x1={20} y1={lv.y} x2={280} y2={lv.y} stroke={i === 4 ? COLORS.gold : COLORS.blue} strokeDasharray="3,3" strokeWidth={1} opacity={0.7} />
          <SvgText x={250} y={lv.y - 3} fill={i === 4 ? COLORS.gold : COLORS.dim} fontSize={8}>{lv.l}</SvgText>
        </React.Fragment>
      ))}
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Circle cx={curX} cy={curY} r={3} fill={COLORS.gold} />
      <SvgText x={10} y={140} fill={COLORS.text} fontSize={10}>{tr('dg_39')}</SvgText>
    </Svg>
  );
}

export function FiboExtDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pts = [[30, 100], [80, 30], [130, 75], [200, 10]];
  const { pointsStr, curX, curY } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={100} x2={280} y2={100} stroke={COLORS.blue} strokeDasharray="3,3" strokeWidth={1} opacity={0.7} />
      <SvgText x={250} y={97} fill={COLORS.dim} fontSize={8}>100%</SvgText>
      <Line x1={20} y1={30} x2={280} y2={30} stroke={COLORS.gold} strokeDasharray="3,3" strokeWidth={1} />
      <SvgText x={240} y={27} fill={COLORS.gold} fontSize={8}>161.8%</SvgText>
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Circle cx={curX} cy={curY} r={3} fill={COLORS.gold} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_40')}</SvgText>
    </Svg>
  );
}

/* ---------- Palier 5 ---------- */
export function VolumeDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pricePts = [[20, 60], [60, 50], [100, 65], [140, 40], [180, 55], [220, 35], [260, 45]];
  const { pointsStr } = revealPath(pricePts, t);
  const bars = [8, 14, 10, 22, 12, 26, 15];
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.6} />
      {bars.map((h, i) => {
        const p = barProgress(t, bars.length, i);
        return <Rect key={i} x={30 + i * 34} y={130 - h * p} width={16} height={h * p} fill={i === 5 ? COLORS.gold : COLORS.blue} opacity={0.7} />;
      })}
      <SvgText x={10} y={20} fill={COLORS.text} fontSize={10}>{tr('dg_41')}</SvgText>
    </Svg>
  );
}

export function VWAPDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pts = [[20, 90], [60, 70], [100, 85], [140, 55], [180, 75], [220, 45], [260, 60]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={80} x2={260} y2={55} stroke={COLORS.gold} strokeWidth={2} />
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.4} opacity={0.7} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_42')}</SvgText>
    </Svg>
  );
}

export function VolumeProfileDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pricePts = [[40, 110], [80, 90], [120, 100], [160, 60], [200, 75], [240, 40]];
  const { pointsStr } = revealPath(pricePts, t);
  const bars = [10, 18, 26, 14, 20, 8];
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.6} />
      {bars.map((w, i) => {
        const p = barProgress(t, bars.length, i);
        return <Rect key={i} x={260} y={20 + i * 17} width={w * p} height={12} fill={i === 2 ? COLORS.gold : COLORS.blue} opacity={0.7} />;
      })}
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_43')}</SvgText>
    </Svg>
  );
}

export function LiquidityZonesDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pts = [[20, 100], [70, 40], [120, 90], [170, 35], [220, 95]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={40} y1={40} x2={200} y2={35} stroke={COLORS.bear} strokeDasharray="3,3" strokeWidth={1} />
      <SvgText x={205} y={32} fill={COLORS.bear} fontSize={9}>{tr('dg_44')}</SvgText>
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_45')}</SvgText>
    </Svg>
  );
}

export function OrderFlowDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2400, 700);
  const heights = [12, -8, 18, -14, 22, -6, 10];
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={70} x2={280} y2={70} stroke={COLORS.dim} strokeWidth={1} />
      {heights.map((h, i) => {
        const p = barProgress(t, heights.length, i);
        const hh = Math.abs(h) * p;
        return <Rect key={i} x={30 + i * 34} y={h >= 0 ? 70 - hh : 70} width={16} height={hh} fill={h >= 0 ? COLORS.bull : COLORS.bear} />;
      })}
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_46')}</SvgText>
    </Svg>
  );
}

/* ---------- Palier 6 ---------- */
export function OrderBlockDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2400, 700);
  const pts = [[96, 80], [130, 60], [160, 30], [200, 10]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={70} y={60} width={26} height={20} fill={COLORS.bear} opacity={0.9} />
      <Rect x={65} y={55} width={36} height={30} fill="none" stroke={COLORS.gold} strokeWidth={1.2} strokeDasharray="3,3" />
      <Polyline points={pointsStr} fill="none" stroke={COLORS.bull} strokeWidth={2} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_47')}</SvgText>
    </Svg>
  );
}

export function FVGDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const h1 = Math.min(1, barProgress(t, 3, 0)) * 30;
  const h2 = Math.min(1, barProgress(t, 3, 1)) * 50;
  const h3 = Math.min(1, barProgress(t, 3, 2)) * 40;
  const gapOpacity = barProgress(t, 3, 2);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={70} y={110 - h1} width={26} height={h1} fill={COLORS.bull} />
      <Rect x={110} y={80 - h2} width={26} height={h2} fill={COLORS.bull} />
      <Rect x={150} y={60 - h3} width={26} height={h3} fill={COLORS.bull} />
      <Rect x={98} y={55} width={40} height={25} fill={COLORS.gold} opacity={0.25 * gapOpacity} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_48')}</SvgText>
    </Svg>
  );
}

export function LiquiditySweepDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pts = [[30, 90], [80, 50], [110, 60], [140, 20], [170, 75]];
  const { pointsStr, curX, curY } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={40} x2={280} y2={40} stroke={COLORS.bear} strokeDasharray="3,3" strokeWidth={1} />
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      {t > 0.55 && <Circle cx={140} cy={20} r={4} stroke={COLORS.gold} strokeWidth={1.5} fill="none" />}
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_49')}</SvgText>
    </Svg>
  );
}

export function BreakerBlockDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2400, 700);
  const pts = [[86, 45], [130, 80], [170, 60], [220, 100]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={60} y={30} width={26} height={20} fill={COLORS.bull} opacity={0.5} />
      <Polyline points={pointsStr} fill="none" stroke={COLORS.bear} strokeWidth={2} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_50')}</SvgText>
    </Svg>
  );
}

export function ChochBosDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pts = [[20, 100], [60, 60], [100, 80], [140, 30], [180, 90]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={100} y1={80} x2={200} y2={80} stroke={COLORS.gold} strokeDasharray="3,3" strokeWidth={1} />
      <SvgText x={205} y={83} fill={COLORS.gold} fontSize={9}>{tr('dg_51')}</SvgText>
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_52')}</SvgText>
    </Svg>
  );
}

export function PremiumDiscountDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(3000, 700);
  const cursorY = 20 + t * 80;
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={20} y={20} width={260} height={40} fill={COLORS.bear} opacity={0.15} />
      <Rect x={20} y={60} width={260} height={40} fill={COLORS.bull} opacity={0.15} />
      <Line x1={20} y1={60} x2={280} y2={60} stroke={COLORS.dim} strokeWidth={1} />
      <Line x1={20} y1={cursorY} x2={280} y2={cursorY} stroke={COLORS.gold} strokeWidth={1.6} />
      <SvgText x={225} y={35} fill={COLORS.bear} fontSize={9}>{tr('dg_53')}</SvgText>
      <SvgText x={225} y={80} fill={COLORS.bull} fontSize={9}>{tr('dg_54')}</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_55')}</SvgText>
    </Svg>
  );
}

export function KillZonesDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(3000, 700);
  const cursorX = 20 + t * 250;
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={60} x2={280} y2={60} stroke={COLORS.dim} strokeWidth={1} />
      <Rect x={30} y={30} width={60} height={60} fill={COLORS.blue} opacity={0.15} />
      <Rect x={110} y={30} width={70} height={60} fill={COLORS.gold} opacity={0.2} />
      <Rect x={200} y={30} width={70} height={60} fill={COLORS.bull} opacity={0.15} />
      <Line x1={cursorX} y1={20} x2={cursorX} y2={100} stroke={COLORS.text} strokeWidth={1.4} />
      <SvgText x={35} y={100} fill={COLORS.text} fontSize={8}>{tr('dg_56')}</SvgText>
      <SvgText x={115} y={100} fill={COLORS.text} fontSize={8}>{tr('dg_57')}</SvgText>
      <SvgText x={205} y={100} fill={COLORS.text} fontSize={8}>{tr('dg_58')}</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_59')}</SvgText>
    </Svg>
  );
}

export function OTEDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2400, 700);
  const pts = [[30, 100], [100, 40], [160, 70]];
  const { pointsStr, curX, curY } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={100} x2={280} y2={100} stroke={COLORS.blue} strokeDasharray="3,3" strokeWidth={1} opacity={0.6} />
      <Line x1={20} y1={40} x2={280} y2={40} stroke={COLORS.blue} strokeDasharray="3,3" strokeWidth={1} opacity={0.6} />
      <Rect x={20} y={55} width={260} height={25} fill={COLORS.gold} opacity={0.2} />
      <SvgText x={225} y={70} fill={COLORS.gold} fontSize={8}>{tr('dg_60')}</SvgText>
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Circle cx={curX} cy={curY} r={3} fill={COLORS.gold} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_61')}</SvgText>
    </Svg>
  );
}

/* ---------- Palier 7 ---------- */
export function CorrelationDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2800, 700);
  const goldPts = [[20, 40], [70, 55], [120, 35], [170, 60], [220, 30], [270, 50]];
  const bluePts = [[20, 90], [70, 75], [120, 95], [170, 70], [220, 100], [270, 80]];
  const gold = revealPath(goldPts, t);
  const blue = revealPath(bluePts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Polyline points={gold.pointsStr} fill="none" stroke={COLORS.gold} strokeWidth={1.8} />
      <Polyline points={blue.pointsStr} fill="none" stroke={COLORS.blue} strokeWidth={1.8} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_62')}</SvgText>
    </Svg>
  );
}

export function SessionsDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(3000, 700);
  const cursorX = 20 + t * 250;
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={70} x2={280} y2={70} stroke={COLORS.dim} strokeWidth={1} />
      <Rect x={20} y={50} width={70} height={40} fill={COLORS.blue} opacity={0.15} />
      <Rect x={90} y={50} width={90} height={40} fill={COLORS.text} opacity={0.1} />
      <Rect x={180} y={50} width={100} height={40} fill={COLORS.bull} opacity={0.15} />
      <Line x1={cursorX} y1={40} x2={cursorX} y2={100} stroke={COLORS.gold} strokeWidth={1.4} />
      <SvgText x={35} y={45} fill={COLORS.text} fontSize={8}>{tr('dg_56')}</SvgText>
      <SvgText x={115} y={45} fill={COLORS.text} fontSize={8}>{tr('dg_57')}</SvgText>
      <SvgText x={210} y={45} fill={COLORS.text} fontSize={8}>{tr('dg_58')}</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_63')}</SvgText>
    </Svg>
  );
}

export function NewsDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2800, 700);
  const pts = [[20, 70], [100, 68], [120, 90], [140, 20], [160, 95], [180, 50], [260, 45]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={140} y1={10} x2={140} y2={110} stroke={COLORS.bear} strokeDasharray="3,3" strokeWidth={1} />
      <SvgText x={144} y={20} fill={COLORS.bear} fontSize={9}>{tr('dg_64')}</SvgText>
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_65')}</SvgText>
    </Svg>
  );
}

export function SentimentDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2200, 700);
  const w1 = Math.min(1, t * 1.3) * 180;
  const w2 = Math.min(1, t * 1.3) * 80;
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={20} y={50} width={w1} height={20} fill={COLORS.bull} />
      <Rect x={280 - w2} y={50} width={w2} height={20} fill={COLORS.bear} />
      <SvgText x={30} y={45} fill={COLORS.bull} fontSize={9}>{tr('dg_66')}</SvgText>
      <SvgText x={205} y={45} fill={COLORS.bear} fontSize={9}>{tr('dg_67')}</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_68')}</SvgText>
    </Svg>
  );
}

/* ---------- Palier 8 ---------- */
export function ConfluenceSRDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2400, 700);
  const pts = [[30, 40], [80, 95], [130, 50]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={100} x2={280} y2={100} stroke={COLORS.blue} strokeDasharray="3,3" strokeWidth={1} />
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      {t > 0.5 && <Rect x={58} y={80} width={14} height={14} fill={COLORS.bull} />}
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_69')}</SvgText>
    </Svg>
  );
}

export function ConfluenceICTFiboDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pts = [[30, 110], [100, 70], [180, 20]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={90} y={60} width={26} height={20} fill={COLORS.bear} opacity={0.7} />
      <Line x1={20} y1={70} x2={280} y2={70} stroke={COLORS.gold} strokeDasharray="3,3" strokeWidth={1} />
      <SvgText x={225} y={67} fill={COLORS.gold} fontSize={8}>{tr('dg_70')}</SvgText>
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_71')}</SvgText>
    </Svg>
  );
}

export function MultiTFDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2600, 700);
  const pts = [[200, 50], [215, 45], [225, 55], [240, 35], [255, 50]];
  const { pointsStr } = revealPath(pts, t);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,90 L60,60 L100,75 L140,30 L180,50" fill="none" stroke={COLORS.text} strokeWidth={1.4} opacity={0.5} />
      <SvgText x={10} y={20} fill={COLORS.dim} fontSize={8}>{tr('dg_72')}</SvgText>
      <Polyline points={pointsStr} fill="none" stroke={COLORS.gold} strokeWidth={2} />
      <SvgText x={195} y={100} fill={COLORS.dim} fontSize={8}>{tr('dg_73')}</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_74')}</SvgText>
    </Svg>
  );
}

export function CustomSystemDiagram() {
  const { t: tr } = useI18n();
  const t = useLoopedT(2700, 700);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      {[0, 1, 2].map((i) => {
        const p = barProgress(t, 3, i);
        return (
          <React.Fragment key={i}>
            <Rect x={20} y={20 + i * 35} width={16} height={16} fill="none" stroke={COLORS.gold} strokeWidth={1.5} opacity={p > 0 ? 1 : 0.25} />
            <Line x1={46} y1={28 + i * 35} x2={46 + 214 * p} y2={28 + i * 35} stroke={COLORS.dim} strokeWidth={1} />
          </React.Fragment>
        );
      })}
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>{tr('dg_75')}</SvgText>
    </Svg>
  );
}

export default function Diagram({ type }: { type: string }) {
  const map: Record<string, ComponentType> = {
    candle: CandleDiagram, support: SupportDiagram, resistance: ResistanceDiagram, polarity: PolarityDiagram,
    trend: TrendDiagram, trendline: TrendlineDiagram, channel: ChannelDiagram, breakout: BreakoutDiagram,
    pinbar: PinbarDiagram, engulfing: EngulfingDiagram, doji: DojiDiagram, morningstar: MorningStarDiagram,
    insidebar: InsideBarDiagram, threesoldiers: ThreeSoldiersDiagram,
    headshoulders: HeadShouldersDiagram, doubletop: DoubleTopDiagram, triangle: TriangleDiagram,
    flag: FlagDiagram, wedge: WedgeDiagram, cuphandle: CupHandleDiagram,
    rsi: RSIDiagram, ma: MADiagram, macd: MACDDiagram, bollinger: BollingerDiagram,
    stoch: StochDiagram, atr: ATRDiagram, fibo: FiboDiagram, fiboext: FiboExtDiagram,
    volume: VolumeDiagram, vwap: VWAPDiagram, volumeprofile: VolumeProfileDiagram,
    liquidityzones: LiquidityZonesDiagram, orderflow: OrderFlowDiagram,
    orderblock: OrderBlockDiagram, fvg: FVGDiagram, liquiditysweep: LiquiditySweepDiagram,
    breakerblock: BreakerBlockDiagram, chochbos: ChochBosDiagram, premiumdiscount: PremiumDiscountDiagram,
    killzones: KillZonesDiagram, ote: OTEDiagram,
    correlation: CorrelationDiagram, sessions: SessionsDiagram, news: NewsDiagram, sentiment: SentimentDiagram,
    confluencesr: ConfluenceSRDiagram, confluenceictfibo: ConfluenceICTFiboDiagram,
    multitf: MultiTFDiagram, customsystem: CustomSystemDiagram,
  };
  const C = map[type];
  return C ? <C /> : null;
}