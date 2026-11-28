"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BookOpen, ChevronDown, Compass, LogOut, Settings, Trees } from "lucide-react";
import { Brand } from "./Brand";
import { roleLabels, type Account } from "@/lib/types";
import { connectionError, submit } from "@/lib/client";

const sections = [
  { href: "/garden", label: "Мой сад", icon: Trees },
  { href: "/adventures", label: "Приключения", icon: Compass },
  { href: "/collection", label: "Коллекция", icon: BookOpen },
];

export function GameHeader({ account }: { account: Account }) {
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  async function signOut() {
    setWorking(true);
    setError("");
    try {
      const result = await submit("logout", {});
      if (result.ok) { window.location.replace("/"); return; }
      setError(result.message || connectionError);
    } catch { setError(connectionError); }
    setWorking(false);
  }

  return <header className="game-header">
    <Link className="brand-link" href="/garden" aria-label="Сад № 0 — Мой сад"><Brand /></Link>
    <nav aria-label="Основные разделы" className="main-nav">
      {sections.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
        <Icon size={18} aria-hidden="true" />{label}
      </Link>)}
    </nav>
    <div className="account-nav" ref={container} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button ref={trigger} className="avatar-button" aria-label="Меню пользователя" aria-expanded={open} aria-controls="account-menu"
        onClick={() => setOpen(!open)}>
        <span className="avatar">{Array.from(account.username)[0].toLocaleUpperCase("ru")}</span><ChevronDown size={15} />
      </button>
      {open && <div className="account-menu" id="account-menu">
        <div className="account-identity"><strong>{account.username}</strong><span>{roleLabels[account.role]}</span></div>
        <Link href="/settings" onClick={() => setOpen(false)}><Settings size={18} />Настройки</Link>
        <button disabled={working} onClick={signOut}><LogOut size={18} />{working ? "Выход…" : "Выйти"}</button>
        {error && <p className="field-error" role="alert">{error}</p>}
      </div>}
    </div>
  </header>;
}
