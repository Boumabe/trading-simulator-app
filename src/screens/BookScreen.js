import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import Diagram from "../components/BookDiagrams";
import COLORS from "../constants/palette";
import { useLang } from "../i18n";

function loc(val, lang) {
  if (val && typeof val === "object" && !Array.isArray(val)) return val[lang] || val.fr;
  return val;
}

const STRATEGIES = [
  { id: "support", tier: "PALIER 1", diagram: "support",
    title: { fr: "Support", en: "Support", es: "Soporte" },
    def: { fr: "Niveau de prix où la demande se concentre, provoquant un rebond répété vers le haut.", en: "Price level where demand concentrates, causing a repeated bounce upward.", es: "Nivel de precio donde se concentra la demanda, provocando un rebote repetido hacia arriba." },
    points: { fr: ["Valide si une mèche touche sans clôturer en dessous", "2 touches minimum confirment le niveau"], en: ["Valid if a wick touches without closing below", "2 touches minimum confirm the level"], es: ["Válido si una mecha toca sin cerrar por debajo", "2 toques mínimo confirman el nivel"] } },
  { id: "resistance", tier: "PALIER 1", diagram: "resistance",
    title: { fr: "Résistance", en: "Resistance", es: "Resistencia" },
    def: { fr: "Niveau de prix où l'offre se concentre, provoquant un rejet répété vers le bas.", en: "Price level where supply concentrates, causing a repeated rejection downward.", es: "Nivel de precio donde se concentra la oferta, provocando un rechazo repetido hacia abajo." },
    points: { fr: ["Valide si une mèche touche sans clôturer au-dessus", "2 touches minimum confirment le niveau"], en: ["Valid if a wick touches without closing above", "2 touches minimum confirm the level"], es: ["Válido si una mecha toca sin cerrar por encima", "2 toques mínimo confirman el nivel"] } },
  { id: "trend", tier: "PALIER 1", diagram: "trend",
    title: { fr: "Tendance & Structure", en: "Trend & Structure", es: "Tendencia y Estructura" },
    def: { fr: "Succession de sommets et creux plus hauts (haussier) ou plus bas (baissier) qui indique la direction dominante.", en: "A succession of higher highs and higher lows (bullish) or lower highs and lower lows (bearish) that shows the dominant direction.", es: "Sucesión de máximos y mínimos cada vez más altos (alcista) o más bajos (bajista) que indica la dirección dominante." },
    points: { fr: ["HH/HL = structure haussière", "LH/LL = structure baissière"], en: ["HH/HL = bullish structure", "LH/LL = bearish structure"], es: ["HH/HL = estructura alcista", "LH/LL = estructura bajista"] } },
  { id: "trendline", tier: "PALIER 1", diagram: "trendline",
    title: { fr: "Lignes de tendance", en: "Trendlines", es: "Líneas de tendencia" },
    def: { fr: "Droite reliant au moins deux creux ou deux sommets pour visualiser la structure.", en: "A line connecting at least two lows or two highs to visualize the structure.", es: "Línea que une al menos dos mínimos o dos máximos para visualizar la estructura." },
    points: { fr: ["3 points alignés = ligne plus fiable", "Ne doit pas couper les corps des bougies"], en: ["3 aligned points = more reliable line", "Should not cut through candle bodies"], es: ["3 puntos alineados = línea más fiable", "No debe cortar los cuerpos de las velas"] } },
  { id: "channel", tier: "PALIER 1", diagram: "channel",
    title: { fr: "Canaux de prix", en: "Price Channels", es: "Canales de precio" },
    def: { fr: "Deux lignes parallèles encadrant le prix entre un support et une résistance dynamiques.", en: "Two parallel lines framing the price between a dynamic support and resistance.", es: "Dos líneas paralelas que enmarcan el precio entre un soporte y una resistencia dinámicos." },
    points: { fr: ["Achat près du bas du canal", "Vente près du haut du canal"], en: ["Buy near the bottom of the channel", "Sell near the top of the channel"], es: ["Compra cerca de la parte baja del canal", "Vende cerca de la parte alta del canal"] } },
  { id: "breakout", tier: "PALIER 1", diagram: "breakout",
    title: { fr: "Breakout & Retest", en: "Breakout & Retest", es: "Ruptura y Reprueba" },
    def: { fr: "Sortie du prix hors d'une zone, suivie d'un retour tester cette même zone avant de continuer.", en: "Price breaking out of a zone, followed by a return to retest that same zone before continuing.", es: "Salida del precio de una zona, seguida de un regreso para reprobar esa misma zona antes de continuar." },
    points: { fr: ["Le retest confirme la cassure", "Volume plus fort = cassure plus fiable"], en: ["The retest confirms the breakout", "Stronger volume = more reliable breakout"], es: ["La reprueba confirma la ruptura", "Mayor volumen = ruptura más fiable"] } },
  { id: "pinbar", tier: "PALIER 2", title: "Pin bar / Marteau", diagram: "pinbar", def: "Bougie à petit corps et longue mèche, signe d'un rejet fort d'un niveau de prix.", points: ["Mèche 2-3x plus longue que le corps", "Plus fiable sur une zone déjà connue"] },
  { id: "engulfing", tier: "PALIER 2", title: "Engulfing", diagram: "engulfing", def: "Bougie dont le corps englobe entièrement le corps de la précédente, signalant un retournement.", points: ["Plus efficace en fin de tendance", "Confirmé si le volume augmente"] },
  { id: "doji", tier: "PALIER 2", title: "Doji", diagram: "doji", def: "Bougie où l'ouverture et la clôture sont quasiment identiques, formant un corps minuscule — signe d'indécision entre acheteurs et vendeurs.", points: ["Plus significatif après une tendance marquée", "Souvent suivi d'un retournement ou d'une pause"] },
  { id: "morningstar", tier: "PALIER 2", title: "Étoile du matin / du soir", diagram: "morningstar", def: "Figure de 3 bougies annonçant un retournement : une grande bougie dans le sens de la tendance, une petite bougie d'indécision, puis une grande bougie inverse qui confirme le changement.", points: ["Étoile du matin = retournement haussier", "Étoile du soir = son miroir baissier"] },
  { id: "insidebar", tier: "PALIER 2", title: "Inside bar", diagram: "insidebar", def: "Bougie dont le corps et les mèches restent entièrement contenus dans la fourchette de la bougie précédente — signe de contraction avant un mouvement.", points: ["Souvent suivi d'une cassure franche", "Plus fiable après une forte tendance"] },
  { id: "threesoldiers", tier: "PALIER 2", title: "Trois soldats / corbeaux", diagram: "threesoldiers", def: "Trois bougies consécutives de même couleur, chacune clôturant plus loin que la précédente — signe d'un momentum fort et soutenu.", points: ["Trois soldats blancs = pression acheteuse continue", "Trois corbeaux noirs = son miroir baissier"] },
  { id: "headshoulders", tier: "PALIER 3", title: "Tête-épaules", diagram: "headshoulders", def: "Figure de retournement formée de trois sommets, celui du milieu (la tête) plus haut que les deux épaules qui l'encadrent.", points: ["La cassure de la ligne de cou confirme le retournement", "La version inversée annonce un retournement haussier"] },
  { id: "doubletop", tier: "PALIER 3", title: "Double top / bottom", diagram: "doubletop", def: "Figure de retournement où le prix teste deux fois un même niveau sans réussir à le franchir.", points: ["Les deux sommets/creux doivent être à un niveau similaire", "La cassure du creux intermédiaire confirme la figure"] },
  { id: "triangle", tier: "PALIER 3", title: "Triangle", diagram: "triangle", def: "Convergence progressive du prix entre deux lignes de tendance qui se rapprochent, signalant une consolidation avant une cassure.", points: ["Symétrique = direction incertaine avant cassure", "Le volume diminue souvent pendant la formation"] },
  { id: "flag", tier: "PALIER 3", title: "Drapeau et fanion", diagram: "flag", def: "Courte pause de consolidation après un mouvement fort, suivie généralement d'une continuation dans le même sens.", points: ["Plus la pause est courte et serrée, plus le signal est fiable", "Le volume remonte à la cassure"] },
  { id: "wedge", tier: "PALIER 3", title: "Biseau (wedge)", diagram: "wedge", def: "Deux lignes de tendance convergentes penchées dans la même direction.", points: ["Un biseau ascendant est souvent baissier malgré la hausse apparente", "Un biseau descendant est souvent haussier"] },
  { id: "cuphandle", tier: "PALIER 3", title: "Cup and handle", diagram: "cuphandle", def: "Figure de continuation haussière en forme de U, suivie d'une petite consolidation avant la cassure.", points: ["Plus la tasse est arrondie et symétrique, plus le signal est fiable", "L'anse ne doit pas retracer plus d'un tiers de la remontée"] },
  { id: "rsi", tier: "PALIER 4", title: "RSI", diagram: "rsi", def: "Indicateur de momentum entre 0 et 100 signalant des zones de survente ou de surachat.", points: ["< 30 = survente possible", "> 70 = surachat possible"] },
  { id: "ma", tier: "PALIER 4", title: "Moyennes mobiles", diagram: "ma", def: "Moyenne du prix sur une période donnée, utilisée pour lisser la tendance.", points: ["Croisement de 2 moyennes = signal", "Plus la période est longue, plus le signal est lent"] },
  { id: "macd", tier: "PALIER 4", title: "MACD", diagram: "macd", def: "Indicateur qui compare deux moyennes mobiles pour repérer les changements de momentum.", points: ["Croisement des lignes = signal potentiel", "L'histogramme montre la force du momentum"] },
  { id: "bollinger", tier: "PALIER 4", title: "Bandes de Bollinger", diagram: "bollinger", def: "Enveloppe autour du prix basée sur sa volatilité récente.", points: ["Bandes resserrées = faible volatilité, souvent avant un mouvement", "Le prix touche rarement les bandes extrêmes durablement"] },
  { id: "stoch", tier: "PALIER 4", title: "Stochastique", diagram: "stoch", def: "Indicateur comparant le prix de clôture à sa fourchette récente, entre 0 et 100.", points: ["Croisement des lignes %K/%D = signal", "Complète souvent le RSI"] },
  { id: "atr", tier: "PALIER 4", title: "ATR", diagram: "atr", def: "Mesure la volatilité moyenne du marché sur une période donnée, sans indiquer de direction.", points: ["Utile pour calibrer la taille du stop-loss", "Plus l'ATR est élevé, plus les mouvements sont amples"] },
  { id: "fibo", tier: "PALIER 4", title: "Retracements de Fibonacci", diagram: "fibo", def: "Niveaux (23.6/38.2/50/61.8%) où le prix corrige souvent avant de poursuivre sa tendance.", points: ["61.8% = niveau le plus surveillé", "Tracé du creux au sommet du mouvement"] },
  { id: "fiboext", tier: "PALIER 4", title: "Extensions de Fibonacci", diagram: "fiboext", def: "Niveaux au-delà de 100% utilisés pour estimer où un mouvement pourrait s'arrêter après une cassure.", points: ["161.8% est le niveau le plus surveillé", "Utile pour fixer un objectif de profit"] },
  { id: "volume", tier: "PALIER 5", title: "Volume basique", diagram: "volume", def: "Nombre de transactions effectuées sur une période, révélant la force réelle derrière un mouvement de prix.", points: ["Un mouvement sans volume est suspect", "Un pic de volume confirme souvent un point de retournement"] },
  { id: "vwap", tier: "PALIER 5", title: "VWAP", diagram: "vwap", def: "Prix moyen d'un actif sur la séance, pondéré par le volume échangé à chaque niveau.", points: ["Très suivi par les institutionnels", "Le prix au-dessus du VWAP est jugé fort, en dessous faible"] },
  { id: "volumeprofile", tier: "PALIER 5", title: "Volume Profile", diagram: "volumeprofile", def: "Répartition horizontale du volume échangé à chaque niveau de prix, plutôt que dans le temps.", points: ["Le niveau le plus échangé sert souvent d'aimant au prix", "Utile pour repérer les zones de valeur"] },
  { id: "liquidityzones", tier: "PALIER 5", title: "Zones de liquidité", diagram: "liquidityzones", def: "Zones où les ordres stop des traders se concentrent, généralement juste au-delà des sommets ou creux évidents.", points: ["Le prix est souvent attiré vers ces zones avant de repartir", "Plus les sommets sont égaux, plus la liquidité y est dense"] },
  { id: "orderflow", tier: "PALIER 5", title: "Order flow", diagram: "orderflow", def: "Analyse du déséquilibre en temps réel entre les ordres d'achat et de vente.", points: ["Un déséquilibre fort précède souvent un mouvement rapide", "Complète l'analyse de volume classique"] },
  { id: "ob", tier: "PALIER 6", title: "Order Block (ICT)", diagram: "orderblock", def: "Dernière bougie opposée avant un mouvement impulsif, zone où de gros ordres auraient été placés.", points: ["Souvent suivi d'un retour partiel", "Plus valide sur cassure de structure"] },
  { id: "fvg", tier: "PALIER 6", title: "Fair Value Gap", diagram: "fvg", def: "Écart de prix laissé par un mouvement rapide, que le marché a tendance à revenir combler.", points: ["Visible entre 3 bougies consécutives", "Zone d'intérêt pour une entrée"] },
  { id: "liquiditysweep", tier: "PALIER 6", title: "Liquidity sweep", diagram: "liquiditysweep", def: "Mouvement rapide qui dépasse un niveau connu pour déclencher les stops avant de repartir en sens inverse.", points: ["La mèche dépasse le niveau, la clôture revient à l'intérieur", "Souvent suivi d'un mouvement franc dans l'autre sens"] },
  { id: "breakerblock", tier: "PALIER 6", title: "Breaker block", diagram: "breakerblock", def: "Ancien order block cassé qui change de rôle et devient une nouvelle zone d'intérêt dans le sens opposé.", points: ["Un support cassé devient résistance, et inversement", "Se forme après une cassure de structure"] },
  { id: "chochbos", tier: "PALIER 6", title: "CHoCH / BOS", diagram: "chochbos", def: "Deux façons de lire la cassure de structure : le BOS confirme la tendance en cours, le CHoCH signale un changement de direction.", points: ["BOS = la tendance continue", "CHoCH = premier signe de retournement"] },
  { id: "premiumdiscount", tier: "PALIER 6", title: "Zones premium/discount", diagram: "premiumdiscount", def: "Division d'un intervalle de prix en deux moitiés : la zone haute (premium) où vendre, la zone basse (discount) où acheter.", points: ["On cherche à acheter dans le discount", "On cherche à vendre dans le premium"] },
  { id: "killzones", tier: "PALIER 6", title: "Kill zones", diagram: "killzones", def: "Plages horaires précises où la probabilité de mouvements significatifs est la plus élevée, en particulier les chevauchements de sessions.", points: ["Le chevauchement Londres/New York est souvent le plus actif", "Utile pour savoir quand rester devant l'écran"] },
  { id: "ote", tier: "PALIER 6", title: "Optimal Trade Entry", diagram: "ote", def: "Zone de retracement entre 61.8% et 79% considérée comme idéale pour entrer dans le sens de la tendance.", points: ["Combine souvent Fibonacci et order block", "Réduit le risque par rapport à une entrée trop précoce"] },
  { id: "correlation", tier: "PALIER 7", title: "Corrélations inter-marchés", diagram: "correlation", def: "Relation entre deux actifs qui évoluent souvent en sens inverse ou en parallèle, comme l'or et le dollar.", points: ["L'or et le DXY évoluent le plus souvent en miroir", "Utile pour confirmer un biais avant d'entrer"] },
  { id: "sessions", tier: "PALIER 7", title: "Sessions de trading", diagram: "sessions", def: "Le marché mondial se découpe en sessions (Asie, Londres, New York), chacune avec son propre comportement de prix.", points: ["La session de Londres ouvre souvent les grands mouvements", "L'ouverture de New York peut inverser la tendance du matin"] },
  { id: "news", tier: "PALIER 7", title: "News économiques", diagram: "news", def: "Publications macroéconomiques programmées (taux d'intérêt, emploi, inflation) qui provoquent des pics de volatilité soudains.", points: ["Les spreads s'élargissent souvent juste avant l'annonce", "Beaucoup de traders évitent de trader dans la minute qui suit"] },
  { id: "sentiment", tier: "PALIER 7", title: "Sentiment / COT", diagram: "sentiment", def: "Indication du positionnement dominant des grands acteurs du marché (institutionnels, fonds) sur un actif donné.", points: ["Un positionnement extrême précède parfois un retournement", "Le rapport COT est publié chaque semaine pour les futures"] },
  { id: "confluencesr", tier: "PALIER 8", title: "S/R + chandelier", diagram: "confluencesr", def: "Combiner un niveau de support ou résistance avec un pattern de chandelier au même endroit pour renforcer le signal.", points: ["Un pin bar sur un support vaut plus qu'un pin bar isolé", "Plus les confirmations s'accumulent, plus le signal est fiable"] },
  { id: "confluenceictfibo", tier: "PALIER 8", title: "ICT + Fibonacci", diagram: "confluenceictfibo", def: "Aligner un order block ou une Fair Value Gap avec une zone de retracement Fibonacci pour une entrée à forte probabilité.", points: ["L'alignement de plusieurs outils réduit le risque", "L'OTE combiné à un order block est un des setups les plus suivis"] },
  { id: "multitf", tier: "PALIER 8", title: "Multi-timeframe", diagram: "multitf", def: "Lire la direction générale sur un cadre temporel élevé, puis affiner le point d'entrée sur un cadre plus bas.", points: ["Ne jamais trader contre la tendance du cadre supérieur", "Le cadre inférieur sert à préciser le timing, pas à décider la direction"] },
  { id: "customsystem", tier: "PALIER 8", title: "Système personnalisé", def: "Combinaison réfléchie de plusieurs stratégies apprises en une check-list cohérente et personnelle.", points: ["Un bon système est simple et répétable", "Il vaut mieux maîtriser 3 règles que suivre 10 vaguement"] },
];

