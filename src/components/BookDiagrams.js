import React, { useState, useEffect, useRef } from "react";
import Svg, { Line, Rect, Circle, Text as SvgText, Path, Polyline } from "react-native-svg";
import COLORS from "../constants/palette";

function useLoopedT(durationMs = 2400, pauseMs = 700) {
  const [t, setT] = useState(0);
  const rafRef = useRef(null);
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

export function CandleDiagram() {
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
      <SvgText x={10} y={20} fill={COLORS.dim} fontSize={10}>Ouverture</SvgText>
      <Line x1={cx - 14} y1={openY} x2={40} y2={openY} stroke={COLORS.dim} strokeWidth={1} strokeDasharray="2,2" />
      <SvgText x={10} y={172} fill={COLORS.gold} fontSize={10}>
        {t < 0.5 ? "Les vendeurs poussent le prix vers le bas..." : "...puis les acheteurs reprennent le contrôle"}
      </SvgText>
    </Svg>
  );
}

export function SupportDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={10} y1={100} x2={290} y2={100} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Path d="M20,40 L70,95 L120,50 L170,95 L220,45 L270,60" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Circle cx={70} cy={95} r={4} stroke={COLORS.gold} strokeWidth={1.5} fill="none" />
      <Circle cx={170} cy={95} r={4} stroke={COLORS.gold} strokeWidth={1.5} fill="none" />
      <SvgText x={10} y={120} fill={COLORS.text} fontSize={11}>Le prix touche deux fois le même plancher</SvgText>
      <SvgText x={10} y={135} fill={COLORS.gold} fontSize={10}>sans jamais clôturer en dessous — support validé</SvgText>
    </Svg>
  );
}

export function ResistanceDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={10} y1={40} x2={290} y2={40} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Path d="M20,100 L70,45 L120,90 L170,45 L220,95 L270,80" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Circle cx={70} cy={45} r={4} stroke={COLORS.gold} strokeWidth={1.5} fill="none" />
      <Circle cx={170} cy={45} r={4} stroke={COLORS.gold} strokeWidth={1.5} fill="none" />
      <SvgText x={10} y={120} fill={COLORS.text} fontSize={11}>Le prix touche deux fois le même plafond</SvgText>
      <SvgText x={10} y={135} fill={COLORS.gold} fontSize={10}>sans jamais clôturer au-dessus — résistance validée</SvgText>
    </Svg>
  );
}

const SR_POINTS = [[20, 40], [70, 95], [100, 55], [140, 95], [170, 72], [200, 112], [240, 97], [270, 130]];
const SR_BREAK_INDEX = 5;

export function PolarityDiagram() {
  const t = useLoopedT(3200, 800);
  const totalSegs = SR_POINTS.length - 1;
  const raw = t * totalSegs;
  const segIdx = Math.min(Math.floor(raw), totalSegs - 1);
  const segFrac = raw - segIdx;
  const visiblePts = SR_POINTS.slice(0, segIdx + 1);
  const [ax, ay] = SR_POINTS[segIdx];
  const [bx, by] = SR_POINTS[segIdx + 1];
  const curX = ax + (bx - ax) * segFrac;
  const curY = ay + (by - ay) * segFrac;
  const pointsStr = [...visiblePts, [curX, curY]].map((p) => p.join(",")).join(" ");
  const isResistanceNow = segIdx >= SR_BREAK_INDEX;
  const lineColor = isResistanceNow ? COLORS.gold : COLORS.blue;

  return (
    <Svg width="100%" height={150} viewBox="0 0 300 150">
      <Line x1={10} y1={95} x2={290} y2={95} stroke={lineColor} strokeDasharray="4,3" strokeWidth={1.4} />
      <SvgText x={10} y={88} fill={lineColor} fontSize={10}>{isResistanceNow ? "RÉSISTANCE (ex-support)" : "SUPPORT"}</SvgText>
      <Polyline points={pointsStr} fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Circle cx={curX} cy={curY} r={3.5} fill={COLORS.gold} />
      <SvgText x={10} y={140} fill={COLORS.dim} fontSize={10}>Un niveau cassé change de rôle — le support devient résistance</SvgText>
    </Svg>
  );
}

