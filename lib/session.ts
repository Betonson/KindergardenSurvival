import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cookieName, sessionAccount } from "./store";

export const currentAccount = cache(async () => {
  const jar = await cookies();
  return sessionAccount(jar.get(cookieName)?.value);
});

export async function requireAccount() {
  const account = await currentAccount();
  if (!account) redirect("/");
  return account;
}
