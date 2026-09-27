import { router, useFocusEffect } from 'expo-router';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getEntriesForDay } from '@/database/repository/entryRepository';
import type { entries } from '@/database/schema';
import { loadPhotoPathsForEntries } from '@/services/photoService';
import { PhotoViewer } from '@/components/photo-viewer';

export default function DiaryScreen() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [isPickingDate, setIsPickingDate] = useState(false);
  const [diaryEntries, setDiaryEntries] = useState<(typeof entries.$inferSelect)[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [photosByEntryId, setPhotosByEntryId] = useState<Record<number, string[]>>({});
  const [viewedPhotoPath, setViewedPhotoPath] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;

      getEntriesForDay(selectedDate)
        .then(async (result) => {
          const photos = await loadPhotoPathsForEntries(result.map((entry) => entry.id));
          if (isCurrent) {
            setDiaryEntries(result);
            setPhotosByEntryId(photos.reduce<Record<number, string[]>>((grouped, photo) => {
              (grouped[photo.entryId] ??= []).push(photo.filePath);
              return grouped;
            }, {}));
          }
        })
        .finally(() => {
          if (isCurrent) setIsLoading(false);
        });

      return () => {
        isCurrent = false;
      };
    }, [selectedDate]),
  );

  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();
  const dateLabel = isToday ? 'Today' : selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerDetails}>
        <Text style={styles.eyebrow}>DIARY</Text>
        <Text style={styles.date}>{dateLabel}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => setIsPickingDate((visible) => !visible)} style={styles.calendarButton}>
          <Text style={styles.calendarButtonText}>Calendar</Text>
        </Pressable>
      </View>
      {isPickingDate ? <DateTimePicker accentColor="#A6513F" display={Platform.OS === 'ios' ? 'inline' : 'default'} mode="date" onDismiss={() => setIsPickingDate(false)} onValueChange={(_, date) => { setSelectedDate(date); setIsPickingDate(false); }} presentation={Platform.OS === 'android' ? 'dialog' : 'inline'} value={selectedDate} /> : null}

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
            <View key={entry.id} style={styles.timelineItem}>
              <View style={styles.timelineRail}><Text style={styles.entryTime}>{entry.entryTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text><View style={styles.timelineDot} /><View style={styles.timelineLine} /></View>
            <Pressable
              accessibilityHint="Opens this entry for editing"
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/entry/[id]', params: { id: String(entry.id) } })}
              style={({ pressed }) => [styles.entryCard, pressed && styles.entryCardPressed]}>
              <View style={styles.entryMeta}>
                <Text style={styles.category}>{entry.category}</Text>
              </View>
              {entry.content ? <Text style={styles.entryContent}>{entry.content}</Text> : null}
              {(photosByEntryId[entry.id] ?? []).length > 0 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>{photosByEntryId[entry.id].map((path) => <Pressable key={path} onPress={() => setViewedPhotoPath(path)}><Image source={{ uri: path }} style={styles.photo} /></Pressable>)}</ScrollView> : null}
            </Pressable>
            </View>
          ))}
        </ScrollView>
      )}

      <Pressable accessibilityRole="button" onPress={() => router.push('/entry/new')} style={styles.addButton}>
        <Text style={styles.addButtonText}>Add entry</Text>
      </Pressable>
      <PhotoViewer filePath={viewedPhotoPath} onClose={() => setViewedPhotoPath(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F6F1', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 96 },
  header: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  headerDetails: { flex: 1, marginRight: 12 },
  eyebrow: { color: '#77736B', fontSize: 12, fontWeight: '600', letterSpacing: 2 },
  date: { color: '#24231F', flexShrink: 1, fontSize: 26, fontWeight: '600', letterSpacing: -0.6, marginTop: 8 },
  calendarButton: { backgroundColor: '#F3E5DF', borderRadius: 12, marginTop: 30, paddingHorizontal: 12, paddingVertical: 10 },
  calendarButtonText: { color: '#A6513F', fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 56 },
  iconCircle: { alignItems: 'center', backgroundColor: '#F3E5DF', borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  bookIcon: { color: '#A6513F', fontSize: 24, fontWeight: '700' },
  title: { color: '#24231F', fontSize: 20, fontWeight: '600', marginTop: 24 },
  description: { color: '#77736B', fontSize: 16, lineHeight: 24, marginTop: 8, maxWidth: 280, textAlign: 'center' },
  addButton: { alignItems: 'center', backgroundColor: '#A6513F', borderRadius: 16, justifyContent: 'center', minHeight: 56 },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  entriesList: { gap: 0, paddingTop: 28, paddingBottom: 24 },
  timelineItem: { flexDirection: 'row', marginBottom: 16, minHeight: 112 },
  timelineRail: { alignItems: 'center', width: 57 },
  timelineDot: { backgroundColor: '#A6513F', borderColor: '#F3E5DF', borderRadius: 7, borderWidth: 3, height: 14, marginTop: 8, width: 14 },
  timelineLine: { backgroundColor: '#D9CABC', flex: 1, marginTop: 4, width: 1 },
  entryCard: { backgroundColor: '#FFFFFF', borderColor: '#E5E0D6', borderRadius: 16, borderWidth: 1, flex: 1, padding: 16 },
  entryCardPressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  entryMeta: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  entryTime: { color: '#77736B', fontSize: 14, fontWeight: '600' },
  category: { color: '#A6513F', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  entryContent: { color: '#24231F', fontSize: 16, lineHeight: 24, marginTop: 10 },
  photoList: { marginTop: 12 },
  photo: { borderRadius: 10, height: 88, marginRight: 8, width: 88 },
});
