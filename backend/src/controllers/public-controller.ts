import type { Request, Response } from "express";
import { routeParam, success } from "@/lib/http";
import type { AuthenticatedRequest } from "@/middlewares/auth-middleware";
import { createGuestBookingService } from "@/services/booking-service";
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

}
