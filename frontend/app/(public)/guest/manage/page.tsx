import { GuestManager } from "@/components/public/guest-manager";

export default function GuestManagePage() {
  return (
    <div className="page-shell max-w-3xl py-10 sm:py-14">
      <div className="mb-8 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-secondary/30 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-4">
          <img
            src="/mascot.jpg"
            alt="Dr. Octo"
            className="size-16 rounded-2xl object-cover ring-2 ring-primary/20 shadow-sm shrink-0"
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Private Guest Portal
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
              Manage your appointment
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Secure, token-scoped session linked to your booking confirmation.
            </p>
          </div>
        </div>
      </div>
      <GuestManager />
    </div>
  );
}
