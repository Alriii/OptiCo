"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, RefreshCw, Save, Settings2 } from "lucide-react";
import { toast } from "sonner";
import {
  adminService,
  settingsSchema,
  type SettingsInput,
} from "@/services/admin.service";
import { getApiError } from "@/lib/api-error";
import type { ClinicSettings } from "@/services/types";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

const EMPTY: SettingsInput = {
  name: "",
  address: "",
  phone: "",
  email: "",
  cancellationCutoffHours: 24,
  bookingNoticeHours: 2,
};

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [policyPrivacy, setPolicyPrivacy] = useState("");
  const [policyTerms, setPolicyTerms] = useState("");
  const [policyCancellation, setPolicyCancellation] = useState("");

  const form = useForm<SettingsInput>({
    resolver: zodResolver(settingsSchema),
    defaultValues: EMPTY,
    mode: "onBlur",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getSettings();
      const data = response.data;
      setSettings(data);
      form.reset({
        name: data?.name ?? "",
        address: data?.address ?? "",
        phone: data?.phone ?? "",
        email: data?.email ?? "",
        cancellationCutoffHours: data?.cancellationCutoffHours ?? 24,
        bookingNoticeHours: data?.bookingNoticeHours ?? 2,
      });
      setPolicyPrivacy(data?.policies?.privacy ?? "");
      setPolicyTerms(data?.policies?.terms ?? "");
      setPolicyCancellation(data?.policies?.cancellation ?? "");
    } catch (err) {
      setError(getApiError(err, "Clinic settings could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSubmit = async (values: SettingsInput) => {
    try {
      const response = await adminService.updateSettings({
        ...values,
        policies: {
          privacy: policyPrivacy.trim(),
          terms: policyTerms.trim(),
          cancellation: policyCancellation.trim(),
        },
      });
      setSettings(response.data ?? settings);
      toast.success("Clinic settings saved.");
    } catch (err) {
      toast.error(getApiError(err, "Clinic settings could not be saved."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Clinic profile and booking rules"
        description="Public clinic details and the scheduling rules patients see. Secrets, SMTP credentials, and database URLs are never displayed here."
        actions={
          <Button type="button" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
        }
      />

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      ) : null}

      {loading ? (
        <LoadingState title="Loading clinic settings" />
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings2 className="size-4" /> Clinic profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={Boolean(form.formState.errors.name)}>
                    <FieldLabel htmlFor="settings-name">Clinic name</FieldLabel>
                    <Input
                      id="settings-name"
                      aria-invalid={Boolean(form.formState.errors.name)}
                      {...form.register("name")}
                    />
                    <FieldError errors={[form.formState.errors.name]} />
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.email)}>
                    <FieldLabel htmlFor="settings-email">Public email</FieldLabel>
                    <Input
                      id="settings-email"
                      type="email"
                      aria-invalid={Boolean(form.formState.errors.email)}
                      {...form.register("email")}
                    />
                    <FieldError errors={[form.formState.errors.email]} />
                  </Field>
                </div>

                <Field data-invalid={Boolean(form.formState.errors.address)}>
                  <FieldLabel htmlFor="settings-address">Address</FieldLabel>
                  <Input
                    id="settings-address"
                    aria-invalid={Boolean(form.formState.errors.address)}
                    {...form.register("address")}
                  />
                  <FieldError errors={[form.formState.errors.address]} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field data-invalid={Boolean(form.formState.errors.phone)}>
                    <FieldLabel htmlFor="settings-phone">Phone</FieldLabel>
                    <Input
                      id="settings-phone"
                      type="tel"
                      aria-invalid={Boolean(form.formState.errors.phone)}
                      {...form.register("phone")}
                    />
                    <FieldError errors={[form.formState.errors.phone]} />
                  </Field>

                  <Field
                    data-invalid={Boolean(
                      form.formState.errors.cancellationCutoffHours,
                    )}
                  >
                    <FieldLabel htmlFor="settings-cutoff">
                      Cancellation cutoff (hours)
                    </FieldLabel>
                    <Input
                      id="settings-cutoff"
                      type="number"
                      min="0"
                      max="168"
                      aria-invalid={Boolean(
                        form.formState.errors.cancellationCutoffHours,
                      )}
                      {...form.register("cancellationCutoffHours", {
                        valueAsNumber: true,
                      })}
                    />
                    <FieldError
                      errors={[form.formState.errors.cancellationCutoffHours]}
                    />
                  </Field>

                  <Field
                    data-invalid={Boolean(
                      form.formState.errors.bookingNoticeHours,
                    )}
                  >
                    <FieldLabel htmlFor="settings-notice">
                      Minimum booking notice (hours)
                    </FieldLabel>
                    <Input
                      id="settings-notice"
                      type="number"
                      min="0"
                      max="168"
                      aria-invalid={Boolean(
                        form.formState.errors.bookingNoticeHours,
                      )}
                      {...form.register("bookingNoticeHours", {
                        valueAsNumber: true,
                      })}
                    />
                    <FieldError
                      errors={[form.formState.errors.bookingNoticeHours]}
                    />
                  </Field>
                </div>
                <FieldDescription>
                  The backend enforces these rules. Changing them affects new
                  requests only; existing appointments keep their recorded terms.
                </FieldDescription>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Policy copy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Optional clinic-approved wording for the public policy pages.
                The built-in pages remain in place when these fields are empty.
                Do not paste legal text until the clinic has approved it.
              </p>

              <Field>
                <FieldLabel htmlFor="settings-privacy">Privacy notice</FieldLabel>
                <Textarea
                  id="settings-privacy"
                  rows={3}
                  value={policyPrivacy}
                  onChange={(event) => setPolicyPrivacy(event.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="settings-terms">Terms of use</FieldLabel>
                <Textarea
                  id="settings-terms"
                  rows={3}
                  value={policyTerms}
                  onChange={(event) => setPolicyTerms(event.target.value)}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="settings-cancellation">
                  Cancellation policy
                </FieldLabel>
                <Textarea
                  id="settings-cancellation"
                  rows={3}
                  value={policyCancellation}
                  onChange={(event) => setPolicyCancellation(event.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <ConfirmDialog
              trigger={
                <Button
                  type="button"
                  disabled={form.formState.isSubmitting}
                >
                  <Save className="size-4" /> Review and save
                </Button>
              }
              title="Save clinic settings?"
              description="These values affect public clinic information and new appointment requests. Review the details before saving."
              confirmLabel="Save settings"
              onConfirm={() => form.handleSubmit(onSubmit)()}
            />
            <p className="text-xs text-muted-foreground">
              {settings?.name
                ? `Currently saved as ${settings.name}.`
                : "No clinic settings have been saved yet."}
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
