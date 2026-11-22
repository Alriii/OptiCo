import { Router } from "express";
import { PatientController } from "@/controllers/patient-controller";
import { AuthMiddleware } from "@/middlewares/auth-middleware";
import { PermissionMiddleware } from "@/middlewares/permission-middleware";
import { SchemaMiddleware } from "@/middlewares/schema-middleware";
import { emailTriggerRateLimit } from "@/middlewares/rate-limit";
import { createAppointmentSchema, optionalReasonSchema, rescheduleSchema } from "@/schema/appointment-schema";
import { paginationSchema } from "@/schema/common-schema";
import { patientProfileSchema } from "@/schema/patient-schema";

const router = Router();
const controller = new PatientController();
const auth = new AuthMiddleware();
const permission = new PermissionMiddleware();
const schema = new SchemaMiddleware();

router.use(auth.execute);

router.get("/profile", permission.require("appointments.read_own"), controller.getProfile);
router.patch("/profile", permission.require("appointments.read_own"), schema.validate(patientProfileSchema), controller.updateProfile);

router.get("/appointments", permission.require("appointments.read_own"), schema.validate(paginationSchema), controller.listAppointments);
router.post("/appointments", permission.require("appointments.request"), schema.validate(createAppointmentSchema), controller.createAppointment);
router.get("/appointments/:id", permission.require("appointments.read_own"), controller.getAppointment);
router.post(
  "/appointments/:id/cancel-request",
  permission.require("appointments.cancel"),
  emailTriggerRateLimit,
  schema.validate(optionalReasonSchema),
  controller.cancelRequest,
);
router.post(
  "/appointments/:id/reschedule-request",
  permission.require("appointments.reschedule"),
  emailTriggerRateLimit,
  schema.validate(rescheduleSchema),
  controller.rescheduleRequest,
);

export default router;
