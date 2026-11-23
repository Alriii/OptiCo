"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CalendarCheck,
  ClipboardList,
  ListOrdered,
  RefreshCw,
  Stethoscope,
} from "lucide-react";
import { adminService } from "@/services/admin.service";
import { getApiError } from "@/lib/api-error";
import type { AdminOverview } from "@/services/types";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePageMeta } from "@/lib/use-page-meta";

const QUICK_LINKS = [
  { href: "/admin/doctors", label: "Doctors and services" },
  { href: "/admin/staff", label: "Staff invitations" },
  { href: "/admin/services", label: "Service catalog" },
  { href: "/admin/schedules", label: "Clinic schedules" },
  { href: "/admin/settings", label: "Clinic settings" },
  { href: "/admin/audit-logs", label: "Audit logs" },
];

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({
    title: "Admin Portal",
    description: "OptiCo administrative overview, clinic settings, and audit logs.",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getOverview();
      setOverview(response.data ?? null);
    } catch (err) {
      setError(getApiError(err, "The overview could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administrator"
        title="Clinic overview"
        description="Operational counts, configuration shortcuts, and system audit trail."
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
        <LoadingState title="Loading clinic overview" />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard
              label="Pending requests"
              value={overview?.pendingAppointments ?? 0}
              icon={ClipboardList}
              hint="Awaiting staff review"
            />
            <StatCard
              label="Confirmed today"
              value={overview?.confirmedToday ?? 0}
              icon={CalendarCheck}
              hint="On today's schedule"
            />
            <StatCard
              label="Walk-ins waiting"
              value={overview?.walkInsWaiting ?? 0}
              icon={ListOrdered}
              hint="Current clinic day"
            />
            <StatCard
              label="Active doctors"
              value={overview?.doctorsActive ?? 0}
              icon={Stethoscope}
              hint="Published for assignment"
            />
            <StatCard
              label="Active services"
              value={overview?.activeServices ?? 0}
              icon={ClipboardList}
              hint="Available in catalog"
            />
          </div>

          <Card>
            <CardContent className="space-y-4 px-5 py-5">
              <h2 className="text-lg font-semibold">Configuration</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg border bg-secondary/40 px-4 py-3 text-sm font-medium transition-colors hover:border-primary/40 hover:bg-secondary"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Secret values, SMTP credentials, and database connection strings
                are never exposed in this portal.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
