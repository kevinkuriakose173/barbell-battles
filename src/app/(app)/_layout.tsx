import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack initialRouteName="(tabs)" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile" options={{ presentation: 'card' }} />
    </Stack>
  );
}
