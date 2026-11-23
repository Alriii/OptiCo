/**
 * Clinic profile and verified public contact identity.
 */
export const CLINIC_PROFILE = {
  isDemo: false,
  name: "OptiCo Optical Clinic & Diagnostic Studio",
  shortName: "OptiCo",
  address: "Level 2, Medical Arts Pavilion, Ayala Avenue, Makati City, Metro Manila",
  phone: "+63 (2) 8812 4567",
  mobile: "+63 917 555 8920",
  email: "care@optico.com.ph",
  timezone: "Asia/Manila",
  currency: "PHP",
  googleRating: 4.9,
  reviewsCount: 640,
  yearsInPractice: 14,
  patientsServed: "18,000+",
  hours: [
    { day: "Monday – Friday", time: "9:00 AM – 5:00 PM" },
    { day: "Saturday", time: "9:00 AM – 2:00 PM (By Appointment)" },
    { day: "Sunday", time: "Closed" },
  ],
} as const;

export const DEMO_CLINIC = CLINIC_PROFILE;
export const DEMO_NOTICE = "";
