type TemplatePayload = Record<string, unknown>;

type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function value(payload: TemplatePayload, key: string, fallback = ""): string {
  const raw = payload[key];
  return typeof raw === "string" || typeof raw === "number" ? String(raw) : fallback;
}

function layout(title: string, paragraphs: string[]): RenderedEmail["html"] {
  return `<!doctype html>
<html><body style="margin:0;background:#F3F0E5;font-family:Arial,Helvetica,sans-serif;color:#202A27">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px">
    <div style="background:#223C35;color:#FCFBF8;padding:20px 24px;border-radius:12px 12px 0 0">
      <strong style="font-size:18px">OptiCo</strong>
    </div>
    <div style="background:#FCFBF8;padding:24px;border:1px solid #E5E1D8;border-top:0;border-radius:0 0 12px 12px">
      <h1 style="font-size:20px;margin:0 0 16px">${escapeHtml(title)}</h1>
      ${paragraphs.map((paragraph) => `<p style="line-height:1.6;margin:0 0 12px">${escapeHtml(paragraph)}</p>`).join("")}
      <p style="font-size:12px;color:#5b6662;margin-top:24px">This is an automated message from the OptiCo clinic scheduling system.</p>
    </div>
  </div>
</body></html>`;
}

function render(title: string, paragraphs: string[]): RenderedEmail {
  return {
    subject: title,
    text: [title, "", ...paragraphs, "", "This is an automated message from the OptiCo clinic scheduling system."].join("\n"),
    html: layout(title, paragraphs),
  };
}

export function renderEmail(templateKey: string, payload: TemplatePayload): RenderedEmail {
  const reference = value(payload, "reference");
  const serviceName = value(payload, "serviceName");
  const when = value(payload, "when");
  const clinicName = value(payload, "clinicName", "OptiCo");
  const doctorName = value(payload, "doctorName");

  switch (templateKey) {
    case "request_received":
      return render("We received your appointment request", [
        `Hi ${value(payload, "patientName", "there")},`,
        `Your request ${reference} for ${serviceName} on ${when} is awaiting clinic review.`,
        "This is a request only. Your schedule is confirmed after clinic approval.",
      ]);

    case "staff_pending_alert":
      return render("New pending appointment request", [
        `Reference ${reference} from ${value(payload, "patientName")} needs review.`,
        `Service: ${serviceName}`,
        `Requested time: ${when}`,
      ]);

    case "approved":
      return render("Your appointment is confirmed", [
        `Hi ${value(payload, "patientName", "there")},`,
        `Your appointment ${reference} is confirmed with ${doctorName} on ${when}.`,
        `Service: ${serviceName}`,
        `Clinic: ${clinicName}`,
      ]);

    case "rejected":
      return render("Your appointment request was not approved", [
        `Reference ${reference} for ${serviceName} on ${when} was not approved.`,
        value(payload, "reason", "Please contact the clinic to choose another time."),
      ]);

    case "cancelled":
      return render("Appointment cancelled", [
        `Reference ${reference} on ${when} has been cancelled.`,
        value(payload, "reason") ? `Reason: ${value(payload, "reason")}` : "Please contact the clinic to book again.",
      ]);

    case "rescheduled":
      return render("Appointment rescheduled", [
        `Reference ${reference} has been moved to ${when}.`,
        `Service: ${serviceName}`,
        doctorName ? `Doctor: ${doctorName}` : "",
      ].filter(Boolean));

    case "guest_link":
      return render("Manage your appointment request", [
        `Reference ${reference}.`,
        `Use this private link within ${value(payload, "ttlHours", "168")} hours: ${value(payload, "link")}`,
        "The link can be exchanged once. Do not forward it.",
      ]);

    case "reschedule_requested":
      return render("Patient requested a new time", [
        `Reference ${reference} is pending a reschedule request.`,
        `Requested new time: ${when}`,
        `Service: ${serviceName}`,
      ]);

    case "staff_invite":
      return render("You are invited to the OptiCo staff portal", [
        `Hi ${value(payload, "name", "there")},`,
        `You were invited as ${value(payload, "role")}. Set your password here: ${value(payload, "link")}`,
        `This invitation expires on ${value(payload, "expiresAt")}.`,
      ]);

    case "reminder_24h":
      return render("Appointment reminder: tomorrow", [
        `Reference ${reference} is scheduled for ${when}.`,
        `Service: ${serviceName}`,
        doctorName ? `Doctor: ${doctorName}` : "",
      ].filter(Boolean));

    case "reminder_2h":
      return render("Appointment reminder: in 2 hours", [
        `Reference ${reference} is scheduled for ${when}.`,
        `Service: ${serviceName}`,
        doctorName ? `Doctor: ${doctorName}` : "",
      ].filter(Boolean));

    default:
      return render("OptiCo notification", [`Reference ${reference || "n/a"}.`]);
  }
}
