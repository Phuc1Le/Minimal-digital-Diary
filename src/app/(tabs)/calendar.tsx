import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getEntriesForDateRange } from '@/database/repository/entryRepository';
import type { entries } from '@/database/schema';

type Entry = typeof entries.$inferSelect;

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getMonthGrid(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const gridStart = addDays(firstDay, -firstDay.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

export default function CalendarScreen() {
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [monthEntries, setMonthEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const calendarDays = useMemo(() => getMonthGrid(visibleMonth), [visibleMonth]);
  const entryDays = useMemo(() => new Set(monthEntries.map((entry) => dayKey(entry.entryTime))), [monthEntries]);
  const selectedEntries = useMemo(
    () => monthEntries.filter((entry) => dayKey(entry.entryTime) === dayKey(selectedDate)),
    [monthEntries, selectedDate],
  );

  useFocusEffect(
    useCallback(() => {
      let isCurrent = true;
      const rangeStart = calendarDays[0];
      const rangeEnd = addDays(calendarDays[calendarDays.length - 1], 1);

      setIsLoading(true);
      getEntriesForDateRange(rangeStart, rangeEnd)
        .then((result) => {
          if (isCurrent) setMonthEntries(result);
        })
        .finally(() => {
          if (isCurrent) setIsLoading(false);
        });

      return () => {
        isCurrent = false;
      };
    }, [calendarDays]),
  );

  function changeMonth(offset: number) {
    const nextMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    setVisibleMonth(nextMonth);
    setSelectedDate(new Date(nextMonth));
  }

  const monthLabel = visibleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const selectedDateLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={styles.monthHeader}>
        <Pressable accessibilityLabel="Previous month" accessibilityRole="button" onPress={() => changeMonth(-1)} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel}</Text>
        <Pressable accessibilityLabel="Next month" accessibilityRole="button" onPress={() => changeMonth(1)} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {weekdayLabels.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
      </View>
      <View style={styles.grid}>
        {calendarDays.map((date) => {
          const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
          const isSelected = dayKey(date) === dayKey(selectedDate);
          const hasEntries = entryDays.has(dayKey(date));

          return (
            <Pressable
              key={date.toISOString()}
              accessibilityLabel={date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => setSelectedDate(date)}
              style={[styles.dayButton, isSelected && styles.dayButtonSelected]}>
              <Text style={[styles.dayText, !isCurrentMonth && styles.dayTextMuted, isSelected && styles.dayTextSelected]}>{date.getDate()}</Text>
              {hasEntries ? <View style={[styles.entryDot, isSelected && styles.entryDotSelected]} /> : <View style={styles.dotPlaceholder} />}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.eyebrow}>ENTRIES</Text>
          <Text style={styles.selectedDate}>{selectedDateLabel}</Text>
        </View>
        {isLoading ? <ActivityIndicator color="#A6513F" /> : null}
      </View>

      {!isLoading && selectedEntries.length === 0 ? (
        <Text style={styles.emptyText}>No entries for this day.</Text>
      ) : (
        <View style={styles.entriesList}>
          {selectedEntries.map((entry) => (
            <Pressable
              key={entry.id}
              accessibilityHint="Opens this entry for editing"
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/entry/[id]', params: { id: String(entry.id) } })}
              style={({ pressed }) => [styles.entryCard, pressed && styles.entryCardPressed]}>
              <View style={styles.entryMeta}>
                <Text style={styles.entryTime}>{entry.entryTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</Text>
                <Text style={styles.category}>{entry.category}</Text>
              </View>
              <Text numberOfLines={2} style={styles.entryContent}>{entry.content}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F8F6F1', flexGrow: 1, padding: 24, paddingBottom: 104 },
  monthHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  monthLabel: { color: '#24231F', fontSize: 23, fontWeight: '600' },
  monthButton: { alignItems: 'center', borderColor: '#E5E0D6', borderRadius: 18, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  monthButtonText: { color: '#A6513F', fontSize: 27, fontWeight: '400', lineHeight: 30 },
  weekdayRow: { flexDirection: 'row', marginTop: 24 },
  weekday: { color: '#77736B', flex: 1, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  dayButton: { alignItems: 'center', borderRadius: 16, height: 48, justifyContent: 'center', width: '14.2857%' },
  dayButtonSelected: { backgroundColor: '#A6513F' },
  dayText: { color: '#24231F', fontSize: 15, fontWeight: '600' },
  dayTextMuted: { color: '#B9B4AA' },
  dayTextSelected: { color: '#FFFFFF' },
  entryDot: { backgroundColor: '#A6513F', borderRadius: 3, height: 5, marginTop: 3, width: 5 },
  entryDotSelected: { backgroundColor: '#FFFFFF' },
  dotPlaceholder: { height: 8 },
  sectionHeader: { alignItems: 'center', borderTopColor: '#E5E0D6', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, paddingTop: 22 },
  eyebrow: { color: '#77736B', fontSize: 11, fontWeight: '600', letterSpacing: 1.6 },
  selectedDate: { color: '#24231F', fontSize: 18, fontWeight: '600', marginTop: 5 },
  emptyText: { color: '#77736B', fontSize: 16, marginTop: 18 },
  entriesList: { gap: 10, marginTop: 18 },
  entryCard: { backgroundColor: '#FFFFFF', borderColor: '#E5E0D6', borderRadius: 16, borderWidth: 1, padding: 15 },
  entryCardPressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  entryMeta: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  entryTime: { color: '#77736B', fontSize: 14, fontWeight: '600' },
  category: { color: '#A6513F', fontSize: 13, fontWeight: '600', textTransform: 'capitalize' },
  entryContent: { color: '#24231F', fontSize: 16, lineHeight: 23, marginTop: 8 },
});
