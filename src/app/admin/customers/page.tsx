import { db, ensureSeeded, getSetting } from "@/lib/db";
import SharedCustomerCredentialsForm from "./shared-customer-credentials-form";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  await ensureSeeded();

  const customer = db
    .prepare(
      `SELECT u.username, u.status,
              (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id) AS posts,
              (SELECT COUNT(*) FROM comments c WHERE c.author_id = u.id) AS comments
       FROM users u
       WHERE u.role = 'customer'
       LIMIT 1`,
    )
    .get() as
    | { username: string; status: "active" | "suspended"; posts: number; comments: number }
    | undefined;

  if (!customer) {
    throw new Error("Shared customer account is missing; database migration did not complete.");
  }

  return (
    <div className="max-w-3xl space-y-10">
      <section aria-labelledby="shared-login-title">
        <h2 id="shared-login-title" className="font-display text-2xl font-light">
          Shared customer login
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-3">
          There is one customer username and password for everyone. Share them directly with your customers.
          Changing either value signs out all customers and replaces the credentials for everyone.
        </p>
        {getSetting("shared_customer_default_credentials_active") === "1" ? (
          <p className="notice notice-ok mt-4" role="status">
            The initial shared login is active: <strong>USER001</strong> / <strong>PASSWORD12345</strong>.
            Change it below if you want to use different credentials.
          </p>
        ) : null}
        <div className="mt-6">
          <SharedCustomerCredentialsForm
            username={customer.username}
            status={customer.status}
            posts={customer.posts}
            comments={customer.comments}
          />
        </div>
      </section>
    </div>
  );
}
