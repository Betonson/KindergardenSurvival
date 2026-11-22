import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Kindergarden Survival — Вход", template: "%s · Kindergarden Survival" },
  description: "Академия супернаставников — браузерная игра для педагогов.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="ru"><body>{children}</body></html>;
}
