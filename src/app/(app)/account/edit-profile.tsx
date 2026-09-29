import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AccountScreen } from '@/components/account-screen';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { colors, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/with-timeout';
import { useAuth } from '@/providers/auth-provider';

type WeightUnit = 'lb' | 'kg';

export default function EditProfileScreen() {
  const router = useRouter();
  const { profile, refreshProfile, session } = useAuth();
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [username, setUsername] = useState(profile?.username ?? '');
  const [preferredUnit, setPreferredUnit] = useState<WeightUnit>(profile?.preferred_unit ?? 'lb');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSave() {
    const normalizedUsername = username.trim().toLowerCase();

    if (!firstName.trim() || !lastName.trim() || !normalizedUsername) {
      Alert.alert('Missing information', 'Complete your name and username.');
      return;
    }

    if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) {
      Alert.alert('Invalid username', 'Use 3–24 lowercase letters, numbers, or underscores.');
      return;
    }

    if (!session) return;

    setIsSubmitting(true);
    try {
      const { error } = await withTimeout(
        supabase
          .from('profiles')
          .update({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            preferred_unit: preferredUnit,
            username: normalizedUsername,
          })
          .eq('id', session.user.id)
      );

      if (error) {
        const message = error.code === '23505' ? 'That username is already taken.' : error.message;
        Alert.alert('Unable to update profile', message);
        return;
      }

      await refreshProfile();
      router.back();
    } catch (error) {
      Alert.alert(
        'Unable to update profile',
        error instanceof Error ? error.message : 'Check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AccountScreen
      title="Edit profile"
      description="Your name and username appear on leaderboards shared with your groups.">
      <View style={styles.form}>
        <Field
          autoComplete="given-name"
          label="First name"
          onChangeText={setFirstName}
          placeholder="First name"
          value={firstName}
        />
        <Field
          autoComplete="family-name"
          label="Last name"
          onChangeText={setLastName}
          placeholder="Last name"
          value={lastName}
        />
        <Field
          autoCapitalize="none"
          autoCorrect={false}
          label="Username"
          onChangeText={setUsername}
          placeholder="username"
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
        <Button disabled={isSubmitting} onPress={handleSave}>
          {isSubmitting ? 'Saving changes…' : 'Save changes'}
        </Button>
      </View>
    </AccountScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  label: { color: colors.text, fontSize: 14, fontWeight: '700' },
  unitField: { gap: spacing.sm },
  unitOption: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 13,
  },
  unitOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  unitOptions: { flexDirection: 'row', gap: spacing.sm },
  unitText: { color: colors.textMuted, fontWeight: '800' },
  unitTextSelected: { color: '#ffffff' },
});
