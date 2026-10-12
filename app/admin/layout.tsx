import type { Metadata } from "next";

// Nothing in the admin area is indexable or cacheable.
export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false, follow: false, nocache: true } };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div data-admin>{children}</div>;
}
