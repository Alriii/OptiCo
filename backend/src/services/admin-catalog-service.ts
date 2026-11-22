import type { UserRole } from "@/db/schema";
import { AppError } from "@/lib/http";
import { DoctorRepository } from "@/repositories/doctor-repository";
import { ServiceRepository, type ServiceInput } from "@/repositories/service-repository";
import { UserRepository } from "@/repositories/user-repository";
import { recordAudit } from "@/services/audit-service";
import { createStaffInviteService } from "@/services/auth/staff-invite-service";

const serviceRepository = new ServiceRepository();
const doctorRepository = new DoctorRepository();
const userRepository = new UserRepository();

function isUniqueViolation(error: unknown) {
  return (error as { code?: string })?.code === "23505";
}

export async function listServicesAdminService() {
  return serviceRepository.listAll();
}

export async function createServiceService(input: ServiceInput, actorUserId: string) {
  try {
    const service = await serviceRepository.create(input);
    await recordAudit({
      actorUserId,
      action: "service.created",
      entityType: "service",
      entityId: service.id,
      metadata: { slug: service.slug },
    });
    return service;
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError(409, "A service with that slug already exists");
    throw error;
  }
}

export async function updateServiceService(id: string, input: Partial<ServiceInput>, actorUserId: string) {
  const existing = await serviceRepository.findById(id);
  if (!existing) throw new AppError(404, "Service not found");
  try {
    const service = await serviceRepository.update(id, input);
    await recordAudit({
      actorUserId,
      action: "service.updated",
      entityType: "service",
      entityId: id,
      metadata: { slug: service.slug },
    });
    return service;
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError(409, "A service with that slug already exists");
    throw error;
  }
}

export async function listDoctorsAdminService() {
  const doctors = await doctorRepository.listAdmin();
  return Promise.all(
    doctors.map(async (doctor) => ({
      ...doctor,
      serviceIds: await doctorRepository.getServiceIds(doctor.id),
    })),
  );
}

export async function createDoctorService(
  input: {
    email: string;
    name: string;
    slug: string;
    displayName: string;
    credentials?: string | null;
    bio?: string | null;
    photoUrl?: string | null;
    isActive?: boolean;
    serviceIds?: string[];
  },
  actorUserId: string,
) {
  const existingUser = await userRepository.findByEmail(input.email);
  if (existingUser && existingUser.role !== "DOCTOR") {
    throw new AppError(409, "An account with this email already exists");
  }

  const invite = await createStaffInviteService(
    { email: input.email, name: input.name, role: "DOCTOR" as UserRole },
    actorUserId,
  );

  try {
    const doctor = await doctorRepository.create(invite.user.id, {
      slug: input.slug,
      displayName: input.displayName,
      credentials: input.credentials ?? null,
      bio: input.bio ?? null,
      photoUrl: input.photoUrl ?? null,
      isActive: input.isActive ?? true,
    });

    if (input.serviceIds?.length) {
      await doctorRepository.setServices(doctor.id, input.serviceIds);
    }

    await recordAudit({
      actorUserId,
      action: "doctor.created",
      entityType: "doctor",
      entityId: doctor.id,
      metadata: { slug: doctor.slug },
    });
    return doctor;
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError(409, "That doctor slug is already in use");
    throw error;
  }
}

export async function updateDoctorService(
  id: string,
  input: {
    slug?: string;
    displayName?: string;
    credentials?: string | null;
    bio?: string | null;
    photoUrl?: string | null;
    isActive?: boolean;
    serviceIds?: string[];
  },
  actorUserId: string,
) {
  const existing = await doctorRepository.findById(id);
  if (!existing) throw new AppError(404, "Doctor not found");

  const { serviceIds, ...profile } = input;
  try {
    const doctor = await doctorRepository.update(id, profile);
    if (serviceIds) await doctorRepository.setServices(id, serviceIds);
    await recordAudit({
      actorUserId,
      action: "doctor.updated",
      entityType: "doctor",
      entityId: id,
      metadata: { slug: doctor.slug, isActive: doctor.isActive },
    });
    return doctor;
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError(409, "That doctor slug is already in use");
    throw error;
  }
}

export async function setDoctorServicesService(id: string, serviceIds: string[], actorUserId: string) {
  const existing = await doctorRepository.findById(id);
  if (!existing) throw new AppError(404, "Doctor not found");
  await doctorRepository.setServices(id, serviceIds);
  await recordAudit({
    actorUserId,
    action: "doctor.services_updated",
    entityType: "doctor",
    entityId: id,
    metadata: { serviceCount: serviceIds.length },
  });
  return { serviceIds };
}
