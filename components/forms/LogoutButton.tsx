"use client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const out = async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.replace("/login");
    router.refresh();
  };
  return <button onClick={out} className="btn btn-ghost btn-sm">Sign out</button>;
}
