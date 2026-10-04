import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/sessions";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  if (user.role !== "admin") redirect("/account");

  const tabs = [
    ["/admin", "Moderation"],
    ["/admin/collections", "Collections"],
    ["/admin/customers", "Customers"],
    ["/admin/messages", "Messages"],
    ["/admin/settings", "Settings"],
  ] as const;

  return (
    <section className="mx-auto max-w-6xl px-5 sm:px-8 pt-10 md:pt-14 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="eyebrow">The studio</p>
          <h1 className="mt-2 font-display text-4xl font-light tracking-tight">
            Atelier admin
          </h1>
        </div>
        <p className="text-sm text-ink-3">Signed in as {user.name}</p>
      </div>

      <nav aria-label="Admin sections" className="mt-8 border-b border-line">
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {tabs.map(([href, label]) => (
            <li key={href}>
              <Link
                href={href}
                className="inline-block pb-3 text-xs uppercase tracking-[0.16em] text-ink-3 hover:text-ink aria-[current=page]:text-ink"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-10">{children}</div>
    </section>
  );
}
