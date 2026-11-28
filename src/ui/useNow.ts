import { useEffect, useState } from 'react';

/** Heure courante, rafraîchie à intervalle régulier (le compte à rebours et le changement de jour se mettent à jour tout seuls). */
export function useNow(everyMs = 30000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}
