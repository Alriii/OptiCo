import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db, closePool } from "./index";
import {
  clinicHours,
  clinicSettings,
  doctors,
  doctorServices,
  doctorWeeklyAvailability,
  patients,
  services,
  users,
} from "./schema";

const BCRYPT_ROUNDS = 12;
const DEMO_PASSWORD = "Password123!";

async function seed() {
  console.log("🌱 Seeding OptiCo demo clinic database...");

  // 1. Clinic Settings
  const existingSettings = await db.select().from(clinicSettings).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(clinicSettings).values({
      name: "OptiCo Optical Clinic (Demo)",
      description: "Premium optical care and comprehensive vision services.",
      address: "Unit 402, Medical Arts Building, Makati City, Metro Manila",
      phone: "+63 2 8123 4567",
      email: "info@optico.local",
      timezone: "Asia/Manila",
      currency: "PHP",
      cancellationCutoffHours: 24,
      guestLinkTtlHours: 168,
    });
    console.log("✓ Clinic settings created");
  }

  // 2. Clinic Operating Hours (Mon-Fri 09:00-17:00, Weekends closed)
  const existingHours = await db.select().from(clinicHours);
  if (existingHours.length === 0) {
    const hoursData = [
      { weekday: 0, isOpen: false, openTime: null, closeTime: null }, // Sunday
      { weekday: 1, isOpen: true, openTime: "09:00", closeTime: "17:00" }, // Monday
      { weekday: 2, isOpen: true, openTime: "09:00", closeTime: "17:00" }, // Tuesday
      { weekday: 3, isOpen: true, openTime: "09:00", closeTime: "17:00" }, // Wednesday
      { weekday: 4, isOpen: true, openTime: "09:00", closeTime: "17:00" }, // Thursday
      { weekday: 5, isOpen: true, openTime: "09:00", closeTime: "17:00" }, // Friday
      { weekday: 6, isOpen: false, openTime: null, closeTime: null }, // Saturday
    ];
    await db.insert(clinicHours).values(hoursData);
    console.log("✓ Clinic operating hours created (Mon-Fri 09:00-17:00)");
  }

  // 3. Five Configurable Services (Section 2.3 of Master Instruction)
  const initialServices = [
    {
      slug: "optometry-consultation",
      name: "Optometry consultation",
      description: "Comprehensive primary eye care evaluation and general visual health review.",
      durationMinutes: 30,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 5,
      fee: "800.00",
      isActive: true,
      displayOrder: 1,
    },
    {
      slug: "comprehensive-eye-examination",
      name: "Comprehensive eye examination",
      description: "Thorough internal and external ocular evaluation with vision health profiling.",
      durationMinutes: 45,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 10,
      fee: "1500.00",
      isActive: true,
      displayOrder: 2,
    },
    {
      slug: "refraction-vision-testing",
      name: "Refraction / vision testing",
      description: "Precise optical assessment for prescription lenses and visual acuity determination.",
      durationMinutes: 20,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 5,
      fee: "500.00",
      isActive: true,
      displayOrder: 3,
    },
    {
      slug: "follow-up-consultation",
      name: "Follow-up consultation",
      description: "Short re-check of optical adjustment, lens adaptation, or treatment response.",
      durationMinutes: 15,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 5,
      fee: "400.00",
      isActive: true,
      displayOrder: 4,
    },
    {
      slug: "eyewear-consultation",
      name: "Eyewear consultation",
      description: "Professional frame styling, lens geometry selection, and ergonomic fitting.",
      durationMinutes: 30,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      fee: "600.00",
      isActive: true,
      displayOrder: 5,
    },
  ];

  const createdServices = [];
  for (const s of initialServices) {
    const [existing] = await db.select().from(services).where(eq(services.slug, s.slug)).limit(1);
    if (!existing) {
      const [inserted] = await db.insert(services).values(s).returning();
      createdServices.push(inserted);
    } else {
      createdServices.push(existing);
    }
  }
  console.log(`✓ Services seeded (${createdServices.length} active services)`);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS);

  // 4. Demo Users & Accounts
  // A. Admin
  const adminEmail = "admin@optico.local";
  const [adminUser] = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
  if (!adminUser) {
    await db
      .insert(users)
      .values({
        email: adminEmail,
        name: "Clinic Administrator",
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      });
    console.log(`✓ Admin user created: ${adminEmail}`);
  }

  // B. Receptionist
  const receptionistEmail = "receptionist@optico.local";
  const [receptionistUser] = await db.select().from(users).where(eq(users.email, receptionistEmail)).limit(1);
  if (!receptionistUser) {
    await db
      .insert(users)
      .values({
        email: receptionistEmail,
        name: "Maria Santos (Reception)",
        passwordHash,
        role: "RECEPTIONIST",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      });
    console.log(`✓ Receptionist user created: ${receptionistEmail}`);
  }

  // C. Doctors (2 sample active doctors)
  const sampleDoctors = [
    {
      email: "doctor.reyes@optico.local",
      name: "Dr. Elena Reyes",
      slug: "dr-elena-reyes",
      credentials: "OD, FAAO",
      bio: "Senior optometrist with 12 years of clinical experience in comprehensive refractive care.",
      photoUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300",
    },
    {
      email: "doctor.tan@optico.local",
      name: "Dr. Marcus Tan",
      slug: "dr-marcus-tan",
      credentials: "OD",
      bio: "Specializing in visual ergonomics, contact lens adaptation, and paediatric screening.",
      photoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300",
    },
  ];

  for (const doc of sampleDoctors) {
    let [docUser] = await db.select().from(users).where(eq(users.email, doc.email)).limit(1);
    if (!docUser) {
      [docUser] = await db
        .insert(users)
        .values({
          email: doc.email,
          name: doc.name,
          passwordHash,
          role: "DOCTOR",
          status: "ACTIVE",
          emailVerifiedAt: new Date(),
        })
        .returning();
    }

    let [docRecord] = await db.select().from(doctors).where(eq(doctors.userId, docUser.id)).limit(1);
    if (!docRecord) {
      [docRecord] = await db
        .insert(doctors)
        .values({
          userId: docUser.id,
          slug: doc.slug,
          displayName: doc.name,
          credentials: doc.credentials,
          bio: doc.bio,
          photoUrl: doc.photoUrl,
          isActive: true,
        })
        .returning();
      console.log(`✓ Doctor profile created: ${doc.name} (${doc.email})`);
    }

    // Link doctor to all 5 services
    for (const service of createdServices) {
      const [link] = await db
        .select()
        .from(doctorServices)
        .where(eq(doctorServices.doctorId, docRecord.id))
        .limit(1);
      if (!link) {
        await db
          .insert(doctorServices)
          .values({ doctorId: docRecord.id, serviceId: service.id })
          .onConflictDoNothing();
      }
    }

    // Add Weekly Availability (Monday through Friday 09:00-17:00 with lunch break 12:00-13:00)
    const existingSched = await db
      .select()
      .from(doctorWeeklyAvailability)
      .where(eq(doctorWeeklyAvailability.doctorId, docRecord.id));
    if (existingSched.length === 0) {
      const weekdays = [1, 2, 3, 4, 5];
      for (const w of weekdays) {
        await db.insert(doctorWeeklyAvailability).values({
          doctorId: docRecord.id,
          weekday: w,
          startTime: "09:00",
          endTime: "17:00",
          breakStart: "12:00",
          breakEnd: "13:00",
        });
      }
      console.log(`✓ Weekly schedule created for ${doc.name} (Mon-Fri 09:00-17:00)`);
    }
  }

  // D. Demo Patient
  const patientEmail = "patient@optico.local";
  let [patientUser] = await db.select().from(users).where(eq(users.email, patientEmail)).limit(1);
  if (!patientUser) {
    [patientUser] = await db
      .insert(users)
      .values({
        email: patientEmail,
        name: "Juan Dela Cruz",
        passwordHash,
        role: "PATIENT",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      })
      .returning();
  }

  const [patientRecord] = await db.select().from(patients).where(eq(patients.userId, patientUser.id)).limit(1);
  if (!patientRecord) {
    await db
      .insert(patients)
      .values({
        userId: patientUser.id,
        fullName: "Juan Dela Cruz",
        email: patientEmail,
        mobile: "+639171234567",
        dateOfBirth: "1990-05-15",
      });
    console.log(`✓ Patient account created: ${patientEmail}`);
  }

  console.log("\n=======================================================");
  console.log("   Admin:        admin@optico.local");
  console.log("   Receptionist: receptionist@optico.local");
  console.log("   Doctor 1:     doctor.reyes@optico.local");
  console.log("   Doctor 2:     doctor.tan@optico.local");
  console.log("   Patient:      patient@optico.local");
  console.log("=======================================================\n");
}

seed()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await closePool();
    process.exit(0);
  });
