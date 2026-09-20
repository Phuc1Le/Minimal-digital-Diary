import { migrate } from 'drizzle-orm/expo-sqlite/migrator';

import migrations from '../../drizzle/migrations';
import { db } from './client';

export async function migrateDatabase() {
  await migrate(db, migrations);
}