import { GuestManager } from "@/components/public/guest-manager";

export default function GuestManagePage() {
  return (
    <div className="page-shell max-w-3xl py-10 sm:py-14">
      <div className="mb-6 space-y-2">
        <p className="eyebrow">Guest booking</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Manage your appointment
        </h1>
        <p className="text-sm text-muted-foreground">
          This page uses the private link from your booking email. The link is
          removed from the address bar as soon as it is exchanged.
        </p>
      </div>
      <GuestManager />
    </div>
  );
}
