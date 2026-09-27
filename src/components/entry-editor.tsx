import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import {
  Keyboard,
  KeyboardAvoidingView,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { entryCategories, type EntryCategory, type entries } from '@/database/schema';
import type { TextEntryInput } from '@/services/entryService';
import { FeedbackDialog } from '@/components/feedback-dialog';
import { deleteStoredPhoto, pickAndStorePhotos, takeAndStorePhoto } from '@/services/photoService';
import { PhotoViewer } from '@/components/photo-viewer';

type Entry = typeof entries.$inferSelect;

type EntryEditorProps = {
  initialEntry?: Entry;
  initialPhotoPaths?: string[];
  onDelete?: () => Promise<void>;
  onRemovePhoto?: (entryId: number, filePath: string) => Promise<void>;
  onSave: (input: TextEntryInput) => Promise<Entry>;
};

export function EntryEditor({ initialEntry, initialPhotoPaths = [], onDelete, onRemovePhoto, onSave }: EntryEditorProps) {
  const [category, setCategory] = useState<EntryCategory>(initialEntry?.category ?? 'activity');
  const [currentEntryId, setCurrentEntryId] = useState<number | null>(initialEntry?.id ?? null);
  const [content, setContent] = useState(initialEntry?.content ?? '');
  const [entryTime, setEntryTime] = useState(initialEntry?.entryTime ?? new Date());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPickingDate, setIsPickingDate] = useState(false);
  const [photoPaths, setPhotoPaths] = useState<string[]>(initialPhotoPaths);
  const [pendingPhotoPaths, setPendingPhotoPaths] = useState<string[]>([]);
  const [viewedPhotoPath, setViewedPhotoPath] = useState<string | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardWillShow', () => setIsKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardWillHide', () => setIsKeyboardVisible(false));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  const [dialog, setDialog] = useState<'saved' | 'unsaved' | 'delete' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSave(showConfirmation = true) {
    if (isSaving || isDeleting) return false;
    setIsSaving(true);

    try {
      const savedEntry = await onSave({ category, content, entryTime, photoPaths: pendingPhotoPaths });
      setCurrentEntryId(savedEntry.id);
      setEntryTime(savedEntry.entryTime);
      setHasUnsavedChanges(false);
      setPendingPhotoPaths([]);

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

  async function addPhotos(source: 'library' | 'camera') {
    try {
      const pickedPaths = source === 'library' ? await pickAndStorePhotos() : await takeAndStorePhoto();
      if (pickedPaths.length > 0) {
        setPhotoPaths((current) => [...current, ...pickedPaths]);
        setPendingPhotoPaths((current) => [...current, ...pickedPaths]);
        setHasUnsavedChanges(true);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to add photos.');
    }
  }

  async function removePhoto(filePath: string) {
    try {
      if (pendingPhotoPaths.includes(filePath)) await deleteStoredPhoto(filePath);
      else if (currentEntryId && onRemovePhoto) await onRemovePhoto(currentEntryId, filePath);
      setPhotoPaths((current) => current.filter((path) => path !== filePath));
      setPendingPhotoPaths((current) => current.filter((path) => path !== filePath));
      setHasUnsavedChanges(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to remove this photo.');
    }
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

        <>
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
        </>

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

        {!isKeyboardVisible ? <View style={styles.photoSection}>
          <View style={styles.photoActions}>
            <Pressable accessibilityRole="button" onPress={() => void addPhotos('library')} style={styles.photoButton}><Text style={styles.photoButtonText}>Choose photo</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={() => void addPhotos('camera')} style={styles.photoButton}><Text style={styles.photoButtonText}>Take photo</Text></Pressable>
          </View>
          {photoPaths.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
              {photoPaths.map((filePath) => (
                <View key={filePath} style={styles.photoTile}>
                  <Pressable onPress={() => setViewedPhotoPath(filePath)}><Image source={{ uri: filePath }} style={styles.photoPreview} /></Pressable>
                  <Pressable accessibilityLabel="Remove photo" accessibilityRole="button" onPress={() => void removePhoto(filePath)} style={styles.photoDeleteButton}>
                    <Text style={styles.photoDeleteButtonText}>×</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          ) : null}
        </View> : null}

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
          actions={[
            { label: 'Keep writing', onPress: () => setDialog(null), tone: 'secondary' },
            { label: 'Done', onPress: () => router.dismissAll() },
          ]}
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
        <PhotoViewer filePath={viewedPhotoPath} onClose={() => setViewedPhotoPath(null)} />
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
  photoSection: { marginTop: 12 },
  photoActions: { flexDirection: 'row', gap: 8 },
  photoButton: { alignItems: 'center', borderColor: '#A6513F', borderRadius: 12, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 42 },
  photoButtonText: { color: '#A6513F', fontSize: 15, fontWeight: '600' },
  photoList: { marginTop: 10 },
  photoTile: { height: 70, marginRight: 8, position: 'relative', width: 70 },
  photoPreview: { borderRadius: 10, height: 70, width: 70 },
  photoDeleteButton: { alignItems: 'center', backgroundColor: '#7A2E24', borderColor: '#FFFFFF', borderRadius: 11, borderWidth: 1.5, height: 22, justifyContent: 'center', position: 'absolute', right: -5, top: -5, width: 22 },
  photoDeleteButtonText: { color: '#FFFFFF', fontSize: 18, lineHeight: 19 },
  saveButton: { alignItems: 'center', backgroundColor: '#A6513F', borderRadius: 16, justifyContent: 'center', marginTop: 16, minHeight: 56 },
  buttonDisabled: { opacity: 0.65 },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  deleteButton: { alignItems: 'center', marginTop: 16, minHeight: 36 },
  deleteButtonText: { color: '#B42318', fontSize: 15, fontWeight: '600' },
  doneButton: { paddingHorizontal: 4, paddingVertical: 8 },
  doneButtonText: { color: '#A6513F', fontSize: 16, fontWeight: '600' },
});
