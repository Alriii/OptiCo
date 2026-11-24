"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { loginSchema, type LoginInput } from "@/services/auth.service";
import { getApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";

export function LoginForm({
  registered,
  invited,
  next,
}: {
  registered?: boolean;
  invited?: boolean;
  next?: string;
}) {
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const onSubmit = async (values: LoginInput) => {
    setFormError(null);
    try {
      await login(values);
      toast.success("Welcome back! Signing you in…");
    } catch (error) {
      const message = getApiError(error, "Sign in failed. Check your details.");
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Minimalist Header */}
      <div className="space-y-1.5">
        <h1 id="login-heading" className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Sign in
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and password to access your clinic portal.
        </p>
      </div>

      {/* Notifications / Alerts */}
      {next?.includes("booking") ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-primary/20 bg-primary/10 px-3.5 py-2.5 text-xs text-foreground">
          <CheckCircle2 className="size-4 shrink-0 text-primary" />
          <span>Please sign in with your patient account to book an appointment.</span>
        </div>
      ) : null}

      {registered ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Account created successfully. Sign in to continue.</span>
        </div>
      ) : null}

      {invited ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Invitation accepted! You may now sign in.</span>
        </div>
      ) : null}

      {formError ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      ) : null}

      {/* Form */}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        aria-labelledby="login-heading"
        className="space-y-4"
        noValidate
      >
        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="block text-xs font-medium text-foreground/90"
          >
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="name@example.com"
              spellCheck={false}
              autoCapitalize="none"
              autoCorrect="off"
              enterKeyHint="next"
              required
              aria-invalid={Boolean(form.formState.errors.email)}
              aria-describedby={
                form.formState.errors.email ? "login-email-error" : undefined
              }
              {...form.register("email")}
              className={`flex h-10 w-full rounded-lg border bg-background px-3 pl-9 text-sm text-foreground shadow-2xs transition-colors placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-1 ${
                form.formState.errors.email
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input focus-visible:border-primary focus-visible:ring-primary"
              }`}
            />
          </div>
          {form.formState.errors.email?.message ? (
            <p id="login-email-error" className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="block text-xs font-medium text-foreground/90"
            >
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••••••"
              enterKeyHint="done"
              required
              aria-invalid={Boolean(form.formState.errors.password)}
              aria-describedby={
                form.formState.errors.password
                  ? "login-password-error"
                  : undefined
              }
              {...form.register("password")}
              className={`flex h-10 w-full rounded-lg border bg-background px-3 pl-9 pr-9 text-sm text-foreground shadow-2xs transition-colors placeholder:text-muted-foreground/40 focus-visible:outline-none focus-visible:ring-1 ${
                form.formState.errors.password
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input focus-visible:border-primary focus-visible:ring-primary"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground/60 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {form.formState.errors.password?.message ? (
            <p id="login-password-error" className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="h-10 w-full rounded-lg text-sm font-medium shadow-xs transition-colors"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Signing in…
            </span>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      {/* Footer Navigation */}
      <p className="text-center text-xs text-muted-foreground pt-2">
        Don&apos;t have an account?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
