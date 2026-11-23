import { db, closePool } from "../src/db";
import { emailOutbox, appointments } from "../src/db/schema";
import { getPaymentBalanceService } from "../src/services/payment-service";
import { desc, eq } from "drizzle-orm";

interface CookieJar {
  [name: string]: string;
}

class HttpClient {
  public cookies: CookieJar = {};
  public csrfToken: string = "";

  constructor(public baseUrl: string) {}

  private extractCookies(headers: Headers) {
    const rawCookies: string[] = [];
    if (typeof (headers as any).getSetCookie === "function") {
      rawCookies.push(...(headers as any).getSetCookie());
    } else {
      const single = headers.get("set-cookie");
      if (single) rawCookies.push(single);
    }

    for (const cookieStr of rawCookies) {
      const parts = cookieStr.split(";");
      const [nameVal] = parts;
      const eqIdx = nameVal.indexOf("=");
      if (eqIdx > 0) {
        const name = nameVal.slice(0, eqIdx).trim();
        const value = nameVal.slice(eqIdx + 1).trim();
        this.cookies[name] = value;
      }
    }
  }

  private buildCookieHeader(): string {
    return Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  }

  async getCsrf() {
    const res = await this.request("GET", "/api/v1/auth/csrf-token");
    if (res.body?.data?.csrfToken) {
      this.csrfToken = res.body.data.csrfToken;
    }
    return res;
  }

  async request(method: string, path: string, body?: any) {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    const cookieHeader = this.buildCookieHeader();
    if (cookieHeader) {
      headers["Cookie"] = cookieHeader;
    }

    if (this.csrfToken && !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase())) {
      headers["x-csrf-token"] = this.csrfToken;
    }

    if (body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    this.extractCookies(res.headers);

    let parsedBody: any;
    const text = await res.text();
    try {
      parsedBody = JSON.parse(text);
    } catch {
      parsedBody = text;
    }

    return {
      status: res.status,
      ok: res.ok,
      body: parsedBody,
    };
  }

  clone(): HttpClient {
    const client = new HttpClient(this.baseUrl);
    client.cookies = { ...this.cookies };
    client.csrfToken = this.csrfToken;
    return client;
  }
}

