import * as Localization from "expo-localization";
import translations from "./translations";

export function useLang() {
  const locales = Localization.getLocales();
  const code = locales && locales[0] ? locales[0].languageCode : "fr";
  let lang;
  if (code === "fr") lang = "fr";
  else if (code === "es") lang = "es";
  else lang = "en"; // toute autre langue système bascule sur l'anglais, par défaut le plus universel

  const t = (key) => translations[lang]?.[key] ?? translations.fr[key] ?? key;
  return { lang, t };
}