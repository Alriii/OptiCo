"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { signupSchema, type SignupInput } from "@/services/auth.service";
import { getApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function SignupForm() {
  const { signup } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "" },
    mode: "onBlur",
  });

  const onSubmit = async (values: SignupInput) => {
    setFormError(null);
    try {
      await signup(values);
      toast.success("Account created.");
    } catch (error) {
      const message = getApiError(error, "Account creation failed. Try again.");
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <div className="w-full rounded-2xl border border-border/70 bg-card/95 p-7 sm:p-9 shadow-md shadow-primary/[0.03] backdrop-blur-sm transition-all">
      {/* Clean Minimalist Header */}
      <div className="mb-6 space-y-1.5">
        <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium tracking-wide text-primary">
          <span className="size-1.5 rounded-full bg-primary" />
          Patient Registration
        </div>
        <h1 className="text-2xl sm:text-[26px] font-semibold tracking-tight text-foreground">
          Create an account
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Register for convenient patient appointments and visit history.
        </p>
      </div>

      <div className="space-y-4">
        {formError ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {formError}
          </p>
        ) : null}

        <form id="signup-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.name)}>
              <FieldLabel htmlFor="signup-name" className="text-xs">Full name</FieldLabel>
              <Input
                id="signup-name"
                autoComplete="name"
                placeholder="e.g. Maria Santos"
                className="h-10 rounded-xl"
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>

            <Field data-invalid={Boolean(form.formState.errors.email)}>
              <FieldLabel htmlFor="signup-email" className="text-xs">Email address</FieldLabel>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className="h-10 rounded-xl"
                aria-invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
              <FieldError errors={[form.formState.errors.email]} />
            </Field>

            <Field data-invalid={Boolean(form.formState.errors.password)}>
              <FieldLabel htmlFor="signup-password" className="text-xs">Password</FieldLabel>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="h-10 rounded-xl"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
              <FieldDescription className="text-[11px]">
                Must include at least 8 characters, one uppercase letter, and one number.
              </FieldDescription>
              <FieldError errors={[form.formState.errors.password]} />
            </Field>
          </FieldGroup>

          <Button
            type="submit"
            form="signup-form"
            className="mt-2 h-10 w-full rounded-xl text-sm font-medium shadow-xs transition-transform active:scale-[0.99]"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Creating account…
              </span>
            ) : (
              "Create patient account"
            )}
          </Button>
        </form>
      </div>

      <div className="mt-6 space-y-2 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground">
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
        <p className="text-[11px] leading-relaxed text-muted-foreground/75">
          By continuing you acknowledge the{" "}
          <Link href="/policies/privacy" className="underline underline-offset-4">
            privacy notice
          </Link>{" "}
          and{" "}
          <Link href="/policies/terms" className="underline underline-offset-4">
            terms of use
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
