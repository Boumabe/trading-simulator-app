import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Animated, BackHandler, Pressable, StyleSheet, Text, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { SESSION, SPEEDS, type Speed } from '../core/constants';
import { LEVELS, levelById, type LevelDef } from '../core/data/levels';
import { SCENARIOS } from '../core/data/scenarios';
import { hudState } from '../core/engine/hud';
import { SNIPER_MIN_ACCURACY, lineAccuracy, zoneAccuracy, type RuleOpts } from '../core/engine/rules';
import { compile } from '../core/engine/scenario';
import { currentPrice, initSession, makeReducer, sessionStats, type SessionEvent } from '../core/engine/session';
import { ECONOMY } from '../core/constants';
import { useI18n, useLevelName } from '../core/i18n';
import { routeForLevel } from '../core/nav';
import { rulesLabel } from '../core/rulesText';
import { haptic, reward, sfx } from '../core/services/feedback';
import { useActions, useGame } from '../core/store/game';
import { isUnlocked, type LevelResult } from '../core/store/logic';
import type { Anchor, Zone } from '../core/types';
import { RECOMMENDED_START } from '../core/data/levels';
import { Btn } from '../ui/Button';
import { Burst } from '../ui/Burst';
import { Chart, IndicatorPanel, VolumePanel, makeGeo } from '../ui/Chart';
import { HudBar } from '../ui/HudBar';
import { ResultOverlay } from '../ui/ResultOverlay';
import { Screen, TopBar } from '../ui/Screen';
import { TourOverlay } from '../ui/TourOverlay';
import { TradeFeedback, type FeedbackData } from '../ui/TradeFeedback';
import { useShake } from '../ui/anim';
import { COLORS, FILL, RADIUS, money } from '../ui/theme';

type Phase = 'tour' | 'sniper_intro' | 'sniper_p1' | 'sniper_p2' | 'sniper_confirm' | 'play';
interface Sniper { zone?: Zone; anchors?: [Anchor, Anchor]; accuracy: number }
const CHART_H = 220;

export default function PlayScreen({ levelId }: { levelId: number }) {
  const level = levelById(levelId);
  const { t } = useI18n();
  const router = useRouter();
  if (!level || level.kind !== 'play' || !level.strategyId || !SCENARIOS[level.strategyId]) {
    return (
      <Screen>
        <TopBar title="" onBack={() => router.replace('/map')} />
        <Text style={{ color: COLORS.dim, textAlign: 'center', marginTop: 40 }}>{t('map_soon')}</Text>
      </Screen>
    );
  }
  return <PlayInner key={level.id} level={level} />;
}

