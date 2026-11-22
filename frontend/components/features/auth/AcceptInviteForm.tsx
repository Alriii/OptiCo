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
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Accept your invitation</CardTitle>
        <CardDescription>
          Set a password for your clinic staff account. Ask an administrator for
          a new invitation if this one has expired.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!token ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
            No invitation token was found in this link. Open the link from your
            invitation email.
          </p>
        ) : null}

        {formError ? (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {formError}
          </p>
        ) : null}

        <form id="accept-invite-form" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.token)}>
              <FieldLabel htmlFor="invite-token">Invitation token</FieldLabel>
              <Input
                id="invite-token"
                autoComplete="off"
                aria-invalid={Boolean(form.formState.errors.token)}
                {...form.register("token")}
              />
              <FieldError errors={[form.formState.errors.token]} />
            </Field>

            <Field data-invalid={Boolean(form.formState.errors.password)}>
              <FieldLabel htmlFor="invite-password">New password</FieldLabel>
              <Input
                id="invite-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
              <FieldError errors={[form.formState.errors.password]} />
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          type="submit"
          form="accept-invite-form"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Saving…" : "Accept invitation"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Already activated?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
