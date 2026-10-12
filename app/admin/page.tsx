import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/forms/LogoutButton";
import { isAdmin } from "@/lib/admin/session";
import { getDb } from "@/lib/db/supabase";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

interface Row {
  reference_code: string; full_name: string; phone: string; email: string; city: string; motorcycle_slug: string;
  preferred_date: string; preferred_time_window: string; status: string; created_at: string;
}

async function loadRequests(): Promise<{ rows: Row[] } | { error: "not-configured" | "failed" }> {
  const db = getDb();
  if (!db) return { error: "not-configured" };
  const { data, error } = await db
    .from("test_ride_requests")
    .select("reference_code, full_name, phone, email, city, motorcycle_slug, preferred_date, preferred_time_window, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) { console.error("[admin] request list failed:", error.code); return { error: "failed" }; }
  return { rows: data as Row[] };
}

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/login"); // every request is checked here; there is no client-side gate
  const result = await loadRequests();
  return (
    <section className="container-x pb-16 pt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="micro">Staff only</p>
          <h1 className="display mt-2 text-4xl md:text-6xl">Test-ride requests</h1>
        </div>
        <LogoutButton />
      </div>

      {"error" in result ? (
        <div className="mt-10 max-w-2xl border border-line bg-elevated p-6">
          <p className="micro !text-fg">{result.error === "not-configured" ? "Database not connected" : "Couldn't load requests"}</p>
          <p className="mt-2 text-sm text-muted">
            {result.error === "not-configured"
              ? "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY and run the migration so requests can be saved and listed here (see README)."
              : "The database returned an error. Check the server log and try again."}
          </p>
        </div>
      ) : result.rows.length === 0 ? (
        <p className="mt-10 text-muted">No requests yet.</p>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="num w-full min-w-[860px] border-collapse text-left text-sm">
            <caption className="sr-only">Test-ride requests, newest first</caption>
            <thead>
              <tr className="text-xs uppercase tracking-[.14em] text-muted">
                {["Reference", "Received", "Name", "Phone", "Email", "City", "Model", "Preferred", "Status"].map((h) => <th key={h} scope="col" className="p-3 font-semibold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((r) => (
                <tr key={r.reference_code} className="border-t border-line align-top">
                  <td className="p-3 font-semibold">{r.reference_code}</td>
                  <td className="p-3 text-muted">{new Date(r.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td className="p-3">{r.full_name}</td>
                  <td className="p-3"><a href={`tel:${r.phone}`} className="underline">{r.phone}</a></td>
                  <td className="p-3"><a href={`mailto:${r.email}`} className="underline">{r.email}</a></td>
                  <td className="p-3">{r.city}</td>
                  <td className="p-3">{r.motorcycle_slug}</td>
                  <td className="p-3">{r.preferred_date}, {r.preferred_time_window}</td>
                  <td className="p-3 capitalize">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-muted">Showing the latest {result.rows.length} requests. Contains personal data: do not share this page.</p>
        </div>
      )}
    </section>
  );
}
