import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/** /admin has no content of its own: the dashboard checks the session and sends visitors to the login page if needed. */
export default function AdminIndex() {
  redirect("/admin/dashboard");
}
