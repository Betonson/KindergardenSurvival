import catalog from "../content/collection/catalog.json" with { type: "json" };
import { database } from "./store.ts";
import type { Account } from "./types";

export type CollectionTopic = (typeof catalog)[number];
export type CollectionMaterial = CollectionTopic["materials"][number];
export type CollectionItem = CollectionMaterial["items"][number];

export async function getCollection(account: Pick<Account, "id" | "role">): Promise<CollectionTopic[]> {
  if (account.role === "admin" || account.role === "methodist") return catalog;
  const db = await database();
  const { rows } = await db.query<{ adventure_id: string }>(
    "SELECT adventure_id FROM adventure_completions WHERE account_id = $1", [account.id],
  );
  const completed = new Set(rows.map((row) => row.adventure_id));
  return catalog.map((topic) => ({
    ...topic, materials: topic.materials.filter((material) => completed.has(material.adventureId)),
  })).filter((topic) => topic.materials.length > 0);
}
