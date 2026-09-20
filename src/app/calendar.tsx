import { StyleSheet, Text, View } from 'react-native';

export default function CalendarScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.emptyState}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>□</Text>
        </View>
        <Text style={styles.title}>Your days, together</Text>
        <Text style={styles.description}>Dates with diary entries will appear here when you begin writing.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F8F6F1', flex: 1, paddingHorizontal: 24 },
  emptyState: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 56 },
  iconCircle: { alignItems: 'center', backgroundColor: '#F3E5DF', borderRadius: 32, height: 64, justifyContent: 'center', width: 64 },
  icon: { color: '#A6513F', fontSize: 28, fontWeight: '700' },
  title: { color: '#24231F', fontSize: 20, fontWeight: '600', marginTop: 24 },
  description: { color: '#77736B', fontSize: 16, lineHeight: 24, marginTop: 8, maxWidth: 280, textAlign: 'center' },
});
