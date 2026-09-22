import type { Firestore } from 'firebase/firestore';

/** Clé web Firebase : publique par conception. La sécurité vient des règles Firestore (voir /firestore.rules). */
const CONFIG = {
  apiKey: 'AIzaSyBqSwelGYsLA6A1Ono83Cmcuf9Ac1baAhg',
  authDomain: 'simtra-7a272.firebaseapp.com',
  projectId: 'simtra-7a272',
  storageBucket: 'simtra-7a272.firebasestorage.app',
  messagingSenderId: '661695098031',
  appId: '1:661695098031:web:1160deb8b7534441a9785a',
};

let dbPromise: Promise<Firestore> | null = null;

/** Firebase n'est chargé qu'au premier besoin : démarrage de l'app plus rapide et plus léger. */
export function getDb(): Promise<Firestore> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const { initializeApp, getApps, getApp } = await import('firebase/app');
      const fs = await import('firebase/firestore');
      const app = getApps().length ? getApp() : initializeApp(CONFIG);
      try {
        // Sur réseaux mobiles instables, le long-polling évite les blocages WebChannel.
        return fs.initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
      } catch {
        return fs.getFirestore(app);
      }
    })();
  }
  return dbPromise;
}
