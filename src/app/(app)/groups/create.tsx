import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { colors, spacing } from '@/constants/theme';
import { createGroup } from '@/features/groups/api';

export default function CreateGroupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleCreate() {
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 60) {
      Alert.alert('Check the group name', 'Use between 2 and 60 characters.');
      return;
    }
    try {
      setIsSaving(true);
      await createGroup(trimmedName);
      router.back();
    } catch (error) {
      Alert.alert('Unable to create group', error instanceof Error ? error.message : 'Try again.');
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Groups</Text></Pressable>
          <View style={styles.header}><Text style={styles.eyebrow}>NEW GROUP</Text><Text style={styles.title}>Create group</Text><Text style={styles.description}>You’ll receive a join code to share with friends.</Text></View>
          <Field autoCapitalize="words" autoFocus label="Group name" maxLength={60} onChangeText={setName} placeholder="Morning Crew" returnKeyType="done" value={name} />
          <Button disabled={isSaving} onPress={handleCreate}>{isSaving ? 'Creating…' : 'Create group'}</Button>
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
