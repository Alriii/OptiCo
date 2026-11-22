import type { Request, Response } from "express";
import { routeParam, success } from "@/lib/http";
import { clearGuestCookie, setGuestCookie } from "@/lib/auth-cookies";
import type { AuthenticatedRequest } from "@/middlewares/auth-middleware";
import {
  createGuestBookingService,
  toGuestAppointmentView,
} from "@/services/booking-service";
import { exchangeGuestTokenService } from "@/services/guest-service";
import { guestCancelRequestService, getGuestAppointmentService } from "@/services/appointment-service";
import {
  getPublicClinicService,
  getPublicDoctorService,
  listPublicDoctorsService,
  listPublicServicesService,
} from "@/services/public-service";
import { getAvailability } from "@/services/scheduling-service";

export class PublicController {
  public clinic = async (_req: Request, res: Response) => {
    return success(res, await getPublicClinicService());
  };

  public services = async (_req: Request, res: Response) => {
    return success(res, { services: await listPublicServicesService() });
  };

  public doctors = async (_req: Request, res: Response) => {
    return success(res, { doctors: await listPublicDoctorsService() });
  };

  public doctor = async (req: Request, res: Response) => {
    return success(res, await getPublicDoctorService(routeParam(req, "slug")));
  };

  public availability = async (req: Request, res: Response) => {
    const { serviceId, date } = req.query as unknown as { serviceId: string; date: string };
    return success(res, await getAvailability(serviceId, date));
  };

  public createBooking = async (req: Request, res: Response) => {
    const result = await createGuestBookingService(req.body);
    return success(res, result, "Appointment request received. The clinic will review it.", 201);
  };

  public exchangeGuestToken = async (req: Request, res: Response) => {
    const result = await exchangeGuestTokenService(req.body.token);
    setGuestCookie(res, result.appointmentId);
    return success(res, { appointment: result.appointment }, "Guest session started");
  };

  public guestAppointment = async (req: Request, res: Response) => {
    const appointmentId = (req as AuthenticatedRequest).guestAppointmentId!;
    const detail = await getGuestAppointmentService(appointmentId);
    return success(res, { appointment: toGuestAppointmentView(detail) });
  };

  public guestCancelRequest = async (req: Request, res: Response) => {
    const appointmentId = (req as AuthenticatedRequest).guestAppointmentId!;
    const detail = await guestCancelRequestService(appointmentId, req.body.reason ?? "");
    clearGuestCookie(res);
    return success(res, { appointment: toGuestAppointmentView(detail) }, "Cancellation recorded");
  };
}
