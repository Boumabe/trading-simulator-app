import React from 'react';
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useI18n } from '@/core/i18n';
import { COLORS } from '@/ui/theme';

const icon = (emoji: string) => ({ focused }: { focused: boolean }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;

/** Navigation par onglets : Android gère « Retour » naturellement (avant : l'app se fermait). */
export default function TabsLayout() {
  const { t } = useI18n();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.gold,
        tabBarInactiveTintColor: COLORS.dim,
        tabBarStyle: { backgroundColor: COLORS.panel, borderTopColor: COLORS.line },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        sceneStyle: { backgroundColor: COLORS.bg },
      }}
    >
      <Tabs.Screen name="map" options={{ title: t('tab_map'), tabBarIcon: icon('🗺️') }} />
      <Tabs.Screen name="book" options={{ title: t('tab_book'), tabBarIcon: icon('📖') }} />
      <Tabs.Screen name="profile" options={{ title: t('tab_profile'), tabBarIcon: icon('🏅') }} />
      <Tabs.Screen name="settings" options={{ title: t('tab_settings'), tabBarIcon: icon('⚙️') }} />
    </Tabs>
  );
}
