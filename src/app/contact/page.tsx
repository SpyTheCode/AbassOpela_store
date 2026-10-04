import type { Metadata } from "next";
import ContactForm from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Abass Opela — commissions, fittings and availability. Purchases happen in person or by personal arrangement.",
};

export default function ContactPage() {
  return (
    <>
      <header className="mx-auto max-w-7xl px-5 sm:px-8 pt-14 md:pt-20 pb-10 md:pb-14">
        <p className="eyebrow">Correspondence</p>
        <h1 className="mt-3 font-display text-4xl md:text-6xl font-light leading-[1.05] tracking-tight">
          Contact
        </h1>
        <p className="mt-4 max-w-2xl text-base md:text-lg leading-7 md:leading-8 text-ink-2">
          Purchases happen in person or by personal arrangement — there is no
          online checkout. Send a note and the house replies personally.
        </p>
      </header>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-20">
        <div className="grid gap-12 md:grid-cols-[1fr_1.2fr]">
          <aside className="space-y-8">
            <div>
              <p className="eyebrow mb-2">Email</p>
              <a href="mailto:hello@abassopela.com" className="link-underline text-lg text-ink">
                hello@abassopela.com
              </a>
            </div>
            <div>
              <p className="eyebrow mb-2">Atelier</p>
              <p className="text-ink-2">Lagos · Worldwide</p>
              <p className="mt-1 text-sm text-ink-3">
                Private fittings are arranged by appointment.
              </p>
            </div>
            <div>
              <p className="eyebrow mb-2">The gallery</p>
              <p className="text-sm leading-6 text-ink-2">
                Customers of the house can share their own photographs and film
                with an account. Sign in, then upload from your account page.
              </p>
            </div>
          </aside>

          <ContactForm />
        </div>
      </section>
    </>
  );
}
