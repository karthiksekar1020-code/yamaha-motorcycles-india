/**
 * A small in-memory stand-in for Supabase, used to test the website's own authorization and CRUD code.
 * It models the parts of the real service that matter here: who is signed in, whether they are the owner,
 * row-level security (non-owners cannot write and cannot see drafts) and private file storage.
 * It does NOT prove that Supabase accepts these calls: that is covered by tests/db (real Postgres policies)
 * and by scripts/verify-backend.mjs against a real project.
 */
type Row = Record<string, unknown>;
type Tables = Record<"motorcycles" | "gallery_images" | "gallery_hidden" | "site_content" | "audit_logs" | "admin_users", Row[]> & Record<string, Row[]>;

export interface FakeBackend {
  tables: Tables;
  storage: Map<string, Uint8Array>;
  users: Record<string, { id: string; email: string; password: string; admin: boolean; mfa: boolean }>;
  /** Everything written by the code under test, for assertions. */
  log: { signOuts: string[]; resetEmails: string[]; signUps: number };
  nextId: number;
}

export function newBackend(): FakeBackend {
  return { tables: { motorcycles: [], gallery_images: [], gallery_hidden: [], site_content: [], audit_logs: [], admin_users: [] }, storage: new Map(), users: {}, log: { signOuts: [], resetEmails: [], signUps: 0 }, nextId: 1 };
}

export interface Session { userId: string | null; aal: "aal1" | "aal2"; expired?: boolean }

const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const isPublishedRow = (table: string, r: Row) => table === "motorcycles" || table === "gallery_images" ? r.is_published === true : table === "site_content" ? r.status === "published" : false;