function PlayInner({ level }: { level: LevelDef }) {
  const { t } = useI18n();
  const router = useRouter();
  const game = useGame();
  const actions = useActions();
  const name = useLevelName(level.id);
  const { width } = useWindowDimensions();
  const chartW = Math.min(width - 24, 520);

  const rt = useMemo(() => compile(level.strategyId!, SCENARIOS[level.strategyId!]), [level.strategyId]);
  const reducer = useMemo(() => makeReducer(rt), [rt]);
  const [s, dispatch] = useReducer(reducer, undefined, initSession);

  const passesBefore = game.levels[level.id]?.passes ?? 0;
  const [phase, setPhase] = useState<Phase>(() => (!game.seenTour ? 'tour' : rt.sniperEligible && passesBefore > 0 ? 'sniper_intro' : 'play'));
  const [speed, setSpeed] = useState<Speed>(1);
  const [sniper, setSniper] = useState<Sniper | null>(null);
  const [drawZone, setDrawZone] = useState<Zone | null>(null);
  const [drawAnchors, setDrawAnchors] = useState<[Anchor, Anchor] | null>(null);
  const [point1, setPoint1] = useState<{ idx: number; price: number } | null>(null);
  const [fb, setFb] = useState<FeedbackData | null>(null);
  const [result, setResult] = useState<LevelResult | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [coins, setCoins] = useState(0);
  const [confetti, setConfetti] = useState(0);
  const fbId = useRef(0);
  const processed = useRef(0);
  const shake = useShake();

  const inSniperPhase = phase.startsWith('sniper');
  const sniperActive = inSniperPhase || sniper !== null;
  const opts = useMemo<RuleOpts>(() => ({ playerZone: sniper?.zone ?? null, playerAnchors: sniper?.anchors ?? null }), [sniper]);
  const drawing = phase === 'sniper_p1' || phase === 'sniper_p2';

  /* ---------- Démarrage : tutoriel → (mode Sniper) → jeu ---------- */
  const beginAfterTour = useCallback(() => {
    if (rt.sniperEligible && passesBefore > 0) setPhase('sniper_intro');
    else setPhase('play');
  }, [rt.sniperEligible, passesBefore]);

  useEffect(() => { if (phase === 'play' && s.status === 'idle') dispatch({ type: 'start' }); }, [phase, s.status]);

  const finishTour = () => { actions.markTourSeen(); beginAfterTour(); };

  /* ---------- Boucle de temps ---------- */
  useEffect(() => {
    if (s.status !== 'running') return;
    const id = setInterval(() => dispatch({ type: 'tick' }), SESSION.TICK_MS / speed);
    return () => clearInterval(id);
  }, [s.status, speed]);

  /* ---------- Réactions aux événements du moteur (récompenses, sons, résultat) ---------- */
  const onEvent = useCallback((ev: SessionEvent) => {
    if (ev.type === 'candle') {
      if (ev.touch || ev.pattern) haptic('select');
    } else if (ev.type === 'open') {
      if (ev.verdict.compliant) { sfx('click'); haptic('light'); } else haptic('warning');
    } else if (ev.type === 'trade') {
      const r = actions.recordTrade(ev.trade, ev.combo, level.id);
      fbId.current += 1;
      setFb({ id: fbId.current, trade: ev.trade, xp: r.xp, combo: ev.combo, delta: r.delta });
      if (ev.trade.compliant) {
        reward.coin();
        setCoins((n) => n + 1);
        if (ev.combo >= 3) setConfetti((n) => n + 1);
      } else {
        reward.lose();
        shake.shake();
      }
    }
  }, [actions, level.id, shake]);

  useEffect(() => {
    for (let i = processed.current; i < s.events.length; i++) onEvent(s.events[i]);
    processed.current = s.events.length;
  }, [s.events, onEvent]);

  useEffect(() => {
    if (s.status !== 'ended' || result) return;
    const st = sessionStats(s);
    setResult(actions.finishLevel({ levelId: level.id, discipline: st.discipline, trades: st.count, sniperAccuracy: sniper?.accuracy }));
  }, [s, result, actions, level.id, sniper]);

  /* ---------- « Cible verrouillée » : signal sonore quand une entrée conforme devient possible ---------- */
  const hud = hudState(rt, s, opts);
  const wasLocked = useRef(false);
  const lastCue = useRef(0);
  useEffect(() => {
    if (s.status === 'running' && hud.locked && !wasLocked.current && !s.position && Date.now() - lastCue.current > 1500) {
      lastCue.current = Date.now();
      reward.lock();
    }
    wasLocked.current = hud.locked;
  }, [hud.locked, s.status, s.position]);

  /* ---------- Actions du joueur ---------- */
  const price = currentPrice(rt, s);
  const dir = s.position ? (s.position.type === 'buy' ? 1 : -1) : 0;
  const livePnl = s.position ? (price - s.position.entryPrice) * dir * ECONOMY.POINT_VALUE : 0;
  const canTrade = game.balance > 0 && s.status === 'running' && !s.position;

  const open = (side: 'buy' | 'sell') => canTrade && dispatch({ type: 'open', side, opts });

  const requestExit = useCallback(() => {
    if (result) { router.replace('/map'); return; }
    if (phase === 'play' && (s.status === 'running' || s.status === 'paused')) {
      dispatch({ type: 'pause' });
      setConfirmExit(true);
      return;
    }
    router.back();
  }, [result, phase, s.status, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { requestExit(); return true; });
    return () => sub.remove();
  }, [requestExit]);

  const quit = () => {
    if (s.position) {
      const next = reducer(s, { type: 'close' });
      const ev = next.events[next.events.length - 1];
      if (ev && ev.type === 'trade') actions.recordTrade(ev.trade, ev.combo, level.id);
    }
    router.back();
  };

  const replay = () => {
    dispatch({ type: 'reset' });
    processed.current = 0;
    setResult(null); setFb(null); setSniper(null); setDrawZone(null); setDrawAnchors(null); setPoint1(null);
    if (rt.sniperEligible && (game.levels[level.id]?.passes ?? 0) > 0) setPhase('sniper_intro'); else setPhase('play');
  };

  const next = LEVELS.find((l) => l.id === level.id + 1);
  const goNext = next && isUnlocked(game, next.id, RECOMMENDED_START[game.choice ?? 'debutant']) ? () => router.replace(routeForLevel(next) as never) : undefined;

  /* ---------- Mode Sniper : dessiner sa propre zone / ligne ---------- */
  const g = useMemo(() => makeGeo(rt, chartW, CHART_H), [rt, chartW]);
  const onTap = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    const p = g.max - ((locationY - 16) / CHART_H) * (g.max - g.min);
    const idx = Math.max(0, Math.min(rt.cutCount - 1, Math.round((locationX - g.spacing / 2) / g.spacing)));
    haptic('select');
    if (phase === 'sniper_p1') { setPoint1({ idx, price: p }); setPhase('sniper_p2'); return; }
    if (!point1) return;
    if (rt.cfg.mode === 'trendzone') {
      let a: [Anchor, Anchor] = point1.idx <= idx ? [point1, { idx, price: p }] : [{ idx, price: p }, point1];
      if (a[0].idx === a[1].idx) a = [a[0], { ...a[1], idx: a[1].idx + 1 }];
      setDrawAnchors(a);
      setDrawZone(null);
    } else {
      const real = rt.cfg.zones![0];
      setDrawZone({ low: Math.min(point1.price, p), high: Math.max(point1.price, p), direction: real.direction });
      setDrawAnchors(null);
    }
    setPhase('sniper_confirm');
  };

  const accuracy = drawAnchors ? lineAccuracy(rt, drawAnchors) : drawZone ? zoneAccuracy(drawZone, rt.cfg.zones![0]) : 0;
  const accurateEnough = accuracy >= SNIPER_MIN_ACCURACY;
  const redraw = () => { setPoint1(null); setDrawZone(null); setDrawAnchors(null); setPhase('sniper_p1'); };
  const confirmSniper = () => {
    reward.win();
    setSniper({ zone: drawZone ?? undefined, anchors: drawAnchors ?? undefined, accuracy });
    setPoint1(null);
    setPhase('play');
  };

  /* ---------- Rendu ---------- */
  const st = sessionStats(s);
  const patternLabel = t(`pat_${level.strategyId}`);
  const chipText = hud.key ? (hud.text ? `${t(hud.key)} ${hud.text}` : t(hud.key)) : hud.text ?? '';
  const showPanels = phase === 'play' || s.status !== 'idle';

  return (
    <Screen>
      <HudBar compact liveDelta={livePnl} />
      <TopBar
        title={name}
        onBack={requestExit}
        right={phase === 'play' && s.status !== 'ended' ? (
          <View style={styles.ctrl}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('play_speed')} onPress={() => { reward.tap(); setSpeed((v) => SPEEDS[(SPEEDS.indexOf(v) + 1) % SPEEDS.length]); }} style={styles.pill}>
              <Text style={styles.pillText}>×{speed}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={s.status === 'paused' ? t('play_resume') : t('play_pause')} onPress={() => { reward.tap(); dispatch({ type: s.status === 'paused' ? 'resume' : 'pause' }); }} style={styles.pill}>
              <Text style={styles.pillText}>{s.status === 'paused' ? '▶' : '⏸'}</Text>
            </Pressable>
          </View>
        ) : null}
      />

      {game.balance <= 0 && <View style={styles.broke}><Text style={styles.brokeText}>{t('play_broke_banner')}</Text></View>}

      {drawing && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {rt.cfg.mode === 'trendzone' ? t(phase === 'sniper_p1' ? 'sniper_step1_trend' : 'sniper_step2_trend') : t(phase === 'sniper_p1' ? 'sniper_step1_zone' : 'sniper_step2_zone')}
          </Text>
        </View>
      )}

      <View style={styles.chips}>
        <Text style={styles.chip}>{chipText}</Text>
        <Text style={[styles.chip, hud.locked && styles.chipOn]}>{hud.locked ? t('hud_target_locked') : t('hud_out_of_zone')}</Text>
        {s.combo >= 2 && <Text style={[styles.chip, { color: COLORS.warn, borderColor: COLORS.warn }]}>🔥 {t('combo_x', { n: s.combo })}</Text>}
        {sniperActive && <Text style={[styles.chip, styles.chipOn]}>{t('sniper_badge')}</Text>}
        {s.status === 'paused' && <Text style={[styles.chip, { color: COLORS.warn, borderColor: COLORS.warn }]}>{t('play_paused')}</Text>}
      </View>

      <View style={styles.priceRow}>
        <Text style={styles.price}>{price.toFixed(2)}</Text>
        {s.position ? (
          <View style={styles.posRow}>
            <Text style={[styles.pnl, { color: livePnl >= 0 ? COLORS.bull : COLORS.bear }]}>
              {s.position.type === 'buy' ? t('play_buy') : t('play_sell')} · {money(livePnl, true)}
            </Text>
            <Text style={[styles.verdict, { color: s.position.compliant ? COLORS.bull : COLORS.bear }]}>
              {s.position.compliant ? `✓ ${t('entry_ok')}` : `✕ ${t(`why_${s.position.reason}`)}`}
            </Text>
          </View>
        ) : null}
      </View>

      <Animated.View style={{ alignSelf: 'center', width: chartW, transform: [{ translateX: shake.x }] }}>
        <View style={styles.frame}>
          <Chart
            rt={rt} state={s} width={chartW} height={CHART_H} preview={inSniperPhase} hideAnswer={sniperActive} opts={opts}
            locked={hud.locked && !inSniperPhase} lockedLabel={t('hud_target_locked')} patternLabel={patternLabel}
            playerZone={drawZone ?? sniper?.zone ?? null} playerAnchors={drawAnchors ?? sniper?.anchors ?? null} point1={point1}
          />
          {drawing && <View style={FILL} onStartShouldSetResponder={() => true} onResponderRelease={onTap} accessibilityLabel={t('sniper_step1_zone')} />}
          <Burst trigger={coins} kind="coins" count={18} />
          <Burst trigger={confetti} kind="confetti" count={30} />
        </View>
        {showPanels && !inSniperPhase && rt.cfg.mode === 'indicator' && <IndicatorPanel rt={rt} closed={s.closed} width={chartW} />}
        {showPanels && !inSniperPhase && (rt.cfg.showVolume || rt.cfg.mode === 'vwap') && <VolumePanel rt={rt} closed={s.closed} width={chartW} />}
      </Animated.View>

      <View style={{ flex: 1 }} />

      {fb && <TradeFeedback key={fb.id} data={fb} onDone={() => setFb((x) => (x && x.id === fb.id ? null : x))} />}

      <Text style={styles.rule} numberOfLines={2} onPress={() => setShowInfo(true)} accessibilityRole="button">ⓘ {rulesLabel(rt, t)}</Text>

      <View style={styles.actions}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('play_rules')} onPress={() => { reward.tap(); setShowInfo(true); }} style={styles.info}>
          <Text style={{ color: COLORS.text, fontSize: 16 }}>ⓘ</Text>
        </Pressable>
        <Btn silent label={t('play_buy')} variant="bull" disabled={!canTrade} onPress={() => open('buy')} style={{ flex: 1 }} />
        <Btn silent label={t('play_sell')} variant="bear" disabled={!canTrade} onPress={() => open('sell')} style={{ flex: 1 }} />
        <Btn silent label={t('play_close_trade')} variant="ghost" disabled={!s.position || s.status === 'idle'} onPress={() => dispatch({ type: 'close' })} style={{ flex: 1 }} textStyle={{ fontSize: 12 }} />
      </View>

      {showInfo && (
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>{t('play_rules')}</Text>
          <Text style={styles.ruleLine}>• {rulesLabel(rt, t)}</Text>
          {rt.cfg.mode === 'zone' && <Text style={styles.ruleLine}>• {t('rule_touches', { n: rt.touchesRequired })}</Text>}
          {['indicator', 'band', 'ma', 'vwap'].includes(rt.cfg.mode) && <Text style={styles.ruleDim}>{t('rule_simplified')}</Text>}
          <Text style={styles.sheetTitle}>{t('play_trades')} ({s.trades.length})</Text>
          {s.trades.length === 0 ? <Text style={styles.ruleDim}>—</Text> : s.trades.map((tr, i) => (
            <Text key={i} style={{ color: tr.compliant ? COLORS.bull : COLORS.bear, fontSize: 12, marginBottom: 3 }}>
              {tr.compliant ? '✓' : '✕'} {money(tr.pnl, true)} — {t(`why_${tr.reason}`)}
            </Text>
          ))}
          <Btn label={t('play_close')} onPress={() => setShowInfo(false)} style={{ marginTop: 10 }} />
        </View>
      )}

      {phase === 'tour' && <TourOverlay onFinish={finishTour} />}

      {phase === 'sniper_intro' && (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.sheetTitle}>{t('sniper_intro_title')}</Text>
            <Text style={styles.cardTitle}>{name}</Text>
            <Text style={styles.cardText}>{t('sniper_intro_text')}</Text>
            <Btn label={t('sniper_intro_button')} onPress={() => setPhase('sniper_p1')} />
          </View>
        </View>
      )}

      {phase === 'sniper_confirm' && (
        <View style={styles.confirm}>
          <Text style={styles.confirmTitle}>{t('sniper_accuracy', { pct: Math.round(accuracy * 100) })}</Text>
          <Text style={styles.confirmText}>{accurateEnough ? t('sniper_confirm_text') : t(drawAnchors ? 'sniper_off_line' : 'sniper_off_zone')}</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignSelf: 'stretch' }}>
            <Btn variant="ghost" label={t('sniper_redraw')} onPress={redraw} style={{ flex: 1 }} />
            {accurateEnough && <Btn label={t('sniper_confirm_button')} onPress={confirmSniper} style={{ flex: 1 }} />}
          </View>
        </View>
      )}

      {confirmExit && (
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('exit_title')}</Text>
            <Text style={styles.cardText}>{s.position ? t('exit_text_open') : t('exit_text')}</Text>
            <Btn label={t('exit_continue')} onPress={() => { setConfirmExit(false); dispatch({ type: 'resume' }); }} />
            <Btn variant="ghost" label={t('exit_quit')} onPress={quit} style={{ marginTop: 8 }} />
          </View>
        </View>
      )}

      {result && (
        <ResultOverlay
          title={name}
          passed={result.passed}
          stars={result.stars}
          xp={result.xp}
          improved={result.improved}
          stats={[
            { label: t('play_discipline'), value: `${st.discipline}%`, color: COLORS.gold },
            { label: t('play_result'), value: money(st.net, true), color: st.net >= 0 ? COLORS.bull : COLORS.bear },
            { label: t('play_trades_count'), value: String(st.count) },
          ]}
          note={st.count === 0 ? t('result_no_trade') : undefined}
          onReplay={replay}
          onNext={goNext}
          onMap={() => router.replace('/map')}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  ctrl: { flexDirection: 'row', gap: 6 },
  pill: { minWidth: 34, height: 30, paddingHorizontal: 8, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.panel },
  pillText: { color: COLORS.text, fontSize: 12, fontWeight: '800' },
  broke: { backgroundColor: '#1F1420', borderColor: COLORS.bear, borderWidth: 1, marginHorizontal: 14, borderRadius: RADIUS.sm, padding: 8, marginBottom: 6 },
  brokeText: { color: COLORS.bear, fontSize: 12, textAlign: 'center' },
  banner: { backgroundColor: COLORS.panel, borderColor: COLORS.gold, borderWidth: 1, marginHorizontal: 14, borderRadius: RADIUS.sm, padding: 8, marginBottom: 6 },
  bannerText: { color: COLORS.gold, fontSize: 12, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, marginBottom: 6 },
  chip: { color: COLORS.dim, fontSize: 11, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.pill, paddingHorizontal: 9, paddingVertical: 3, overflow: 'hidden' },
  chipOn: { color: COLORS.gold, borderColor: COLORS.gold },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 6, minHeight: 34 },
  price: { color: COLORS.text, fontSize: 22, fontWeight: '800' },
  posRow: { alignItems: 'flex-end' },
  pnl: { fontSize: 14, fontWeight: '800' },
  verdict: { fontSize: 11, marginTop: 1, fontWeight: '700' },
  frame: { borderWidth: 1, borderColor: COLORS.line, overflow: 'hidden', borderRadius: 4 },
  rule: { color: COLORS.dim, fontSize: 12, lineHeight: 16, paddingHorizontal: 16, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 6, padding: 10, borderTopWidth: 1, borderTopColor: COLORS.line, backgroundColor: COLORS.panel },
  info: { width: 42, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.md },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: COLORS.panel, padding: 16, paddingBottom: 24, borderTopWidth: 1, borderTopColor: COLORS.line, zIndex: 20 },
  sheetTitle: { color: COLORS.dim, fontSize: 10, letterSpacing: 1, marginTop: 8, marginBottom: 6 },
  ruleLine: { color: COLORS.text, fontSize: 13, marginBottom: 4, lineHeight: 18 },
  ruleDim: { color: COLORS.dim, fontSize: 11, marginBottom: 4, fontStyle: 'italic' },
  overlay: { ...FILL, backgroundColor: 'rgba(10,11,22,0.94)', alignItems: 'center', justifyContent: 'center', padding: 24, zIndex: 30 },
  card: { width: '100%', maxWidth: 400, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: RADIUS.lg, padding: 22 },
  cardTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  cardText: { color: COLORS.dim, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  confirm: { position: 'absolute', left: 14, right: 14, bottom: 96, backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.gold, borderRadius: RADIUS.md, padding: 14, alignItems: 'center', zIndex: 15 },
  confirmTitle: { color: COLORS.gold, fontSize: 15, fontWeight: '800', marginBottom: 4 },
  confirmText: { color: COLORS.text, fontSize: 12, textAlign: 'center', marginBottom: 10 },
});
