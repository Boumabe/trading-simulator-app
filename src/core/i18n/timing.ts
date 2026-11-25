import type { Lang } from '../types';

/** Textes de règles des zones (nombre de contacts exact, zone tracée après le motif) et pastille « observe la formation ». Fusionné en dernier : remplace les anciens textes. */
export const TIMING_TEXT: Record<Lang, Record<string, string>> = {
  "fr": {
    "hud_watching": "Observe la formation…",
    "rule_zone_single_1": "Attends que le prix touche la zone, puis {action} {side}.",
    "rule_zone_single": "Attends {n} contacts confirmés sur la zone, puis {action} {side}.",
    "rule_zone_multi_1": "Attends que le prix touche l’une des zones marquées avant d’entrer.",
    "rule_zone_multi": "Attends {n} contacts confirmés sur l’une des zones marquées avant d’entrer.",
    "rule_zone_formed": "La zone se trace une fois le motif formé. Quand elle apparaît, attends que le prix y revienne, puis {action} {side}.",
    "rule_zone_formed_multi": "Les zones se tracent une fois le motif formé. Quand elles apparaissent, attends que le prix y revienne avant d’entrer.",
    "rule_trendzone_formed": "La ligne de tendance se trace une fois ses points formés. Quand elle apparaît, {action} quand le prix la touche."
  },
  "en": {
    "hud_watching": "Watch it form…",
    "rule_zone_single_1": "Wait for price to touch the zone, then {action} {side}.",
    "rule_zone_single": "Wait for {n} confirmed touches on the zone, then {action} {side}.",
    "rule_zone_multi_1": "Wait for price to touch one of the marked zones before entering.",
    "rule_zone_multi": "Wait for {n} confirmed touches on one of the marked zones before entering.",
    "rule_zone_formed": "The zone is drawn once the pattern has formed. When it appears, wait for price to come back to it, then {action} {side}.",
    "rule_zone_formed_multi": "The zones are drawn once the pattern has formed. When they appear, wait for price to come back to them before entering.",
    "rule_trendzone_formed": "The trendline is drawn once its points have formed. When it appears, {action} when price touches it."
  },
  "es": {
    "hud_watching": "Observa la formación…",
    "rule_zone_single_1": "Espera a que el precio toque la zona y luego {action} {side}.",
    "rule_zone_single": "Espera {n} toques confirmados en la zona y luego {action} {side}.",
    "rule_zone_multi_1": "Espera a que el precio toque una de las zonas marcadas antes de entrar.",
    "rule_zone_multi": "Espera {n} toques confirmados en una de las zonas marcadas antes de entrar.",
    "rule_zone_formed": "La zona se traza cuando el patrón ya se ha formado. Cuando aparece, espera a que el precio vuelva a ella y luego {action} {side}.",
    "rule_zone_formed_multi": "Las zonas se trazan cuando el patrón ya se ha formado. Cuando aparecen, espera a que el precio vuelva a ellas antes de entrar.",
    "rule_trendzone_formed": "La línea de tendencia se traza cuando ya están sus puntos. Cuando aparece, {action} cuando el precio la toque."
  }
};
