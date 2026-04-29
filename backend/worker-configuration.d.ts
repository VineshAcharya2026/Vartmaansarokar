interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<{ success: boolean; meta?: { changes?: number; duration?: number } }>;
  all<T = unknown>(): Promise<{ results: T[]; success?: boolean; meta?: { duration?: number } }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
}