export function TrendDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,110 L80,80 L100,90 L160,50 L180,60 L240,20" fill="none" stroke={COLORS.bull} strokeWidth={1.8} />
      <SvgText x={70} y={72} fill={COLORS.gold} fontSize={9}>sommet+</SvgText>
      <SvgText x={150} y={42} fill={COLORS.gold} fontSize={9}>sommet+</SvgText>
      <SvgText x={10} y={130} fill={COLORS.text} fontSize={11}>Sommets et creux de plus en plus hauts = tendance haussière</SvgText>
    </Svg>
  );
}

export function TrendlineDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,110 L80,80 L140,95 L200,50 L260,65" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Line x1={20} y1={108} x2={260} y2={55} stroke={COLORS.blue} strokeWidth={1.4} />
      <Circle cx={80} cy={80} r={3.5} stroke={COLORS.gold} strokeWidth={1.3} fill="none" />
      <Circle cx={200} cy={50} r={3.5} stroke={COLORS.gold} strokeWidth={1.3} fill="none" />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Droite reliant au moins deux creux (ou sommets)</SvgText>
    </Svg>
  );
}

export function ChannelDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={100} x2={280} y2={50} stroke={COLORS.blue} strokeWidth={1.4} />
      <Line x1={20} y1={60} x2={280} y2={10} stroke={COLORS.blue} strokeWidth={1.4} />
      <Path d="M30,55 L70,90 L110,45 L150,80 L190,35 L230,65" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Le prix oscille entre deux lignes parallèles</SvgText>
    </Svg>
  );
}

export function BreakoutDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={60} x2={280} y2={60} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Path d="M30,90 L70,65 L110,80 L150,58 L170,75 L210,30" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Circle cx={150} cy={58} r={3.5} stroke={COLORS.gold} strokeWidth={1.3} fill="none" />
      <SvgText x={155} y={50} fill={COLORS.gold} fontSize={8}>retest</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Cassure puis retour tester le niveau avant de continuer</SvgText>
    </Svg>
  );
}

export function PinbarDiagram() {
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
  const t = useLoopedT(2200, 600);
  const growW = 20 + t * 40;
  const growH = 30 + t * 60;

  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={90} y={55} width={20} height={30} fill={COLORS.bear} />
      <Rect x={140 - (growW - 20) / 2} y={70 - growH / 2} width={growW} height={growH} fill={COLORS.bull} opacity={0.92} />
      <SvgText x={68} y={100} fill={COLORS.dim} fontSize={9}>Bougie 1</SvgText>
      <SvgText x={10} y={128} fill={COLORS.gold} fontSize={10}>La 2e bougie grandit jusqu'à englober entièrement la 1ère</SvgText>
    </Svg>
  );
}

export function DojiDiagram() {
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
      <SvgText x={170} y={openY + 4} fill={COLORS.text} fontSize={11}>Ouverture ≈ clôture</SvgText>
      <SvgText x={10} y={130} fill={COLORS.gold} fontSize={10}>Indécision — le prix teste puis revient sans trancher</SvgText>
    </Svg>
  );
}

export function MorningStarDiagram() {
  const t = useLoopedT(3000, 800);
  const h1 = t < 0.34 ? Math.min(50, (t / 0.34) * 50) : 50;
  const h2 = t < 0.34 ? 0 : t < 0.67 ? Math.min(8, ((t - 0.34) / 0.33) * 8) : 8;
  const h3 = t < 0.67 ? 0 : Math.min(55, ((t - 0.67) / 0.33) * 55);
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={60} y={40} width={26} height={h1} fill={COLORS.bear} />
      <Rect x={137} y={82} width={26} height={h2} fill={COLORS.dim} />
      <Rect x={214} y={90 - h3} width={26} height={h3} fill={COLORS.bull} />
      <SvgText x={44} y={100} fill={COLORS.text} fontSize={9}>Grande baissière</SvgText>
      <SvgText x={122} y={108} fill={COLORS.text} fontSize={9}>Étoile</SvgText>
      <SvgText x={190} y={100} fill={COLORS.text} fontSize={9}>Grande haussière</SvgText>
      <SvgText x={10} y={130} fill={COLORS.gold} fontSize={10}>3 bougies — retournement de tendance</SvgText>
    </Svg>
  );
}

