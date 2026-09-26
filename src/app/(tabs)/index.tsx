import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getEntriesForDay } from '@/database/repository/entryRepository';
import type { entries } from '@/database/schema';

const today = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
}).format(new Date());

export default function DiaryScreen() {
  const [diaryEntries, setDiaryEntries] = useState<(typeof entries.$inferSelect)[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;

      getEntriesForDay(new Date())
        .then((result) => {
          if (isCurrent) setDiaryEntries(result);
        })
        .finally(() => {
          if (isCurrent) setIsLoading(false);
        });

      return () => {
        isCurrent = false;
      };
    }, []),
  );

  return (
    <View style={styles.screen}>
      <View>
        <Text style={styles.eyebrow}>TODAY</Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      {isLoading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#A6513F" />
        </View>
      ) : diaryEntries.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.iconCircle}>
            <Text style={styles.bookIcon}>D</Text>
          </View>
          <Text style={styles.title}>A blank page awaits</Text>
          <Text style={styles.description}>Capture a moment, thought, or event from your day.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.entriesList}>
          {diaryEntries.map((entry) => (
            <Pressable
              key={entry.id}
              accessibilityHint="Opens this entry for editing"
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/entry/[id]', params: { id: String(entry.id) } })}
              style={({ pressed }) => [styles.entryCard, pressed && styles.entryCardPressed]}>
              <View style={styles.entryMeta}>
                <Text style={styles.entryTime}>
                  {entry.entryTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                </Text>
                <Text style={styles.category}>{entry.category}</Text>
              </View>
              <Text style={styles.entryContent}>{entry.content}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Pressable accessibilityRole="button" onPress={() => router.push('/entry/new')} style={styles.addButton}>
        <Text style={styles.addButtonText}>Add entry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F6F1', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 96 },
  eyebrow: { color: '#77736B', fontSize: 12, fontWeight: '600', letterSpacing: 2 },
  date: { color: '#24231F', fontSize: 29, fontWeight: '600', letterSpacing: -0.6, marginTop: 8 },
  emptyState: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 56 },
  iconCircle: { alignItems: 'center', backgroundColor: '#F3E5DF', borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  bookIcon: { color: '#A6513F', fontSize: 24, fontWeight: '700' },
  title: { color: '#24231F', fontSize: 20, fontWeight: '600', marginTop: 24 },
  description: { color: '#77736B', fontSize: 16, lineHeight: 24, marginTop: 8, maxWidth: 280, textAlign: 'center' },
  addButton: { alignItems: 'center', backgroundColor: '#A6513F', borderRadius: 16, justifyContent: 'center', minHeight: 56 },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  entriesList: { gap: 12, paddingTop: 28, paddingBottom: 24 },
  entryCard: { backgroundColor: '#FFFFFF', borderColor: '#E5E0D6', borderRadius: 16, borderWidth: 1, padding: 16 },
  entryCardPressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  entryMeta: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  entryTime: { color: '#77736B', fontSize: 14, fontWeight: '600' },
  category: { color: '#A6513F', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  entryContent: { color: '#24231F', fontSize: 16, lineHeight: 24, marginTop: 10 },
});
