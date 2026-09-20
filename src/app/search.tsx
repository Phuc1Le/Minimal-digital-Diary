import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function SearchScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.searchField}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          placeholder="Search your diary"
          placeholderTextColor="#9A958C"
          returnKeyType="search"
          style={styles.input}
        />
      </View>
      <View style={styles.emptyState}>
        <Text style={styles.icon}>⌕</Text>
        <Text style={styles.title}>Find a memory</Text>
        <Text style={styles.description}>Search will look through the words you have written.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F8F6F1', flex: 1, paddingHorizontal: 24, paddingTop: 20 },
  searchField: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E5E0D6', borderRadius: 16, borderWidth: 1, flexDirection: 'row', minHeight: 52, paddingHorizontal: 16 },
  searchIcon: { color: '#77736B', fontSize: 24, marginRight: 10 },
  input: { color: '#24231F', flex: 1, fontSize: 16, paddingVertical: 10 },
  emptyState: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 76 },
  icon: { color: '#A6513F', fontSize: 32 },
  title: { color: '#24231F', fontSize: 20, fontWeight: '600', marginTop: 20 },
  description: { color: '#77736B', fontSize: 16, lineHeight: 24, marginTop: 8, maxWidth: 280, textAlign: 'center' },
});