export function InsideBarDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={100} y1={20} x2={100} y2={110} stroke={COLORS.bear} strokeWidth={1.6} />
      <Rect x={85} y={40} width={30} height={50} fill={COLORS.bear} />
      <Line x1={160} y1={45} x2={160} y2={85} stroke={COLORS.bull} strokeWidth={1.6} />
      <Rect x={148} y={55} width={24} height={20} fill={COLORS.bull} />
      <SvgText x={10} y={130} fill={COLORS.gold} fontSize={10}>La 2e bougie reste dans la 1ère — contraction</SvgText>
    </Svg>
  );
}

export function ThreeSoldiersDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={70} y={70} width={22} height={35} fill={COLORS.bull} />
      <Rect x={130} y={45} width={22} height={40} fill={COLORS.bull} />
      <Rect x={190} y={20} width={22} height={45} fill={COLORS.bull} />
      <SvgText x={10} y={130} fill={COLORS.gold} fontSize={10}>3 bougies consécutives, clôtures de plus en plus hautes</SvgText>
    </Svg>
  );
}

export function HeadShouldersDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,100 L60,50 L100,100 L140,20 L180,100 L220,55 L260,100" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Line x1={40} y1={100} x2={260} y2={100} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <SvgText x={40} y={35} fill={COLORS.gold} fontSize={9}>Tête</SvgText>
      <SvgText x={10} y={122} fill={COLORS.text} fontSize={10}>Ligne de cou reliant les deux creux</SvgText>
      <SvgText x={10} y={135} fill={COLORS.gold} fontSize={10}>Cassure de la ligne = retournement confirmé</SvgText>
    </Svg>
  );
}

export function DoubleTopDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={40} y1={30} x2={220} y2={30} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Path d="M20,110 L70,30 L120,80 L170,30 L220,100" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Circle cx={70} cy={30} r={4} stroke={COLORS.gold} strokeWidth={1.5} fill="none" />
      <Circle cx={170} cy={30} r={4} stroke={COLORS.gold} strokeWidth={1.5} fill="none" />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Deux sommets au même niveau, incapables de le dépasser</SvgText>
    </Svg>
  );
}

export function TriangleDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={20} x2={260} y2={70} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Line x1={20} y1={110} x2={260} y2={70} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Path d="M30,90 L60,40 L90,85 L120,55 L150,80 L180,60 L210,75" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Le prix se resserre entre deux lignes qui convergent</SvgText>
    </Svg>
  );
}

export function FlagDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,120 L60,20" fill="none" stroke={COLORS.bull} strokeWidth={2} />
      <Line x1={60} y1={20} x2={180} y2={55} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Line x1={60} y1={40} x2={180} y2={75} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Path d="M60,30 L90,45 L120,55 L150,65 L180,60" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Path d="M180,60 L230,15" fill="none" stroke={COLORS.bull} strokeWidth={2} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Mât fort, courte pause, puis continuation</SvgText>
    </Svg>
  );
}

export function WedgeDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={95} x2={260} y2={35} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Line x1={20} y1={120} x2={260} y2={45} stroke={COLORS.blue} strokeDasharray="4,3" strokeWidth={1} />
      <Path d="M25,110 L60,80 L95,100 L130,70 L165,90 L200,60 L235,75" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={10} y={135} fill={COLORS.gold} fontSize={10}>Biseau ascendant — souvent baissier malgré la hausse</SvgText>
    </Svg>
  );
}

export function CupHandleDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,40 Q80,120 140,40" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Path d="M140,40 L160,40 L175,58 L190,45" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Path d="M190,45 L235,15" fill="none" stroke={COLORS.bull} strokeWidth={2} />
      <SvgText x={50} y={110} fill={COLORS.dim} fontSize={9}>Tasse</SvgText>
      <SvgText x={155} y={75} fill={COLORS.dim} fontSize={9}>Anse</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Continuation haussière après une pause en U</SvgText>
    </Svg>
  );
}

