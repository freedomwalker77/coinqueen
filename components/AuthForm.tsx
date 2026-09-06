"use client";

import { login, signup } from "@/app/actions/auth";
import Link from "next/link";
import { useActionState } from "react";

const inputClass =
  "mt-1 w-full rounded-xl border border-gold/20 bg-queen-card px-3 py-2 text-cream outline-none focus:border-gold";

export function SignupForm() {
  const [state, action, pending] = useActionState(signup, undefined);

  return (
    <form action={action} className="max-w-md space-y-4">
      <Field label="Name" name="name" autoComplete="name" errors={state?.errors?.name} />
      <Field label="Email" name="email" type="email" autoComplete="email" errors={state?.errors?.email} />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        errors={state?.errors?.password}
        hint="At least 8 characters, with a letter and a number."
      />
      {state?.message ? <p className="text-sm text-red-300">{state.message}</p> : null}
      <button
        disabled={pending}
        type="submit"
        className="rounded-full bg-gold px-6 py-3 font-medium text-queen-ink hover:bg-gold-bright disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-sm text-cream/50">
        Already collecting?{" "}
        <Link href="/login" className="text-gold hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="max-w-md space-y-4">
      <Field label="Email" name="email" type="email" autoComplete="email" errors={state?.errors?.email} />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        errors={state?.errors?.password}
      />
      {state?.message ? <p className="text-sm text-red-300">{state.message}</p> : null}
      <button
        disabled={pending}
        type="submit"
        className="rounded-full bg-gold px-6 py-3 font-medium text-queen-ink hover:bg-gold-bright disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Log in"}
      </button>
      <p className="text-sm text-cream/50">
        New here?{" "}
        <Link href="/signup" className="text-gold hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  autoComplete,
  errors,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  errors?: string[];
  hint?: string;
}) {
  return (
    <label className="block text-sm text-cream/70">
      {label}
      <input id={name} name={name} type={type} autoComplete={autoComplete} className={inputClass} />
      {hint ? <p className="mt-1 text-xs text-cream/40">{hint}</p> : null}
      {errors?.map((error) => (
        <p key={error} className="mt-1 text-sm text-red-300">
          {error}
        </p>
      ))}
    </label>
  );
}
