import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPage } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

/**
 * Every page in the dashboard is rendered inside this layout, and it checks the session and the owner role on the
 * server before rendering anything. Visitors are redirected to the login page; nothing here relies on client code.
 */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdminPage();
  return <AdminShell email={user.email ?? "Owner"}>{children}</AdminShell>;
}
