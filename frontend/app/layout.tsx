import type { Metadata } from "next";
import { ThemeProvider } from "@/components/provider/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import "@/styles/globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: "OptiCo — Optical Clinic Appointments",
    template: "%s | OptiCo",
  },
  description:
    "Request an eye care appointment, manage your visit, and keep your clinic schedule in one calm place.",
  keywords: [
    "optical clinic",
    "eye examination",
    "optometry",
    "appointment booking",
    "OptiCo",
  ],
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "OptiCo",
    title: "OptiCo — Optical Clinic Appointments",
    description:
      "Request an eye care appointment and manage your visit with OptiCo.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
