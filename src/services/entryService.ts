import { deleteEntry, getEntryById, insertEntry, updateEntry } from '@/database/repository/entryRepository';
import type { EntryCategory } from '@/database/schema';

export type TextEntryInput = {
  category: EntryCategory;
  content: string;
  entryTime: Date;
};

function getValidatedContent(content: string) {
  const normalizedContent = content.trim();

  if (!normalizedContent) {
    throw new Error('Write something before saving an entry.');
  }

  return normalizedContent;
}

export async function createTextEntry(input: TextEntryInput) {
  const content = getValidatedContent(input.content);

  const now = new Date();

  return insertEntry({
    category: input.category,
    content,
    entryTime: input.entryTime,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateTextEntry(id: number, input: TextEntryInput) {
  return updateEntry(id, {
    category: input.category,
    content: getValidatedContent(input.content),
    entryTime: input.entryTime,
    updatedAt: new Date(),
  });
}

export async function loadEntry(id: number) {
  return getEntryById(id);
}

export async function removeEntry(id: number) {
  await deleteEntry(id);
}
