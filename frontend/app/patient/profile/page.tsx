"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { patientService, profileSchema, type ProfileInput } from "@/services/patient.service";
import { getApiError } from "@/lib/api-error";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";

export default function PatientProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      email: "",
      mobile: "",
      dateOfBirth: "",
    },
    mode: "onBlur",
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await patientService.getProfile();
      const profile = response.data;
      if (!profile) {
        setError("No patient profile is attached to this account yet.");
        return;
      }
      setProfileId(profile.id);
      form.reset({
        fullName: profile.fullName ?? "",
        email: profile.email ?? "",
        mobile: profile.mobile ?? "",
        dateOfBirth: profile.dateOfBirth ?? "",
      });
    } catch (err) {
      setError(getApiError(err, "Your profile could not be loaded."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (values: ProfileInput) => {
    try {
      await patientService.updateProfile({
        ...values,
        dateOfBirth: values.dateOfBirth || undefined,
      });
      toast.success("Profile updated.");
    } catch (err) {
      toast.error(getApiError(err, "The profile could not be saved."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title="Contact details"
        description="Keep the contact information the clinic uses for appointment updates. The clinic controls which fields can be changed."
      />

      {error ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={load}>
            <RefreshCw className="size-4" /> Retry
          </Button>
        </div>
      ) : null}

      {loading ? (
        <LoadingState title="Loading profile" />
      ) : (
        <Card>
          <CardContent className="px-5 py-5">
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <FieldGroup>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={Boolean(form.formState.errors.fullName)}>
                    <FieldLabel htmlFor="profile-name">Full name</FieldLabel>
                    <Input
                      id="profile-name"
                      autoComplete="name"
                      aria-invalid={Boolean(form.formState.errors.fullName)}
                      {...form.register("fullName")}
                    />
                    <FieldError errors={[form.formState.errors.fullName]} />
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.email)}>
                    <FieldLabel htmlFor="profile-email">Email</FieldLabel>
                    <Input
                      id="profile-email"
                      type="email"
                      autoComplete="email"
                      aria-invalid={Boolean(form.formState.errors.email)}
                      {...form.register("email")}
                    />
                    <FieldError errors={[form.formState.errors.email]} />
                  </Field>

                  <Field data-invalid={Boolean(form.formState.errors.mobile)}>
                    <FieldLabel htmlFor="profile-mobile">Mobile number</FieldLabel>
                    <Input
                      id="profile-mobile"
                      type="tel"
                      autoComplete="tel"
                      aria-invalid={Boolean(form.formState.errors.mobile)}
                      {...form.register("mobile")}
                    />
                    <FieldError errors={[form.formState.errors.mobile]} />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="profile-dob">Date of birth</FieldLabel>
                    <Input
                      id="profile-dob"
                      type="date"
                      {...form.register("dateOfBirth")}
                    />
                    <FieldDescription>
                      Used only for age and guardian requirements.
                    </FieldDescription>
                  </Field>
                </div>
              </FieldGroup>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving…" : "Save changes"}
                </Button>
                <span className="text-xs text-muted-foreground">
                  Patient record: {profileId ?? "—"}
                </span>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
