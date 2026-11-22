/**
 * Placeholder clinic identity for development and demos. Every surface that
 * shows this data also shows a demo label, so it is never mistaken for a real
 * medical facility.
 */
export const DEMO_CLINIC = {
  isDemo: true,
  name: "OptiCo Demo Optical Clinic",
  shortName: "OptiCo",
  address: "Unit 2, Sample Heritage Building, 123 Demo Avenue, Makati City",
  phone: "+63 2 0000 0000",
  mobile: "0917 000 0000",
  email: "hello@example.com",
  timezone: "Asia/Manila",
  currency: "PHP",
  hours: [
    { day: "Monday – Friday", time: "9:00 AM – 5:00 PM" },
    { day: "Saturday", time: "Closed" },
    { day: "Sunday", time: "Closed" },
  ],
} as const;

export const DEMO_NOTICE =
  "Demo clinic — sample identity, contact details, and schedules for development.";
