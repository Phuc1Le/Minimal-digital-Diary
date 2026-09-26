import { EntryEditor } from '@/components/entry-editor';
import { useState } from 'react';

import { createTextEntry, type TextEntryInput, updateTextEntry } from '@/services/entryService';

export default function NewEntryScreen() {
  const [savedEntryId, setSavedEntryId] = useState<number | null>(null);

  async function saveEntry(input: TextEntryInput) {
    const savedEntry = savedEntryId
      ? await updateTextEntry(savedEntryId, input)
      : await createTextEntry(input);

    setSavedEntryId(savedEntry.id);
    return savedEntry;
  }

  return <EntryEditor onSave={saveEntry} />;
}
