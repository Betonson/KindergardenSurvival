import { redirect } from "next/navigation";
import { Brand } from "@/components/Brand";
import { AuthForm } from "@/components/AuthForm";
import { currentAccount } from "@/lib/session";

export default async function AuthPage() {
  if (await currentAccount()) redirect("/welcome");
  return <main className="auth-page">
    <section className="auth-column" aria-label="Авторизация">
      <Brand />
      <div className="auth-center"><AuthForm /></div>
    </section>
    <aside className="poster" aria-label="Академия супернаставников">
      <div className="poster-heading" aria-hidden="true">
        <span className="poster-rule"><i />✦<i /></span>
        <p>Академия<br />супернаставников</p>
      </div>
    </aside>
  </main>;
}
