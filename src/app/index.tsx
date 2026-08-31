import { useState, useCallback } from "react";
import { View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import useWallet from "../hooks/useWallet";
import CapitalBar from "../components/CapitalBar";
import SplashScreen from "../screens/SplashScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import MapScreen from "../screens/MapScreen";
import PlayScreen from "../screens/PlayScreen";
import BookScreen from "../screens/BookScreen";
import QuizScreen from "../screens/QuizScreen";
import MySystemScreen from "../screens/MySystemScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { loadRemoteLevelNames } from "../i18n/levelNames";

function AppInner() {
  loadRemoteLevelNames();
  const [screen, setScreen] = useState("splash");
  const [level, setLevel] = useState<string | null>(null);
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [liveDelta, setLiveDelta] = useState(0);
  const wallet = useWallet();

  const handleLiveDeltaChange = useCallback((d: number) => setLiveDelta(d), []);
  const showCapital = screen !== "splash" && screen !== "onboarding" && screen !== "quiz" && screen !== "mysystem" && screen !== "settings";

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0E17" }}>
      {showCapital && (
        <CapitalBar balance={wallet.balance} bonusAvailable={wallet.bonusAvailable} onClaimBonus={wallet.claimBonus} liveDelta={screen === "play" ? liveDelta : 0} />
      )}

      {screen === "splash" && <SplashScreen onDone={() => setScreen("onboarding")} />}
      {screen === "onboarding" && (
        <OnboardingScreen onDone={(lvl: string) => { setLevel(lvl); setScreen("map"); }} />
      )}
      {screen === "map" && (
        <MapScreen
          level={level}
          onBack={() => setScreen("onboarding")}
          onOpenLevel={(sid: string) => { setStrategyId(sid); setLiveDelta(0); setScreen("play"); }}
          onOpenQuiz={(qid: string) => { setQuizId(qid); setScreen("quiz"); }}
          onOpenTool={() => setScreen("mysystem")}
          onOpenBook={() => setScreen("book")}
          onOpenSettings={() => setScreen("settings")}
        />
      )}
      {screen === "book" && <BookScreen onBack={() => setScreen("map")} />}
      {screen === "quiz" && <QuizScreen quizId={quizId} onBack={() => setScreen("map")} />}
      {screen === "mysystem" && <MySystemScreen onBack={() => setScreen("map")} />}
      {screen === "settings" && (
        <SettingsScreen
          onBack={() => setScreen("map")}
          onConfirmReset={async () => {
            await AsyncStorage.clear();
            window.__simtraReset?.();
          }}
        />
      )}
      {screen === "play" && (
        <PlayScreen
          onBack={() => { setLiveDelta(0); setScreen("map"); }}
          balance={wallet.balance}
          onApplyDelta={wallet.applyDelta}
          strategyId={strategyId}
          onLiveDeltaChange={handleLiveDeltaChange}
        />
      )}
    </View>
  );
}

export default function Index() {
  const [resetKey, setResetKey] = useState(0);
  if (typeof window !== "undefined") {
    (window as any).__simtraReset = () => setResetKey((k) => k + 1);
  }
  return <AppInner key={resetKey} />;
}