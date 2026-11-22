"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";

interface ReasonDialogProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  label?: string;
  confirmLabel?: string;
  destructive?: boolean;
  required?: boolean;
  onSubmit: (reason: string) => Promise<void> | void;
}

/**
 * Confirmation with an optional operational reason. Used for rejections and
 * cancellations where the audit trail needs context.
 */
export function ReasonDialog({
  trigger,
  title,
  description,
  label = "Reason",
  confirmLabel = "Confirm",
  destructive = false,
  required = false,
  onSubmit,
}: ReasonDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (required && !reason.trim()) {
      setError("A short reason is required.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onSubmit(reason.trim());
      setOpen(false);
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The action failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!busy) {
          setOpen(next);
          if (!next) {
            setReason("");
            setError(null);
          }
        }
      }}
    >
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <Field data-invalid={Boolean(error)}>
          <FieldLabel htmlFor="reason-input">{label}</FieldLabel>
          <Textarea
            id="reason-input"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            aria-invalid={Boolean(error)}
            placeholder="Operational context only. Do not include clinical details."
          />
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </Field>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Keep as is</AlertDialogCancel>
          <Button
            type="button"
            variant={destructive ? "destructive" : "default"}
            disabled={busy}
            onClick={handleSubmit}
          >
            {busy ? "Working…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
