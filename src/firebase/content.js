import { collection, getDocs } from "firebase/firestore";
import { db } from "./config";
import { STRATEGIES as LOCAL_STRATEGIES, GLOSSARY as LOCAL_GLOSSARY } from "../data/bookContent";

export async function fetchStrategies() {
  try {
    const snap = await getDocs(collection(db, "strategies"));
    if (snap.empty) return LOCAL_STRATEGIES;
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return LOCAL_STRATEGIES;
  }
}

export async function fetchGlossary() {
  try {
    const snap = await getDocs(collection(db, "glossary"));
    if (snap.empty) return LOCAL_GLOSSARY;
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch {
    return LOCAL_GLOSSARY;
  }
}

export async function fetchQuizData() {
  try {
    const snap = await getDocs(collection(db, "quizzes"));
    if (snap.empty) return null;
    const merged = {};
    snap.forEach((d) => { merged[d.id] = d.data(); });
    return merged;
  } catch {
    return null;
  }
}