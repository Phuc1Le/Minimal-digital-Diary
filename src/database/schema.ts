import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const entryCategories = ['activity', 'thought', 'event'] as const;

export type EntryCategory = (typeof entryCategories)[number];

export const entries = sqliteTable(
  'entry',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    entryTime: integer('entry_time', { mode: 'timestamp_ms' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
    category: text('category').$type<EntryCategory>().notNull(),
    content: text('content'),
  },
  (table) => [
    index('entry_time_index').on(table.entryTime),
    index('entry_category_index').on(table.category),
  ],
);

export const photos = sqliteTable(
  'photos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    entryId: integer('entry_id')
      .notNull()
      .references(() => entries.id, { onDelete: 'cascade' }),
    filePath: text('file_path').notNull(),
  },
  (table) => [index('photos_entry_id_index').on(table.entryId)],
);