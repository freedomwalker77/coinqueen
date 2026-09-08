import { z } from "zod";

export const SignupFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }).trim(),
  email: z.email({ message: "Enter a valid email." }).trim().toLowerCase(),
  password: z
    .string()
    .min(8, { message: "Use at least 8 characters." })
    .regex(/[a-zA-Z]/, { message: "Include a letter." })
    .regex(/[0-9]/, { message: "Include a number." }),
});

export const LoginFormSchema = z.object({
  email: z.email({ message: "Enter a valid email." }).trim().toLowerCase(),
  password: z.string().min(1, { message: "Enter your password." }),
});

export type AuthFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export type SessionPayload = {
  userId: string;
  name?: string;
  shopSlug?: string;
  email?: string;
  expiresAt: number;
};

export type SessionUser = {
  id: string;
  name: string;
  shopSlug: string;
  email?: string;
};

export type ConnectStatus = {
  enabled: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  country: string | null;
};
