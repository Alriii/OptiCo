import type { Request, Response } from "express";
import { routeParam, success } from "@/lib/http";
import { manilaDateString } from "@/lib/time";
import type { AuthenticatedRequest } from "@/middlewares/auth-middleware";
import type { AppointmentStatus } from "@/db/schema";
import {
  doctorStatusChangeService,
  getDoctorAppointmentService,
  listDoctorAppointmentsService,
} from "@/services/appointment-service";
import { getMyAvailabilityService } from "@/services/admin-schedule-service";

function pagination(req: Request) {
  return { page: Number(req.query.page ?? 1), limit: Number(req.query.limit ?? 20) };
}

export class DoctorController {
  public schedule = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const date = (req.query.date as string | undefined) ?? manilaDateString(new Date());
    const result = await listDoctorAppointmentsService(user.id, { date }, 1, 100);
    return success(res, { date, appointments: result.rows });
  };

  public appointments = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const { page, limit } = pagination(req);
    const status = req.query.status as AppointmentStatus | undefined;
    const date = req.query.date as string | undefined;
    const result = await listDoctorAppointmentsService(user.id, { statuses: status ? [status] : undefined, date }, page, limit);
    return success(res, result);
  };

  public getAppointment = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, { appointment: await getDoctorAppointmentService(user.id, routeParam(req, "id")) });
  };

  public availability = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, { windows: await getMyAvailabilityService(user.id) });
  };

  public changeStatus = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const detail = await doctorStatusChangeService(user.id, routeParam(req, "id"), req.body.status, req.body.reason);
    return success(res, { appointment: detail }, "Appointment status updated");
  };
}
