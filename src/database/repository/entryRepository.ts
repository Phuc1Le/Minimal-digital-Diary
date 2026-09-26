import { and, asc, desc, eq, gte, like, lt, type SQL } from 'drizzle-orm';

import { db } from '@/database/client';
import { entries } from '@/database/schema';

function getDayBounds(date: Date){
    const start = new Date(date);
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return {start, end};
}

export async function getEntriesForDay(date: Date){
    const {start, end} = getDayBounds(date);
    return db
        .select()
        .from(entries)
        .where(and(gte(entries.entryTime, start), lt(entries.entryTime, end)))
        .orderBy(asc(entries.entryTime));
}

export async function getEntriesForDateRange(start: Date, end: Date) {
  return db
    .select()
    .from(entries)
    .where(and(gte(entries.entryTime, start), lt(entries.entryTime, end)))
    .orderBy(asc(entries.entryTime));
}

export async function searchEntries(
  query: string,
  category?: typeof entries.$inferSelect['category'],
  startDate?: Date,
) {
  const filters: SQL[] = [];
  const normalizedQuery = query.trim();

  if (normalizedQuery) {
    filters.push(like(entries.content, `%${normalizedQuery}%`));
  }

  if (category) {
    filters.push(eq(entries.category, category));
  }

  if (startDate) {
    filters.push(gte(entries.entryTime, startDate));
  }

  return db
    .select()
    .from(entries)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(entries.entryTime))
    .limit(100);
}

export async function getRecentEntries(limit = 3) {
  return db.select().from(entries).orderBy(desc(entries.entryTime)).limit(limit);
}

export async function getEntryById(id: number) {
  return db.select().from(entries).where(eq(entries.id, id)).get();
}

export type NewEntry = typeof entries.$inferInsert;

export async function insertEntry(entry: NewEntry) {
  const [createdEntry] = await db.insert(entries).values(entry).returning();

  return createdEntry;
}

export type EntryUpdate = Pick<NewEntry, 'category' | 'content' | 'entryTime' | 'updatedAt'>;

export async function updateEntry(id: number, entry: EntryUpdate) {
  const [updatedEntry] = await db.update(entries).set(entry).where(eq(entries.id, id)).returning();

  if (!updatedEntry) {
    throw new Error('This entry no longer exists.');
  }

  return updatedEntry;
}

export async function deleteEntry(id: number) {
  const [deletedEntry] = await db.delete(entries).where(eq(entries.id, id)).returning();

  if (!deletedEntry) {
    throw new Error('This entry no longer exists.');
  }
}
