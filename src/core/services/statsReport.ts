import type { Counts } from './analytics';

/** Lecture sûre d'un compteur imbriqué. */
export function num(c: Counts | undefined, ...path: (string | number)[]): number {
  let node: number | Counts | undefined = c;
  for (const k of path) {
    if (node === undefined || typeof node === 'number') return 0;
    node = node[String(k)];
  }
  return typeof node === 'number' ? node : 0;
}

const TRACKS = ['new', 'debutant', 'intermediaire', 'avance'] as const;
export const TRACK_LABEL: Record<(typeof TRACKS)[number], string> = { new: 'Sans profil', debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)} %` : '–');
const sumTour = (c: Counts | undefined, step: string) => TRACKS.reduce((n, t) => n + num(c, 'c', 'tour', step, t), 0);
const sumTracks = (c: Counts | undefined, ev: string) => TRACKS.reduce((n, t) => n + num(c, 'c', ev, t), 0);

const SOURCE_LABEL = { friend: 'ami/famille', tiktok: 'TikTok', facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube', whatsapp: 'WhatsApp/Telegram', store: 'Play Store', other: 'autre', social: 'réseaux sociaux (ancien choix)' } as const;
const SOURCE_KEYS = Object.keys(SOURCE_LABEL) as (keyof typeof SOURCE_LABEL)[];

export interface Section { title: string; lines: string[] }

/** Rapport en texte lisible (affiché dans l'écran et partageable). Toutes les valeurs viennent des compteurs, rien n'est deviné. */
export function buildReport(s: Counts): Section[] {
  const out: Section[] = [];
  const cohort = num(s, 'cohort', 'n');
  out.push({
    title: 'Joueurs (depuis la mise à jour)',
    lines: [
      `Nouveaux joueurs comptés : ${cohort}`,
      `Reviennent à J1 : ${num(s, 'ret', 'd1')} (${pct(num(s, 'ret', 'd1'), cohort)})`,
      `Reviennent à J7 : ${num(s, 'ret', 'd7')} (${pct(num(s, 'ret', 'd7'), cohort)})`,
      `Reviennent à J30 : ${num(s, 'ret', 'd30')} (${pct(num(s, 'ret', 'd30'), cohort)})`,
      `Ouvertures de l'app : ${sumTracks(s, 'open')}`,
      'Petit échantillon : à lire comme des tendances, pas des certitudes.',
    ],
  });

  const place = (t: string) => num(s, 'diag', 'place', t);
  const scores = [0, 1, 2, 3, 4, 5, 6, 7].map((n) => `${n}:${num(s, 'diag', 'score', n)}`).join('  ');
  const RET_DAYS = ['d1', 'd7', 'd30'] as const;
  const retLine = (label: string, size: number, get: (d: (typeof RET_DAYS)[number]) => number) =>
    `${label} : ${size} joueur${size > 1 ? 's' : ''} · ${RET_DAYS.map((d) => `${d.toUpperCase()} ${get(d)} (${pct(get(d), size)})`).join(' · ')}${size < 30 ? ' · peu de joueurs : tendance seulement' : ''}`;

  const bySrc = Object.keys(SOURCE_LABEL).concat(['skip', 'unknown', 'none']);
  const srcLabel = (k: string) => (k in SOURCE_LABEL ? SOURCE_LABEL[k as keyof typeof SOURCE_LABEL] : k === 'skip' ? 'question passée' : k === 'unknown' ? 'déjà installés avant la question' : 'pas encore répondu');
  const knownSrc = bySrc.filter((k) => k !== 'none').reduce((n, k) => n + num(s, 'cohort', 'src', k), 0);
  const srcRows = bySrc
    .map((k) => ({ k, size: k === 'none' ? Math.max(0, cohort - knownSrc) : num(s, 'cohort', 'src', k) }))
    .filter((r) => r.size > 0 || RET_DAYS.some((d) => num(s, 'ret', 'src', d, r.k) > 0))
    .sort((a, b) => b.size - a.size)
    .map((r) => retLine(srcLabel(r.k), r.size, (d) => num(s, 'ret', 'src', d, r.k)));
  out.push({
    title: 'Rétention par provenance',
    lines: [
      'Chaque ligne : joueurs arrivés par cette source, et combien sont revenus exactement 1, 7 et 30 jours après leur premier jour.',
      ...(srcRows.length ? srcRows : ['Pas encore de données.']),
    ],
  });

  const trkRows = (['debutant', 'intermediaire', 'avance'] as const)
    .map((t) => ({ t, size: num(s, 'cohort', 'trk', t) }))
    .filter((r) => r.size > 0 || RET_DAYS.some((d) => num(s, 'ret', 'trk', d, r.t) > 0))
    .map((r) => retLine(TRACK_LABEL[r.t], r.size, (d) => num(s, 'ret', 'trk', d, r.t)));
  out.push({ title: 'Rétention par profil', lines: trkRows.length ? trkRows : ['Pas encore de données.'] });

  // Défi du jour : entonnoir (vu → commencé → terminé → partagé) et rétention de ceux qui l'ont fait.
  const dv = (st: string) => TRACKS.reduce((n, t) => n + num(s, 'c', 'daily_view', st, t), 0);
  const dStart = sumTracks(s, 'daily_start');
  const dDone = sumTracks(s, 'daily_done');
  const dShare = sumTracks(s, 'daily_share');
  const dQuit = (w: string) => TRACKS.reduce((n, t) => n + num(s, 'c', 'daily_quit', w, t), 0);
  const dlyYes = num(s, 'cohort', 'dly', 'yes');
  const dlyNo = Math.max(0, cohort - dlyYes);
  out.push({
    title: 'Défi du jour',
    lines: [
      `Carte vue : prête ${dv('ready')} · terminée ${dv('done')} · verrouillée ${dv('locked')}`,
      `Commencés : ${dStart} · validés : ${dDone} (${pct(dDone, dStart)} des commencés) · partagés : ${dShare} (${pct(dShare, dDone)} des validés)`,
      `Abandons : avant tout trade ${dQuit('before_trade')} · après un trade ${dQuit('after_trade')}`,
      `Discipline des défis validés : ${[0, 25, 50, 75, 100].map((b) => `${b === 100 ? '100' : `${b}-${b + 24}`} % : ${num(s, 'c', 'daily_disc', b)}`).join(' · ')}`,
      `Séries atteintes : ${[3, 7, 14, 30].map((n) => `${n} j : ${num(s, 'c', 'daily_streak', n)}`).join(' · ')}`,
      `Rappel quotidien : activé ${TRACKS.reduce((n, t) => n + num(s, 'c', 'daily_rem', 'on', t), 0)} · coupé ${TRACKS.reduce((n, t) => n + num(s, 'c', 'daily_rem', 'off', t), 0)}`,
    ],
  });
  out.push({
    title: 'Rétention : ont-ils fait le défi ?',
    lines: [
      'À lire avec prudence : ceux qui font le défi sont déjà les plus motivés (ce n’est pas une preuve que le défi crée la rétention).',
      retLine('A fait au moins un défi', dlyYes, (d) => num(s, 'ret', 'dly', d, 'yes')),
      retLine('N’a fait aucun défi', dlyNo, (d) => num(s, 'ret', 'dly', d, 'no')),
    ],
  });

  out.push({
    title: 'Accueil et test de niveau',
    lines: [
      `Test commencé : ${sumTracks(s, 'diag_start')} · terminé : ${TRACKS.reduce((n, t) => n + place(t), 0)}`,
      `« Je débute totalement » : ${num(s, 'c', 'beginner_pick', 'new')}`,
      `Placés : débutant ${place('debutant')} · intermédiaire ${place('intermediaire')} · avancé ${place('avance')}`,
      `Scores (bonnes réponses : joueurs) : ${scores}`,
      ...['candle', 'support', 'pnl', 'rr', 'drawdown', 'expectancy', 'streak'].map(
        (q) => `Question ${q} : ${num(s, 'dq', q, 'right')} juste · ${num(s, 'dq', q, 'wrong')} faux · ${num(s, 'dq', q, 'skip')} « je ne sais pas »`,
      ),
    ],
  });

  out.push({
    title: 'Provenance et Leçon 0',
    lines: [
      `Provenance (réponses) : ${(['friend', 'tiktok', 'facebook', 'instagram', 'youtube', 'whatsapp', 'store', 'other', 'social'] as const).map((k) => `${SOURCE_LABEL[k]} ${num(s, 'c', 'source', k)}`).join(' · ')}`,
      `Question de provenance passée : ${num(s, 'c', 'source', 'skip')} (sur ${SOURCE_KEYS.reduce((n, k) => n + num(s, 'c', 'source', k), 0) + num(s, 'c', 'source', 'skip')} nouveaux joueurs)`,
      `Leçon 0 : commencée ${sumTracks(s, 'lesson_start')} · terminée ${sumTracks(s, 'lesson_done')} · passée ${sumTracks(s, 'lesson_skip')}`,
      `Tutoriel guidé (joueurs arrivés à chaque étape) : ${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `${n}:${sumTour(s, String(n))}`).join('  ')} · terminé ${sumTour(s, 'done')} · passé ${sumTour(s, 'skip')}`,
      `Scores de la leçon (bonnes réponses : joueurs) : ${[0, 1, 2, 3].map((n) => `${n}:${num(s, 'c', 'lesson_score', n)}`).join('  ')}`,
    ],
  });

  const funnel: string[] = [];
  for (const t of TRACKS) {
    const starts = num(s, 'c', 'level_start', t);
    const ends = num(s, 'c', 'level_end', t);
    if (!num(s, 'c', 'open', t) && !starts) continue;
    funnel.push(
      `${TRACK_LABEL[t]} : ${starts} niveaux lancés · ${num(s, 'c', 'trade', t)} trades · ${ends} terminés (${pct(num(s, 'c', 'level_pass', t), ends)} réussis) · ${num(s, 'c', 'level_quit', t)} abandons (${pct(num(s, 'c', 'level_quit', t), starts)} des lancés)`,
      `   capital épuisé ${num(s, 'c', 'broke', t)} · recharges ${num(s, 'c', 'refill', t)} · vitesse ×0,5 ${num(s, 'spd', '0_5', t)} / ×1 ${num(s, 'spd', '1', t)} / ×2 ${num(s, 'spd', '2', t)} / ×4 ${num(s, 'spd', '4', t)}`,
    );
  }
  out.push({ title: 'Parcours par profil', lines: funnel.length ? funnel : ['Pas encore de données.'] });

  const levels: string[] = [];
  const lv = (s.lv && typeof s.lv === 'object' ? s.lv : {}) as Counts;
  Object.keys(lv).map(Number).filter(Number.isFinite).sort((a, b) => a - b).forEach((id) => {
    const start = num(s, 'lv', id, 'start');
    const end = num(s, 'lv', id, 'end');
    const quit = num(s, 'lv', id, 'quit');
    const easy = num(s, 'diff', id, 'easy');
    const ok = num(s, 'diff', id, 'ok');
    const hard = num(s, 'diff', id, 'hard');
    const avgDisc = end > 0 ? `${Math.round(num(s, 'lv', id, 'disc') / end)} %` : '–';
    levels.push(`Niveau ${id} : ${start} lancés · ${end} finis · réussite ${pct(num(s, 'lv', id, 'pass'), end)} · abandons ${quit} · discipline moy. ${avgDisc} · avis facile/ok/dur ${easy}/${ok}/${hard}`);
  });
  out.push({ title: 'Par niveau', lines: levels.length ? levels : ['Pas encore de données.'] });

  const why = (s.why && typeof s.why === 'object' ? s.why : {}) as Counts;
  const errors = Object.keys(why)
    .filter((k) => !k.startsWith('ok_'))
    .map((k) => ({ k, n: TRACKS.reduce((n, t) => n + num(s, 'why', k, t), 0) }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 8);
  out.push({ title: 'Erreurs les plus fréquentes (trades hors règle)', lines: errors.length ? errors.map((e) => `${e.k} : ${e.n}`) : ['Pas encore de données.'] });
  return out;
}

export const reportToText = (sections: Section[]): string =>
  sections.map((sec) => `${sec.title}\n${sec.lines.join('\n')}`).join('\n\n');
