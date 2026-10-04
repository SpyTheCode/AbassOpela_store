import type { Metadata } from "next";
import Link from "next/link";
import SignInForms from "./signin-forms";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in with the shared customer login to post and comment in the Abass Opela gallery.",
};

export default function SignInPage() {
  return (
    <section className="mx-auto max-w-md px-5 sm:px-8 pt-14 md:pt-20 pb-24">
      <SignInForms />
      <p className="mt-10 text-center text-xs text-ink-3">
        <Link href="/" className="link-underline">
          Back to the house
        </Link>
      </p>
    </section>
  );
}
