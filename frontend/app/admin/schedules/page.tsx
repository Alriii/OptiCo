"use client";

import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AlertCircle, CalendarRange, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  adminService,
  closureSchema,
  type ClosureInput,
} from "@/services/admin.service";
import { getApiError } from "@/lib/api-error";
import { readList } from "@/lib/api-shape";
import { formatDate, weekdayLabel } from "@/lib/format";
import type {
  ClinicClosure,
  ClinicHour,
  Doctor,
  DoctorAvailability,
} from "@/services/types";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { usePageMeta } from "@/lib/use-page-meta";

type Tab = "hours" | "closures" | "availability";

interface HourRow {
  weekday: number;
  open: boolean;
  openTime: string;
  closeTime: string;
}

interface AvailabilityRow {
  weekday: number;
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
}

function normalizeHours(hours: ClinicHour[]): HourRow[] {
  return Array.from({ length: 7 }, (_, weekday) => {
    const found = hours.find((item) => Number(item.weekday) === weekday);
    return {
      weekday,
      open: found?.open ?? false,
      openTime: found?.openTime ?? "09:00",
      closeTime: found?.closeTime ?? "17:00",
    };
  });
}

function normalizeAvailability(days: DoctorAvailability[]): AvailabilityRow[] {
  return Array.from({ length: 7 }, (_, weekday) => {
    const found = days.find((item) => Number(item.weekday) === weekday);
    return {
      weekday,
      enabled: Boolean(found),
      startTime: found?.startTime ?? "09:00",
      endTime: found?.endTime ?? "17:00",
      breakStart: found?.breakStart ?? "",
      breakEnd: found?.breakEnd ?? "",
    };
  });
}

