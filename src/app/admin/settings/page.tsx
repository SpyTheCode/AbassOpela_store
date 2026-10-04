import Image from "next/image";
import { ensureSeeded, getSetting } from "@/lib/db";
import { getBrand } from "@/lib/brand";
import { requireAdmin } from "@/lib/sessions";
import SettingsForm from "./settings-form";
import RecoveryForm from "./recovery-form";
import AdminCredentialsForm from "./admin-credentials-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await ensureSeeded();
  const admin = await requireAdmin();
  const brand = getBrand();

  return (
    <div>
      <section aria-labelledby="settings-title">
        <h2 id="settings-title" className="font-display text-2xl font-light">
          Brand settings
        </h2>
        <p className="mt-1 text-sm text-ink-3">
          The logo, name and copy here drive the whole public site.
        </p>

        <div className="mt-8 grid gap-10 md:grid-cols-[1fr_280px] items-start">
          <SettingsForm
            values={{
              brand_name: getSetting("brand_name") ?? "",
              brand_tagline: getSetting("brand_tagline") ?? "",
              contact_email: getSetting("contact_email") ?? "",
              contact_location: getSetting("contact_location") ?? "",
              about_intro: getSetting("about_intro") ?? "",
              about_body: getSetting("about_body") ?? "",
              contact_blurb: getSetting("contact_blurb") ?? "",
              instagram: getSetting("instagram") ?? "",
              pinterest: getSetting("pinterest") ?? "",
            }}
          />

          <aside className="border border-line bg-card p-5">
            <p className="field-label">Current logo</p>
            <div className="relative mt-2 aspect-square w-full max-w-[180px] overflow-hidden border border-line bg-wash">
              <Image
                src={brand.logo}
                alt={`${brand.name} logo`}
                fill
                sizes="180px"
                className="object-contain"
                unoptimized={brand.logo.endsWith(".svg")}
              />
            </div>
            <p className="mt-3 text-xs text-ink-3">
              Replace it from the form — upload a square JPEG, PNG, WebP or SVG up
              to 2 MB. The change applies everywhere immediately.
            </p>
          </aside>
        </div>
      </section>

      <section aria-labelledby="admin-credentials-title" className="mt-14 max-w-2xl">
        <h2 id="admin-credentials-title" className="font-display text-2xl font-light">
          Admin login
        </h2>
        <p className="mb-4 mt-1 text-sm leading-6 text-ink-3">
          The initial login is <strong>OPELA_USERNAME</strong> / <strong>OPELA_PASSWORD</strong>.
          Change it here after signing in, and especially before making the site public.
        </p>
        <AdminCredentialsForm username={admin.username} />
      </section>

      <section aria-labelledby="recovery-title" className="mt-14 max-w-2xl">
        <h3 id="recovery-title" className="font-display text-xl font-light">
          Admin account recovery
        </h3>
        <p className="mb-4 mt-1 text-sm text-ink-3">
          If the admin forgets their username or password, this private recovery name lets them set new credentials.
        </p>
        <RecoveryForm configured={Boolean(getSetting("admin_recovery_hash"))} />
      </section>
    </div>
  );
}
