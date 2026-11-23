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
    <div className="w-full rounded-3xl border border-border/80 bg-card/95 p-8 sm:p-10 shadow-sm sm:shadow-xl sm:shadow-primary/[0.04] backdrop-blur-xs transition-all">
      {/* Clean Minimalist Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          Accept invitation
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
          Set a secure password for your clinic staff account
        </p>
      </div>

      <div className="space-y-4">
        {!token ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
            No invitation token was found in this link. Open the link from your
            invitation email.
          </p>
        ) : null}

        {formError ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {formError}
          </p>
        ) : null}

        <form id="accept-invite-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.token)}>
              <FieldLabel htmlFor="invite-token" className="text-xs">Invitation token</FieldLabel>
              <Input
                id="invite-token"
                autoComplete="off"
                className="h-10 rounded-xl font-mono text-xs"
                aria-invalid={Boolean(form.formState.errors.token)}
                {...form.register("token")}
              />
              <FieldError errors={[form.formState.errors.token]} />
            </Field>

            <Field data-invalid={Boolean(form.formState.errors.password)}>
              <FieldLabel htmlFor="invite-password" className="text-xs">New password</FieldLabel>
              <Input
                id="invite-password"
                type="password"
                autoComplete="new-password"
                placeholder="Choose a strong password"
                className="h-10 rounded-xl"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
              <FieldError errors={[form.formState.errors.password]} />
            </Field>
          </FieldGroup>

          <Button
            type="submit"
            form="accept-invite-form"
            className="mt-2 h-10 w-full rounded-xl text-sm font-medium shadow-xs transition-transform active:scale-[0.99]"
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

      <div className="mt-6 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground">
        <p>
          Already activated?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
