import type { Request, Response } from "express";
import { routeParam, success } from "@/lib/http";
import type { AppointmentStatus } from "@/db/schema";
import type { AuthenticatedRequest } from "@/middlewares/auth-middleware";
import {
  approveAppointmentService,
  cancelAppointmentService,
  checkInAppointmentService,
  completeAppointmentService,
  getStaffAppointmentService,
  listStaffAppointmentsService,
  noShowAppointmentService,
  rejectAppointmentService,
  rescheduleAppointmentService,
} from "@/services/appointment-service";
import { searchPatientsService } from "@/services/patient-service";
import {
  callWalkInService,
  cancelWalkInService,
  completeWalkInService,
  listWalkInsService,
  registerWalkInService,
  startWalkInService,
} from "@/services/walkin-service";

function pagination(req: Request) {
  return { page: Number(req.query.page ?? 1), limit: Number(req.query.limit ?? 20) };
}

export class StaffController {
  public listAppointments = async (req: Request, res: Response) => {
    const { page, limit } = pagination(req);
    const status = req.query.status as AppointmentStatus | undefined;
    const result = await listStaffAppointmentsService(
      {
        statuses: status ? [status] : undefined,
        date: req.query.date as string | undefined,
        q: req.query.q as string | undefined,
      },
      page,
      limit,
    );
    return success(res, result);
  };

  public getAppointment = async (req: Request, res: Response) => {
    return success(res, { appointment: await getStaffAppointmentService(routeParam(req, "id")) });
  };

  public approve = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const detail = await approveAppointmentService(routeParam(req, "id"), user.id);
    return success(res, { appointment: detail }, "Appointment confirmed");
  };

  public reject = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const detail = await rejectAppointmentService(routeParam(req, "id"), user.id, req.body.reason);
    return success(res, { appointment: detail }, "Request rejected");
  };

  public cancel = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const detail = await cancelAppointmentService(routeParam(req, "id"), user.id, req.body.reason);
    return success(res, { appointment: detail }, "Appointment cancelled");
  };

  public reschedule = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const detail = await rescheduleAppointmentService(routeParam(req, "id"), user.id, new Date(req.body.startAt));
    return success(res, { appointment: detail }, "Appointment rescheduled");
  };

  public checkIn = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, { appointment: await checkInAppointmentService(routeParam(req, "id"), user.id) }, "Patient checked in");
  };

  public complete = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, { appointment: await completeAppointmentService(routeParam(req, "id"), user.id) }, "Appointment completed");
  };

  public noShow = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, { appointment: await noShowAppointmentService(routeParam(req, "id"), user.id) }, "Marked as no-show");
  };

  public searchPatients = async (req: Request, res: Response) => {
    const q = (req.query.q as string | undefined) ?? "";
    const limit = Math.min(Number(req.query.limit ?? 20), 50);
    return success(res, { patients: await searchPatientsService(q, limit) });
  };

  public listWalkIns = async (req: Request, res: Response) => {
    return success(res, { entries: await listWalkInsService(req.query.date as string | undefined) });
  };

  public registerWalkIn = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const result = await registerWalkInService(req.body, user.id);
    return success(res, result, "Walk-in registered", 201);
  };

  public callWalkIn = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, { entry: await callWalkInService(routeParam(req, "id"), user.id) });
  };

  public startWalkIn = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, { entry: await startWalkInService(routeParam(req, "id"), user.id, req.body.doctorId) });
  };

  public completeWalkIn = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, { entry: await completeWalkInService(routeParam(req, "id"), user.id) });
  };

  public cancelWalkIn = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, { entry: await cancelWalkInService(routeParam(req, "id"), user.id) });
  };
}
