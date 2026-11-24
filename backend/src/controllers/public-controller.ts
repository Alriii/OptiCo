import type { Request, Response } from "express";
import { AppError, routeParam, success } from "@/lib/http";
import {
  getPublicClinicService,
  getPublicDoctorService,
  listPublicDoctorsService,
  listPublicServicesService,
} from "@/services/public-service";
import { getAvailability } from "@/services/scheduling-service";

export class PublicController {
  // Return public clinic information.
  public clinic = async (_req: Request, res: Response) => {
    return success(res, await getPublicClinicService());
  };

  // List active clinical services.
  public services = async (_req: Request, res: Response) => {
    return success(res, { services: await listPublicServicesService() });
  };

  // List active clinic doctors.
  public doctors = async (_req: Request, res: Response) => {
    return success(res, { doctors: await listPublicDoctorsService() });
  };

  // Return doctor profile details.
  public doctor = async (req: Request, res: Response) => {
    return success(res, await getPublicDoctorService(routeParam(req, "slug")));
  };

  // Return service slot availability.
  public availability = async (req: Request, res: Response) => {
    const { serviceId, date } = req.query as unknown as { serviceId: string; date: string };
    return success(res, await getAvailability(serviceId, date));
  };

  // Reject unauthorized guest booking.
  public createBooking = async (_req: Request, _res: Response) => {
    throw new AppError(401, "Guest booking is disabled. Please create an account or sign in to book an appointment.");
  };

}
