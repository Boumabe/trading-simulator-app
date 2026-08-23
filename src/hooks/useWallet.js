import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BALANCE_KEY = "wallet_balance";
const LAST_BONUS_KEY = "wallet_last_bonus_date";
const START_BALANCE = 50;
const DAILY_BONUS = 5;

function todayStr() {
  const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    }

    export default function useWallet() {
      const [balance, setBalance] = useState(null);
        const [bonusAvailable, setBonusAvailable] = useState(false);

          useEffect(() => {
              (async () => {
                    const stored = await AsyncStorage.getItem(BALANCE_KEY);
                          let bal = stored !== null ? parseFloat(stored) : START_BALANCE;
                                if (stored === null) await AsyncStorage.setItem(BALANCE_KEY, String(START_BALANCE));
                                      const lastBonus = await AsyncStorage.getItem(LAST_BONUS_KEY);
                                            if (lastBonus !== todayStr()) setBonusAvailable(true);
                                                  setBalance(bal);
                                                      })();
                                                        }, []);

                                                          const claimBonus = useCallback(async () => {
                                                              setBalance((b) => {
                                                                    const nb = +((b ?? 0) + DAILY_BONUS).toFixed(2);
                                                                          AsyncStorage.setItem(BALANCE_KEY, String(nb));
                                                                                AsyncStorage.setItem(LAST_BONUS_KEY, todayStr());
                                                                                      return nb;
                                                                                          });
                                                                                              setBonusAvailable(false);
                                                                                                }, []);

                                                                                                  const applyDelta = useCallback((delta) => {
                                                                                                      setBalance((b) => {
                                                                                                            const nb = +((b ?? 0) + delta).toFixed(2);
                                                                                                                  AsyncStorage.setItem(BALANCE_KEY, String(nb));
                                                                                                                        return nb;
                                                                                                                            });
                                                                                                                              }, []);

                                                                                                                                return { balance, bonusAvailable, claimBonus, applyDelta };
                                                                                                                                }