export function makeClient(be: FakeBackend, session: Session) {
  // Looked up on every call: signing in or out changes the session after the client was created.
  const current = () => (session.userId && !session.expired ? Object.values(be.users).find((u) => u.id === session.userId) ?? null : null);

  const canSee = (table: string, r: Row) => {
    const user = current();
    if (table === "audit_logs" || table === "admin_users") return table === "admin_users" ? r.user_id === user?.id : Boolean(user?.admin);
    if (table === "gallery_hidden") return true; // the list of removed photo ids is public by design
    return Boolean(user?.admin) || isPublishedRow(table, r);
  };

  function from(table: string) {
    type Op = { kind: "select" | "insert" | "update" | "delete" | "upsert"; payload?: Row | Row[]; opts?: Row };
    let op: Op = { kind: "select" };
    const filters: Array<(r: Row) => boolean> = [];
    let single: "single" | "maybe" | null = null;
    let wantRows = false;
    let range: [number, number] | null = null;
    const order: Array<[string, boolean]> = [];
    let wantCount = false;

    const run = async (): Promise<{ data: unknown; error: { code: string; message: string; name?: string } | null; count?: number }> => {
      const user = current();
      const isAdmin = Boolean(user?.admin);
      const rows = be.tables[table] ?? (be.tables[table] = []);
      const match = (r: Row) => filters.every((f) => f(r));
      if (op.kind === "insert" || op.kind === "upsert") {
        const payloads = Array.isArray(op.payload) ? op.payload : [op.payload!];
        // RLS: only the owner may write; audit rows must be attributed to the caller.
        const allowed = table === "admin_users" ? false : isAdmin && (table !== "audit_logs" || payloads.every((p) => p.actor_id === user?.id));
        if (!allowed) return { data: null, error: { code: "42501", message: "new row violates row-level security policy" } };
        const out: Row[] = [];
        for (const p of payloads) {
          if (table === "motorcycles" && rows.some((r) => r.slug === p.slug && !(op.kind === "upsert"))) return { data: null, error: { code: "23505", message: "duplicate key" } };
          if (op.kind === "upsert") {
            const keys = String(op.opts?.onConflict ?? "id").split(",");
            const existing = rows.find((r) => keys.every((k) => r[k] === p[k]));
            if (existing) { Object.assign(existing, p); out.push(existing); continue; }
          }
          const row: Row = { id: uuid(be.nextId++), is_published: false, created_at: new Date().toISOString(), ...p };
          rows.push(row);
          out.push(row);
        }
        return finish(out);
      }
      if (op.kind === "update") {
        if (!isAdmin) return { data: [], error: null }; // RLS: nothing matches, no error
        const hit = rows.filter(match);
        for (const r of hit) Object.assign(r, op.payload as Row);
        return finish(hit);
      }
      if (op.kind === "delete") {
        if (table === "audit_logs") return { data: null, error: { code: "42501", message: "permission denied" } };
        if (!isAdmin) return { data: [], error: null };
        const hit = rows.filter(match);
        be.tables[table] = rows.filter((r) => !hit.includes(r));
        return finish(hit);
      }
      let visible = rows.filter((r) => canSee(table, r)).filter(match);
      const total = visible.length;
      for (const [col, asc] of [...order].reverse()) visible = [...visible].sort((a, b) => (String(a[col] ?? "") < String(b[col] ?? "") ? -1 : 1) * (asc ? 1 : -1));
      if (range) visible = visible.slice(range[0], range[1] + 1);
      return finish(visible, total);
    };

    const finish = (live: Row[], total?: number) => {
      const rows = live.map((r) => structuredClone(r));
      const count = wantCount ? total ?? rows.length : undefined;
      if (single === "single") return rows.length === 1 ? { data: rows[0], error: null, count } : { data: null, error: { code: "PGRST116", message: "no rows" }, count };
      if (single === "maybe") return { data: rows[0] ?? null, error: null, count };
      return { data: rows, error: null, count };
    };

    const b: Record<string, unknown> = {
      select(_cols?: string, opts?: Row) { if (op.kind === "select") op = { kind: "select" }; wantRows = true; if (opts?.count) wantCount = true; return b; },
      insert(p: Row | Row[]) { op = { kind: "insert", payload: p }; return b; },
      upsert(p: Row | Row[], opts?: Row) { op = { kind: "upsert", payload: p, opts }; return b; },
      update(p: Row) { op = { kind: "update", payload: p }; return b; },
      delete() { op = { kind: "delete" }; return b; },
      eq(col: string, v: unknown) { filters.push((r) => r[col] === v); return b; },
      not(col: string, _o: string, v: unknown) { filters.push((r) => r[col] !== v); return b; },
      or() { return b; },
      order(col: string, o?: { ascending?: boolean }) { order.push([col, o?.ascending !== false]); return b; },
      limit() { return b; },
      range(a: number, z: number) { range = [a, z]; return b; },
      single() { single = "single"; return b; },
      maybeSingle() { single = "maybe"; return b; },
      then(res: (v: unknown) => unknown, rej: (e: unknown) => unknown) { return run().then(res, rej); },
    };
    void wantRows;
    return b;
  }

  const factors = () => (current()?.mfa ? [{ id: uuid(9000), status: "verified" }] : []);
  const auth = {
    getUser: async () => { const user = current(); return (user ? { data: { user: { id: user.id, email: user.email } }, error: null } : { data: { user: null }, error: { message: session.expired ? "JWT expired" : "no session" } }); },
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const u = Object.values(be.users).find((x) => x.email === email && x.password === password);
      if (!u) return { data: { user: null }, error: { message: "Invalid login credentials" } };
      session.userId = u.id; session.aal = "aal1";
      return { data: { user: { id: u.id, email: u.email } }, error: null };
    },
    signOut: async (o?: { scope?: string }) => { be.log.signOuts.push(o?.scope ?? "global"); session.userId = null; return { error: null }; },
    signUp: async () => { be.log.signUps++; return { data: {}, error: null }; },
    resetPasswordForEmail: async (email: string) => { be.log.resetEmails.push(email); return { data: {}, error: null }; },
    updateUser: async () => ({ data: {}, error: null }),
    exchangeCodeForSession: async (code: string) => (code === "good-code" ? { data: {}, error: null } : { data: {}, error: { message: "bad" } }),
    mfa: {
      getAuthenticatorAssuranceLevel: async () => ({ data: { currentLevel: session.aal, nextLevel: current()?.mfa ? "aal2" : "aal1" }, error: null }),
      listFactors: async () => ({ data: { all: factors(), totp: factors() }, error: null }),
      challengeAndVerify: async ({ code }: { code: string }) => (code === "123456" ? (session.aal = "aal2", { data: {}, error: null }) : { data: null, error: { message: "bad code" } }),
      enroll: async () => ({ data: { id: uuid(9001), totp: { qr_code: "data:image/svg+xml;utf8,<svg/>", secret: "JBSWY3DPEHPK3PXP" } }, error: null }),
      unenroll: async () => ({ data: {}, error: null }),
    },
  };

  const storage = {
    from: (bucket: string) => ({
      upload: async (path: string, data: Uint8Array) => {
        if (!current()?.admin) return { data: null, error: { name: "StorageApiError", message: "new row violates row-level security policy" } };
        be.storage.set(`${bucket}/${path}`, data); return { data: { path }, error: null };
      },
      remove: async (paths: string[]) => {
        if (!current()?.admin) return { data: [], error: null };
        for (const p of paths) be.storage.delete(`${bucket}/${p}`);
        return { data: [], error: null };
      },
      download: async (path: string) => {
        const row = be.tables.gallery_images?.find((r) => r.storage_path === path);
        const visible = Boolean(current()?.admin) || (row && row.is_published === true);
        const file = be.storage.get(`${bucket}/${path}`);
        if (!visible || !file) return { data: null, error: { name: "StorageApiError", message: "not found" } };
        return { data: new Blob([file as BlobPart]), error: null };
      },
    }),
  };

  return { from, auth, storage };
}

/** Convenience: a backend with an owner, an ordinary user, and the helpers to act as each. */
export function seedUsers(be: FakeBackend) {
  be.users.owner = { id: uuid(101), email: "owner@example.com", password: "Correct-Horse-9", admin: true, mfa: false };
  be.users.visitor = { id: uuid(102), email: "visitor@example.com", password: "Visitor-Pass-9", admin: false, mfa: false };
  be.tables.admin_users.push({ user_id: be.users.owner.id, role: "owner" });
  return be;
}
