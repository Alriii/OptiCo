import { manilaDateString } from "@/lib/time";
import { AppointmentRepository } from "@/repositories/appointment-repository";
import { AuditRepository, type AuditFilters } from "@/repositories/audit-repository";
import { DoctorRepository } from "@/repositories/doctor-repository";
import { PatientRepository } from "@/repositories/patient-repository";
import { ServiceRepository } from "@/repositories/service-repository";
import { SettingsRepository, type ClinicSettingsInput } from "@/repositories/settings-repository";
import { UserRepository } from "@/repositories/user-repository";
import { WalkInRepository } from "@/repositories/walkin-repository";
import { recordAudit } from "@/services/audit-service";

const settingsRepository = new SettingsRepository();
const appointmentRepository = new AppointmentRepository();
const doctorRepository = new DoctorRepository();
const serviceRepository = new ServiceRepository();
const patientRepository = new PatientRepository();
const walkInRepository = new WalkInRepository();
const auditRepository = new AuditRepository();
const userRepository = new UserRepository();

export async function getClinicSettingsService() {
  return settingsRepository.get();
}

export async function updateClinicSettingsService(input: ClinicSettingsInput, actorUserId: string) {
  const settings = await settingsRepository.update(input);
  await recordAudit({
    actorUserId,
    action: "clinic_settings.updated",
    entityType: "clinic_settings",
    entityId: settings.id,
  });
  return settings;
}

export async function listAuditLogsService(filters: AuditFilters, page: number, limit: number) {
  return auditRepository.list(filters, page, limit);
}

export async function listStaffService(page: number, limit: number) {
  return userRepository.listStaff(page, limit);
}

export async function getOverviewService() {
  const today = manilaDateString(new Date());
  const [pending, todaysAppointments, activeDoctors, activeServices, patients, waiting] = await Promise.all([
    appointmentRepository.countByStatus("PENDING"),
    appointmentRepository.countOnDate(today),
    doctorRepository.countActive(),
    serviceRepository.countActive(),
    patientRepository.count(),
    walkInRepository.countByDateAndStatus(today, "WAITING"),
  ]);

  return {
    date: today,
    pendingAppointments: pending,
    todayAppointments: todaysAppointments,
    activeDoctors,
    activeServices,
    patients,
    waitingWalkIns: waiting,
  };
}
