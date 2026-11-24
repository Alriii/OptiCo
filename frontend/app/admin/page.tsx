"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  CalendarCheck,
  CalendarRange,
  ClipboardList,
  FileClock,
  ListOrdered,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Stethoscope,
  UsersRound,
} from "lucide-react";
import { adminService } from "@/services/admin.service";
import { getApiError } from "@/lib/api-error";
import type { AdminOverview } from "@/services/types";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { LoadingState } from "@/components/shared/loading-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePageMeta } from "@/lib/use-page-meta";

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageMeta({
    title: "Admin Portal",
    description: "OptiCo administrative overview, clinic operations, and management controls.",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getOverview();
      setOverview(response.data ?? null);
    } catch (err) {
      setError(getApiError(err, "The clinic overview could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administrator"
        title="Clinic Overview"
        description="Real-time operational metrics, clinical capacity, and quick administrative management workflows."
        actions={
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={load}
            disabled={loading}
            className="rounded-xl border-border/80 shadow-2xs hover:bg-secondary cursor-pointer"
          >
            <RefreshCw className="size-4 mr-2" />
            Refresh data
          </Button>
        }
      />

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <p className="leading-relaxed">{error}</p>
        </div>
      ) : null}

      {loading ? (
        <LoadingState title="Loading clinic operational metrics…" />
      ) : (
        <>
          {/* Key Operational Stat Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              label="Pending requests"
              value={overview?.pendingAppointments ?? 0}
              icon={ClipboardList}
              hint="Awaiting triage & review"
            />
            <StatCard
              label="Confirmed today"
              value={overview?.confirmedToday ?? 0}
              icon={CalendarCheck}
              hint="Scheduled consultations"
            />
            <StatCard
              label="Walk-ins in queue"
              value={overview?.walkInsWaiting ?? 0}
              icon={ListOrdered}
              hint="Active on today's floor"
            />
            <StatCard
              label="Active optometrists"
              value={overview?.doctorsActive ?? 0}
              icon={Stethoscope}
              hint="Available for booking"
            />
            <StatCard
              label="Active services"
              value={overview?.activeServices ?? 0}
              icon={Activity}
              hint="Published in catalog"
            />
          </div>

          {/* Operational Health & Management Hub */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Clinical Readiness & Queue Health */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2.5">
                    <Activity className="size-5 text-emerald-600 dark:text-emerald-400" />
                    Clinical Operations & Capacity
                  </CardTitle>
                  <Badge variant="secondary" className="px-2.5 py-0.5 text-xs font-medium">
                    Live System
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Direct controls for optometrist rosters, clinical services, operating schedules, and appointment flows.
                </p>

                <div className="grid gap-3 sm:grid-cols-2 pt-1">
                  <Link
                    href="/admin/doctors"
                    className="flex flex-col justify-between rounded-xl border border-border/70 bg-secondary/30 p-4 transition-all hover:border-primary/40 hover:bg-secondary/60 hover:shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        Optometrists
                      </span>
                      <Stethoscope className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {overview?.doctorsActive ?? 0} active doctors configured
                    </p>
                  </Link>

                  <Link
                    href="/admin/services"
                    className="flex flex-col justify-between rounded-xl border border-border/70 bg-secondary/30 p-4 transition-all hover:border-primary/40 hover:bg-secondary/60 hover:shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        Services & Fees
                      </span>
                      <Activity className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {overview?.activeServices ?? 0} services in clinical catalog
                    </p>
                  </Link>

                  <Link
                    href="/admin/schedules"
                    className="flex flex-col justify-between rounded-xl border border-border/70 bg-secondary/30 p-4 transition-all hover:border-primary/40 hover:bg-secondary/60 hover:shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        Clinic Schedules
                      </span>
                      <CalendarRange className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Operating hours, doctor shifts & closures
                    </p>
                  </Link>

                  <Link
                    href="/admin/staff"
                    className="flex flex-col justify-between rounded-xl border border-border/70 bg-secondary/30 p-4 transition-all hover:border-primary/40 hover:bg-secondary/60 hover:shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        Staff & Roles
                      </span>
                      <UsersRound className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Invitations & access permissions
                    </p>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Governance & System Integrity */}
            <Card className="rounded-2xl border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2.5">
                    <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                    Clinic Governance & Audit
                  </CardTitle>
                  <Badge variant="outline" className="px-2.5 py-0.5 text-xs font-normal">
                    Compliance
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  System logs, cancellation notice periods, booking cutoffs, and regulatory healthcare audit logs.
                </p>

                <div className="space-y-3 pt-1">
                  <Link
                    href="/admin/audit-logs"
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/30 p-4 transition-all hover:border-primary/40 hover:bg-secondary/60 hover:shadow-2xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileClock className="size-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          Security & Audit Logs
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Inspect immutable clinical & admin change history
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-primary">View logs →</span>
                  </Link>

                  <Link
                    href="/admin/settings"
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/30 p-4 transition-all hover:border-primary/40 hover:bg-secondary/60 hover:shadow-2xs group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Settings className="size-4.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          Clinic Settings & Policies
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Lead times, cancellation cutoffs, and contact data
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-primary">Manage →</span>
                  </Link>
                </div>

                <p className="text-xs text-muted-foreground/80 pt-2 border-t border-border/60">
                  Protected: Sensitive clinic credentials, SMTP secrets, and database keys are never exposed in administrative views.
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
