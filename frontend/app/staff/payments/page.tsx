"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CreditCard, RefreshCw, Wallet } from "lucide-react";
import { toast } from "sonner";
import { staffService, type PaymentMethod } from "@/services/staff.service";
import { getApiError } from "@/lib/api-error";
import { readList } from "@/lib/api-shape";
import { formatCurrency, formatDateTime, todayInClinic } from "@/lib/format";
import type { Appointment, Payment } from "@/services/types";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card terminal" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "EWALLET", label: "E-wallet" },
];

const PAYABLE_STATUSES = new Set([
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
]);

export default function StaffPaymentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [paidAt, setPaidAt] = useState(`${todayInClinic()}T09:00`);
  const [note, setNote] = useState("");

  const selectedAppointment = useMemo(
    () => appointments.find((item) => item.id === selectedId) ?? null,
    [appointments, selectedId],
  );

  const loadAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    setError(null);
    try {
      const response = await staffService.getAppointments({ page: 1 });
      const list = readList<Appointment>(response.data, "appointments").filter(
        (item) => PAYABLE_STATUSES.has(item.status.toUpperCase()),
      );
      setAppointments(list);
    } catch (err) {
      setError(getApiError(err, "Appointments could not be loaded."));
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  const loadPayments = useCallback(async (appointmentId: string) => {
    if (!appointmentId) {
      setPayments([]);
      return;
    }
    setLoadingPayments(true);
    try {
      const response = await staffService.getPayments(appointmentId);
      setPayments(readList<Payment>(response.data, "payments"));
    } catch (err) {
      toast.error(getApiError(err, "Payment history could not be loaded."));
      setPayments([]);
    } finally {
      setLoadingPayments(false);
    }
  }, []);

  useEffect(() => {
    void loadAppointments();
  }, [loadAppointments]);

  useEffect(() => {
    if (!selectedId) return;
    void loadPayments(selectedId);
    if (selectedAppointment?.fee !== undefined) {
      setAmount(String(selectedAppointment.fee));
    }
  }, [selectedId, loadPayments, selectedAppointment?.fee]);

  const recordPayment = async () => {
    setFormError(null);

    if (!selectedAppointment) {
      setFormError("Choose an appointment first.");
      throw new Error("No appointment selected");
    }

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setFormError("Enter a payment amount greater than zero.");
      throw new Error("Invalid amount");
    }
    if (!method) {
      setFormError("Choose a payment method.");
      throw new Error("No method");
    }

    setSubmitting(true);
    try {
      await staffService.recordPayment({
        appointmentId: selectedAppointment.id,
        amount: value,
        method,
        receiptNumber: receiptNumber.trim() || undefined,
        paidAt: paidAt ? new Date(paidAt).toISOString() : undefined,
        note: note.trim() || undefined,
      });
      toast.success("Payment recorded.");
      setReceiptNumber("");
      setNote("");
      await loadPayments(selectedAppointment.id);
      await loadAppointments();
    } catch (err) {
      const message = getApiError(err, "The payment could not be recorded.");
      setFormError(message);
      toast.error(message);
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const columns: DataTableColumn<Payment>[] = [
    {
      key: "amount",
      header: "Amount",
      cell: (payment) => (
        <span className="font-medium">
          {formatCurrency(payment.amount, payment.currency ?? "PHP")}
        </span>
      ),
    },
    {
      key: "method",
      header: "Method",
      cell: (payment) =>
        METHODS.find((item) => item.value === payment.method)?.label ??
        payment.method,
    },
    {
      key: "receipt",
      header: "Receipt",
      cell: (payment) => payment.receiptNumber || "—",
    },
    {
      key: "paidAt",
      header: "Paid",
      cell: (payment) => formatDateTime(payment.paidAt),
    },
    {
      key: "recordedBy",
      header: "Recorded by",
      cell: (payment) => payment.recordedBy || "—",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payments"
        title="Record an in-clinic payment"
        description="No online payment gateway is used. Record cash, terminal, transfer, or e-wallet payments received at the clinic. Corrections must go through an auditable flow."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={loadAppointments}
            disabled={loadingAppointments}
          >
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

      {loadingAppointments ? (
        <LoadingState title="Loading payable appointments" />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payable appointments"
          description="Confirmed, checked-in, in-progress, or completed appointments appear here."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field>
                <FieldLabel htmlFor="payment-appointment">Appointment</FieldLabel>
                <Select
                  value={selectedId}
                  onValueChange={(value) => {
                    setSelectedId(value);
                    setFormError(null);
                  }}
                >
                  <SelectTrigger id="payment-appointment" className="w-full">
                    <SelectValue placeholder="Choose an appointment" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointments.map((appointment) => (
                      <SelectItem key={appointment.id} value={appointment.id}>
                        {appointment.reference ?? appointment.id} ·{" "}
                        {appointment.patientName ?? "Patient"} ·{" "}
                        {formatDateTime(
                          appointment.startsAt ?? appointment.requestedStartAt,
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {selectedAppointment ? (
                <div className="rounded-lg border bg-secondary/40 px-3 py-2 text-sm">
                  <p className="font-medium">
                    {selectedAppointment.serviceName ??
                      selectedAppointment.service?.name ??
                      "Service"}
                  </p>
                  <p className="text-muted-foreground">
                    Fee: {formatCurrency(selectedAppointment.fee)} ·{" "}
                    {selectedAppointment.paymentStatus ? (
                      <StatusBadge
                        kind="payment"
                        status={selectedAppointment.paymentStatus}
                      />
                    ) : (
                      "Payment state not reported"
                    )}
                  </p>
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="payment-amount">Amount (PHP)</FieldLabel>
                  <Input
                    id="payment-amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="payment-method">Method</FieldLabel>
                  <Select
                    value={method}
                    onValueChange={(value) => setMethod(value as PaymentMethod)}
                  >
                    <SelectTrigger id="payment-method" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {METHODS.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="payment-receipt">
                    Receipt / reference
                  </FieldLabel>
                  <Input
                    id="payment-receipt"
                    value={receiptNumber}
                    onChange={(event) => setReceiptNumber(event.target.value)}
                    placeholder="Optional"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="payment-date">Paid at</FieldLabel>
                  <Input
                    id="payment-date"
                    type="datetime-local"
                    value={paidAt}
                    onChange={(event) => setPaidAt(event.target.value)}
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="payment-note">Operational note</FieldLabel>
                <Textarea
                  id="payment-note"
                  rows={2}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional. No card numbers or payment secrets."
                />
                <FieldDescription>
                  Never store card numbers, CVV, or online banking credentials.
                </FieldDescription>
              </Field>

              {formError ? (
                <p role="alert" className="text-sm text-destructive">
                  {formError}
                </p>
              ) : null}

              <ConfirmDialog
                trigger={
                  <Button type="button" disabled={!selectedAppointment || submitting}>
                    <CreditCard className="size-4" /> Review and record
                  </Button>
                }
                title="Record this payment?"
                description={
                  selectedAppointment
                    ? `${formatCurrency(amount || 0)} via ${
                        METHODS.find((item) => item.value === method)?.label ??
                        method
                      } for ${selectedAppointment.reference ?? selectedAppointment.id}. This creates an auditable payment entry.`
                    : "Choose an appointment first."
                }
                confirmLabel="Record payment"
                onConfirm={recordPayment}
              />
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Payment history</h2>
            {loadingPayments ? (
              <LoadingState title="Loading payments" />
            ) : (
              <DataTable
                columns={columns}
                rows={payments}
                getRowKey={(payment) => payment.id}
                emptyTitle="No payments recorded"
                emptyDescription={
                  selectedAppointment
                    ? "This appointment has no payment entries yet."
                    : "Choose an appointment to view its payment history."
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