export function RSIDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={30} x2={280} y2={30} stroke={COLORS.bear} strokeDasharray="4,3" strokeWidth={1} />
      <SvgText x={224} y={26} fill={COLORS.bear} fontSize={9}>70 — surachat</SvgText>
      <Line x1={20} y1={95} x2={280} y2={95} stroke={COLORS.bull} strokeDasharray="4,3" strokeWidth={1} />
      <SvgText x={20} y={110} fill={COLORS.bull} fontSize={9}>30 — survente</SvgText>
      <Path d="M20,70 L60,40 L100,25 L140,60 L180,100 L220,80 L260,50" fill="none" stroke={COLORS.gold} strokeWidth={1.8} />
    </Svg>
  );
}

export function MADiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,110 L60,90 L100,100 L140,60 L180,70 L220,30 L260,40" fill="none" stroke={COLORS.text} strokeWidth={1.6} opacity={0.6} />
      <Path d="M20,100 L60,95 L100,90 L140,75 L180,65 L220,50 L260,42" fill="none" stroke={COLORS.gold} strokeWidth={2} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>La moyenne (dorée) lisse le prix brut</SvgText>
    </Svg>
  );
}

export function MACDDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={70} x2={280} y2={70} stroke={COLORS.dim} strokeWidth={1} />
      {[10, 18, 22, 14, -8, -16, -10, 6].map((h, i) => (
        <Rect key={i} x={40 + i * 30} y={h >= 0 ? 70 - h : 70} width={14} height={Math.abs(h)} fill={h >= 0 ? COLORS.bull : COLORS.bear} />
      ))}
      <Path d="M30,50 L80,42 L130,55 L180,68 L230,60" fill="none" stroke={COLORS.gold} strokeWidth={1.5} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Croisement des lignes + histogramme = signal</SvgText>
    </Svg>
  );
}

export function BollingerDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,50 L60,30 L100,60 L140,20 L180,55 L220,25 L260,45" fill="none" stroke={COLORS.blue} strokeWidth={1.2} opacity={0.7} />
      <Path d="M20,110 L60,105 L100,115 L140,95 L180,110 L220,90 L260,100" fill="none" stroke={COLORS.blue} strokeWidth={1.2} opacity={0.7} />
      <Path d="M20,80 L60,65 L100,88 L140,55 L180,82 L220,55 L260,72" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Le prix reste presque toujours entre les bandes</SvgText>
    </Svg>
  );
}

export function StochDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={25} x2={280} y2={25} stroke={COLORS.bear} strokeDasharray="4,3" strokeWidth={1} />
      <Line x1={20} y1={100} x2={280} y2={100} stroke={COLORS.bull} strokeDasharray="4,3" strokeWidth={1} />
      <Path d="M20,80 L60,30 L100,40 L140,90 L180,105 L220,60 L260,35" fill="none" stroke={COLORS.gold} strokeWidth={1.6} />
      <Path d="M20,85 L60,45 L100,35 L140,80 L180,100 L220,75 L260,45" fill="none" stroke={COLORS.text} strokeWidth={1.2} opacity={0.6} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Deux lignes (%K, %D) qui se croisent</SvgText>
    </Svg>
  );
}

export function ATRDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      {[8, 14, 22, 35, 28, 16, 10].map((h, i) => (
        <Rect key={i} x={30 + i * 34} y={110 - h} width={18} height={h} fill={COLORS.blue} opacity={0.7} />
      ))}
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Barres plus hautes = marché plus volatil</SvgText>
    </Svg>
  );
}

export function FiboDiagram() {
  const levels = [
    { y: 25, l: "0%" }, { y: 45, l: "23.6%" }, { y: 62, l: "38.2%" },
    { y: 75, l: "50%" }, { y: 88, l: "61.8%" }, { y: 110, l: "100%" },
  ];
  return (
    <Svg width="100%" height={150} viewBox="0 0 300 150">
      {levels.map((lv, i) => (
        <React.Fragment key={i}>
          <Line x1={20} y1={lv.y} x2={280} y2={lv.y} stroke={i === 4 ? COLORS.gold : COLORS.blue} strokeDasharray="3,3" strokeWidth={1} opacity={0.7} />
          <SvgText x={250} y={lv.y - 3} fill={i === 4 ? COLORS.gold : COLORS.dim} fontSize={8}>{lv.l}</SvgText>
        </React.Fragment>
      ))}
      <Path d="M30,110 L90,25 L160,88" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={10} y={140} fill={COLORS.text} fontSize={10}>Le prix corrige souvent près de 61.8%</SvgText>
    </Svg>
  );
}

