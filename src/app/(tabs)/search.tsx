import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Keyboard, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getRecentEntries, searchEntries } from '@/database/repository/entryRepository';
import type { EntryCategory, entries } from '@/database/schema';

type Entry = typeof entries.$inferSelect;
type CategoryFilter = 'all' | EntryCategory;
type TimeRange = 'any' | 'week' | 'month' | 'year';
type Filters = { category: CategoryFilter; timeRange: TimeRange };
type SearchRequest = Filters & { query: string };

const defaultFilters: Filters = { category: 'all', timeRange: 'any' };

function getRangeStart(range: TimeRange) {
  if (range === 'any') return undefined;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === 'week') start.setDate(start.getDate() - 7);
  if (range === 'month') start.setDate(start.getDate() - 30);
  if (range === 'year') start.setFullYear(start.getFullYear() - 1);
  return start;
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Filters>(defaultFilters);
  const [draftFilters, setDraftFilters] = useState<Filters>(defaultFilters);
  const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;
      setIsLoading(true);

      const request = searchRequest;
      const loadEntries = request
        ? searchEntries(request.query, request.category === 'all' ? undefined : request.category, getRangeStart(request.timeRange))
        : getRecentEntries();

      loadEntries
        .then((loadedEntries) => {
          if (isCurrent) setEntries(loadedEntries);
        })
        .finally(() => {
          if (isCurrent) setIsLoading(false);
        });

      return () => {
        isCurrent = false;
      };
    }, [searchRequest]),
  );

  const activeFilterCount = Number(activeFilters.category !== 'all') + Number(activeFilters.timeRange !== 'any');

  function runSearch(filters = activeFilters) {
    Keyboard.dismiss();
    const normalizedQuery = query.trim();

    if (!normalizedQuery && filters.category === 'all' && filters.timeRange === 'any') {
      setSearchRequest(null);
      return;
    }

    setSearchRequest({ query: normalizedQuery, ...filters });
  }

  function openFilters() {
    setDraftFilters(activeFilters);
    setIsFilterSheetVisible(true);
  }

  function applyFilters() {
    setActiveFilters(draftFilters);
    setIsFilterSheetVisible(false);
    runSearch(draftFilters);
  }

  const isShowingSearchResults = searchRequest !== null;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.toolbar}>
        <View style={styles.searchField}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            onSubmitEditing={() => runSearch()}
            placeholder="Search your diary"
            placeholderTextColor="#9A958C"
            returnKeyType="search"
            style={styles.input}
            value={query}
          />
        </View>
        <Pressable accessibilityRole="button" onPress={openFilters} style={styles.filterButton}>
          <Text style={styles.filterButtonText}>{activeFilterCount ? `Filters (${activeFilterCount})` : 'Filters'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => runSearch()} style={styles.searchButton}>
          <Text style={styles.searchButtonText}>Search</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isLoading ? (
          <View style={styles.statusState}><ActivityIndicator color="#A6513F" /></View>
        ) : entries.length === 0 ? (
          <View style={styles.statusState}>
            <Text style={styles.title}>{isShowingSearchResults ? 'No matching entries' : 'Your diary is waiting'}</Text>
            <Text style={styles.description}>{isShowingSearchResults ? 'Try different words or adjust Filters.' : 'Your three most recent entries will appear here once you start writing.'}</Text>
          </View>
        ) : (
          <View style={styles.results}>
            <Text style={styles.resultCount}>
              {isShowingSearchResults
                ? entries.length === 100 ? 'Showing the first 100 matches' : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}`
                : 'Recent entries'}
            </Text>
            {entries.map((entry) => (
              <Pressable
                key={entry.id}
                accessibilityHint="Opens this entry for editing"
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/entry/[id]', params: { id: String(entry.id) } })}
                style={({ pressed }) => [styles.entryCard, pressed && styles.entryCardPressed]}>
                <View style={styles.entryMeta}>
                  <Text style={styles.entryDate}>{entry.entryTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                  <Text style={styles.category}>{entry.category}</Text>
                </View>
                <Text numberOfLines={3} style={styles.entryContent}>{entry.content}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal animationType="slide" transparent visible={isFilterSheetVisible} onRequestClose={() => setIsFilterSheetVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View accessibilityViewIsModal style={styles.filterSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <Pressable accessibilityRole="button" onPress={() => setIsFilterSheetVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>

            <Text style={styles.sheetLabel}>ENTRY TYPE</Text>
            <View style={styles.optionRow}>
              {(['all', 'activity', 'thought', 'event'] as CategoryFilter[]).map((filter) => (
                <Pressable key={filter} onPress={() => setDraftFilters((current) => ({ ...current, category: filter }))} style={[styles.option, draftFilters.category === filter && styles.optionSelected]}>
                  <Text style={[styles.optionText, draftFilters.category === filter && styles.optionTextSelected]}>{filter === 'all' ? 'All' : filter}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.sheetLabel, styles.timeRangeLabel]}>TIME RANGE</Text>
            <View style={styles.timeRangeList}>
              {([
                ['any', 'Any time'],
                ['week', 'Last 7 days'],
                ['month', 'Last 30 days'],
                ['year', 'Last year'],
              ] as [TimeRange, string][]).map(([range, label]) => (
                <Pressable key={range} onPress={() => setDraftFilters((current) => ({ ...current, timeRange: range }))} style={[styles.rangeOption, draftFilters.timeRange === range && styles.rangeOptionSelected]}>
                  <Text style={[styles.rangeOptionText, draftFilters.timeRange === range && styles.rangeOptionTextSelected]}>{label}</Text>
                  {draftFilters.timeRange === range ? <Text style={styles.checkmark}>Selected</Text> : null}
                </Pressable>
              ))}
            </View>

            <View style={styles.sheetActions}>
              <Pressable onPress={() => setDraftFilters(defaultFilters)} style={styles.resetButton}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </Pressable>
              <Pressable onPress={applyFilters} style={styles.applyButton}>
                <Text style={styles.applyButtonText}>Apply filters</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F8F6F1', flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  toolbar: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  searchField: { backgroundColor: '#FFFFFF', borderColor: '#E5E0D6', borderRadius: 12, borderWidth: 1, flex: 1, minHeight: 44, paddingHorizontal: 12 },
  input: { color: '#24231F', fontSize: 15, paddingVertical: 7 },
  filterButton: { alignItems: 'center', backgroundColor: '#F3E5DF', borderRadius: 12, justifyContent: 'center', minHeight: 44, paddingHorizontal: 10 },
  filterButtonText: { color: '#A6513F', fontSize: 13, fontWeight: '700' },
  searchButton: { alignItems: 'center', backgroundColor: '#A6513F', borderRadius: 12, justifyContent: 'center', minHeight: 44, paddingHorizontal: 10 },
  searchButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  content: { flexGrow: 1, paddingBottom: 96 },
  statusState: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 76 },
  title: { color: '#24231F', fontSize: 20, fontWeight: '600', marginTop: 20 },
  description: { color: '#77736B', fontSize: 16, lineHeight: 24, marginTop: 8, maxWidth: 280, textAlign: 'center' },
  results: { gap: 10, marginTop: 24 },
  resultCount: { color: '#77736B', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  entryCard: { backgroundColor: '#FFFFFF', borderColor: '#E5E0D6', borderRadius: 16, borderWidth: 1, padding: 15 },
  entryCardPressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  entryMeta: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  entryDate: { color: '#77736B', fontSize: 14, fontWeight: '600' },
  category: { color: '#A6513F', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  entryContent: { color: '#24231F', fontSize: 16, lineHeight: 23, marginTop: 8 },
  modalBackdrop: { backgroundColor: 'rgba(36, 35, 31, 0.34)', flex: 1, justifyContent: 'flex-end' },
  filterSheet: { backgroundColor: '#F8F6F1', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 34 },
  sheetHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sheetTitle: { color: '#24231F', fontSize: 22, fontWeight: '600' },
  closeButton: { paddingVertical: 8 },
  closeButtonText: { color: '#A6513F', fontSize: 15, fontWeight: '600' },
  sheetLabel: { color: '#77736B', fontSize: 12, fontWeight: '600', letterSpacing: 1.4, marginTop: 24 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  option: { borderColor: '#E5E0D6', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9 },
  optionSelected: { backgroundColor: '#F3E5DF', borderColor: '#A6513F' },
  optionText: { color: '#77736B', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  optionTextSelected: { color: '#A6513F' },
  timeRangeLabel: { marginTop: 22 },
  timeRangeList: { gap: 8, marginTop: 10 },
  rangeOption: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: '#E5E0D6', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 46, paddingHorizontal: 14 },
  rangeOptionSelected: { borderColor: '#A6513F' },
  rangeOptionText: { color: '#24231F', fontSize: 15 },
  rangeOptionTextSelected: { color: '#A6513F', fontWeight: '600' },
  checkmark: { color: '#A6513F', fontSize: 12, fontWeight: '700' },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 24 },
  resetButton: { alignItems: 'center', borderColor: '#E5E0D6', borderRadius: 14, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 50 },
  resetButtonText: { color: '#77736B', fontSize: 15, fontWeight: '600' },
  applyButton: { alignItems: 'center', backgroundColor: '#A6513F', borderRadius: 14, flex: 2, justifyContent: 'center', minHeight: 50 },
  applyButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
