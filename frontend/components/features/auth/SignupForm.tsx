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

export function SignupForm({ next }: { next?: string } = {}) {
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
    <div className="w-full space-y-6">
      {/* Clean Minimalist Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Register to book patient appointments and access visit history.
        </p>
      </div>

      <div className="space-y-4">
        {formError ? (
          <p
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {formError}
          </p>
        ) : null}

        <form id="signup-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.name)}>
              <FieldLabel htmlFor="signup-name" className="text-xs font-medium text-foreground/90">Full name</FieldLabel>
              <Input
                id="signup-name"
                autoComplete="name"
                placeholder="e.g. Maria Santos"
                className="h-10 rounded-lg border-input bg-background text-sm shadow-2xs placeholder:text-muted-foreground/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>

            <Field data-invalid={Boolean(form.formState.errors.email)}>
              <FieldLabel htmlFor="signup-email" className="text-xs font-medium text-foreground/90">Email address</FieldLabel>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className="h-10 rounded-lg border-input bg-background text-sm shadow-2xs placeholder:text-muted-foreground/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                aria-invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
              <FieldError errors={[form.formState.errors.email]} />
            </Field>

            <Field data-invalid={Boolean(form.formState.errors.password)}>
              <FieldLabel htmlFor="signup-password" className="text-xs font-medium text-foreground/90">Password</FieldLabel>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="h-10 rounded-lg border-input bg-background text-sm shadow-2xs placeholder:text-muted-foreground/40 focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
              <FieldDescription className="text-[11px] text-muted-foreground/80">
                Must include at least 8 characters, one uppercase letter, and one number.
              </FieldDescription>
              <FieldError errors={[form.formState.errors.password]} />
            </Field>
          </FieldGroup>

          <Button
            type="submit"
            form="signup-form"
            className="h-10 w-full rounded-lg text-sm font-medium shadow-xs transition-colors"
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

      <div className="space-y-2 pt-2 text-center text-xs text-muted-foreground">
        <p>
          Already have an account?{" "}
          <Link
            href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors"
          >
            Sign in
          </Link>
        </p>
        <p className="text-[11px] text-muted-foreground/75">
          By continuing you acknowledge our{" "}
          <Link href="/policies/privacy" className="underline underline-offset-4 hover:text-foreground">
            privacy policy
          </Link>{" "}
          and{" "}
          <Link href="/policies/terms" className="underline underline-offset-4 hover:text-foreground">
            terms
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