export function FiboExtDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={100} x2={280} y2={100} stroke={COLORS.blue} strokeDasharray="3,3" strokeWidth={1} opacity={0.7} />
      <SvgText x={250} y={97} fill={COLORS.dim} fontSize={8}>100%</SvgText>
      <Line x1={20} y1={30} x2={280} y2={30} stroke={COLORS.gold} strokeDasharray="3,3" strokeWidth={1} />
      <SvgText x={240} y={27} fill={COLORS.gold} fontSize={8}>161.8%</SvgText>
      <Path d="M30,100 L80,30 L130,75 L200,10" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Objectifs de prix au-delà du mouvement initial</SvgText>
    </Svg>
  );
}

export function VolumeDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,60 L60,50 L100,65 L140,40 L180,55 L220,35 L260,45" fill="none" stroke={COLORS.text} strokeWidth={1.6} />
      {[8, 14, 10, 22, 12, 26, 15].map((h, i) => (
        <Rect key={i} x={30 + i * 34} y={130 - h} width={16} height={h} fill={i === 5 ? COLORS.gold : COLORS.blue} opacity={0.7} />
      ))}
      <SvgText x={10} y={20} fill={COLORS.text} fontSize={10}>Un pic de volume confirme un mouvement</SvgText>
    </Svg>
  );
}

export function VWAPDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,90 L60,70 L100,85 L140,55 L180,75 L220,45 L260,60" fill="none" stroke={COLORS.text} strokeWidth={1.4} opacity={0.6} />
      <Path d="M20,80 L260,55" fill="none" stroke={COLORS.gold} strokeWidth={2} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Prix moyen pondéré par le volume de la séance</SvgText>
    </Svg>
  );
}

export function VolumeProfileDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M40,110 L80,90 L120,100 L160,60 L200,75 L240,40" fill="none" stroke={COLORS.text} strokeWidth={1.6} />
      {[10, 18, 26, 14, 20, 8].map((w, i) => (
        <Rect key={i} x={260} y={20 + i * 17} width={w} height={12} fill={i === 2 ? COLORS.gold : COLORS.blue} opacity={0.7} />
      ))}
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Concentration du volume par niveau de prix</SvgText>
    </Svg>
  );
}

export function LiquidityZonesDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,100 L70,40 L120,90 L170,35 L220,95" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Line x1={40} y1={40} x2={200} y2={35} stroke={COLORS.bear} strokeDasharray="3,3" strokeWidth={1} />
      <SvgText x={205} y={32} fill={COLORS.bear} fontSize={9}>liquidité</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Stops accumulés au-dessus des sommets égaux</SvgText>
    </Svg>
  );
}

export function OrderFlowDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={70} x2={280} y2={70} stroke={COLORS.dim} strokeWidth={1} />
      {[12, -8, 18, -14, 22, -6, 10].map((h, i) => (
        <Rect key={i} x={30 + i * 34} y={h >= 0 ? 70 - h : 70} width={16} height={Math.abs(h)} fill={h >= 0 ? COLORS.bull : COLORS.bear} />
      ))}
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Déséquilibre entre ordres acheteurs et vendeurs</SvgText>
    </Svg>
  );
}

export function OrderBlockDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={70} y={60} width={26} height={20} fill={COLORS.bear} opacity={0.9} />
      <Path d="M96,80 L130,60 L160,30 L200,10" fill="none" stroke={COLORS.bull} strokeWidth={2} />
      <Rect x={65} y={55} width={36} height={30} fill="none" stroke={COLORS.gold} strokeWidth={1.2} strokeDasharray="3,3" />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Dernière bougie opposée avant le mouvement fort</SvgText>
    </Svg>
  );
}

