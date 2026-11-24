"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { acceptInviteSchema, authService, type AcceptInviteInput } from "@/services/auth.service";
import { getApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function AcceptInviteForm({ token }: { token?: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<AcceptInviteInput>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: { token: token ?? "", password: "" },
    mode: "onBlur",
  });

  const onSubmit = async (values: AcceptInviteInput) => {
    setFormError(null);
    try {
      await authService.acceptInvite(values);
      toast.success("Invitation accepted. Sign in with your new password.");
      router.replace("/login?invited=1");
    } catch (error) {
      const message = getApiError(
        error,
        "The invitation could not be accepted. It may have expired.",
      );
      setFormError(message);
      toast.error(message);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Clean Minimalist Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Accept invitation
        </h1>
        <p className="text-sm text-muted-foreground">
          Set a secure password for your clinic account.
        </p>
      </div>

      <div className="space-y-4">
        {!token ? (
          <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-900 dark:text-amber-200">
            No invitation token was found in this link. Open the link from your invitation email.
          </p>
        ) : null}

        {formError ? (
          <p
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {formError}
          </p>
        ) : null}

        <form id="accept-invite-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.token)}>
              <FieldLabel htmlFor="invite-token" className="text-xs font-medium text-foreground/90">Invitation token</FieldLabel>
              <Input
                id="invite-token"
                autoComplete="off"
                className="h-10 rounded-lg border-input bg-background font-mono text-xs shadow-2xs focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                aria-invalid={Boolean(form.formState.errors.token)}
                {...form.register("token")}
              />
              <FieldError errors={[form.formState.errors.token]} />
            </Field>

            <Field data-invalid={Boolean(form.formState.errors.password)}>
              <FieldLabel htmlFor="invite-password" className="text-xs font-medium text-foreground/90">New password</FieldLabel>
              <Input
                id="invite-password"
                type="password"
                autoComplete="new-password"
                placeholder="Choose a strong password"
                className="h-10 rounded-lg border-input bg-background text-sm shadow-2xs focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
              <FieldError errors={[form.formState.errors.password]} />
            </Field>
          </FieldGroup>

          <Button
            type="submit"
            form="accept-invite-form"
            className="h-10 w-full rounded-lg text-sm font-medium shadow-xs transition-colors"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="size-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                Saving…
              </span>
            ) : (
              "Activate account"
            )}
          </Button>
        </form>
      </div>

      <p className="pt-2 text-center text-xs text-muted-foreground">
        Already activated?{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
