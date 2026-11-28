import { CollectionView } from "@/components/CollectionView";
import { getCollection } from "@/lib/collection";
import { requireAccount } from "@/lib/session";
import "./collection.css";

export const metadata = { title: "Коллекция" };

export default async function Collection() {
  const account = await requireAccount();
  return <CollectionView topics={await getCollection(account)} />;
}