const GLOSSARY = [
  { id: "candle", diagram: "candle",
    title: { fr: "Anatomie d'une bougie", en: "Anatomy of a Candle", es: "Anatomía de una vela" },
    def: { fr: "Une bougie résume le prix sur une période donnée avec quatre valeurs : ouverture, clôture, plus haut, plus bas. Le corps relie ouverture et clôture ; les mèches montrent les extrêmes atteints en cours de route.", en: "A candle summarizes price over a given period with four values: open, close, high, low. The body connects open and close; the wicks show the extremes reached along the way.", es: "Una vela resume el precio en un período dado con cuatro valores: apertura, cierre, máximo, mínimo. El cuerpo conecta apertura y cierre; las mechas muestran los extremos alcanzados en el camino." } },
  { id: "polarity", diagram: "polarity",
    title: { fr: "Polarité : un niveau change de rôle", en: "Polarity: a level changes role", es: "Polaridad: un nivel cambia de rol" },
    def: { fr: "Quand un support est franchement cassé (clôture en dessous), il ne disparaît pas — il devient souvent une résistance au retour du prix. Le même mécanisme fonctionne à l'inverse pour une résistance cassée.", en: "When a support is clearly broken (a close below it), it doesn't disappear — it often becomes resistance when price returns. The same works in reverse for a broken resistance.", es: "Cuando un soporte se rompe claramente (cierre por debajo), no desaparece — a menudo se convierte en resistencia cuando el precio regresa. Lo mismo funciona a la inversa para una resistencia rota." } },
  { id: "trading",
    title: { fr: "Qu'est-ce que le trading ?", en: "What is trading?", es: "¿Qué es el trading?" },
    def: { fr: "Acheter et vendre un actif financier dans le but de profiter de ses variations de prix à court ou moyen terme.", en: "Buying and selling a financial asset with the goal of profiting from its price movements over the short or medium term.", es: "Comprar y vender un activo financiero con el objetivo de beneficiarse de sus variaciones de precio a corto o medio plazo." } },
  { id: "action",
    title: { fr: "Action", en: "Stock", es: "Acción" },
    def: { fr: "Part de propriété d'une entreprise cotée en bourse, donnant droit à une fraction de ses bénéfices.", en: "A share of ownership in a publicly listed company, entitling the holder to a portion of its profits.", es: "Parte de propiedad de una empresa cotizada en bolsa, que da derecho a una fracción de sus beneficios." } },
  { id: "etf",
    title: { fr: "ETF", en: "ETF", es: "ETF" },
    def: { fr: "Fonds coté en bourse qui réplique la performance d'un indice ou d'un panier d'actifs.", en: "An exchange-traded fund that replicates the performance of an index or a basket of assets.", es: "Fondo cotizado en bolsa que replica el rendimiento de un índice o una cesta de activos." } },
  { id: "spread",
    title: { fr: "Spread", en: "Spread", es: "Spread" },
    def: { fr: "Écart entre le prix d'achat et de vente d'un actif — c'est le coût implicite de chaque trade.", en: "The gap between an asset's buy and sell price — it's the implicit cost of every trade.", es: "Diferencia entre el precio de compra y venta de un activo — es el costo implícito de cada operación." } },
  { id: "levier",
    title: { fr: "Effet de levier", en: "Leverage", es: "Apalancamiento" },
    def: { fr: "Emprunt permettant de contrôler une position plus grande que son capital, ce qui amplifie gains et pertes.", en: "Borrowing that lets you control a position larger than your capital, which amplifies both gains and losses.", es: "Préstamo que permite controlar una posición mayor que tu capital, lo que amplifica ganancias y pérdidas." } },
  { id: "sl",
    title: { fr: "Stop-loss", en: "Stop-loss", es: "Stop-loss" },
    def: { fr: "Ordre automatique qui clôture une position à un prix défini pour limiter la perte.", en: "An automatic order that closes a position at a set price to limit the loss.", es: "Orden automática que cierra una posición a un precio definido para limitar la pérdida." } },
];

