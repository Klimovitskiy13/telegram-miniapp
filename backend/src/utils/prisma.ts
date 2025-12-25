/**
 * Prisma Client singleton
 * Используется для подключения к базе данных
 */
import { PrismaClient } from '@prisma/client';
import { env } from './env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

type DbUrlSummary = {
  host?: string;
  port?: string;
  database?: string;
  username?: string;
  isPgbouncer?: boolean;
  sslmode?: string | null;
};

function safeParseDatabaseUrl(raw?: string): DbUrlSummary {
  if (!raw) return {};
  try {
    const u = new URL(raw);
    const db = u.pathname?.startsWith('/') ? u.pathname.slice(1) : u.pathname;
    const isPgbouncer =
      u.searchParams.get('pgbouncer') === 'true' || u.hostname.includes('pooler.supabase.com');

    return {
      host: u.hostname || undefined,
      port: u.port || undefined,
      database: db || undefined,
      username: u.username || undefined,
      isPgbouncer,
      sslmode: u.searchParams.get('sslmode'),
    };
  } catch {
    return {};
  }
}

export function getDatabaseConfigSummary() {
  return {
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    databaseUrl: safeParseDatabaseUrl(process.env.DATABASE_URL),
  };
}

function isPrismaDbError(err: unknown): err is { name?: string; message?: string } {
  return typeof err === 'object' && err !== null && ('name' in err || 'message' in err);
}

function isLikelyDbConnectionIssue(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("can't reach database server") ||
    m.includes('p1001') || // Can't reach database server
    m.includes('p1000') || // Authentication failed
    m.includes('econnrefused') ||
    m.includes('etimedout') ||
    m.includes('timeout') ||
    m.includes('ssl') ||
    m.includes('tls')
  );
}

export function toDatabaseHttpError(err: unknown):
  | { status: number; body: Record<string, unknown> }
  | null {
  if (!isPrismaDbError(err)) return null;

  const name = String(err.name || '');
  const message = String(err.message || '');

  const isInit = name === 'PrismaClientInitializationError';
  const isConn = isLikelyDbConnectionIssue(message);
  if (!isInit && !isConn) return null;

  const summary = getDatabaseConfigSummary();
  const body: Record<string, unknown> = {
    success: false,
    error: 'DATABASE_UNAVAILABLE',
    hint: 'Проверь DATABASE_URL (timeweb.cloud → Базы данных → Параметры подключения).',
  };

  if (env.NODE_ENV !== 'production') {
    body.details = {
      name,
      message: message.slice(0, 300),
      database: summary.databaseUrl,
    };
  }

  return { status: 503, body };
}

