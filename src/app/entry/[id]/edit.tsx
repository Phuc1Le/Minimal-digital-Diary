import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { EntryEditor } from '@/components/entry-editor';
import type { entries } from '@/database/schema';
import { loadEntry, removeEntry, updateTextEntry } from '@/services/entryService';
import { loadPhotoPathsForEntries, removePhotoFromEntry } from '@/services/photoService';

type Entry = typeof entries.$inferSelect;

export default function EditEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const entryId = Number(id);
  const [entry, setEntry] = useState<Entry | null>(null); const [photos, setPhotos] = useState<string[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { Promise.all([loadEntry(entryId), loadPhotoPathsForEntries([entryId])]).then(([result, rows]) => { setEntry(result ?? null); setPhotos(rows.map((photo) => photo.filePath)); }).finally(() => setLoading(false)); }, [entryId]);
  if (loading) return <View style={styles.status}><ActivityIndicator color="#A6513F" /></View>;
  if (!entry) return <View style={styles.status}><Text>Unable to open this entry.</Text></View>;
  return <EntryEditor initialEntry={entry} initialPhotoPaths={photos} onDelete={() => removeEntry(entry.id)} onRemovePhoto={removePhotoFromEntry} onSave={(input) => updateTextEntry(entry.id, input)} />;
}
const styles = StyleSheet.create({ status: { alignItems: 'center', backgroundColor: '#F8F6F1', flex: 1, justifyContent: 'center' } });
