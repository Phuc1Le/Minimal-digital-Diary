import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { EntryEditor } from '@/components/entry-editor';
import type { entries } from '@/database/schema';
import { loadEntry, removeEntry, updateTextEntry } from '@/services/entryService';

type Entry = typeof entries.$inferSelect;

export default function EditEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entryId = Number(id);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isInteger(entryId) || entryId <= 0) {
      setMessage('This entry could not be found.');
      setIsLoading(false);
      return;
    }

    loadEntry(entryId)
      .then((result) => {
        if (result) setEntry(result);
        else setMessage('This entry could not be found.');
      })
      .catch(() => setMessage('Unable to open this entry.'))
      .finally(() => setIsLoading(false));
  }, [entryId]);

  if (isLoading) {
    return (
      <View style={styles.statusScreen}>
        <ActivityIndicator color="#A6513F" />
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.statusScreen}>
        <Text style={styles.statusTitle}>{message}</Text>
      </View>
    );
  }

  return (
    <EntryEditor
      initialEntry={entry}
      onDelete={() => removeEntry(entry.id)}
      onSave={(input) => updateTextEntry(entry.id, input)}
    />
  );
}

const styles = StyleSheet.create({
  statusScreen: { alignItems: 'center', backgroundColor: '#F8F6F1', flex: 1, justifyContent: 'center', padding: 24 },
  statusTitle: { color: '#24231F', fontSize: 18, fontWeight: '600', textAlign: 'center' },
});
