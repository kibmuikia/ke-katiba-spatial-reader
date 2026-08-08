// Minimal ambient module for sql.js (no upstream types are shipped).
declare module "sql.js" {
  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
  }
  export interface Database {
    prepare(sql: string): Statement;
    close(): void;
  }
  export interface Statement {
    bind(params?: unknown[] | Record<string, unknown>): boolean;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): void;
  }
  const initSqlJs: (opts?: {
    locateFile?: (file: string) => string;
  }) => Promise<SqlJsStatic>;
  export default initSqlJs;
}
