import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

declare global {
  // eslint-disable-next-line no-var
  var __db_client: ReturnType<typeof postgres> | undefined;
}

const client = globalThis.__db_client ?? postgres(process.env.DATABASE_URL, { max: 5 });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__db_client = client;
}

export const db = drizzle(client, { schema });
