"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { saveCollection, deleteCollection } from "@/app/actions/admin";

type LibraryItem = { id: string; file_name: string; kind: "image" | "video"; alt: string };

type Collection = {
  id: string;
  slug: string;
  title: string;
  season: string;
  description: string;
  published: number;
  cover: string | null;
  looks: string[];
  count: number;
};

function Save() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-solid btn-sm" disabled={pending}>
      {pending ? "Saving…" : "Save collection"}
    </button>
  );
}

export default function CollectionEditor({
  collection,
  library,
}: {
  collection: Collection;
  library: LibraryItem[];
}) {
  const [state, formAction] = useActionState(saveCollection, { ok: false });
  const [selected, setSelected] = useState<string[]>(collection.looks);
  const [coverId, setCoverId] = useState<string>(
    library.find((l) => l.file_name === collection.cover)?.id ?? "",
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function move(id: string, dir: -1 | 1) {
    setSelected((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function removeCollection() {
    if (window.confirm(`Delete the collection “${collection.title}”? The images stay in the library.`)) {
      startTransition(async () => {
        const res = await deleteCollection(collection.id);
        if (res.ok) router.refresh();
      });
    }
  }

  return (
    <form action={formAction} className="border border-line bg-card">
      <input type="hidden" name="id" value={collection.id} />
      <input type="hidden" name="looksSubmitted" value="true" />
      {selected.map((id) => (
        <input key={id} type="hidden" name="looks" value={id} />
      ))}
      <input type="hidden" name="cover" value={coverId} />

      <div className="p-5">
        {state.ok && state.message ? (
          <p className="notice notice-ok mb-4" role="status">{state.message}</p>
        ) : null}
        {state.error ? (
          <p className="notice notice-error mb-4" role="alert">{state.error}</p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`t-${collection.id}`} className="field-label">Title</label>
            <input id={`t-${collection.id}`} name="title" defaultValue={collection.title} required className="input" />
          </div>
          <div>
            <label htmlFor={`s-${collection.id}`} className="field-label">Season</label>
            <input id={`s-${collection.id}`} name="season" defaultValue={collection.season} className="input" placeholder="e.g. Resort 2027" />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor={`d-${collection.id}`} className="field-label">Description</label>
          <textarea
            id={`d-${collection.id}`}
            name="description"
            defaultValue={collection.description}
            rows={2}
            className="input resize-y"
          />
        </div>
        <label className="mt-4 inline-flex items-center gap-2 text-sm text-ink-2">
          <input
            type="checkbox"
            name="published"
            defaultChecked={collection.published === 1}
            className="h-4 w-4 accent-[#a4762a]"
          />
          Published (visible on the public site)
        </label>
      </div>

      <div className="border-t border-line p-5">
        <p className="field-label">Cover</p>
        <div className="flex gap-3 overflow-x-auto filmstrip pb-2">
          {selected.length === 0 ? (
            <p className="text-sm text-ink-3">Select looks below, then choose a cover.</p>
          ) : (
            selected.map((id) => {
              const item = library.find((l) => l.id === id);
              if (!item || item.kind !== "image") return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCoverId(id)}
                  aria-pressed={coverId === id}
                  className={`relative h-24 w-20 shrink-0 overflow-hidden border-2 ${
                    coverId === id ? "border-brass" : "border-transparent"
                  }`}
                  title="Use as cover"
                >
                  <Image src={item.file_name} alt="" fill sizes="80px" className="object-cover" unoptimized={/\.(heic|heif)$/i.test(item.file_name)} />
                </button>
              );
            })
          )}
        </div>

        <p className="field-label mt-5">
          Looks in this lookbook <span className="normal-case tracking-normal text-ink-3">(click to add/remove)</span>
        </p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {library
            .filter((l) => l.kind === "image")
            .map((item) => {
              const isSelected = selected.includes(item.id);
              const order = selected.indexOf(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  aria-pressed={isSelected}
                  className={`relative aspect-[3/4] overflow-hidden border-2 ${
                    isSelected ? "border-brass" : "border-transparent"
                  }`}
                >
                  <Image
                    src={item.file_name}
                    alt={item.alt || "Library image"}
                    fill
                    sizes="120px"
                    className="object-cover"
                    unoptimized={/\.(heic|heif)$/i.test(item.file_name)}
                  />
                  {isSelected ? (
                    <span className="absolute top-1 left-1 flex items-center gap-1 rounded-sm bg-ink/85 px-1.5 py-0.5 text-[0.6rem] text-paper">
                      {order + 1}
                    </span>
                  ) : null}
                </button>
              );
            })}
        </div>

        {selected.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {selected.map((id) => (
              <span key={id} className="inline-flex items-center gap-1 border border-line px-2 py-1 text-xs text-ink-2">
                {selected.indexOf(id) + 1}
                <button type="button" aria-label="Move earlier" onClick={() => move(id, -1)} className="px-0.5 hover:text-ink">←</button>
                <button type="button" aria-label="Move later" onClick={() => move(id, 1)} className="px-0.5 hover:text-ink">→</button>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between border-t border-line p-5">
        <button type="button" onClick={removeCollection} className="btn btn-danger btn-sm" disabled={pending}>
          Delete collection
        </button>
        <Save />
      </div>
    </form>
  );
}
