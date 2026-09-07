"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import {
  LoginFormSchema,
  SignupFormSchema,
  type AuthFormState,
} from "@/lib/definitions";
import { createUser, findUserByEmail, upsertUser } from "@/lib/db";
import { loadGhlAccount, persistGhlAccount } from "@/lib/ghl";
import { createSession, deleteSession } from "@/lib/session";

export async function signup(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validated = SignupFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, email, password } = validated.data;
  const passwordHash = await bcrypt.hash(password, 10);
  const created = createUser({ name, email, passwordHash });
  let user = "error" in created ? null : created.user;

  if ("error" in created) {
    const existing = findUserByEmail(email) ?? (await loadGhlAccount(email));
    if (!existing) return { message: created.error };
    const matches = await bcrypt.compare(password, existing.passwordHash);
    if (!matches) {
      return { message: "An account with that email already exists. Log in instead." };
    }
    user = upsertUser({ ...existing, name, passwordHash });
  }

  if (!user) return { message: created.error };
  await persistGhlAccount(user);
  await createSession(user);
  redirect("/collection");
}

export async function login(_state: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const validated = LoginFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  let user = findUserByEmail(validated.data.email);
  if (!user) {
    const remote = await loadGhlAccount(validated.data.email);
    if (remote) user = upsertUser(remote);
  }
  if (!user) {
    return { message: "Email or password is incorrect." };
  }
  const ok = await bcrypt.compare(validated.data.password, user.passwordHash);
  if (!ok) {
    return { message: "Email or password is incorrect." };
  }

  await persistGhlAccount(user);
  await createSession(user);
  redirect("/collection");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
