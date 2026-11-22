import { PGlite } from "@electric-sql/pglite";
import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import type { Account, AuthField, FieldErrors } from "./types";

const derive = promisify(scrypt);
const sessionSeconds = 60 * 60 * 24 * 14;
const digest = (token: string) => createHash("sha256").update(token).digest("hex");
const identityKey = (value: string) => value.trim().normalize("NFKC").toLowerCase();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

// Next development reloads modules. Keep one writer for the embedded database.
const singleton = globalThis as typeof globalThis & { academyDb?: Promise<PGlite> };
async function openDatabase() {
  const directory = process.env.ACADEMY_DATA_DIR || path.join(process.cwd(), ".data", "postgres");
  if (directory !== "memory://") await mkdir(directory, { recursive: true });
  const db = await PGlite.create(directory);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS application_settings (
      singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
      grant_new_users_full_rights boolean NOT NULL DEFAULT true
    );
    INSERT INTO application_settings (singleton) VALUES (true) ON CONFLICT DO NOTHING;
    CREATE TABLE IF NOT EXISTS accounts (
      id uuid PRIMARY KEY, username text NOT NULL, username_key text NOT NULL UNIQUE,
      first_name text NOT NULL, last_name text NOT NULL, email text NOT NULL,
      email_key text NOT NULL UNIQUE, password_salt text NOT NULL, password_hash text NOT NULL,
      role text NOT NULL CHECK (role IN ('admin','methodist','teacher'))
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash text PRIMARY KEY, account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      expires_at timestamptz NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions (expires_at);
  `);
  return db;
}
export function database() {
  return singleton.academyDb ??= openDatabase().catch((error) => {
    delete singleton.academyDb;
    throw error;
  });
}

type Input = Partial<Record<AuthField, unknown>>;
function input(data: Input, field: AuthField) {
  const value = data[field];
  return typeof value === "string" ? value : "";
}

export async function register(data: Input): Promise<{ errors: FieldErrors } | { token: string }> {
  const username = input(data, "username").trim();
  const firstName = input(data, "firstName").trim();
  const lastName = input(data, "lastName").trim();
  const email = input(data, "email").trim();
  const password = input(data, "password");
  const usernameKey = identityKey(username);
  const emailKey = identityKey(email);
  const errors: FieldErrors = {};
  if (!username || username.length > 80 || usernameKey.includes("@")) {
    errors.username = "Введите имя пользователя до 80 символов без знака @.";
  }
  if (!firstName || firstName.length > 120) errors.firstName = "Введите имя длиной до 120 символов.";
  if (!lastName || lastName.length > 120) errors.lastName = "Введите фамилию длиной до 120 символов.";
  if (!emailPattern.test(emailKey) || email.length > 254) errors.email = "Введите корректную почту.";
  if (password.length < 8 || password.length > 512) errors.password = "Введите пароль длиной от 8 до 512 символов.";
  if (!input(data, "confirmation") || password !== input(data, "confirmation")) {
    errors.confirmation = "Пароли не совпадают. Повторите пароль.";
  }

  const db = await database();
  async function checkDuplicates() {
    const result = await db.query<{ username_key: string; email_key: string }>(
      "SELECT username_key, email_key FROM accounts WHERE username_key = $1 OR email_key = $2",
      [usernameKey, emailKey],
    );
    for (const account of result.rows) {
      if (account.username_key === usernameKey) errors.username = "Это имя уже занято. Введите другое.";
      if (account.email_key === emailKey) errors.email = "Эта почта уже зарегистрирована. Введите другую.";
    }
  }
  await checkDuplicates();
  if (Object.keys(errors).length) return { errors };
  const salt = randomBytes(16).toString("hex");
  const hash = (await derive(password, salt, 64)) as Buffer;
  const id = randomUUID();
  const token = randomBytes(32).toString("hex");
  const created = await db.transaction(async (tx) => {
    const result = await tx.query(`
      INSERT INTO accounts (id, username, username_key, first_name, last_name, email, email_key, password_salt, password_hash, role)
      SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, CASE WHEN grant_new_users_full_rights THEN 'admin' ELSE 'teacher' END
      FROM application_settings WHERE singleton ON CONFLICT DO NOTHING RETURNING id`,
      [id, username, usernameKey, firstName, lastName, email, emailKey, salt, hash.toString("hex")]);
    if (!result.rows.length) return false;
    await insertSession(tx, id, token);
    return true;
  });
  if (created) return { token };
  await checkDuplicates();
  return { errors };
}

async function insertSession(db: Pick<PGlite, "query">, id: string, token: string) {
  await db.query("DELETE FROM sessions WHERE expires_at <= NOW()");
  await db.query("INSERT INTO sessions (token_hash, account_id, expires_at) VALUES ($1, $2, $3)",
    [digest(token), id, new Date(Date.now() + sessionSeconds * 1000).toISOString()]);
}

export async function login(data: Input) {
  const identifier = identityKey(input(data, "identifier"));
  const password = input(data, "password");
  if (!identifier || identifier.length > 254 || !password || password.length > 512) return null;
  const db = await database();
  const result = await db.query<{ id: string; password_hash: string; password_salt: string }>(
    "SELECT id, password_hash, password_salt FROM accounts WHERE username_key = $1 OR email_key = $1", [identifier]);
  const account = result.rows[0];
  const candidate = (await derive(password, account?.password_salt ?? "f0".repeat(16), 64)) as Buffer;
  if (!account || !timingSafeEqual(candidate, Buffer.from(account.password_hash, "hex"))) return null;
  const token = randomBytes(32).toString("hex");
  await db.transaction((tx) => insertSession(tx, account.id, token));
  return token;
}

export const cookieOptions = {
  httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production",
  path: "/", maxAge: sessionSeconds,
};
export const cookieName = "academy_session";

export async function sessionAccount(token?: string): Promise<Account | null> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const db = await database();
  const result = await db.query<Account>(`
    SELECT a.id, a.username, a.role FROM accounts a JOIN sessions s ON a.id = s.account_id
    WHERE s.token_hash = $1 AND s.expires_at > NOW()`, [digest(token)]);
  return result.rows[0] ?? null;
}

export async function logout(token: string) {
  const db = await database();
  await db.query("DELETE FROM sessions WHERE token_hash = $1", [digest(token)]);
}

export async function newUsersGetFullRights() {
  const db = await database();
  const result = await db.query<{ grant_new_users_full_rights: boolean }>(
    "SELECT grant_new_users_full_rights FROM application_settings WHERE singleton");
  return result.rows[0].grant_new_users_full_rights;
}

export async function saveFullRights(token: string, value: boolean) {
  const db = await database();
  const result = await db.query(`
    UPDATE application_settings SET grant_new_users_full_rights = $1 WHERE singleton AND EXISTS (
      SELECT 1 FROM accounts a JOIN sessions s ON s.account_id = a.id
      WHERE s.token_hash = $2 AND s.expires_at > NOW() AND a.role = 'admin'
    ) RETURNING singleton`, [value, digest(token)]);
  return result.rows.length === 1;
}
