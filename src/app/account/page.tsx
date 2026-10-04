import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/sessions";
import UploadForm from "@/components/upload-form";
import { signOut } from "@/app/actions/auth";

export const metadata: Metadata = {
  title: "Share a look",
  description: "Upload a photo or video to the Abass Opela customer gallery.",
  robots: { index: false },
};

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/signin");
  if (user.role === "admin") redirect("/admin");

  return (
    <section className="mx-auto max-w-3xl px-5 sm:px-8 pt-12 md:pt-16 pb-24">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Customer gallery</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl font-light tracking-tight">
            Share a look
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-3">
            You are signed in with the shared customer login. Submit a photo or video for the atelier to review before it appears in the gallery.
          </p>
        </div>
        <form action={signOut}>
          <button type="submit" className="btn btn-outline btn-sm">Sign out</button>
        </form>
      </div>

      <div className="mt-8">
        <UploadForm />
      </div>
      <p className="mt-5 text-sm leading-6 text-ink-3">
        Customer access is for posting and commenting only. Posts and comments use the shared customer profile; the admin manages or removes content.
      </p>
    </section>
  );
}
