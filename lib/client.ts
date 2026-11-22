import type { FieldErrors } from "./types";

export async function submit(operation: "login" | "register" | "logout" | "settings", data: object) {
  const response = await fetch(`/api/${operation}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("Unexpected response");
  const result: { errors?: FieldErrors; message?: string } = await response.json();
  return { ok: response.ok, ...result };
}

export const connectionError = "Не удалось связаться с сервером. Попробуйте ещё раз.";
