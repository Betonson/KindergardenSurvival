import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Вход · Сад № 0", template: "%s · Сад № 0" },
  description: "Сад № 0. Всё пошло по плану. Почти. Сюжетная игра для сотрудников детских садов «Синергия».",
  icons: { icon: "/brand/rhino.webp" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="ru"><body>{children}</body></html>;
}
