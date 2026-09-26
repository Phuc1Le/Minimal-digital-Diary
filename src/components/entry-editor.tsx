import { router, Stack } from 'expo-router';
import { useState } from 'react';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { entryCategories, type EntryCategory, type entries } from '@/database/schema';
import type { TextEntryInput } from '@/services/entryService';
import { FeedbackDialog } from '@/components/feedback-dialog';

type Entry = typeof entries.$inferSelect;

type EntryEditorProps = {
  initialEntry?: Entry;
  onDelete?: () => Promise<void>;
  onSave: (input: TextEntryInput) => Promise<Entry>;
};

export function EntryEditor({ initialEntry, onDelete, onSave }: EntryEditorProps) {
  const [category, setCategory] = useState<EntryCategory>(initialEntry?.category ?? 'activity');
  const [content, setContent] = useState(initialEntry?.content ?? '');
  const [entryTime, setEntryTime] = useState(initialEntry?.entryTime ?? new Date());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPickingDate, setIsPickingDate] = useState(false);
  const [dialog, setDialog] = useState<'saved' | 'unsaved' | 'delete' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSave(showConfirmation = true) {
    if (isSaving || isDeleting) return false;
    setIsSaving(true);

    try {
      const savedEntry = await onSave({ category, content, entryTime });
      setEntryTime(savedEntry.entryTime);
      setHasUnsavedChanges(false);

      if (showConfirmation) setDialog('saved');
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Please try again.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function saveAndExit() {
    const didSave = await handleSave(false);
    if (didSave) router.back();
  }

  async function handleDelete() {
    if (!onDelete || isDeleting) return;
    setIsDeleting(true);

    try {
      await onDelete();
      router.back();
    } catch (error) {
      setDialog(null);
      setErrorMessage(error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }

  function handleDone() {
    Keyboard.dismiss();

    if (!hasUnsavedChanges) {
      router.back();
      return;
    }

    setDialog('unsaved');
  }

  function selectCategory(nextCategory: EntryCategory) {
    if (nextCategory !== category) {
      setCategory(nextCategory);
      setHasUnsavedChanges(true);
    }
  }

  function updateEntryDate(nextDate: Date) {
    const nextEntryTime = new Date(entryTime);
    nextEntryTime.setFullYear(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
    setEntryTime(nextEntryTime);
    setHasUnsavedChanges(true);
  }

  return (
    <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 56 : 0}
        style={styles.screen}>
        <Stack.Screen
          options={{
            headerRight: () => (
              <Pressable accessibilityRole="button" onPress={handleDone} style={styles.doneButton}>
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            ),
          }}
        />

        <View style={styles.dateRow}>
          <View>
            <Text style={styles.label}>DATE</Text>
            <Text style={styles.dateValue}>{entryTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => setIsPickingDate((visible) => !visible)} style={styles.changeDateButton}>
            <Text style={styles.changeDateButtonText}>{isPickingDate ? 'Hide' : 'Change'}</Text>
          </Pressable>
        </View>
        {isPickingDate ? (
          <DateTimePicker
            accentColor="#A6513F"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            mode="date"
            onDismiss={() => setIsPickingDate(false)}
            onValueChange={(_, nextDate) => {
              updateEntryDate(nextDate);
              if (Platform.OS === 'android') setIsPickingDate(false);
            }}
            presentation={Platform.OS === 'android' ? 'dialog' : 'inline'}
            value={entryTime}
          />
        ) : null}

        <Text style={[styles.label, styles.categoryLabel]}>CATEGORY</Text>
        <View style={styles.categoryRow}>
          {entryCategories.map((item) => {
            const selected = item === category;

            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => selectCategory(item)}
                style={[styles.categoryButton, selected && styles.categoryButtonSelected]}>
                <Text style={[styles.categoryButtonText, selected && styles.categoryButtonTextSelected]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.label, styles.entryLabel]}>ENTRY</Text>
        <TextInput
          multiline
          onChangeText={(nextContent) => {
            setContent(nextContent);
            setHasUnsavedChanges(true);
          }}
          placeholder="Write about your day..."
          placeholderTextColor="#9A958C"
          style={styles.editor}
          textAlignVertical="top"
          value={content}
        />

        <Pressable
          accessibilityRole="button"
          disabled={isSaving || isDeleting}
          onPress={() => void handleSave()}
          style={[styles.saveButton, (isSaving || isDeleting) && styles.buttonDisabled]}>
          <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save entry'}</Text>
        </Pressable>

        {onDelete ? (
          <Pressable accessibilityRole="button" disabled={isDeleting} onPress={() => setDialog('delete')} style={styles.deleteButton}>
            <Text style={styles.deleteButtonText}>Delete entry</Text>
          </Pressable>
        ) : null}

        <FeedbackDialog
          actions={[{ label: 'Keep writing', onPress: () => setDialog(null) }]}
          message="Your entry is saved and remains open for editing."
          title="Entry saved"
          visible={dialog === 'saved'}
        />
        <FeedbackDialog
          actions={[
            { label: 'Discard', onPress: () => router.back(), tone: 'destructive' },
            { label: 'Save entry', onPress: () => { setDialog(null); void saveAndExit(); } },
          ]}
          message="You have changes that have not been saved."
          title="Save this entry?"
          visible={dialog === 'unsaved'}
        />
        <FeedbackDialog
          actions={[
            { label: 'Cancel', onPress: () => setDialog(null), tone: 'secondary' },
            { label: isDeleting ? 'Deleting...' : 'Delete', onPress: () => void handleDelete(), tone: 'destructive' },
          ]}
          message="This permanently removes the entry from this device."
          title="Delete this entry?"
          visible={dialog === 'delete'}
        />
        <FeedbackDialog
          actions={[{ label: 'Okay', onPress: () => setErrorMessage(null) }]}
          message={errorMessage ?? ''}
          title="Unable to save entry"
          visible={errorMessage !== null}
        />
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F8F6F1', flex: 1, padding: 24 },
  label: { color: '#77736B', fontSize: 12, fontWeight: '600', letterSpacing: 1.6 },
  dateRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  dateValue: { color: '#24231F', fontSize: 17, fontWeight: '600', marginTop: 5 },
  changeDateButton: { backgroundColor: '#F3E5DF', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  changeDateButtonText: { color: '#A6513F', fontSize: 14, fontWeight: '600' },
  categoryLabel: { marginTop: 22 },
  categoryRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  categoryButton: { borderColor: '#E5E0D6', borderRadius: 12, borderWidth: 1, flex: 1, paddingHorizontal: 8, paddingVertical: 10 },
  categoryButtonSelected: { backgroundColor: '#F3E5DF', borderColor: '#A6513F' },
  categoryButtonText: { color: '#77736B', fontSize: 13, fontWeight: '600', textAlign: 'center', textTransform: 'capitalize' },
  categoryButtonTextSelected: { color: '#A6513F' },
  entryLabel: { marginTop: 28 },
  editor: { backgroundColor: '#FFFFFF', borderColor: '#E5E0D6', borderRadius: 16, borderWidth: 1, color: '#24231F', flex: 1, fontSize: 17, lineHeight: 25, marginTop: 10, padding: 16 },
  saveButton: { alignItems: 'center', backgroundColor: '#A6513F', borderRadius: 16, justifyContent: 'center', marginTop: 16, minHeight: 56 },
  buttonDisabled: { opacity: 0.65 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  deleteButton: { alignItems: 'center', marginTop: 16, minHeight: 36 },
  deleteButtonText: { color: '#B42318', fontSize: 15, fontWeight: '600' },
  doneButton: { paddingHorizontal: 4, paddingVertical: 8 },
  doneButtonText: { color: '#A6513F', fontSize: 16, fontWeight: '600' },
});