export function FVGDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={70} y={80} width={26} height={30} fill={COLORS.bull} />
      <Rect x={110} y={30} width={26} height={50} fill={COLORS.bull} />
      <Rect x={150} y={20} width={26} height={40} fill={COLORS.bull} />
      <Rect x={98} y={55} width={40} height={25} fill={COLORS.gold} opacity={0.25} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Vide de prix entre 3 bougies — souvent comblé plus tard</SvgText>
    </Svg>
  );
}

export function LiquiditySweepDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={40} x2={280} y2={40} stroke={COLORS.bear} strokeDasharray="3,3" strokeWidth={1} />
      <Path d="M30,90 L80,50 L110,60 L140,20 L170,75" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Circle cx={140} cy={20} r={4} stroke={COLORS.gold} strokeWidth={1.5} fill="none" />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Mèche qui dépasse le niveau puis revient — piège à liquidité</SvgText>
    </Svg>
  );
}

export function BreakerBlockDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={60} y={30} width={26} height={20} fill={COLORS.bull} opacity={0.5} />
      <Path d="M86,45 L130,80 L170,60 L220,100" fill="none" stroke={COLORS.bear} strokeWidth={2} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Zone cassée qui change de rôle (support ↔ résistance)</SvgText>
    </Svg>
  );
}

export function ChochBosDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,100 L60,60 L100,80 L140,30 L180,90" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Line x1={100} y1={80} x2={200} y2={80} stroke={COLORS.gold} strokeDasharray="3,3" strokeWidth={1} />
      <SvgText x={205} y={83} fill={COLORS.gold} fontSize={9}>CHoCH</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>La structure casse dans le sens opposé — retournement</SvgText>
    </Svg>
  );
}

export function PremiumDiscountDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={20} y={20} width={260} height={40} fill={COLORS.bear} opacity={0.15} />
      <Rect x={20} y={60} width={260} height={40} fill={COLORS.bull} opacity={0.15} />
      <Line x1={20} y1={60} x2={280} y2={60} stroke={COLORS.dim} strokeWidth={1} />
      <SvgText x={225} y={35} fill={COLORS.bear} fontSize={9}>premium</SvgText>
      <SvgText x={225} y={80} fill={COLORS.bull} fontSize={9}>discount</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Acheter dans le discount, vendre dans le premium</SvgText>
    </Svg>
  );
}

export function KillZonesDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={60} x2={280} y2={60} stroke={COLORS.dim} strokeWidth={1} />
      <Rect x={30} y={30} width={60} height={60} fill={COLORS.blue} opacity={0.15} />
      <Rect x={110} y={30} width={70} height={60} fill={COLORS.gold} opacity={0.2} />
      <Rect x={200} y={30} width={70} height={60} fill={COLORS.bull} opacity={0.15} />
      <SvgText x={35} y={100} fill={COLORS.text} fontSize={8}>Asie</SvgText>
      <SvgText x={115} y={100} fill={COLORS.text} fontSize={8}>Londres</SvgText>
      <SvgText x={205} y={100} fill={COLORS.text} fontSize={8}>New York</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Les chevauchements de sessions sont les plus volatils</SvgText>
    </Svg>
  );
}

export function OTEDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={100} x2={280} y2={100} stroke={COLORS.blue} strokeDasharray="3,3" strokeWidth={1} opacity={0.6} />
      <Line x1={20} y1={40} x2={280} y2={40} stroke={COLORS.blue} strokeDasharray="3,3" strokeWidth={1} opacity={0.6} />
      <Rect x={20} y={55} width={260} height={25} fill={COLORS.gold} opacity={0.2} />
      <SvgText x={225} y={70} fill={COLORS.gold} fontSize={8}>OTE 61.8-79%</SvgText>
      <Path d="M30,100 L100,40 L160,70" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Zone d'entrée idéale sur le retracement</SvgText>
    </Svg>
  );
}

export function CorrelationDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,40 L70,55 L120,35 L170,60 L220,30 L270,50" fill="none" stroke={COLORS.gold} strokeWidth={1.8} />
      <Path d="M20,90 L70,75 L120,95 L170,70 L220,100 L270,80" fill="none" stroke={COLORS.blue} strokeWidth={1.8} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Deux actifs qui évoluent en miroir (ex. or et dollar)</SvgText>
    </Svg>
  );
}