export default function BookScreen({ onBack }) {
  const { t, lang } = useLang();
  const [tab, setTab] = useState("strategies");
  const [item, setItem] = useState(null);

  if (item) {
    const points = loc(item.points, lang);
    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setItem(null)} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
            <Text style={styles.back}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t("book_detail")}</Text>
          <View style={{ width: 24 }} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <Text style={styles.eyebrow}>{item.tier ? item.tier : t("book_notion")}</Text>
          <Text style={styles.itemTitle}>{loc(item.title, lang)}</Text>
          <Text style={styles.itemDef}>{loc(item.def, lang)}</Text>
          {item.diagram && (
            <View style={styles.diagramBox}>
              <Diagram type={item.diagram} />
            </View>
          )}
          {points && (
            <>
              <Text style={styles.panelTitle}>{t("book_key_points")}</Text>
              {points.map((p, i) => (
                <Text key={i} style={styles.point}>• {p}</Text>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  const list = tab === "strategies" ? STRATEGIES : GLOSSARY;
  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}>
          <Text style={styles.back}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t("book_title")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setTab("strategies")} style={[styles.tab, tab === "strategies" && styles.tabActive]}>
          <Text style={[styles.tabText, tab === "strategies" && styles.tabTextActive]}>{t("book_tab_strategies")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab("glossaire")} style={[styles.tab, tab === "glossaire" && styles.tabActive]}>
          <Text style={[styles.tabText, tab === "glossaire" && styles.tabTextActive]}>{t("book_tab_glossary")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: 6 }}>
        {list.map((it) => (
          <TouchableOpacity key={it.id} style={styles.row} onPress={() => setItem(it)}>
            <Text style={styles.rowText}>{loc(it.title, lang)}</Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 14, paddingHorizontal: 16, paddingBottom: 10 },
  back: { color: COLORS.text, fontSize: 24 },
  title: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 18, marginBottom: 6 },
  tab: { flex: 1, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.line, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  tabText: { color: COLORS.dim, fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: "#0A0E17" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: 10, padding: 14, marginBottom: 8 },
  rowText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  chevron: { color: COLORS.dim, fontSize: 16 },
  eyebrow: { color: COLORS.gold, fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  itemTitle: { color: COLORS.text, fontSize: 20, fontWeight: "700", marginBottom: 10 },
  itemDef: { color: COLORS.dim, fontSize: 13, lineHeight: 20, marginBottom: 16 },
  diagramBox: { backgroundColor: COLORS.panel, borderWidth: 1, borderColor: COLORS.line, borderRadius: 10, padding: 12, marginBottom: 16 },
  panelTitle: { color: COLORS.dim, fontSize: 10, letterSpacing: 1, marginBottom: 8 },
  point: { color: COLORS.text, fontSize: 13, marginBottom: 6, lineHeight: 18 },
});