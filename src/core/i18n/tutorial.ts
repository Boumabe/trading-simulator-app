import type { Lang } from '../types';

/** Tutoriel guidé des débutants (8 étapes sur les vrais éléments de l'écran de jeu) et libellé de zone du graphique. */
export const TUTORIAL_TEXT: Record<Lang, Record<string, string>> = {
  "fr": {
    "chart_zone": "ZONE",
    "tut_1_t": "Le prix en direct",
    "tut_1_d": "Voici le prix de l’actif en ce moment. Dès que tu démarres, il bouge tout seul : le marché n’attend pas.",
    "tut_2_t": "Les bougies",
    "tut_2_d": "Chaque bougie résume une période. Verte : le prix a monté. Rouge : il a baissé. L’échelle à droite donne les prix ; les repères colorés (zone, lignes) montrent ce qu’il faut surveiller.",
    "tut_3_t": "La règle du niveau",
    "tut_3_d": "Ici s’affiche la règle à respecter. Tu n’entres que quand elle est remplie : c’est ça que Simtra t’apprend.",
    "tut_4_t": "Acheter",
    "tut_4_d": "Tu paries que le prix va monter. Tu gagnes si, quand tu clôtures, il est plus haut qu’à ton entrée.",
    "tut_5_t": "Vendre",
    "tut_5_d": "Tu paries que le prix va baisser. Tu gagnes si, quand tu clôtures, il est plus bas qu’à ton entrée.",
    "tut_6_t": "Clôturer",
    "tut_6_d": "Tu fermes ta position. Simtra te dit alors si ton entrée respectait la règle.",
    "tut_7_t": "Ton capital",
    "tut_7_d": "Entrée conforme : +{bonus} $ de discipline, même si le trade perd. Entrée hors règle : −{penalty} $. La méthode compte plus que le gain.",
    "tut_8_t": "Pause et vitesse",
    "tut_8_d": "Tu peux mettre en pause ou changer la vitesse quand tu veux. Pas de stress : ici, on apprend."
  },
  "en": {
    "chart_zone": "ZONE",
    "tut_1_t": "The live price",
    "tut_1_d": "This is the asset’s price right now. Once you start, it moves on its own: the market won’t wait.",
    "tut_2_t": "The candles",
    "tut_2_d": "Each candle sums up a period. Green: price went up. Red: it went down. The scale on the right shows prices; the coloured marks (zone, lines) show what to watch.",
    "tut_3_t": "The level’s rule",
    "tut_3_d": "The rule to follow is shown here. You only enter when it is met: that is what Simtra teaches you.",
    "tut_4_t": "Buy",
    "tut_4_d": "You bet the price will go up. You win if, when you close, it is higher than at your entry.",
    "tut_5_t": "Sell",
    "tut_5_d": "You bet the price will go down. You win if, when you close, it is lower than at your entry.",
    "tut_6_t": "Close",
    "tut_6_d": "You close your position. Simtra then tells you whether your entry followed the rule.",
    "tut_7_t": "Your balance",
    "tut_7_d": "Compliant entry: +${bonus} discipline bonus, even if the trade loses. Off-rule entry: −${penalty}. Method matters more than profit.",
    "tut_8_t": "Pause and speed",
    "tut_8_d": "You can pause or change the speed whenever you want. No stress: here, you learn."
  },
  "es": {
    "chart_zone": "ZONA",
    "tut_1_t": "El precio en vivo",
    "tut_1_d": "Este es el precio del activo ahora. Cuando empiezas, se mueve solo: el mercado no espera.",
    "tut_2_t": "Las velas",
    "tut_2_d": "Cada vela resume un periodo. Verde: el precio subió. Roja: bajó. La escala de la derecha muestra los precios; las marcas de color (zona, líneas) muestran qué vigilar.",
    "tut_3_t": "La regla del nivel",
    "tut_3_d": "Aquí aparece la regla que debes seguir. Solo entras cuando se cumple: eso es lo que te enseña Simtra.",
    "tut_4_t": "Comprar",
    "tut_4_d": "Apuestas a que el precio subirá. Ganas si, al cerrar, está más alto que en tu entrada.",
    "tut_5_t": "Vender",
    "tut_5_d": "Apuestas a que el precio bajará. Ganas si, al cerrar, está más bajo que en tu entrada.",
    "tut_6_t": "Cerrar",
    "tut_6_d": "Cierras tu posición. Simtra te dice entonces si tu entrada cumplía la regla.",
    "tut_7_t": "Tu capital",
    "tut_7_d": "Entrada conforme: +{bonus} $ de disciplina, aunque la operación pierda. Fuera de la regla: −{penalty} $. El método importa más que la ganancia.",
    "tut_8_t": "Pausa y velocidad",
    "tut_8_d": "Puedes pausar o cambiar la velocidad cuando quieras. Sin estrés: aquí se aprende."
  }
};
