import { LoginForm } from "@/components/AuthForm";
import { Footer, Header } from "@/components/Chrome";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/collection");

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <p className="text-xs uppercase tracking-[0.22em] text-money">Account</p>
        <h1 className="mt-2 font-serif text-4xl text-money">Welcome back</h1>
        <p className="mt-2 max-w-xl text-cream/60">
          Log in to see the cabinet and shop listings stored with your account.
        </p>
        <div className="mt-8">
          <LoginForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
