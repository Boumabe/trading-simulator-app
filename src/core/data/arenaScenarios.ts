import type { Lang } from '../types';

/**
 * Traductions des cartes du jeu Arena, par langue (le français est dans le jeu lui-même).
 * Clé = position de la carte : 0 = didacticiel, 1-2 = pauses, 3 + n = n-ième scénario.
 * Format : [question, choix gauche, retour gauche, choix droit, retour droit, leçon?, libellé du graphique?].
 * Une carte absente reste en français : ajouter les lots suivants ici.
 */
export const ARENA_TX: Record<Lang, Record<number, (string | null)[]>> = {
  fr: {},
  en: {
    0: ["Welcome to the trading room. Swipe left or right. Here, time is frozen.", "← Left", "Every decision has a price.", "Right →", "Even doing nothing."],
    1: ["Break between two sessions. The market is quiet, time stands still.", "Re-read your plan", "The rules are fresh.", "Walk for 5 minutes", "Your mind clears."],
    2: ["Journal: you note your last three mistakes.", "Accept them", "Name them and they weigh less.", "Ignore them", "Relief… but short-lived."],
  },
  es: {
    0: ["Bienvenido a la sala de mercado. Desliza a izquierda o derecha. Aquí, el tiempo está detenido.", "← Izquierda", "Cada decisión tiene un precio.", "Derecha →", "Incluso no hacer nada."],
    1: ["Pausa entre dos sesiones. El mercado está en calma, el tiempo se detiene.", "Releer tu plan", "Las reglas están frescas.", "Caminar 5 minutos", "La cabeza se despeja."],
    2: ["Diario: anotas tus tres últimos errores.", "Aceptarlas", "Si las nombras, pesan menos.", "Ignorarlas", "Alivio… pasajero."],
  },
};
