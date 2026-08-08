// Loads the Constitution of Kenya (2010) as parsed by ke-katiba-digest.
// JSON is the primary fast path; the SQLite mirror is fetched lazily for
// advanced relational queries (chapter → article → clause → subclause).

export type ClauseNode = {
  node_id: string;
  identifier: string;
  canonical_ref: string;
  text: string;
  subclauses?: ClauseNode[];
};

export type ArticleNode = {
  node_id: string;
  number: number;
  title: string;
  canonical_ref: string;
  clauses?: ClauseNode[];
  raw_text?: string;
};

export type ChapterNode = {
  node_id: string;
  number: number;
  title: string;
  parts: unknown[];
  articles: ArticleNode[];
};

export type ConstitutionDoc = {
  metadata: {
    title: string;
    country: string;
    year: number;
    source: string;
    parsed_at?: string;
  };
  preamble?: { text: string; paragraphs: string[] };
  chapters: ChapterNode[];
  schedules?: unknown[];
};

let cache: ConstitutionDoc | null = null;

/**
 * Fetches and caches the parsed Constitution JSON from /data.
 * Throws on network or parse failure so callers can show an error state.
 */
export async function loadConstitution(): Promise<ConstitutionDoc> {
  if (cache) return cache;
  const res = await fetch("/data/constitution_kenya_2010.json");
  if (!res.ok) {
    throw new Error(`Failed to load constitution: ${res.status} ${res.statusText}`);
  }
  const doc = (await res.json()) as ConstitutionDoc;
  cache = doc;
  return doc;
}

/**
 * Lazily loads sql.js + the SQLite mirror and returns a ready Database.
 * Use for filtering/search that benefits from joins across tables.
 */
export async function loadConstitutionDb(): Promise<{
  query: (sql: string, params?: unknown[]) => { values: unknown[][] };
  close: () => void;
}> {
  const initSqlJs = (await import("sql.js")).default;
  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://sql.js/dist/${file}`,
  });
  const res = await fetch("/data/constitution_kenya_2010.db");
  if (!res.ok) {
    throw new Error(`Failed to load db: ${res.status} ${res.statusText}`);
  }
  const buf = await res.arrayBuffer();
  const db = new SQL.Database(new Uint8Array(buf));
  return {
    query: (sql: string, params: unknown[] = []) => {
      const stmt = db.prepare(sql);
      stmt.bind(params as Parameters<typeof stmt.bind>[0]);
      const values: unknown[][] = [];
      while (stmt.step()) values.push(stmt.getAsObject() && Object.values(stmt.getAsObject()));
      stmt.free();
      return { values };
    },
    close: () => db.close(),
  };
}
