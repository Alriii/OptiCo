"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { loginSchema, type LoginInput } from "@/services/auth.service";
import { getApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";

const DEMO_PRESETS = [
  { role: "Admin", email: "admin@optico.local", label: "Admin" },
  { role: "Doctor", email: "doctor.reyes@optico.local", label: "Doctor" },
  { role: "Staff", email: "receptionist@optico.local", label: "Staff" },
  { role: "Patient", email: "patient@optico.local", label: "Patient" },
] as const;

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
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onBlur",
  });

  const handleSelectPreset = (email: string, role: string) => {
    setActivePreset(role);
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", "Password123!", { shouldValidate: true });
    setFormError(null);
  };

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
    <div className="w-full rounded-3xl border border-border/80 bg-card/95 p-7 sm:p-9 shadow-sm sm:shadow-xl sm:shadow-primary/[0.04] backdrop-blur-xs transition-all">
      {/* Brand & Mascot Header */}
      <div className="flex flex-col items-center text-center">
        <div className="relative mb-3 group">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-emerald-500/20 via-teal-400/20 to-primary/20 blur-sm transition-all duration-300 group-hover:blur-md" />
          <img
            src="/mascot.jpg"
            alt="Dr. Octo - OptiCo Mascot"
            className="relative size-16 rounded-2xl object-cover ring-2 ring-primary/15 shadow-sm transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-white shadow-xs">
            ✦
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Sign in to access your appointments & clinic portal
        </p>
      </div>

      {/* Quick Demo Credentials Bar */}
      <div className="my-5 rounded-2xl border border-border/60 bg-secondary/50 p-3">
        <div className="mb-2 flex items-center justify-between px-0.5">
          <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Sparkles className="size-3 text-emerald-600 dark:text-emerald-400" />
            Quick Demo Fill
          </span>
          <span className="text-[10px] text-muted-foreground/75">
            1-click credentials
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {DEMO_PRESETS.map((p) => {
            const isSelected = activePreset === p.role;
            return (
              <button
                key={p.role}
                type="button"
                onClick={() => handleSelectPreset(p.email, p.role)}
                className={`flex items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-all ${
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border/60 bg-background/80 text-foreground hover:border-primary/40 hover:bg-background"
                }`}
              >
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {registered ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Account created successfully. Sign in to continue.</span>
        </div>
      ) : null}

      {invited ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Invitation accepted! You may now sign in.</span>
        </div>
      ) : null}

      {formError ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{formError}</span>
        </div>
      ) : null}

      {/* Main Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="block text-xs font-medium text-foreground"
          >
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              aria-invalid={Boolean(form.formState.errors.email)}
              {...form.register("email")}
              className={`flex h-10 w-full rounded-xl border bg-background/80 pl-9 pr-3 text-sm shadow-xs transition-colors placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                form.formState.errors.email
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input hover:border-primary/40"
              }`}
            />
          </div>
          {form.formState.errors.email?.message ? (
            <p className="text-[11px] text-destructive">
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
            <span className="text-[11px] text-muted-foreground/70">
              Demo: <code className="font-mono text-foreground">Password123!</code>
            </span>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/70" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••••••"
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register("password")}
              className={`flex h-10 w-full rounded-xl border bg-background/80 pl-9 pr-10 text-sm shadow-xs transition-colors placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                form.formState.errors.password
                  ? "border-destructive focus-visible:ring-destructive"
                  : "border-input hover:border-primary/40"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {form.formState.errors.password?.message ? (
            <p className="text-[11px] text-destructive">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="mt-2 h-10 w-full rounded-xl text-sm font-medium shadow-xs transition-transform active:scale-[0.99]"
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
      <div className="mt-6 space-y-2 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground">
        <p>
          New patient?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Create an account
          </Link>
        </p>
        <p>
          Booked as a guest?{" "}
          <Link
            href="/guest/manage"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Manage via access code
          </Link>
        </p>
      </div>
    </div>
  );
}
