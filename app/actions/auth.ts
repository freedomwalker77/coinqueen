"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import {
  LoginFormSchema,
  SignupFormSchema,
  type AuthFormState,
} from "@/lib/definitions";
import { createUser, findUserByEmail } from "@/lib/db";
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
  const created = createUser({
    name,
    email,
    passwordHash,
  });
  if ("error" in created) {
    return { message: created.error };
  }

  await createSession(created.user.id);
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

  const user = findUserByEmail(validated.data.email);
  if (!user) {
    return { message: "Email or password is incorrect." };
  }
  const ok = await bcrypt.compare(validated.data.password, user.passwordHash);
  if (!ok) {
    return { message: "Email or password is incorrect." };
  }

  await createSession(user.id);
  redirect("/collection");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
