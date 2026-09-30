import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import pg from 'pg';

const migrationsDirectory = path.resolve('database/migrations');
const files = (await readdir(migrationsDirectory))
  .filter((file) => file.endsWith('.sql'))
  .sort();

const client = new pg.Client({
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  database: process.env.DATABASE_NAME ?? 'ceish_db',
  user: process.env.DATABASE_USER ?? 'ceish_user',
  password: process.env.DATABASE_PASSWORD ?? 'ceish_pass',
});

await client.connect();
try {
  for (const file of files) {
    const sql = await readFile(path.join(migrationsDirectory, file), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`Aplicada: ${file}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
} finally {
  await client.end();
}
