"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CalendarCheck, Info, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { guestService } from "@/services/guest.service";
import { getApiError } from "@/lib/api-error";
import { formatDateTime } from "@/lib/format";
import type { Appointment } from "@/services/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";

type Phase = "loading" | "ready" | "no-link" | "error";

/**
 * The token arrives in the fragment so it never reaches the server, proxy,
 * or referrer. It is exchanged once, then removed from the address bar.
 */
export function GuestManager() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const loadAppointment = useCallback(async () => {
    try {
      const response = await guestService.getAppointment();
      setAppointment(response.data ?? null);
      setPhase("ready");
    } catch (err) {
      setError(
        getApiError(
          err,
          "This guest link is no longer valid. Request a new link from the clinic.",
        ),
      );
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const boot = async () => {
      const hash = window.location.hash;
      const raw = hash.startsWith("#") ? hash.slice(1) : hash;
      const params = new URLSearchParams(raw);
      const token = params.get("token") ?? (raw && !raw.includes("=") ? raw : "");

      if (hash) {
        // Remove the secret before any further navigation or request.
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
      }

      if (token) {
        try {
          const response = await guestService.exchange(token);
          if (cancelled) return;
          if (response.data?.appointment) {
            setAppointment(response.data.appointment);
            setPhase("ready");
            return;
          }
          await loadAppointment();
        } catch (err) {
          if (cancelled) return;
          setError(
            getApiError(
              err,
              "This guest link could not be used. It may have expired or already been used.",
            ),
          );
          setPhase("error");
        }
        return;
      }

      // No fragment: the guest cookie may already be active.
      try {
        const response = await guestService.getAppointment();
        if (cancelled) return;
        setAppointment(response.data ?? null);
        setPhase("ready");
      } catch {
        if (!cancelled) setPhase("no-link");
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [loadAppointment]);

  const requestCancellation = async () => {
    setCancelling(true);
    try {
      await guestService.cancelRequest(
        "Guest requested cancellation from the secure link.",
      );
      toast.success("Cancellation request sent to the clinic.");
      await loadAppointment();
    } catch (err) {
      toast.error(
        getApiError(err, "The cancellation request could not be sent."),
      );
    } finally {
      setCancelling(false);
    }
  };

  if (phase === "loading") {
    return (
      <LoadingState
        title="Opening your booking"
        description="Exchanging the secure link for a limited session."
      />
    );
  }

  if (phase === "no-link") {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="Open the link from your email"
        description="Guest bookings are private. Use the secure link in your appointment email; searching by email or reference is not supported."
        action={
          <Button asChild variant="outline">
            <Link href="/contact">Contact the clinic</Link>
          </Button>
        }
      />
    );
  }

  if (phase === "error") {
    return (
      <div className="space-y-4">
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <p className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/contact">Contact the clinic</Link>
        </Button>
      </div>
    );
  }

  if (!appointment) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="No appointment found"
        description="The secure guest session is active but no appointment is attached."
      />
    );
  }

  const canCancel = !["CANCELLED", "REJECTED", "COMPLETED", "NO_SHOW"].includes(
    appointment.status.toUpperCase(),
  );

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Your appointment request</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Reference:{" "}
              <span className="font-mono">
                {appointment.reference ?? appointment.id}
              </span>
            </p>
          </div>
          <StatusBadge kind="appointment" status={appointment.status} />
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Service
              </p>
              <p className="mt-1 font-medium">
                {appointment.serviceName ?? appointment.service?.name ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Requested time
              </p>
              <p className="mt-1 font-medium">
                {formatDateTime(
                  appointment.startsAt ??
                    appointment.requestedStartAt ??
                    undefined,
                )}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Doctor
              </p>
              <p className="mt-1 font-medium">
                {appointment.doctorName ??
                  appointment.doctor?.name ??
                  "Assigned after approval"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                Patient
              </p>
              <p className="mt-1 font-medium">
                {appointment.patientName ?? "—"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
            <p className="flex items-start gap-2">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                A pending request is not a confirmed schedule. The clinic will
                email you after reviewing it. Cancellation from this page is
                also a request until staff confirm it.
              </span>
            </p>
          </div>

          {canCancel ? (
            <ConfirmDialog
              trigger={
                <Button type="button" variant="outline" disabled={cancelling}>
                  Request cancellation
                </Button>
              }
              title="Request cancellation?"
              description="The clinic will review this request. Your appointment stays on the schedule until staff confirm the cancellation."
              confirmLabel="Send cancellation request"
              destructive
              onConfirm={requestCancellation}
            />
          ) : null}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        This page only exposes the appointment linked to your guest session. It
        cannot access other bookings or account data.
      </p>
    </div>
  );
}
