import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { colors, spacing } from '@/constants/theme';
import { joinGroup } from '@/features/groups/api';

export default function JoinGroupScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleJoin() {
    const normalizedCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{8}$/.test(normalizedCode)) {
      Alert.alert('Check the join code', 'Enter the 8-character code shared by the group owner.');
      return;
    }
    try {
      setIsSaving(true);
      await joinGroup(normalizedCode);
      router.back();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Try again.';
      if (message.includes('already joined this group')) {
        Alert.alert('Already a member', 'You have already joined this group.');
      } else {
        Alert.alert('Unable to join group', message);
      }
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Groups</Text></Pressable>
          <View style={styles.header}><Text style={styles.eyebrow}>INVITE CODE</Text><Text style={styles.title}>Join group</Text><Text style={styles.description}>Ask the group owner for their 8-character code.</Text></View>
          <Field autoCapitalize="characters" autoCorrect={false} autoFocus label="Join code" maxLength={8} onChangeText={(value) => setCode(value.toUpperCase())} placeholder="A1B2C3D4" returnKeyType="done" value={code} />
          <Button disabled={isSaving} onPress={handleJoin}>{isSaving ? 'Joining…' : 'Join group'}</Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.primaryLight, fontSize: 16, fontWeight: '700' },
  content: { gap: spacing.lg, padding: spacing.lg },
  description: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  flex: { flex: 1 },
  header: { gap: spacing.sm },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  title: { color: colors.text, fontSize: 32, fontWeight: '900' },
});
