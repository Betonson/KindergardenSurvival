import Link from "next/link";
import { redirect } from "next/navigation";
import { ContactRound, Monitor, ShieldCheck, UserRound, Volume2 } from "lucide-react";
import { requireAccount } from "@/lib/session";
import { newUsersGetFullRights } from "@/lib/store";
import { AdminSettings } from "@/components/AdminSettings";

export const metadata = { title: "Настройки" };

const tabs = [
  { id: "interface", label: "Интерфейс", icon: Monitor },
  { id: "sound", label: "Звук", icon: Volume2 },
  { id: "account", label: "Аккаунт", icon: UserRound },
  { id: "avatar", label: "Аватар", icon: ContactRound },
  { id: "admin", label: "Администрирование", icon: ShieldCheck },
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const account = await requireAccount();
  const { tab = "interface" } = await searchParams;
  const available = tabs.filter((item) => item.id !== "admin" || account.role === "admin");
  const current = available.find((item) => item.id === tab);
  if (!current) redirect("/settings");
  const Icon = current.icon;
  return <main className="settings-page">
    <h1>Настройки</h1>
    <nav className="settings-tabs" aria-label="Разделы настроек">{available.map(({ id, label, icon: TabIcon }) => (
      <Link key={id} href={id === "interface" ? "/settings" : `/settings?tab=${id}`}
        aria-current={id === tab ? "page" : undefined}><TabIcon size={18} />{label}</Link>
    ))}</nav>
    <section className="settings-panel" aria-labelledby="section-name">
      <div className="section-heading"><span className="section-icon"><Icon size={22} /></span><h2 id="section-name">{current.label}</h2></div>
      {current.id === "admin" ? <AdminSettings initial={await newUsersGetFullRights()} />
        : current.id !== "avatar" && <p className="empty-state">В этом разделе пока нет настроек.</p>}
    </section>
  </main>;
}
