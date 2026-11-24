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
}: {
  registered?: boolean;
  invited?: boolean;
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
    <div className="w-full rounded-3xl border border-border/80 bg-card/95 p-8 sm:p-10 shadow-sm sm:shadow-xl sm:shadow-primary/[0.04] backdrop-blur-xs transition-all">
      {/* Clean Minimalist Header */}
      <div className="mb-6">
        <h1 id="login-heading" className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
          Sign in to manage appointments, schedules & clinic operations
        </p>
      </div>

      {/* Notifications / Alerts */}
      {registered ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2.5 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Account created successfully. Sign in to continue.</span>
        </div>
      ) : null}

      {invited ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2.5 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Invitation accepted! You may now sign in.</span>
        </div>
      ) : null}

      {formError ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      ) : null}

      {/* Main Form */}
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
            className="block text-xs font-medium text-foreground"
          >
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
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
              className={`flex h-11 w-full rounded-xl border bg-background/80 pl-10 pr-3 text-sm shadow-xs transition-colors placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                form.formState.errors.email
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input hover:border-primary/40"
              }`}
            />
          </div>
          {form.formState.errors.email?.message ? (
            <p id="login-email-error" className="text-[11px] text-destructive">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="block text-xs font-medium text-foreground"
            >
              Password
            </label>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
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
              className={`flex h-11 w-full rounded-xl border bg-background/80 pl-10 pr-10 text-sm shadow-xs transition-colors placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                form.formState.errors.password
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input hover:border-primary/40"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-pressed={showPassword}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {form.formState.errors.password?.message ? (
            <p id="login-password-error" className="text-[11px] text-destructive">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="mt-3 h-11 w-full rounded-xl text-sm font-semibold shadow-xs transition-transform active:scale-[0.99]"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Signing in…
            </span>
          ) : (
            "Sign in to portal"
          )}
        </Button>
      </form>

      {/* Footer Navigation */}
      <div className="mt-8 space-y-2 border-t border-border/60 pt-5 text-center text-xs text-muted-foreground">
        <p>
          New patient?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
