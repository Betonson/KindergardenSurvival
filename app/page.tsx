import { redirect } from "next/navigation";
import { Brand } from "@/components/Brand";
import { AuthForm } from "@/components/AuthForm";
import { currentAccount } from "@/lib/session";

export default async function AuthPage() {
  if (await currentAccount()) redirect("/garden");
  return <main className="auth-page">
    <section className="auth-column" aria-label="Авторизация">
      <Brand />
      <div className="auth-center"><AuthForm /></div>
    </section>
    <aside className="poster" aria-label="Сад № 0. Всё пошло по плану. Почти.">
      <div className="cover-heading" aria-hidden="true">
        <div><p className="cover-title">Сад № <em>0</em></p><p className="cover-subtitle">Всё пошло по плану. <b>Почти.</b></p></div>
        <img className="cover-mascot" src="/brand/rhino.webp" width="92" height="92" alt="" />
      </div>
      <div className="comic-strip" role="img" aria-label="В трёх кадрах мальчик пытается поднять тыкву, девочка привозит тележку, и они увозят тыкву вместе.">
        <img src="/art/pumpkin-1.webp" width="980" height="420" alt="" />
        <img src="/art/pumpkin-2.webp" width="980" height="487" alt="" />
        <img src="/art/pumpkin-3.webp" width="980" height="530" alt="" />
      </div>
    </aside>
  </main>;
}
