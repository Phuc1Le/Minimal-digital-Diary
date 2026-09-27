import { StatusBar } from 'expo-status-bar';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { migrateDatabase } from '@/database/migrate';
const diaryTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#F8F6F1',
    card: '#F8F6F1',
    border: '#E5E0D6',
    text: '#24231F',
  },
};

export default function TabLayout() {
  const [isDatabaseReady, setIsDatabaseReady] = useState(false);
  const [databaseError, setDatabaseError] = useState<Error | null>(null);

  useEffect(() => {
    migrateDatabase()
      .then(() => setIsDatabaseReady(true))
      .catch((error: unknown) => {
        setDatabaseError(error instanceof Error ? error : new Error('Database setup failed.'));
      });
  }, []);

  if (databaseError) {
    return (
      <View style={styles.statusScreen}>
        <Text style={styles.statusTitle}>Unable to open your diary</Text>
        <Text style={styles.statusMessage}>{databaseError.message}</Text>
      </View>
    );
  }

  if (!isDatabaseReady) {
    return (
      <View style={styles.statusScreen}>
        <ActivityIndicator color="#A6513F" />
        <Text style={styles.statusMessage}>Preparing your diary…</Text>
      </View>
    );
  }
  return (
    <ThemeProvider value={diaryTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="entry/new"
          options={{
            presentation: 'modal',
            title: 'New Entry',
            headerStyle: { backgroundColor: '#F8F6F1' },
            headerShadowVisible: false,
            headerTitleStyle: { color: '#24231F', fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="entry/[id]"
          options={{
            presentation: 'modal',
            title: 'Entry',
            headerStyle: { backgroundColor: '#F8F6F1' },
            headerShadowVisible: false,
            headerTitleStyle: { color: '#24231F', fontWeight: '600' },
          }}
        />
        <Stack.Screen name="entry/[id]/edit" options={{ title: 'Edit Entry', headerStyle: { backgroundColor: '#F8F6F1' }, headerShadowVisible: false, headerTitleStyle: { color: '#24231F', fontWeight: '600' } }} />
      </Stack>
      <StatusBar style="dark" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  statusScreen: {
    alignItems: 'center',
    backgroundColor: '#F8F6F1',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  statusTitle: {
    color: '#24231F',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  statusMessage: {
    color: '#77736B',
    fontSize: 16,
    textAlign: 'center',
  },
});
