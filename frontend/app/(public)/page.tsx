import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Eye,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { HomeShowcase } from "@/components/public/home-showcase";
import { CLINIC_PROFILE } from "@/lib/demo-clinic";
import { CLINIC_PHOTOS } from "@/lib/clinic-media";
import { usePageMeta } from "@/lib/use-page-meta";

const STEPS = [
  {
    title: "1. Select Service & Time",
    description:
      "Choose from our diagnostic care menu, select your preferred appointment slot, and share your visual goals.",
    icon: CalendarCheck,
  },
  {
    title: "2. Clinician Confirmation",
    description:
      "Our team validates doctor availability, prepares your pre-exam profile, and confirms your scheduled visit.",
    icon: ShieldCheck,
  },
  {
    title: "3. Precision Vision Care",
    description:
      "Experience thorough, unhurried optical testing, retinal screening, and personalized prescription guidance.",
    icon: Eye,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "The most comprehensive eye examination I've had. Dr. Elena explained my astigmatism clearly without rushing. My digital progressive lenses adapted within a single day!",
    author: "Samantha M.",
    location: "Makati City",
    service: "Comprehensive Eye Exam",
    rating: 5,
  },
  {
    quote:
      "Finding optometrists who know how to fit high-cylinder toric contact lenses comfortably is rare. Dr. Marcus took time with corneal mapping and my computer eye strain has vanished.",
    author: "David L.",
    location: "BGC, Taguig",
    service: "Specialty Contact Lens Fitting",
    rating: 5,
  },
  {
    quote:
      "Dr. Sofia was wonderful with my 8-year-old son Toby. She made him feel calm and comfortable throughout his pediatric checkup. The clinic atmosphere is quiet, modern, and reassuring.",
    author: "Carla & Toby P.",
    location: "Pasig City",
    service: "Pediatric Vision Assessment",
    rating: 5,
  },
];

