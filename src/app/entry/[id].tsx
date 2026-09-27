import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { PhotoViewer } from '@/components/photo-viewer';
import type { entries } from '@/database/schema';
import { loadEntry } from '@/services/entryService';
import { loadPhotoPathsForEntries } from '@/services/photoService';

type Entry = typeof entries.$inferSelect;

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const entryId = Number(id);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewedPhoto, setViewedPhoto] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    let isCurrent = true;
    setIsLoading(true);
    Promise.all([loadEntry(entryId), loadPhotoPathsForEntries([entryId])])
      .then(([loadedEntry, photoRows]) => { if (isCurrent) { setEntry(loadedEntry ?? null); setPhotos(photoRows.map((photo) => photo.filePath)); } })
      .finally(() => { if (isCurrent) setIsLoading(false); });
    return () => { isCurrent = false; };
  }, [entryId]));

  if (isLoading) return <View style={styles.status}><ActivityIndicator color="#A6513F" /></View>;
  if (!entry) return <View style={styles.status}><Text style={styles.missing}>This entry could not be found.</Text></View>;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerRight: () => <Pressable onPress={() => router.push({ pathname: '/entry/[id]/edit', params: { id: String(entry.id) } })}><Text style={styles.edit}>Edit</Text></Pressable> }} />
      {entry.content ? <ScrollView style={[styles.description, photos.length === 0 && styles.fullSection]} contentContainerStyle={styles.descriptionContent}>
        <Text style={styles.meta}>{entry.entryTime.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })} · {entry.category}</Text>
        <Text style={styles.content}>{entry.content}</Text>
      </ScrollView> : null}
      <View style={[styles.photos, !entry.content && styles.fullSection, photos.length === 0 && styles.noPhotos]}>
        {photos.length ? <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>{photos.map((path) => <Pressable key={path} onPress={() => setViewedPhoto(path)} style={[styles.photoPage, { width }]}><Image resizeMode="contain" source={{ uri: path }} style={[styles.photo, { width }]} /></Pressable>)}</ScrollView> : null}
      </View>
      <PhotoViewer filePath={viewedPhoto} onClose={() => setViewedPhoto(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F8F6F1', flex: 1 }, status: { alignItems: 'center', backgroundColor: '#F8F6F1', flex: 1, justifyContent: 'center' }, missing: { color: '#24231F', fontSize: 17 },
  description: { flex: 2 }, fullSection: { flex: 1 }, descriptionContent: { padding: 24 }, meta: { color: '#A6513F', fontSize: 14, fontWeight: '600', textTransform: 'capitalize' }, content: { color: '#24231F', fontSize: 17, lineHeight: 25, marginTop: 10 },
  photos: { backgroundColor: '#EDE8DE', flex: 8 }, noPhotos: { flex: 0 }, photoPage: { alignItems: 'center', justifyContent: 'center' }, photo: { height: '100%' }, edit: { color: '#A6513F', fontSize: 16, fontWeight: '600', padding: 4 },
});
