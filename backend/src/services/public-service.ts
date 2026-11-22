import { AppError } from "@/lib/http";
import { DoctorRepository } from "@/repositories/doctor-repository";
import { ScheduleRepository } from "@/repositories/schedule-repository";
import { ServiceRepository } from "@/repositories/service-repository";
import { SettingsRepository } from "@/repositories/settings-repository";

const settingsRepository = new SettingsRepository();
const scheduleRepository = new ScheduleRepository();
const serviceRepository = new ServiceRepository();
const doctorRepository = new DoctorRepository();

export async function getPublicClinicService() {
  const [settings, hours] = await Promise.all([settingsRepository.get(), scheduleRepository.listClinicHours()]);
  if (!settings) throw new AppError(503, "Clinic profile is not configured");

  return {
    name: settings.name,
    description: settings.description,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    timezone: settings.timezone,
    currency: settings.currency,
    cancellationCutoffHours: settings.cancellationCutoffHours,
    hours: hours.map((row) => ({
      weekday: row.weekday,
      isOpen: row.isOpen,
      openTime: row.openTime,
      closeTime: row.closeTime,
    })),
  };
}

export async function listPublicServicesService() {
  const services = await serviceRepository.listActive();
  return services.map((service) => ({
    id: service.id,
    slug: service.slug,
    name: service.name,
    description: service.description,
    durationMinutes: service.durationMinutes,
    fee: service.fee,
  }));
}

export async function listPublicDoctorsService() {
  const doctors = await doctorRepository.listPublic();
  return Promise.all(
    doctors.map(async (doctor) => ({
      ...doctor,
      services: (await doctorRepository.listServicesForDoctor(doctor.id)).map((service) => service.name),
    })),
  );
}

export async function getPublicDoctorService(slug: string) {
  const doctor = await doctorRepository.findPublicBySlug(slug);
  if (!doctor) throw new AppError(404, "Doctor not found");
  const services = await doctorRepository.listServicesForDoctor(doctor.id);
  return { ...doctor, services };
}
