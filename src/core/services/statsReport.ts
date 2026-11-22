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
      `Provenance : amis ${num(s, 'c', 'source', 'friend')} · réseaux sociaux ${num(s, 'c', 'source', 'social')} · Play Store ${num(s, 'c', 'source', 'store')} · autre ${num(s, 'c', 'source', 'other')}`,
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