export function SessionsDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={70} x2={280} y2={70} stroke={COLORS.dim} strokeWidth={1} />
      <Rect x={20} y={50} width={70} height={40} fill={COLORS.blue} opacity={0.15} />
      <Rect x={90} y={50} width={90} height={40} fill={COLORS.text} opacity={0.1} />
      <Rect x={180} y={50} width={100} height={40} fill={COLORS.bull} opacity={0.15} />
      <SvgText x={35} y={45} fill={COLORS.text} fontSize={8}>Asie</SvgText>
      <SvgText x={115} y={45} fill={COLORS.text} fontSize={8}>Londres</SvgText>
      <SvgText x={210} y={45} fill={COLORS.text} fontSize={8}>New York</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Chaque session a son propre style de mouvement</SvgText>
    </Svg>
  );
}

export function NewsDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,70 L100,68 L120,90 L140,20 L160,95 L180,50 L260,45" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Line x1={140} y1={10} x2={140} y2={110} stroke={COLORS.bear} strokeDasharray="3,3" strokeWidth={1} />
      <SvgText x={144} y={20} fill={COLORS.bear} fontSize={9}>annonce</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Une news majeure provoque un pic de volatilité soudain</SvgText>
    </Svg>
  );
}

export function SentimentDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={20} y={50} width={180} height={20} fill={COLORS.bull} />
      <Rect x={200} y={50} width={80} height={20} fill={COLORS.bear} />
      <SvgText x={30} y={45} fill={COLORS.bull} fontSize={9}>Acheteurs 70%</SvgText>
      <SvgText x={205} y={45} fill={COLORS.bear} fontSize={9}>Vendeurs 30%</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Positionnement dominant des grands acteurs du marché</SvgText>
    </Svg>
  );
}

export function ConfluenceSRDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Line x1={20} y1={100} x2={280} y2={100} stroke={COLORS.blue} strokeDasharray="3,3" strokeWidth={1} />
      <Path d="M30,40 L80,95 L130,50" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <Rect x={58} y={80} width={14} height={14} fill={COLORS.bull} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Support + pin bar au même endroit = confluence</SvgText>
    </Svg>
  );
}

export function ConfluenceICTFiboDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Rect x={90} y={60} width={26} height={20} fill={COLORS.bear} opacity={0.7} />
      <Line x1={20} y1={70} x2={280} y2={70} stroke={COLORS.gold} strokeDasharray="3,3" strokeWidth={1} />
      <SvgText x={225} y={67} fill={COLORS.gold} fontSize={8}>OTE 61.8%</SvgText>
      <Path d="M30,110 L100,70 L180,20" fill="none" stroke={COLORS.text} strokeWidth={1.8} />
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Order block et zone Fibonacci alignés = confluence forte</SvgText>
    </Svg>
  );
}

export function MultiTFDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      <Path d="M20,90 L60,60 L100,75 L140,30 L180,50" fill="none" stroke={COLORS.text} strokeWidth={1.4} opacity={0.5} />
      <SvgText x={10} y={20} fill={COLORS.dim} fontSize={8}>Timeframe supérieur — tendance</SvgText>
      <Path d="M200,50 L215,45 L225,55 L240,35 L255,50" fill="none" stroke={COLORS.gold} strokeWidth={2} />
      <SvgText x={195} y={100} fill={COLORS.dim} fontSize={8}>Timeframe inférieur — entrée</SvgText>
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Direction sur le grand cadre, entrée sur le petit</SvgText>
    </Svg>
  );
}

export function CustomSystemDiagram() {
  return (
    <Svg width="100%" height={140} viewBox="0 0 300 140">
      {[0, 1, 2].map((i) => (
        <React.Fragment key={i}>
          <Rect x={20} y={20 + i * 35} width={16} height={16} fill="none" stroke={COLORS.gold} strokeWidth={1.5} />
          <Line x1={46} y1={28 + i * 35} x2={260} y2={28 + i * 35} stroke={COLORS.dim} strokeWidth={1} />
        </React.Fragment>
      ))}
      <SvgText x={10} y={128} fill={COLORS.text} fontSize={10}>Ta propre check-list de règles, combinées à ta façon</SvgText>
    </Svg>
  );
}

export default function Diagram({ type }) {
  const map = {
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