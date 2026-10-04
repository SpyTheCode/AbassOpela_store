import { db, ensureSeeded } from "@/lib/db";
import { EmptyState } from "@/components/ui";
import CollectionEditor from "./collection-editor";
import NewCollectionForm from "./new-collection-form";

export const dynamic = "force-dynamic";

type Col = {
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

export default async function AdminCollectionsPage() {
  ensureSeeded();

  const collections = db
    .prepare(
      `SELECT c.id, c.slug, c.title, c.season, c.description, c.published,
              m.file_name AS cover,
              (SELECT COUNT(*) FROM collection_items ci WHERE ci.collection_id = c.id) AS count
       FROM collections c
       LEFT JOIN media m ON m.id = c.cover_media_id
       ORDER BY c.position ASC, c.created_at ASC`,
    )
    .all()
    .map((row) => ({ ...row })) as Array<Omit<Col, "looks">>;

  const itemsMap = new Map<string, string[]>();
  const items = db
    .prepare(
      "SELECT collection_id, media_id FROM collection_items ORDER BY position ASC",
    )
    .all() as Array<{ collection_id: string; media_id: string }>;
  for (const row of items) {
    const list = itemsMap.get(row.collection_id) ?? [];
    list.push(row.media_id);
    itemsMap.set(row.collection_id, list);
  }

  const library = db
    .prepare(
      "SELECT id, file_name, kind, alt FROM media ORDER BY created_at DESC, id DESC",
    )
    .all()
    .map((row) => ({ ...row })) as Array<{ id: string; file_name: string; kind: "image" | "video"; alt: string }>;

  const withLooks: Col[] = collections.map((c) => ({
    ...c,
    looks: itemsMap.get(c.id) ?? [],
  }));

  return (
    <div className="space-y-14">
      <section aria-labelledby="new-collection-title">
        <h2 id="new-collection-title" className="font-display text-2xl font-light">
          New collection
        </h2>
        <div className="mt-6 max-w-2xl">
          <NewCollectionForm />
        </div>
      </section>

      <section aria-labelledby="edit-collections-title">
        <h2 id="edit-collections-title" className="font-display text-2xl font-light">
          Collections <span className="text-ink-3 text-lg">({collections.length})</span>
        </h2>
        <div className="mt-6 space-y-10">
          {collections.length === 0 ? (
            <EmptyState title="No collections yet" />
          ) : (
            withLooks.map((c) => (
              <CollectionEditor key={c.id} collection={c} library={library} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
