import { readFile } from "node:fs/promises";
import path from "node:path";
import { getCollection } from "@/lib/collection";
import { currentAccount } from "@/lib/session";

export async function GET(_: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const account = await currentAccount();
  const headers = { "Cache-Control": "private, no-store" };
  if (!account) return new Response(null, { status: 401, headers });
  const { itemId } = await params;
  const topics = await getCollection(account);
  const visible = topics.some((topic) => topic.materials.some((material) => material.items.some((item) => item.id === itemId)));
  if (!visible) return new Response(null, { status: 404, headers });
  const image = await readFile(path.join(process.cwd(), "content", "collection", "art", itemId + ".webp"));
  return new Response(new Uint8Array(image), { headers: { ...headers, "Content-Type": "image/webp" } });
}