export default function AdminSchedulesPage() {
  usePageMeta({
    title: "Clinic Schedules",
    description: "Configure clinic operating hours, shifts, and holiday closures.",
  });

  const [tab, setTab] = useState<Tab>("hours");

  const [hours, setHours] = useState<HourRow[]>(normalizeHours([]));
  const [hoursLoading, setHoursLoading] = useState(true);
  const [hoursError, setHoursError] = useState<string | null>(null);
  const [savingHours, setSavingHours] = useState(false);

  const [closures, setClosures] = useState<ClinicClosure[]>([]);
  const [closuresLoading, setClosuresLoading] = useState(true);
  const [closuresError, setClosuresError] = useState<string | null>(null);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [availability, setAvailability] = useState<AvailabilityRow[]>(
    normalizeAvailability([]),
  );
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [savingAvailability, setSavingAvailability] = useState(false);

  const closureForm = useForm<ClosureInput>({
    resolver: zodResolver(closureSchema),
    defaultValues: { date: "", reason: "" },
    mode: "onBlur",
  });

  const loadHours = useCallback(async () => {
    setHoursLoading(true);
    setHoursError(null);
    try {
      const response = await adminService.getClinicHours();
      setHours(normalizeHours(readList<ClinicHour>(response.data, "hours")));
    } catch (err) {
      setHoursError(getApiError(err, "Clinic hours could not be loaded."));
    } finally {
      setHoursLoading(false);
    }
  }, []);

  const loadClosures = useCallback(async () => {
    setClosuresLoading(true);
    setClosuresError(null);
    try {
      const response = await adminService.getClosures();
      setClosures(readList<ClinicClosure>(response.data, "closures"));
    } catch (err) {
      setClosuresError(getApiError(err, "Closures could not be loaded."));
    } finally {
      setClosuresLoading(false);
    }
  }, []);

  const loadDoctors = useCallback(async () => {
    try {
      const response = await adminService.getDoctors();
      setDoctors(readList<Doctor>(response.data, "doctors"));
    } catch (err) {
      setAvailabilityError(getApiError(err, "Doctors could not be loaded."));
    }
  }, []);

  useEffect(() => {
    void loadHours();
    void loadClosures();
    void loadDoctors();
  }, [loadHours, loadClosures, loadDoctors]);

  const loadAvailability = useCallback(async (doctorId: string) => {
    setAvailabilityLoading(true);
    setAvailabilityError(null);
    try {
      const response = await adminService.getDoctorAvailability(doctorId);
      setAvailability(
        normalizeAvailability(
          readList<DoctorAvailability>(response.data, "windows", "availability", "days"),
        ),
      );
    } catch (err) {
      setAvailabilityError(
        getApiError(err, "Doctor availability could not be loaded."),
      );
    } finally {
      setAvailabilityLoading(false);
    }
  }, []);

  const updateHour = (weekday: number, patch: Partial<HourRow>) => {
    setHours((current) =>
      current.map((row) =>
        row.weekday === weekday ? { ...row, ...patch } : row,
      ),
    );
  };

  const saveHours = async () => {
    setSavingHours(true);
    try {
      await adminService.updateClinicHours(
        hours.map((row) => ({
          weekday: row.weekday,
          open: row.open,
          openTime: row.openTime,
          closeTime: row.closeTime,
        })),
      );
      toast.success("Clinic hours saved.");
    } catch (err) {
      toast.error(getApiError(err, "Clinic hours could not be saved."));
    } finally {
      setSavingHours(false);
    }
  };

  const addClosure = async (values: ClosureInput) => {
    try {
      await adminService.createClosure({
        date: values.date,
        reason: values.reason?.trim() || undefined,
      });
      toast.success("Closure added.");
      closureForm.reset({ date: "", reason: "" });
      await loadClosures();
    } catch (err) {
      toast.error(getApiError(err, "The closure could not be added."));
    }
  };

  const deleteClosure = async (closure: ClinicClosure) => {
    try {
      await adminService.deleteClosure(closure.id);
      toast.success("Closure removed.");
      await loadClosures();
    } catch (err) {
      toast.error(getApiError(err, "The closure could not be removed."));
      throw err;
    }
  };

  const updateAvailability = (weekday: number, patch: Partial<AvailabilityRow>) => {
    setAvailability((current) =>
      current.map((row) =>
        row.weekday === weekday ? { ...row, ...patch } : row,
      ),
    );
  };

  const saveAvailability = async () => {
    if (!selectedDoctorId) return;
    setSavingAvailability(true);
    try {
      const days = availability
        .filter((row) => row.enabled)
        .map((row) => ({
          weekday: row.weekday,
          startTime: row.startTime,
          endTime: row.endTime,
          breakStart: row.breakStart || null,
          breakEnd: row.breakEnd || null,
        }));
      await adminService.updateDoctorAvailability(selectedDoctorId, days);
      toast.success("Doctor availability saved.");
    } catch (err) {
      toast.error(getApiError(err, "Availability could not be saved."));
    } finally {
      setSavingAvailability(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Schedules"
        title="Clinic hours, closures, and doctor availability"
        description="Doctor availability must sit inside clinic hours. Appointments are only assigned when the full service duration fits."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void loadHours();
              void loadClosures();
              void loadDoctors();
            }}
          >
            <RefreshCw className="size-4" /> Refresh
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Schedule sections">
        {(
          [
            ["hours", "Clinic hours"],
            ["closures", "Closures"],
            ["availability", "Doctor availability"],
          ] as const
        ).map(([value, label]) => (
          <Button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            variant={tab === value ? "default" : "outline"}
            onClick={() => setTab(value)}
          >
            {label}
          </Button>
        ))}
      </div>

      {tab === "hours" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarRange className="size-4" /> Weekly clinic hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hoursError ? (
              <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {hoursError}
              </p>
            ) : null}

            {hoursLoading ? (
              <LoadingState title="Loading clinic hours" />
            ) : (
              <>
                <div className="divide-y">
                  {hours.map((row) => (
                    <div
                      key={row.weekday}
                      className="grid gap-3 py-3 sm:grid-cols-[10rem_8rem_1fr_1fr] sm:items-center"
                    >
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-input"
                          checked={row.open}
                          onChange={(event) =>
                            updateHour(row.weekday, { open: event.target.checked })
                          }
                        />
                        {weekdayLabel(row.weekday)}
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {row.open ? "Open" : "Closed"}
                      </span>
                      <Input
                        type="time"
                        aria-label={`${weekdayLabel(row.weekday)} opening time`}
                        value={row.openTime}
                        disabled={!row.open}
                        onChange={(event) =>
                          updateHour(row.weekday, { openTime: event.target.value })
                        }
                      />
                      <Input
                        type="time"
                        aria-label={`${weekdayLabel(row.weekday)} closing time`}
                        value={row.closeTime}
                        disabled={!row.open}
                        onChange={(event) =>
                          updateHour(row.weekday, { closeTime: event.target.value })
                        }
                      />
                    </div>
                  ))}
                </div>
                <Button type="button" onClick={saveHours} disabled={savingHours}>
                  {savingHours ? "Saving…" : "Save clinic hours"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      {tab === "closures" ? (
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="size-4" /> Add a closure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={closureForm.handleSubmit(addClosure)}
                className="space-y-4"
                noValidate
              >
                <Field data-invalid={Boolean(closureForm.formState.errors.date)}>
                  <FieldLabel htmlFor="closure-date">Date</FieldLabel>
                  <Input
                    id="closure-date"
                    type="date"
                    aria-invalid={Boolean(closureForm.formState.errors.date)}
                    {...closureForm.register("date")}
                  />
                  <FieldError errors={[closureForm.formState.errors.date]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="closure-reason">Reason</FieldLabel>
                  <Input
                    id="closure-reason"
                    placeholder="Holiday, maintenance, staff event"
                    {...closureForm.register("reason")}
                  />
                  <FieldDescription>
                    Visible to clinic staff. Do not include patient details.
                  </FieldDescription>
                </Field>
                <Button
                  type="submit"
                  disabled={closureForm.formState.isSubmitting}
                >
                  {closureForm.formState.isSubmitting ? "Adding…" : "Add closure"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Scheduled closures</h2>
            {closuresError ? (
              <p role="alert" className="text-sm text-destructive">
                {closuresError}
              </p>
            ) : null}
            {closuresLoading ? (
              <LoadingState title="Loading closures" />
            ) : closures.length === 0 ? (
              <EmptyState
                title="No closures"
                description="Temporary closures and holidays appear here."
              />
            ) : (
              <ul className="divide-y rounded-xl border bg-card">
                {closures.map((closure) => (
                  <li
                    key={closure.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">{formatDate(closure.date)}</p>
                      <p className="text-sm text-muted-foreground">
                        {closure.reason || "No reason recorded"}
                      </p>
                    </div>
                    <ConfirmDialog
                      trigger={
                        <Button type="button" size="sm" variant="ghost">
                          <Trash2 className="size-4" /> Remove
                        </Button>
                      }
                      title="Remove this closure?"
                      description="The clinic becomes available for normal scheduling on this date again."
                      confirmLabel="Remove closure"
                      destructive
                      onConfirm={() => deleteClosure(closure)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {tab === "availability" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Doctor weekly availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {availabilityError ? (
              <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {availabilityError}
              </p>
            ) : null}

            <Field className="max-w-sm">
              <FieldLabel htmlFor="availability-doctor">Doctor</FieldLabel>
              <Select
                value={selectedDoctorId}
                onValueChange={(value) => {
                  setSelectedDoctorId(value);
                  void loadAvailability(value);
                }}
              >
                <SelectTrigger id="availability-doctor" className="w-full">
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                New doctors have no availability until it is saved here.
              </FieldDescription>
            </Field>

            {!selectedDoctorId ? (
              <p className="text-sm text-muted-foreground">
                Choose a doctor to view and edit their weekly hours.
              </p>
            ) : availabilityLoading ? (
              <LoadingState title="Loading doctor availability" />
            ) : (
              <>
                <div className="divide-y">
                  {availability.map((row) => (
                    <div key={row.weekday} className="space-y-2 py-3">
                      <label className="flex items-center gap-2 text-sm font-medium">
                        <input
                          type="checkbox"
                          className="size-4 rounded border-input"
                          checked={row.enabled}
                          onChange={(event) =>
                            updateAvailability(row.weekday, {
                              enabled: event.target.checked,
                            })
                          }
                        />
                        {weekdayLabel(row.weekday)}
                      </label>

                      <div
                        className={cn(
                          "grid gap-2 sm:grid-cols-4",
                          !row.enabled && "opacity-50",
                        )}
                      >
                        <Input
                          type="time"
                          aria-label={`${weekdayLabel(row.weekday)} start`}
                          value={row.startTime}
                          disabled={!row.enabled}
                          onChange={(event) =>
                            updateAvailability(row.weekday, {
                              startTime: event.target.value,
                            })
                          }
                        />
                        <Input
                          type="time"
                          aria-label={`${weekdayLabel(row.weekday)} end`}
                          value={row.endTime}
                          disabled={!row.enabled}
                          onChange={(event) =>
                            updateAvailability(row.weekday, {
                              endTime: event.target.value,
                            })
                          }
                        />
                        <Input
                          type="time"
                          aria-label={`${weekdayLabel(row.weekday)} break start`}
                          value={row.breakStart}
                          disabled={!row.enabled}
                          onChange={(event) =>
                            updateAvailability(row.weekday, {
                              breakStart: event.target.value,
                            })
                          }
                        />
                        <Input
                          type="time"
                          aria-label={`${weekdayLabel(row.weekday)} break end`}
                          value={row.breakEnd}
                          disabled={!row.enabled}
                          onChange={(event) =>
                            updateAvailability(row.weekday, {
                              breakEnd: event.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  onClick={saveAvailability}
                  disabled={savingAvailability}
                >
                  {savingAvailability ? "Saving…" : "Save availability"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
