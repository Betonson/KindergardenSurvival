"use client";

import { useRef, useState, type FormEvent } from "react";
import { AtSign, Eye, EyeOff, KeyRound, LockKeyhole, LogIn, Mail, UserRound, UserRoundPlus } from "lucide-react";
import { connectionError, submit } from "@/lib/client";
import type { AuthField, FieldErrors } from "@/lib/types";

type Mode = "login" | "register";
const fields = {
  identifier: { label: "Имя пользователя или почта", placeholder: "Введите имя или email", icon: UserRound, autoComplete: "username" },
  username: { label: "Имя пользователя", placeholder: "Ваше публичное имя", icon: AtSign, autoComplete: "username" },
  firstName: { label: "Имя", placeholder: "Ваше имя", icon: UserRound, autoComplete: "given-name" },
  lastName: { label: "Фамилия", placeholder: "Ваша фамилия", icon: UserRound, autoComplete: "family-name" },
  email: { label: "Электронная почта", placeholder: "name@example.ru", icon: Mail, autoComplete: "email" },
  password: { label: "Пароль", placeholder: "Введите пароль", icon: LockKeyhole, autoComplete: "current-password" },
  confirmation: { label: "Повторите пароль", placeholder: "Введите пароль ещё раз", icon: KeyRound, autoComplete: "new-password" },
};

export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState<Partial<Record<AuthField, boolean>>>({});
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const isLogin = mode === "login";

  function chooseMode(next: Mode) {
    if (mode === next) return;
    setMode(next);
    setErrors({});
    setMessage("");
    setVisible({});
  }

  async function authenticate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setPending(true);
    setErrors({});
    setMessage("");
    try {
      const result = await submit(mode, values);
      if (result.ok) { window.location.replace("/welcome"); return; }
      if (result.errors) {
        setErrors(result.errors);
        const firstInvalid = Object.keys(result.errors)[0];
        formRef.current?.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus();
      }
      setMessage(result.message || "");
    } catch { setMessage(connectionError); }
    setPending(false);
  }

  function field(name: AuthField) {
    const { label, placeholder, icon: Icon, autoComplete } = fields[name];
    const secret = name === "password" || name === "confirmation";
    const type = secret && !visible[name] ? "password" : name === "email" ? "email" : "text";
    return <div className="field" key={name}>
      <label htmlFor={name}>{label}</label>
      <div className={`input-box${errors[name] ? " invalid" : ""}`}>
        <Icon size={18} aria-hidden="true" />
        <input id={name} name={name} type={type} required readOnly={pending}
          autoComplete={!isLogin && secret ? "new-password" : autoComplete}
          placeholder={!isLogin && name === "password" ? "Не менее 8 символов" : placeholder}
          aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? name + "-error" : undefined}
          onChange={() => { if (errors[name]) setErrors((old) => ({ ...old, [name]: undefined })); if (message) setMessage(""); }} />
        {secret && <button className="eye icon-button" type="button" aria-label={`${visible[name] ? "Скрыть" : "Показать"} пароль — ${label}`}
          aria-pressed={Boolean(visible[name])} onClick={() => setVisible((old) => ({ ...old, [name]: !old[name] }))}>
          {visible[name] ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>}
      </div>
      {errors[name] && <span id={name + "-error"} className="field-error" role="alert">{errors[name]}</span>}
    </div>;
  }

  return <div className={`auth-form ${isLogin ? "login" : "register"}`}>
    <div className="auth-heading">
      <h1>{isLogin ? "Вход в аккаунт" : "Создать аккаунт"}</h1>
      <p>{isLogin ? "Войдите в Академию под своим именем." : "Выберите имя, которое увидят другие игроки."}</p>
    </div>
    <div className="mode-switch" role="group" aria-label="Способ авторизации">
      <button type="button" aria-pressed={isLogin} disabled={pending} onClick={() => chooseMode("login")}><LogIn size={17} />Вход</button>
      <button type="button" aria-pressed={!isLogin} disabled={pending} onClick={() => chooseMode("register")}><UserRoundPlus size={17} />Регистрация</button>
    </div>
    <form key={mode} ref={formRef} onSubmit={authenticate}>
      {isLogin ? field("identifier") : <>
        {field("username")}
        <div className="name-row">{field("firstName")}{field("lastName")}</div>
        {field("email")}
      </>}
      {field("password")}
      {!isLogin && field("confirmation")}
      {message && <p className="field-error" role="alert">{message}</p>}
      <button type="submit" className="primary" disabled={pending}>{pending ? "Подождите…" : isLogin ? "Войти" : "Создать аккаунт"}</button>
    </form>
  </div>;
}