async function runLiveVerification() {
  console.log("==================================================================");
  console.log("      OptiCo Optical Clinic - End-to-End Live System Verification  ");
  console.log("      Testing through Next.js Proxy: http://localhost:3001        ");
  console.log("==================================================================\n");

  const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:7000";
  const client = new HttpClient(BASE_URL);

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, stepName: string, detail?: any) {
    if (condition) {
      console.log(`  ✅ [PASS] ${stepName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${stepName}`, detail || "");
      failedTests++;
    }
  }

  try {
    // 1. Health Checks & Public Discovery
    console.log("1. Testing Health & Public Discovery Endpoints...");
    const health = await client.request("GET", "/api/v1/health/live");
    assert(
      health.status === 200 && health.body?.data?.status === "live",
      "GET /api/v1/health/live is healthy and operational"
    );

    const clinic = await client.request("GET", "/api/v1/public/clinic");
    assert(
      clinic.status === 200 && clinic.body?.data?.name?.includes("OptiCo"),
      `GET /api/v1/public/clinic returned: "${clinic.body?.data?.name}"`
    );

    const services = await client.request("GET", "/api/v1/public/services");
    const serviceList = services.body?.data?.services || [];
    assert(
      services.status === 200 && Array.isArray(serviceList) && serviceList.length >= 5,
      `GET /api/v1/public/services returned ${serviceList.length} active clinical services`
    );

    const doctors = await client.request("GET", "/api/v1/public/doctors");
    const doctorList = doctors.body?.data?.doctors || [];
    assert(
      doctors.status === 200 && Array.isArray(doctorList) && doctorList.length >= 2,
      `GET /api/v1/public/doctors returned ${doctorList.length} active doctors`
    );

    const chosenService = serviceList[0];
    const serviceId = chosenService.id;
    const serviceName = chosenService.name;
    const doctorSlug = doctorList[0].slug;

    const doctorProfile = await client.request("GET", `/api/v1/public/doctors/${doctorSlug}`);
    assert(
      doctorProfile.status === 200 && (doctorProfile.body?.data?.doctor?.slug === doctorSlug || doctorProfile.body?.data?.slug === doctorSlug),
      `GET /api/v1/public/doctors/${doctorSlug} returns detailed doctor profile`
    );

    // 2. CSRF & Authentication
    console.log("\n2. Testing Authentication & CSRF Protection across roles...");
    const csrfRes = await client.getCsrf();
    assert(csrfRes.status === 200 && !!client.csrfToken, "GET /api/v1/auth/csrf-token issues double-submit CSRF token");

    // Login Admin
    const adminClient = client.clone();
    const adminLogin = await adminClient.request("POST", "/api/v1/auth/login", {
      email: "admin@optico.local",
      password: "Password123!",
    });
    assert(adminLogin.status === 200 && adminLogin.body?.data?.user?.role === "ADMIN", "ADMIN login successful");

    const adminSession = await adminClient.request("GET", "/api/v1/auth/session");
    assert(adminSession.status === 200 && adminSession.body?.data?.user?.role === "ADMIN", "ADMIN session verified");

    // Login Doctor
    const doctorClient = client.clone();
    const docLogin = await doctorClient.request("POST", "/api/v1/auth/login", {
      email: "doctor.reyes@optico.local",
      password: "Password123!",
    });
    assert(docLogin.status === 200 && docLogin.body?.data?.user?.role === "DOCTOR", "DOCTOR login successful");

    // Login Patient
    const patientClient = client.clone();
    const patientLogin = await patientClient.request("POST", "/api/v1/auth/login", {
      email: "patient@optico.local",
      password: "Password123!",
    });
    assert(patientLogin.status === 200 && patientLogin.body?.data?.user?.role === "PATIENT", "PATIENT login successful");

    // Login Receptionist (Staff)
    const staffClient = client.clone();
    const staffLogin = await staffClient.request("POST", "/api/v1/auth/login", {
      email: "receptionist@optico.local",
      password: "Password123!",
    });
    assert(
      staffLogin.status === 200 && staffLogin.body?.data?.user?.role === "RECEPTIONIST",
      "RECEPTIONIST (Staff) login successful"
    );

    // 3. Availability Search
    console.log("\n3. Testing Clinical Scheduling Availability Engine...");
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + ((3 - targetDate.getDay() + 7) % 7 || 7)); // Next Wednesday
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
    const dd = String(targetDate.getDate()).padStart(2, "0");
    const testDate = `${yyyy}-${mm}-${dd}`;

    const availability = await client.request(
      "GET",
      `/api/v1/public/availability?serviceId=${serviceId}&date=${testDate}`
    );
    const slots = availability.body?.data?.slots || [];
    assert(
      availability.status === 200 && Array.isArray(slots) && slots.length > 0,
      `Availability engine returned ${slots.length} bookable slots for ${testDate} on "${serviceName}"`
    );

    const chosenSlot = slots[0];

    // 4. Guest Booking Flow (Minor Patient + Guardian validation)
    console.log("\n4. Testing Guest Booking Lifecycle (Minor Patient + Guardian)...");
    const guestEmail = `alex.guest.${Date.now()}@example.com`;
    const bookingPayload = {
      serviceId,
      startAt: chosenSlot.startAt,
      note: "Annual vision checkup and reading glasses review",
      patient: {
        fullName: "Alex Santos",
        email: guestEmail,
        mobile: "+639171234567",
        dateOfBirth: "2015-06-15", // Minor (age ~11)
        guardianName: "Carlos Santos",
        guardianRelationship: "Father",
        guardianContact: "+639177654321",
      },
    };

    const bookingRes = await client.request("POST", "/api/v1/public/appointments", bookingPayload);
    const createdAppt = bookingRes.body?.data;
    assert(
      bookingRes.status === 201 && !!createdAppt?.reference,
      `Guest appointment requested. Reference Code: ${createdAppt?.reference}`,
      bookingRes.body
    );

    const appointmentId = createdAppt?.id;
    const referenceCode = createdAppt?.reference;
    assert(createdAppt?.status === "PENDING", "Initial appointment status is PENDING approval");

    // 5. Guest Token & Appointment Access
    console.log("\n5. Testing Guest Token Exchange & Appointment Access...");
    const guestLinkEmail = await db
      .select()
      .from(emailOutbox)
      .where(eq(emailOutbox.dedupeKey, `guest_link:${appointmentId}`))
      .limit(1);

    const guestPayload = guestLinkEmail[0]?.payload as any;
    const tokenMatch = guestPayload?.link?.match(/#token=(.+)$/);
    const rawGuestToken = tokenMatch ? tokenMatch[1] : null;

    if (rawGuestToken) {
      const guestViewerClient = client.clone();
      const exchangeRes = await guestViewerClient.request("POST", "/api/v1/public/guest/exchange", {
        token: rawGuestToken,
      });
      assert(exchangeRes.status === 200, "Guest SHA-256 token exchange succeeds");

      const guestApptView = await guestViewerClient.request("GET", "/api/v1/public/guest/appointment");
      assert(
        guestApptView.status === 200 && guestApptView.body?.data?.appointment?.reference === referenceCode,
        "Guest can view their appointment via guest session cookie"
      );
    } else {
      assert(false, "Could not extract raw guest token from email outbox", guestPayload);
    }

    // 6. Staff Appointment Management (Approve -> Check-in -> Payment -> Complete)
    console.log("\n6. Testing Staff Workflow (Approval -> Check-In -> Payment -> Completion)...");
    const staffList = await staffClient.request("GET", "/api/v1/staff/appointments?status=PENDING");
    assert(
      staffList.status === 200 && Array.isArray(staffList.body?.data?.rows),
      "Staff can list pending appointments"
    );

    // Approve
    const approveRes = await staffClient.request("POST", `/api/v1/staff/appointments/${appointmentId}/approve`);
    assert(
      approveRes.status === 200 && approveRes.body?.data?.appointment?.status === "CONFIRMED",
      "Staff approves appointment -> Status transitions to CONFIRMED"
    );

    // Check In
    const checkInRes = await staffClient.request("POST", `/api/v1/staff/appointments/${appointmentId}/check-in`);
    assert(
      checkInRes.status === 200 && checkInRes.body?.data?.appointment?.status === "CHECKED_IN",
      "Staff checks in patient upon arrival -> Status transitions to CHECKED_IN"
    );

    // Record Payment
    const paymentRes = await staffClient.request("POST", "/api/v1/staff/payments", {
      appointmentId,
      amount: 500.0,
      method: "CASH",
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      note: "Full consultation fee collected in clinic",
    });
    assert(
      paymentRes.status === 201 && !!paymentRes.body?.data?.payment?.receiptNumber,
      `In-clinic CASH payment recorded: ₱500.00 (Receipt: ${paymentRes.body?.data?.payment?.receiptNumber})`
    );

    // Verify Payment Balance Calculation
    const paymentBalance = await getPaymentBalanceService(appointmentId);
    assert(
      paymentBalance.state === "paid" && paymentBalance.balance === 0,
      `Payment balance engine verified: state is ${paymentBalance.state}, paid ₱${paymentBalance.paid}, balance ₱${paymentBalance.balance}`
    );

    // Complete Appointment
    const completeRes = await staffClient.request("POST", `/api/v1/staff/appointments/${appointmentId}/complete`);
    assert(
      completeRes.status === 200 && completeRes.body?.data?.appointment?.status === "COMPLETED",
      "Staff marks appointment completed -> Status transitions to COMPLETED"
    );

    // 7. Walk-in Queue Management
    console.log("\n7. Testing Walk-in Queue Lifecycle (Register -> Call -> Start -> Complete)...");
    const walkInRegister = await staffClient.request("POST", "/api/v1/staff/walk-ins", {
      patient: {
        fullName: "Roberto Cruz (Walk-in)",
        email: `roberto.walkin.${Date.now()}@example.com`,
        mobile: "+639185551234",
      },
      serviceId,
      immediate: false, // Queue as walk-in entry
    });

    const queueEntry = walkInRegister.body?.data?.queueEntry;
    assert(
      walkInRegister.status === 201 && !!queueEntry?.queueNumber,
      `Walk-in patient registered in queue. Queue Number: ${queueEntry?.queueNumber}`
    );

    const walkInId = queueEntry?.id;

    // Call Walk-in
    const callRes = await staffClient.request("POST", `/api/v1/staff/walk-ins/${walkInId}/call`);
    assert(
      callRes.status === 200 && callRes.body?.data?.entry?.status === "CALLED",
      "Walk-in status updated to CALLED"
    );

    // Start Consultation
    const startRes = await staffClient.request("POST", `/api/v1/staff/walk-ins/${walkInId}/start`, {
      doctorId: doctorList[0].id,
    });
    assert(
      startRes.status === 200 && startRes.body?.data?.entry?.status === "IN_SERVICE",
      "Walk-in consultation started -> Status updated to IN_SERVICE"
    );

    // Complete Walk-in
    const completeWalkInRes = await staffClient.request("POST", `/api/v1/staff/walk-ins/${walkInId}/complete`);
    assert(
      completeWalkInRes.status === 200 && completeWalkInRes.body?.data?.entry?.status === "COMPLETED",
      "Walk-in session completed -> Status updated to COMPLETED"
    );

    // 8. Notification & Outbox Audit
    console.log("\n8. Verifying Notification Outbox & Database Audit Trail...");
    const recentNotifications = await db
      .select()
      .from(emailOutbox)
      .where(eq(emailOutbox.recipient, guestEmail))
      .orderBy(desc(emailOutbox.createdAt))
      .limit(5);

    assert(
      recentNotifications.length > 0,
      `Transactional email queued for guest (${recentNotifications.length} notification entries recorded)`
    );

    const recentAppointmentRecord = await db
      .select()
      .from(appointments)
      .where(eq(appointments.id, appointmentId))
      .limit(1);

    assert(
      recentAppointmentRecord[0]?.status === "COMPLETED",
      "Database verified: Final appointment status is COMPLETED"
    );
  } catch (err: any) {
    console.error("Unhandled error during verification:", err);
    failedTests++;
  } finally {
    await closePool();
  }

  console.log("\n==================================================================");
  console.log(`  VERIFICATION SUMMARY: ${passedTests} Passed, ${failedTests} Failed`);
  console.log("==================================================================");

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runLiveVerification().catch((err) => {
  console.error("Fatal test execution error:", err);
  process.exit(1);
});
