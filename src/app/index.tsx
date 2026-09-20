import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

const today = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
}).format(new Date());

export default function DiaryScreen() {
  return (
    <View style={styles.screen}>
      <View>
        <Text style={styles.eyebrow}>TODAY</Text>
        <Text style={styles.date}>{today}</Text>
      </View>

      <View style={styles.emptyState}>
        <View style={styles.iconCircle}>
          <Text style={styles.bookIcon}>⌁</Text>
        </View>
        <Text style={styles.title}>A blank page awaits</Text>
        <Text style={styles.description}>Capture a moment, thought, or event from your day.</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => Alert.alert('Coming next', 'Entry creation will be available after the local database is connected.')}
        style={styles.addButton}>
        <Text style={styles.addButtonText}>＋  Add entry</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F6F1', paddingHorizontal: 24, paddingTop: 28, paddingBottom: 28 },
  eyebrow: { color: '#77736B', fontSize: 12, fontWeight: '600', letterSpacing: 2 },
  date: { color: '#24231F', fontSize: 29, fontWeight: '600', letterSpacing: -0.6, marginTop: 8 },
  emptyState: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 56 },
  iconCircle: { alignItems: 'center', backgroundColor: '#F3E5DF', borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  bookIcon: { color: '#A6513F', fontSize: 30, fontWeight: '700' },
  title: { color: '#24231F', fontSize: 20, fontWeight: '600', marginTop: 24 },
  description: { color: '#77736B', fontSize: 16, lineHeight: 24, marginTop: 8, maxWidth: 280, textAlign: 'center' },
  addButton: { alignItems: 'center', backgroundColor: '#A6513F', borderRadius: 16, justifyContent: 'center', minHeight: 56 },
  addButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
