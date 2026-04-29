// ---------------------------------------------------------------------------
// LOCAL TABLE SHIM
// ---------------------------------------------------------------------------
// The user's Supabase project does not have the schema this app expects
// ("Could not find the table 'public.bill_payments'" etc.). To keep the app
// fully usable without asking the user to create a dozen tables, we provide
// a localStorage-backed implementation of the small subset of the
// PostgREST query-builder API that the app actually uses.
//
// `localFrom(table)` returns a chainable, awaitable builder that supports:
//   .select(cols?)      .insert(rec|recs)   .update(rec)   .delete()
//   .eq(col, val)       .in(col, vals)      .gte(col, val)
//   .order(col, opts)   .limit(n)           .maybeSingle()  .single()
//
// All terminal methods (and awaiting the chain) return
// `{ data, error }` exactly like supabase-js.
// ---------------------------------------------------------------------------

type Row = Record<string, any>;
type Result<T> = { data: T; error: null } | { data: null; error: { message: string } };

const STORAGE_PREFIX = "smartbank.db.";

function load(table: string): Row[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + table);
    return raw ? (JSON.parse(raw) as Row[]) : [];
  } catch {
    return [];
  }
}

function save(table: string, rows: Row[]) {
  localStorage.setItem(STORAGE_PREFIX + table, JSON.stringify(rows));
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function pickColumns(rows: Row[], cols: string | undefined): Row[] {
  if (!cols || cols.trim() === "*") return rows;
  const wanted = cols.split(",").map((c) => c.trim().split(/\s+/)[0]).filter(Boolean);
  return rows.map((r) => {
    const out: Row = {};
    for (const c of wanted) out[c] = r[c];
    return out;
  });
}

interface Filter {
  kind: "eq" | "neq" | "in" | "gte" | "lte" | "gt" | "lt";
  col: string;
  val: any;
}

interface Order {
  col: string;
  ascending: boolean;
}

type Op =
  | { type: "select"; cols?: string }
  | { type: "insert"; rows: Row[] }
  | { type: "update"; patch: Row }
  | { type: "delete" };

class LocalQuery<T = any> implements PromiseLike<Result<T>> {
  private op: Op = { type: "select" };
  private filters: Filter[] = [];
  private orderBy: Order | null = null;
  private limitN: number | null = null;
  private singleMode: "single" | "maybe" | null = null;

  constructor(private table: string) {}

  select(cols?: string): this {
    this.op = { type: "select", cols };
    return this;
  }

  insert(rec: Row | Row[]): this {
    const rows = Array.isArray(rec) ? rec : [rec];
    this.op = { type: "insert", rows };
    return this;
  }

  update(patch: Row): this {
    this.op = { type: "update", patch };
    return this;
  }

  delete(): this {
    this.op = { type: "delete" };
    return this;
  }

  eq(col: string, val: any): this {
    this.filters.push({ kind: "eq", col, val });
    return this;
  }
  neq(col: string, val: any): this {
    this.filters.push({ kind: "neq", col, val });
    return this;
  }
  in(col: string, vals: any[]): this {
    this.filters.push({ kind: "in", col, val: vals });
    return this;
  }
  gte(col: string, val: any): this {
    this.filters.push({ kind: "gte", col, val });
    return this;
  }
  lte(col: string, val: any): this {
    this.filters.push({ kind: "lte", col, val });
    return this;
  }
  gt(col: string, val: any): this {
    this.filters.push({ kind: "gt", col, val });
    return this;
  }
  lt(col: string, val: any): this {
    this.filters.push({ kind: "lt", col, val });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }): this {
    this.orderBy = { col, ascending: opts?.ascending ?? true };
    return this;
  }

  limit(n: number): this {
    this.limitN = n;
    return this;
  }

  maybeSingle(): Promise<Result<T>> {
    this.singleMode = "maybe";
    return this.run();
  }

  single(): Promise<Result<T>> {
    this.singleMode = "single";
    return this.run();
  }

  then<TResult1 = Result<T>, TResult2 = never>(
    onfulfilled?: ((value: Result<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected);
  }

  private matches(row: Row): boolean {
    for (const f of this.filters) {
      const v = row[f.col];
      switch (f.kind) {
        case "eq": if (v !== f.val) return false; break;
        case "neq": if (v === f.val) return false; break;
        case "in": if (!(f.val as any[]).includes(v)) return false; break;
        case "gte": if (!(v >= f.val)) return false; break;
        case "lte": if (!(v <= f.val)) return false; break;
        case "gt": if (!(v > f.val)) return false; break;
        case "lt": if (!(v < f.val)) return false; break;
      }
    }
    return true;
  }

  private async run(): Promise<Result<T>> {
    try {
      let rows = load(this.table);

      if (this.op.type === "insert") {
        const now = new Date().toISOString();
        const created = this.op.rows.map((r) => ({
          id: r.id ?? uuid(),
          created_at: r.created_at ?? now,
          ...r,
        }));
        rows = [...rows, ...created];
        save(this.table, rows);
        return { data: created as unknown as T, error: null };
      }

      if (this.op.type === "update") {
        const patch = this.op.patch;
        let updated: Row[] = [];
        rows = rows.map((r) => {
          if (this.matches(r)) {
            const next = { ...r, ...patch };
            updated.push(next);
            return next;
          }
          return r;
        });
        save(this.table, rows);
        return { data: updated as unknown as T, error: null };
      }

      if (this.op.type === "delete") {
        const remaining: Row[] = [];
        const removed: Row[] = [];
        for (const r of rows) {
          if (this.matches(r)) removed.push(r);
          else remaining.push(r);
        }
        save(this.table, remaining);
        return { data: removed as unknown as T, error: null };
      }

      // select
      let result = rows.filter((r) => this.matches(r));
      if (this.orderBy) {
        const { col, ascending } = this.orderBy;
        result = [...result].sort((a, b) => {
          const av = a[col];
          const bv = b[col];
          if (av === bv) return 0;
          if (av == null) return ascending ? -1 : 1;
          if (bv == null) return ascending ? 1 : -1;
          return (av < bv ? -1 : 1) * (ascending ? 1 : -1);
        });
      }
      if (this.limitN != null) result = result.slice(0, this.limitN);
      result = pickColumns(result, this.op.cols);

      if (this.singleMode === "maybe") {
        return { data: (result[0] ?? null) as unknown as T, error: null };
      }
      if (this.singleMode === "single") {
        if (result.length === 0)
          return { data: null, error: { message: "No row found" } };
        return { data: result[0] as unknown as T, error: null };
      }
      return { data: result as unknown as T, error: null };
    } catch (e: any) {
      return { data: null, error: { message: e?.message ?? String(e) } };
    }
  }
}

export function localFrom(table: string) {
  return new LocalQuery(table);
}

/**
 * Tables that should be served from local storage instead of the remote
 * Supabase project. These are the tables the SmartBank UI expects but which
 * are not present in the connected Supabase schema.
 */
export const LOCAL_TABLES = new Set<string>([
  "accounts",
  "billers",
  "bill_payments",
  "login_events",
  "profiles",
  "transactions",
  "webauthn_credentials",
  "user_roles",
]);
