import type { Request, Response } from "express";
import { routeParam, success } from "@/lib/http";
import { manilaDayRange, manilaTimeToUtc } from "@/lib/time";
import type { AuthenticatedRequest } from "@/middlewares/auth-middleware";
import {
  createDoctorService,
  createServiceService,
  listDoctorsAdminService,
  listServicesAdminService,
  setDoctorServicesService,
  updateDoctorService,
  updateServiceService,
} from "@/services/admin-catalog-service";
import {
  createClosureService,
  createDoctorExceptionService,
  deleteClosureService,
  getClinicHoursService,
  getDoctorAvailabilityService,
  listClosuresService,
  listDoctorExceptionsService,
  replaceDoctorAvailabilityService,
  updateClinicHoursService,
} from "@/services/admin-schedule-service";
import {
  getClinicSettingsService,
  getOverviewService,
  listAuditLogsService,
  listStaffService,
  updateClinicSettingsService,
} from "@/services/admin-settings-service";
import { createStaffInviteService, updateStaffService } from "@/services/auth/staff-invite-service";

function feeString(fee: string | number): string {
  return Number(fee).toFixed(2);
}

export class AdminController {
  public listServices = async (_req: Request, res: Response) => {
    return success(res, { services: await listServicesAdminService() });
  };

  public createService = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const service = await createServiceService({ ...req.body, fee: feeString(req.body.fee) }, user.id);
    return success(res, { service }, "Service created", 201);
  };

  public updateService = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const input = { ...req.body };
    if (input.fee !== undefined) input.fee = feeString(input.fee);
    const service = await updateServiceService(routeParam(req, "id"), input, user.id);
    return success(res, { service }, "Service updated");
  };

  public listDoctors = async (_req: Request, res: Response) => {
    return success(res, { doctors: await listDoctorsAdminService() });
  };

  public createDoctor = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const doctor = await createDoctorService(req.body, user.id);
    return success(res, { doctor }, "Doctor created and invitation queued", 201);
  };

  public updateDoctor = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const doctor = await updateDoctorService(routeParam(req, "id"), req.body, user.id);
    return success(res, { doctor }, "Doctor updated");
  };

  public setDoctorServices = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, await setDoctorServicesService(routeParam(req, "id"), req.body.serviceIds, user.id));
  };

  public getClinicHours = async (_req: Request, res: Response) => {
    return success(res, { hours: await getClinicHoursService() });
  };

  public updateClinicHours = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, { hours: await updateClinicHoursService(req.body.hours, user.id) }, "Clinic hours updated");
  };

  public listClosures = async (_req: Request, res: Response) => {
    return success(res, { closures: await listClosuresService() });
  };

  public createClosure = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, { closure: await createClosureService(req.body, user.id) }, "Closure created", 201);
  };

  public deleteClosure = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, await deleteClosureService(routeParam(req, "id"), user.id), "Closure removed");
  };

  public getDoctorAvailability = async (req: Request, res: Response) => {
    return success(res, { windows: await getDoctorAvailabilityService(routeParam(req, "id")) });
  };

  public updateDoctorAvailability = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const windows = await replaceDoctorAvailabilityService(routeParam(req, "id"), req.body.windows, user.id);
    return success(res, { windows }, "Availability updated");
  };

  public listDoctorExceptions = async (req: Request, res: Response) => {
    return success(res, { exceptions: await listDoctorExceptionsService(routeParam(req, "id"), req.query.date as string | undefined) });
  };

  public createDoctorException = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const exception = await createDoctorExceptionService(routeParam(req, "id"), req.body, user.id);
    return success(res, { exception }, "Exception created", 201);
  };

  public listStaff = async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    return success(res, await listStaffService(page, limit));
  };

  public createStaff = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const result = await createStaffInviteService(req.body, user.id);
    return success(res, result, "Staff invitation queued", 201);
  };

  public updateStaff = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    const result = await updateStaffService(routeParam(req, "id"), req.body, user.id);
    return success(res, result, "Staff account updated");
  };

  public getSettings = async (_req: Request, res: Response) => {
    return success(res, { settings: await getClinicSettingsService() });
  };

  public updateSettings = async (req: Request, res: Response) => {
    const user = (req as AuthenticatedRequest).user!;
    return success(res, { settings: await updateClinicSettingsService(req.body, user.id) }, "Clinic settings updated");
  };

  public listAuditLogs = async (req: Request, res: Response) => {
    const page = Number(req.query.page ?? 1);
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const from = req.query.from ? manilaTimeToUtc(req.query.from as string, "00:00") : undefined;
    const to = req.query.to ? manilaDayRange(req.query.to as string).end : undefined;
    const result = await listAuditLogsService(
      {
        entityType: req.query.entityType as string | undefined,
        action: req.query.action as string | undefined,
        actorUserId: req.query.actorUserId as string | undefined,
        from,
        to,
      },
      page,
      limit,
    );
    return success(res, result);
  };

  public overview = async (_req: Request, res: Response) => {
    return success(res, await getOverviewService());
  };
}