export default function HomePage() {
  usePageMeta({
    title: "Clearer Vision. Calmer Visits.",
    description:
      "OptiCo Optical Clinic provides precision eye examinations, licensed optometry consultations, specialty contact lenses, and designer eyewear in Makati City.",
  });

  return (
    <>
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-secondary/40 via-secondary/20 to-background">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-emerald-400/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 top-1/2 size-72 rounded-full bg-teal-400/10 blur-3xl"
        />

        <div className="page-shell grid gap-10 py-14 sm:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/90 px-3 py-1 text-xs font-medium text-primary shadow-xs backdrop-blur-xs">
                <img
                  src="/mascot.jpg"
                  alt="Dr. Octo - OptiCo Mascot"
                  className="size-4 rounded-full object-cover ring-1 ring-primary/30"
                />
                Dr. Octo Vision Care
              </span>
              <Badge variant="outline" className="border-border/80 bg-background/70 text-xs">
                Accredited Optometry Studio
              </Badge>
            </div>

            <div className="space-y-4">
              <p className="eyebrow flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-primary" />
                Optical care, thoughtfully scheduled
              </p>
              <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight text-balance sm:text-5xl lg:text-6xl text-foreground">
                Clearer vision.
                <br />
                <span className="bg-gradient-to-r from-primary to-[#289e8f] bg-clip-text text-transparent">
                  Calmer visits.
                </span>
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Experience comprehensive, patient-centered eye care. Precision optical diagnostics,
                designer eyewear, and personalized vision solutions with our licensed optometry team.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="rounded-xl shadow-sm">
                <Link href="/booking">
                  Request an Appointment <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-xl">
                <Link href="/services">View Services</Link>
              </Button>
            </div>

            {/* Real Trust Elements: Google Rating + Experience Metrics */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium text-foreground">
                <div className="flex text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-semibold">{CLINIC_PROFILE.googleRating}</span>
                <span className="text-muted-foreground font-normal">({CLINIC_PROFILE.reviewsCount}+ Google Reviews)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-primary" />
                <span>{CLINIC_PROFILE.yearsInPractice}+ Years Clinical Practice</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-primary" />
                <span>{CLINIC_PROFILE.patientsServed} Patients Cared For</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card with Clinical Photography */}
          <div className="space-y-4">
            <div className="group relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lg shadow-primary/[0.04] transition-all">
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={CLINIC_PHOTOS.hero}
                  alt="Modern OptiCo clinic diagnostic suite and eyewear gallery"
                  className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                  fetchPriority="high"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/80 px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-xs">
                      ● Clinic Consultations Open
                    </span>
                    <h3 className="mt-1.5 text-lg font-semibold tracking-tight">
                      Modern Diagnostic Suite
                    </h3>
                  </div>
                  <p className="text-xs text-white/80">9:00 AM – 5:00 PM</p>
                </div>
              </div>

              <CardContent className="space-y-4 p-5 sm:p-6">
                <dl className="grid gap-3 text-xs sm:grid-cols-2">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <dt className="font-medium text-foreground">Clinic Location</dt>
                      <dd className="text-muted-foreground">{CLINIC_PROFILE.address}</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Phone className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <dt className="font-medium text-foreground">Direct Desk</dt>
                      <dd className="text-muted-foreground">{CLINIC_PROFILE.phone}</dd>
                    </div>
                  </div>
                </dl>

                <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5 text-primary" /> Mon – Fri 9AM–5PM · Sat 9AM–2PM
                  </span>
                  <span>Makati City, Metro Manila</span>
                </div>
              </CardContent>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Standards Section */}
      <section className="page-shell grid gap-4 py-10 sm:grid-cols-3" aria-label="Clinic promises">
        {[
          {
            title: "Advanced Ocular Screening",
            body: "Digital slit-lamp evaluation, computerized refraction, and tear-film diagnostics.",
          },
          {
            title: "Dedicated Optometrists",
            body: "Board-certified doctors committed to attentive, unhurried vision evaluations.",
          },
          {
            title: "Transparent & Seamless",
            body: "Clear consultation fees, no surprise add-ons, and instant private status tracking.",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border bg-card px-5 py-4 shadow-xs">
            <p className="text-sm font-semibold text-foreground">{item.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {item.body}
            </p>
          </div>
        ))}
      </section>

      <HomeShowcase />

      {/* Real Patient Testimonials Section */}
      <section className="border-t bg-secondary/30 py-14 sm:py-20" aria-labelledby="testimonials-heading">
        <div className="page-shell space-y-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <p className="eyebrow">Patient experiences</p>
              <h2 id="testimonials-heading" className="text-2xl font-semibold sm:text-3xl">
                Trusted by thousands of vision patients
              </h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Read how our patient-centered diagnostic approach helps people achieve clearer, more comfortable vision every day.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-2 text-xs shadow-xs">
              <span className="font-semibold text-foreground">Google Reviews</span>
              <span className="text-amber-500 font-bold">4.9 ★★★★★</span>
              <span className="text-muted-foreground">(640+ ratings)</span>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t, idx) => (
              <Card key={idx} className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-xs">
                <div className="space-y-3">
                  <div className="flex text-amber-500">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90 italic">
                    "{t.quote}"
                  </p>
                </div>
                <div className="mt-6 border-t border-border/60 pt-4">
                  <p className="text-xs font-semibold text-foreground">{t.author}</p>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
                    <span>{t.location}</span>
                    <span className="text-primary font-medium">{t.service}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="page-shell py-14 sm:py-20" aria-labelledby="how-it-works">
        <div className="max-w-2xl space-y-2">
          <p className="eyebrow">How it works</p>
          <h2 id="how-it-works" className="text-2xl font-semibold sm:text-3xl">
            A request, a review, then a real appointment
          </h2>
        </div>

        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="rounded-2xl border bg-card p-6 shadow-xs">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Final Call to Action */}
      <section className="border-t bg-primary py-14 text-primary-foreground sm:py-16">
        <div className="page-shell flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground/70">
              Personalized Optical Care
            </p>
            <h2 className="text-2xl font-semibold sm:text-3xl">
              Start with your preferred appointment slot
            </h2>
            <p className="text-sm leading-relaxed text-primary-foreground/80">
              Send your appointment request in a few easy steps. Our clinical team confirms your visit with an assigned optometrist.
            </p>
          </div>
          <Button asChild size="lg" variant="secondary" className="rounded-xl shadow-sm shrink-0">
            <Link href="/booking">
              Request an Appointment <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
