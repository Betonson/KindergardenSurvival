"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { connectionError, submit } from "@/lib/client";

export function AdminSettings({ initial }: { initial: boolean }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function save(event: FormEvent) {
    event.preventDefault();
    if (pending || saved === value) return;
    setPending(true);
    setError("");
    try {
      const result = await submit("settings", { grantFullRights: value });
      if (result.ok) {
        setSaved(value);
        setNotice("Настройки сохранены.");
        router.refresh();
      } else setError(result.message || connectionError);
    } catch { setError(connectionError); }
    setPending(false);
  }

  return <form className="admin-form" onSubmit={save}>
    <label className="checkbox-row">
      <input type="checkbox" name="grantFullRights" checked={value} disabled={pending}
        onChange={(event) => { setValue(event.target.checked); setError(""); setNotice(""); }} />
      <span><strong>Выдавать новым пользователям полные права</strong>
        <small>При включённой настройке новые пользователи становятся администраторами. При выключенной — педагогами.</small>
      </span>
    </label>
    <div className="save-row">
      <button className="primary" disabled={pending || saved === value}>{pending ? "Сохранение…" : "Сохранить"}</button>
      <span role="status">{notice}</span>
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  </form>;
}
