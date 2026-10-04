import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db, ensureSeeded, getSetting } from "@/lib/db";
import { PageIntro } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story of Abass Opela — fabric-first fashion, limited runs, and a customer gallery at the heart of the house.",
};

export default function AboutPage() {
  ensureSeeded();
  const intro = getSetting("about_intro") ?? "";
  const body = (getSetting("about_body") ?? "").split("\n\n");

  const images = db
    .prepare(
      "SELECT file_name, alt, width, height, blur_data_url FROM media WHERE file_name LIKE '/images/%' ORDER BY id DESC LIMIT 2",
    )
    .all() as Array<{ file_name: string; alt: string; width: number; height: number; blur_data_url: string }>;

  return (
    <>
      <PageIntro eyebrow="The house" title="About" lede={intro} />

      <section className="mx-auto max-w-7xl px-5 sm:px-8 pb-20">
        <div className="grid gap-10 md:grid-cols-2 md:gap-16 items-start">
          <div className="space-y-6 text-base leading-8 text-ink-2">
            {body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
            <div className="pt-4">
              <Link href="/contact" className="btn btn-solid btn-sm">
                Get in touch
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {images.map((img, i) => (
              <div key={img.file_name} className={i === 1 ? "mt-10" : ""}>
                <Image
                  src={img.file_name}
                  alt={img.alt}
                  width={img.width ?? 900}
                  height={img.height ?? 1200}
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="w-full h-auto"
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
