import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const isDatabaseConfigured = Boolean(
  process.env.SQL_HOST && process.env.SQL_DB_NAME && process.env.SQL_USER
);

export const createPool = (): Pool | null => {
  if (!isDatabaseConfigured) {
    return null;
  }
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

let dbInstance: NodePgDatabase<typeof schema> | null = null;
try {
  const pool = createPool();
  if (pool) {
    dbInstance = drizzle(pool, { schema });
  } else {
    console.warn('[AI Studio] SQL_HOST not configured — using in-memory studio vault fallback');
  }
} catch (err) {
  console.warn('[AI Studio] Database initialization failed — using in-memory fallback:', err);
  dbInstance = null;
}

export const db = dbInstance as NodePgDatabase<typeof schema>;
