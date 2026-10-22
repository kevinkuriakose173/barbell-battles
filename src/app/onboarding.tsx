import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { colors, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

type WeightUnit = 'lb' | 'kg';

export default function OnboardingScreen() {
  const { refreshProfile, session } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [preferredUnit, setPreferredUnit] = useState<WeightUnit>('lb');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSaveProfile() {
    const normalizedUsername = username.trim().toLowerCase();

    if (!firstName.trim() || !lastName.trim() || !normalizedUsername) {
      Alert.alert('Missing information', 'Complete your name and username.');
      return;
    }

    if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
      Alert.alert(
        'Invalid username',
        'Use 3–24 lowercase letters, numbers, or underscores.'
      );
      return;
    }

    if (!session) return;

    setIsSubmitting(true);
    const { error } = await supabase.from('profiles').insert({
      first_name: firstName.trim(),
      id: session.user.id,
      last_name: lastName.trim(),
      preferred_unit: preferredUnit,
      username: normalizedUsername,
    });

    if (error) {
      setIsSubmitting(false);
      const message = error.code === '23505' ? 'That username is already taken.' : error.message;
      Alert.alert('Unable to save profile', message);
      return;
    }

    await refreshProfile();
    setIsSubmitting(false);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>BUILD YOUR LIFTER CARD</Text>
            <Text style={styles.title}>Tell us who you are</Text>
            <Text style={styles.description}>
              Your name and username will appear on group leaderboards.
            </Text>
          </View>

          <View style={styles.form}>
            <Field
              autoComplete="given-name"
              label="First name"
              onChangeText={setFirstName}
              placeholder="Kevin"
              value={firstName}
            />
            <Field
              autoComplete="family-name"
              label="Last name"
              onChangeText={setLastName}
              placeholder="Smith"
              value={lastName}
            />
            <Field
              autoCapitalize="none"
              autoCorrect={false}
              label="Username"
              onChangeText={setUsername}
              placeholder="kevin_lifts"
              value={username}
            />

            <View style={styles.unitField}>
              <Text style={styles.label}>Preferred unit</Text>
              <View style={styles.unitOptions}>
                {(['lb', 'kg'] as const).map((unit) => {
                  const isSelected = preferredUnit === unit;
                  return (
                    <Pressable
                      key={unit}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => setPreferredUnit(unit)}
                      style={[styles.unitOption, isSelected && styles.unitOptionSelected]}>
                      <Text style={[styles.unitText, isSelected && styles.unitTextSelected]}>
                        {unit.toUpperCase()}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Button disabled={isSubmitting} onPress={handleSaveProfile}>
              {isSubmitting ? 'Saving profile…' : 'Finish setup'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: spacing.xl,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  description: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
  },
  eyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  form: {
    gap: spacing.md,
  },
  heading: {
    gap: spacing.sm,
  },
  keyboardView: {
    flex: 1,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -1,
  },
  unitField: {
    gap: spacing.sm,
  },
  unitOption: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 13,
  },
  unitOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unitText: {
    color: colors.textMuted,
    fontWeight: '800',
  },
  unitTextSelected: {
    color: '#ffffff',
  },
});
