"use client";

import { useRef, useState, type FormEvent } from "react";
import { AtSign, ChevronDown, Eye, EyeOff, KeyRound, LockKeyhole, LogIn, Mail, UserRound, UserRoundPlus } from "lucide-react";
import { connectionError, submit } from "@/lib/client";
import { roleLabels, specializationLabels, type AuthField, type FieldErrors } from "@/lib/types";

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
  const [role, setRole] = useState("");
  const [specialization, setSpecialization] = useState("");
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
    setRole("");
    setSpecialization("");
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
      if (result.ok) { window.location.replace("/garden"); return; }
      if (result.errors) {
        setErrors(result.errors);
        const firstInvalid = Object.keys(result.errors)[0];
        formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      }
      setMessage(result.message || "");
    } catch { setMessage(connectionError); }
    setPending(false);
  }

  function field(name: keyof typeof fields) {
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

  function selection(name: "role" | "specialization", label: string, options: Record<string, string>) {
    const isRole = name === "role";
    return <div className="field">
      <label htmlFor={name}>{label}</label>
      <div className={`select-box${errors[name] ? " invalid" : ""}`}>
        <select id={name} name={name} required disabled={pending} value={isRole ? role : specialization}
          aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? name + "-error" : undefined}
          onChange={(event) => {
            (isRole ? setRole : setSpecialization)(event.target.value);
            setErrors((old) => ({ ...old, [name]: undefined }));
          }}>
          <option value="" disabled>{isRole ? "Выберите роль" : "Выберите специализацию"}</option>
          {Object.entries(options).map(([key, title]) => <option key={key} value={key}>{title}</option>)}
        </select><ChevronDown size={17} aria-hidden="true" />
      </div>
      {errors[name] && <span className="field-error" id={name + "-error"} role="alert">{errors[name]}</span>}
    </div>;
  }

  return <div className={`auth-form ${isLogin ? "login" : "register"}`}>
    <div className="auth-heading">
      <h1>{isLogin ? "Вход в аккаунт" : "Создать аккаунт"}</h1>
      <p>{isLogin ? "Войдите, чтобы открыть свой сад." : "Выберите имя, которое увидят другие игроки."}</p>
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
        {selection("role", "Роль", { methodist: roleLabels.methodist, employee: roleLabels.employee })}
        {role === "employee" && selection("specialization", "Специализация", specializationLabels)}
      </>}
      {field("password")}
      {!isLogin && field("confirmation")}
      {message && <p className="field-error" role="alert">{message}</p>}
      <button type="submit" className="primary" disabled={pending}>{pending ? "Подождите…" : isLogin ? "Войти" : "Создать аккаунт"}</button>
    </form>
  </div>;
}
