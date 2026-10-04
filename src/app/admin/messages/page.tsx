import { db, ensureSeeded } from "@/lib/db";
import { EmptyState } from "@/components/ui";
import MessagesList from "./messages-list";

export const dynamic = "force-dynamic";

type Msg = {
  id: string;
  name: string;
  email: string;
  body: string;
  created_at: number;
  handled: number;
};

export default async function AdminMessagesPage() {
  ensureSeeded();

  const messages = db
    .prepare("SELECT id, name, email, body, created_at, handled FROM messages ORDER BY created_at DESC")
    .all()
    .map((row) => ({ ...row })) as Msg[];

  const unhandled = messages.filter((m) => !m.handled).length;

  return (
    <section aria-labelledby="messages-title">
      <h2 id="messages-title" className="font-display text-2xl font-light">
        Messages{" "}
        <span className="text-ink-3 text-lg">
          ({messages.length}{unhandled ? ` · ${unhandled} new` : ""})
        </span>
      </h2>
      <p className="mt-1 text-sm text-ink-3">
        Notes sent from the contact page. Purchases happen offline — reply by email.
      </p>
      <div className="mt-6">
        {messages.length === 0 ? (
          <EmptyState title="No messages yet" hint="Contact form submissions will appear here." />
        ) : (
          <MessagesList items={messages} />
        )}
      </div>
    </section>
  );
}
