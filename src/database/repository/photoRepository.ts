import { and, eq, inArray } from 'drizzle-orm';

import { db } from '@/database/client';
import { photos } from '@/database/schema';

export async function addPhotos(entryId: number, filePaths: string[]) {
  if (filePaths.length === 0) return [];
  return db.insert(photos).values(filePaths.map((filePath) => ({ entryId, filePath }))).returning();
}

export async function getPhotosForEntry(entryId: number) {
  return db.select().from(photos).where(eq(photos.entryId, entryId));
}

export async function getPhotosForEntries(entryIds: number[]) {
  if (entryIds.length === 0) return [];

  return db.select().from(photos).where(inArray(photos.entryId, entryIds));
}

export async function deletePhotoForEntry(entryId: number, filePath: string) {
  const [deletedPhoto] = await db.delete(photos).where(and(eq(photos.entryId, entryId), eq(photos.filePath, filePath))).returning();
  if (!deletedPhoto) throw new Error('This photo no longer exists.');
  return deletedPhoto;
}
