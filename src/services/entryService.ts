import { deleteEntry, getEntryById, insertEntry, updateEntry } from '@/database/repository/entryRepository';
import { addPhotos } from '@/database/repository/photoRepository';
import { getPhotosForEntry } from '@/database/repository/photoRepository';
import { deleteStoredPhoto } from '@/services/photoService';
import type { EntryCategory } from '@/database/schema';

export type TextEntryInput = {
  category: EntryCategory;
  content: string;
  entryTime: Date;
  photoPaths?: string[];
};

function getValidatedContent(content: string, photoPaths: string[] = []) {
  const normalizedContent = content.trim();

  if (!normalizedContent && photoPaths.length === 0) {
    throw new Error('Write something or attach a photo before saving an entry.');
  }

  return normalizedContent;
}

export async function createTextEntry(input: TextEntryInput) {
  const content = getValidatedContent(input.content, input.photoPaths);

  const now = new Date();

  const entry = await insertEntry({
    category: input.category,
    content,
    entryTime: input.entryTime,
    createdAt: now,
    updatedAt: now,
  });
  await addPhotos(entry.id, input.photoPaths ?? []);
  return entry;
}

export async function updateTextEntry(id: number, input: TextEntryInput) {
  const entry = await updateEntry(id, {
    category: input.category,
    content: getValidatedContent(input.content, input.photoPaths),
    entryTime: input.entryTime,
    updatedAt: new Date(),
  });
  await addPhotos(id, input.photoPaths ?? []);
  return entry;
}

export async function loadEntry(id: number) {
  return getEntryById(id);
}

export async function removeEntry(id: number) {
  const attachedPhotos = await getPhotosForEntry(id);
  await Promise.all(attachedPhotos.map((photo) => deleteStoredPhoto(photo.filePath)));
  await deleteEntry(id);
}
