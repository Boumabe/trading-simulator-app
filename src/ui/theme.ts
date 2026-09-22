export const COLORS = {
  bg: '#0A0B16',
  panel: '#14172A',
  panelAlt: '#1B1E38',
  line: '#232748',
  blue: '#5B5F99',
  gold: '#C6F135',
  bull: '#35D6A0',
  bear: '#EF4368',
  warn: '#FFB020',
  text: '#F1EFFA',
  dim: '#9997B6',
  ink: '#0A0E17',
} as const;

export const RADIUS = { sm: 8, md: 12, lg: 16, pill: 99 } as const;

export const money = (v: number, sign = false): string => {
  const abs = Math.abs(v).toFixed(2);
  const s = v < 0 ? '−' : sign && v > 0 ? '+' : '';
  return `${s}$${abs}`;
};

/** Remplit le parent (StyleSheet.absoluteFillObject n'existe plus dans React Native 0.86). */
export const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;
