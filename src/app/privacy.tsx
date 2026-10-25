import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { privacyPolicy } from '@/constants/privacy-policy';
import { colors, spacing } from '@/constants/theme';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        {router.canGoBack() ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.back()}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
        ) : null}
        <Text accessibilityRole="header" style={styles.title}>Privacy Policy</Text>
        <Text style={styles.date}>Barbell Battles · Updated {privacyPolicy.updated}</Text>
        {privacyPolicy.sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text accessibilityRole="header" style={styles.heading}>{section.title}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { alignSelf: 'center', gap: spacing.lg, maxWidth: 760, padding: spacing.lg, paddingBottom: 64, width: '100%' },
  back: { color: colors.primaryLight, fontSize: 16, fontWeight: '700' },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  date: { color: colors.textMuted, fontSize: 13 },
  section: { gap: spacing.sm },
  heading: { color: colors.text, fontSize: 18, fontWeight: '800' },
  body: { color: colors.textMuted, fontSize: 15, lineHeight: 24 },
});
