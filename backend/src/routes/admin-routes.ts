import { Router } from "express";
import { z } from "zod";
import { AdminController } from "@/controllers/admin-controller";
import { AuthMiddleware } from "@/middlewares/auth-middleware";
import { PermissionMiddleware } from "@/middlewares/permission-middleware";
import { SchemaMiddleware } from "@/middlewares/schema-middleware";
import {
  auditQuerySchema,
  availabilitySchema,
  clinicHoursSchema,
  closureSchema,
  createDoctorSchema,
  createServiceSchema,
  doctorServicesSchema,
  exceptionSchema,
  settingsSchema,
  updateDoctorSchema,
  updateServiceSchema,
} from "@/schema/admin-schema";
import { createStaffSchema, updateStaffSchema } from "@/schema/auth-schema";
import { idParamsSchema, paginationSchema } from "@/schema/common-schema";

const router = Router();
const controller = new AdminController();
const auth = new AuthMiddleware();
const permission = new PermissionMiddleware();
const schema = new SchemaMiddleware();

const exceptionQuerySchema = z.object({
  params: z.object({ id: z.uuid() }),
  query: z.object({ date: z.iso.date().optional() }),
});

router.use(auth.execute);

router.get("/services", permission.require("services.manage"), controller.listServices);
router.post("/services", permission.require("services.manage"), schema.validate(createServiceSchema), controller.createService);
router.patch("/services/:id", permission.require("services.manage"), schema.validate(updateServiceSchema), controller.updateService);

router.get("/doctors", permission.require("doctors.manage"), controller.listDoctors);
router.post("/doctors", permission.require("doctors.manage"), schema.validate(createDoctorSchema), controller.createDoctor);
router.patch("/doctors/:id", permission.require("doctors.manage"), schema.validate(updateDoctorSchema), controller.updateDoctor);
router.put("/doctors/:id/services", permission.require("doctors.manage"), schema.validate(doctorServicesSchema), controller.setDoctorServices);

router.get("/clinic-hours", permission.require("schedules.manage"), controller.getClinicHours);
router.put("/clinic-hours", permission.require("schedules.manage"), schema.validate(clinicHoursSchema), controller.updateClinicHours);

router.get("/closures", permission.require("schedules.manage"), controller.listClosures);
router.post("/closures", permission.require("schedules.manage"), schema.validate(closureSchema), controller.createClosure);
router.delete("/closures/:id", permission.require("schedules.manage"), schema.validate(idParamsSchema), controller.deleteClosure);

router.get("/doctors/:id/availability", permission.require("schedules.manage"), schema.validate(idParamsSchema), controller.getDoctorAvailability);
router.put("/doctors/:id/availability", permission.require("schedules.manage"), schema.validate(availabilitySchema), controller.updateDoctorAvailability);
router.get("/doctors/:id/exceptions", permission.require("schedules.manage"), schema.validate(exceptionQuerySchema), controller.listDoctorExceptions);
router.post("/doctors/:id/exceptions", permission.require("schedules.manage"), schema.validate(exceptionSchema), controller.createDoctorException);

router.get("/staff", permission.require("staff.manage"), schema.validate(paginationSchema), controller.listStaff);
router.post("/staff", permission.require("staff.manage"), schema.validate(createStaffSchema), controller.createStaff);
router.patch("/staff/:id", permission.require("staff.manage"), schema.validate(updateStaffSchema), controller.updateStaff);

router.get("/settings", permission.require("clinic_settings.manage"), controller.getSettings);
router.patch("/settings", permission.require("clinic_settings.manage"), schema.validate(settingsSchema), controller.updateSettings);

router.get("/audit-logs", permission.require("audit_logs.read"), schema.validate(auditQuerySchema), controller.listAuditLogs);
router.get("/overview", permission.require("appointments.read_all"), controller.overview);

export default router;
