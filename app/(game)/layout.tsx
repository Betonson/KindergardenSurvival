import { requireAccount } from "@/lib/session";
import { GameHeader } from "@/components/GameHeader";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const account = await requireAccount();
  return <><GameHeader account={account} />{children}</>;
}
