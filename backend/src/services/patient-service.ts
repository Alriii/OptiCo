import { AppError } from "@/lib/http";
import { ageInYears, manilaDateString } from "@/lib/time";
import { PatientRepository, type PatientInput } from "@/repositories/patient-repository";
import { recordAudit } from "@/services/audit-service";

const patientRepository = new PatientRepository();

export async function getPatientProfileService(userId: string) {
  const patient = await patientRepository.findByUserId(userId);
  if (!patient) throw new AppError(404, "Patient profile not found");
  return patient;
}

export async function updatePatientProfileService(userId: string, input: Partial<PatientInput>) {  const patient = await patientRepository.findByUserId(userId);
  if (!patient) throw new AppError(404, "Patient profile not found");

  if (input.dateOfBirth && ageInYears(input.dateOfBirth, manilaDateString(new Date())) < 18) {
    const guardianName = input.guardianName ?? patient.guardianName;
    const guardianRelationship = input.guardianRelationship ?? patient.guardianRelationship;
    const guardianContact = input.guardianContact ?? patient.guardianContact;
    if (!guardianName || !guardianRelationship || !guardianContact) {
      throw new AppError(400, "A parent or guardian is required for patients under 18");
    }
  }

  const updated = await patientRepository.update(patient.id, input);
  await recordAudit({
    actorUserId: userId,
    action: "patient.profile_updated",
    entityType: "patient",
    entityId: patient.id,
  });
  return updated;
}

export async function searchPatientsService(query: string, limit: number) {
  if (!query || query.trim().length < 2) return [];
  return patientRepository.search(query.trim(), limit);
}
