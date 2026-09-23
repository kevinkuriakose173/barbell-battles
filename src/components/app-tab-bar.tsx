import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

const tabs = {
  groups: {
    label: 'Groups',
    symbol: { ios: 'person.3.fill', android: 'groups', web: 'groups' } as const,
  },
  index: {
    label: 'Leaderboard',
    symbol: { ios: 'trophy.fill', android: 'trophy', web: 'trophy' } as const,
  },
  lifts: {
    label: 'Lifts',
    symbol: { ios: 'dumbbell.fill', android: 'fitness_center', web: 'fitness_center' } as const,
  },
};

type AppTabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

export function AppTabBar({ navigation, state }: AppTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.safeArea}>
      <View style={[styles.bar, { height: 72 + insets.bottom, paddingBottom: insets.bottom }]}>
        {state.routes.map((route, index) => {
          const config = tabs[route.name as keyof typeof tabs];
          if (!config) return null;
          const focused = state.index === index;
          const isLeaderboard = route.name === 'index';

          function handlePress() {
            const event = navigation.emit({ canPreventDefault: true, target: route.key, type: 'tabPress' });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          }

          return (
            <Pressable
              accessibilityLabel={config.label}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              key={route.key}
              onLongPress={() => navigation.emit({ target: route.key, type: 'tabLongPress' })}
              onPress={handlePress}
              style={({ pressed }) => [styles.tab, isLeaderboard && styles.centerTab, pressed && styles.pressed]}>
              {isLeaderboard ? (
                <View style={[styles.medallion, focused && styles.medallionFocused]}>
                  <View style={styles.medallionInner}>
                    <SymbolView name={config.symbol} size={29} tintColor="#18233a" />
                  </View>
                </View>
              ) : (
                <SymbolView name={config.symbol} size={25} tintColor={focused ? colors.accent : colors.textMuted} />
              )}
              <Text style={[styles.label, focused && styles.labelFocused, isLeaderboard && styles.centerLabel]}>
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'center',
    backgroundColor: '#101c31',
    borderColor: colors.border,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    flexDirection: 'row',
    overflow: 'visible',
    paddingHorizontal: 10,
  },
  centerLabel: { marginTop: 35 },
  centerTab: { overflow: 'visible' },
  label: { color: colors.textMuted, fontSize: 11, fontWeight: '700', marginTop: 5 },
  labelFocused: { color: colors.accent },
  medallion: {
    alignItems: 'center',
    backgroundColor: '#d59b0b',
    borderColor: '#ffe58a',
    borderRadius: 36,
    borderWidth: 2,
    height: 72,
    justifyContent: 'center',
    position: 'absolute',
    top: -34,
    width: 72,
  },
  medallionFocused: {
    backgroundColor: colors.accent,
    shadowColor: colors.accent,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 10,
  },
  medallionInner: {
    alignItems: 'center',
    borderColor: 'rgba(24, 35, 58, 0.25)',
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  pressed: { opacity: 0.72 },
  safeArea: { backgroundColor: colors.background },
  tab: { alignItems: 'center', flex: 1, height: 72, justifyContent: 'center' },
});
