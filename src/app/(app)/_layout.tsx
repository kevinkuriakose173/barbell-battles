import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile" options={{ presentation: 'card' }} />
      <Stack.Screen name="account/edit-profile" options={{ presentation: 'card' }} />
      <Stack.Screen name="account/change-password" options={{ presentation: 'card' }} />
      <Stack.Screen name="account/delete-account" options={{ presentation: 'card' }} />
    </Stack>
  );
}
