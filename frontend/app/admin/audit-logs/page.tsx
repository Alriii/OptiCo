"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, FileClock, RefreshCw, Search } from "lucide-react";
import { adminService } from "@/services/admin.service";
import { getApiError } from "@/lib/api-error";
import { readList, readNumber } from "@/lib/api-shape";
import { formatDateTime, titleCase } from "@/lib/format";
import type { AuditLog } from "@/services/types";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { LoadingState } from "@/components/shared/loading-state";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { usePageMeta } from "@/lib/use-page-meta";

export default function AdminAuditLogsPage() {
  usePageMeta({
    title: "Audit Logs",
    description: "Review security, clinical, and administrative audit trails.",
  });
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState<number | undefined>();
  const [action, setAction] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getAuditLogs({
        action: action.trim() || undefined,
        date: date || undefined,
        page,
        pageSize: 20,
      });
      setLogs(readList<AuditLog>(response.data, "logs", "auditLogs"));
      setTotal(
        readNumber(response.data, "total") ??
          readNumber(response.data, "count"),
      );
    } catch (err) {
      setError(getApiError(err, "Audit logs could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [action, date, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: DataTableColumn<AuditLog>[] = [
    {
      key: "action",
      header: "Action",
      cell: (log) => (
        <div>
          <p className="font-medium">{titleCase(log.action)}</p>
          <p className="font-mono text-xs text-muted-foreground">{log.id}</p>
        </div>
      ),
    },
    {
      key: "entity",
      header: "Entity",
      cell: (log) => (
        <div className="text-sm">
          <p>{log.entityType ? titleCase(log.entityType) : "—"}</p>
          {log.entityId ? (
            <p className="font-mono text-xs text-muted-foreground">
              {log.entityId}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "actor",
      header: "Actor",
      cell: (log) => (
        <div className="text-sm">
          <p>{log.actorName ?? "System"}</p>
          {log.actorType ? (
            <Badge variant="outline" className="mt-1">
              {titleCase(log.actorType)}
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Recorded",
      cell: (log) => (
        <span className="whitespace-nowrap text-sm">
          {formatDateTime(log.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Audit trail"
        title="Operational activity"
        description="An append-only record of sensitive clinic actions. Metadata stays summarized here; the backend keeps the authoritative audit record."
        actions={
          <Button type="button" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="size-4" /> Refresh
          </Button>
        }
      />

      <Card>
        <CardContent className="px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] sm:items-end">
            <Field>
              <FieldLabel htmlFor="audit-action">Action contains</FieldLabel>
              <Input
                id="audit-action"
                value={action}
                onChange={(event) => {
                  setAction(event.target.value);
                  setPage(1);
                }}
                placeholder="appointment.approved"
              />
              <FieldDescription>
                Matches the recorded action name. Leave blank for all actions.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="audit-date">Clinic date</FieldLabel>
              <Input
                id="audit-date"
                type="date"
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setPage(1);
                }}
              />
            </Field>

            <div className="flex gap-2">
              <Button type="button" onClick={load} disabled={loading}>
                <Search className="size-4" /> Apply
              </Button>
              {action || date ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setAction("");
                    setDate("");
                    setPage(1);
                  }}
                >
                  Clear
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

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
        <LoadingState title="Loading audit logs" />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={FileClock}
          title="No audit entries match"
          description="Sensitive clinic actions appear here once staff begin using the portal."
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={logs}
            getRowKey={(log) => log.id}
            emptyTitle="No audit entries"
            emptyDescription="Audit entries are created by the backend as clinic actions occur."
          />

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-muted-foreground">
              Page {page}
              {total !== undefined ? ` · ${total} recorded actions` : ""}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={
                  loading ||
                  logs.length < 20 ||
                  (total !== undefined && page * 20 >= total)
                }
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
