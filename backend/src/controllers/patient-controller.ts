import type { Request, Response } from "express";
import { routeParam, success } from "@/lib/http";
import type { AuthenticatedRequest } from "@/middlewares/auth-middleware";
import {
  createPatientBookingService,
} from "@/services/booking-service";
import {
  getPatientAppointmentService,
  listPatientAppointmentsService,
  patientCancelRequestService,
  patientRescheduleRequestService,
} from "@/services/appointment-service";
import {
  getPatientProfileService,
  updatePatientProfileService,
} from "@/services/patient-service";

// Parse request pagination parameters.
function pagination(req: Request) {
  return { page: Number(req.query.page ?? 1), limit: Number(req.query.limit ?? 20) };
}

export class PatientController {
  // Retrieve patient account profile.
  public getProfile = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, { patient: await getPatientProfileService(user.id) });
  };

  // Update patient profile details.
  public updateProfile = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, { patient: await updatePatientProfileService(user.id, req.body) });
  };

  // List patient appointment history.
  public listAppointments = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const { page, limit } = pagination(req);
    const result = await listPatientAppointmentsService(user.id, page, limit);
    return success(res, result);
  };

  // Create new appointment request.
  public createAppointment = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const result = await createPatientBookingService(user.id, req.body);
    return success(res, result, "Appointment request received. The clinic will review it.", 201);
  };

  // Retrieve appointment record details.
  public getAppointment = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, { appointment: await getPatientAppointmentService(user.id, routeParam(req, "id")) });
  };

  // Submit appointment cancellation request.
  public cancelRequest = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const detail = await patientCancelRequestService(user.id, routeParam(req, "id"), req.body.reason ?? "Patient requested cancellation");
    return success(res, { appointment: detail }, "Cancellation recorded");
  };

  // Submit appointment reschedule request.
  public rescheduleRequest = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const detail = await patientRescheduleRequestService(user.id, routeParam(req, "id"), new Date(req.body.startAt));
    return success(res, { appointment: detail }, "Reschedule request submitted");
  };
}
