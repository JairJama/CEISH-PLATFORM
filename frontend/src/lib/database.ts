// ============================================================================
// Conexión centralizada a PostgreSQL.
//
// IMPORTANTE: este archivo se ejecuta ÚNICAMENTE del lado del servidor
// (dentro del proceso Node del dev server de Vite), nunca en el navegador.
// El navegador no puede abrir conexiones TCP a PostgreSQL; por eso los
// servicios del frontend hacen fetch a /api/* y esas rutas usan este pool.
//
// Se crea un único Pool reutilizable para toda la aplicación.
// ============================================================================

import { Pool } from 'pg';
import type { PoolClient } from 'pg';

let pool: Pool | null = null;

/**
 * Devuelve el pool de conexiones único. Lo crea la primera vez que se llama.
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: Number(process.env.DATABASE_PORT ?? 5432),
      database: process.env.DATABASE_NAME ?? 'ceish_db',
      user: process.env.DATABASE_USER ?? 'ceish_user',
      password: process.env.DATABASE_PASSWORD ?? 'ceish_pass',
      max: 10,
    });

    pool.on('error', (err) => {
      console.error('[database] Error inesperado en el pool de PostgreSQL:', err);
    });
  }
  return pool;
}

/**
 * Helper para ejecutar una consulta parametrizada y obtener las filas tipadas.
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

/**
 * Ejecuta `fn` dentro de una transacción con un cliente dedicado.
 * Hace COMMIT si resuelve y ROLLBACK si lanza.
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
