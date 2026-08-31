import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBqSwelGYsLA6A1Ono83Cmcuf9Ac1baAhg",
  authDomain: "simtra-7a272.firebaseapp.com",
  projectId: "simtra-7a272",
  storageBucket: "simtra-7a272.firebasestorage.app",
  messagingSenderId: "661695098031",
  appId: "1:661695098031:web:1160deb8b7534441a9785a",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);