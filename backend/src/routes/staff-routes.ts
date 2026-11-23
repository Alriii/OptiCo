import { Router } from "express";
import { StaffController } from "@/controllers/staff-controller";
import { AuthMiddleware } from "@/middlewares/auth-middleware";
import { PermissionMiddleware } from "@/middlewares/permission-middleware";
import { SchemaMiddleware } from "@/middlewares/schema-middleware";
import { emailTriggerRateLimit } from "@/middlewares/rate-limit";
import {
  appointmentReasonSchema,
  optionalReasonSchema,
  rescheduleSchema,
  staffAppointmentQuerySchema,
} from "@/schema/appointment-schema";
import { idParamsSchema } from "@/schema/common-schema";
import {
  patientSearchSchema,
  registerWalkInSchema,
  startWalkInSchema,
  walkInQuerySchema,
} from "@/schema/operations-schema";

const router = Router();
const controller = new StaffController();
const auth = new AuthMiddleware();
const permission = new PermissionMiddleware();
const schema = new SchemaMiddleware();

router.use(auth.execute);

router.get("/appointments", permission.require("appointments.read_all"), schema.validate(staffAppointmentQuerySchema), controller.listAppointments);
router.get("/appointments/:id", permission.require("appointments.read_all"), controller.getAppointment);
router.post("/appointments/:id/approve", permission.require("appointments.approve"), controller.approve);
router.post("/appointments/:id/reject", permission.require("appointments.reject"), schema.validate(appointmentReasonSchema), controller.reject);
router.post("/appointments/:id/cancel", permission.require("appointments.cancel"), emailTriggerRateLimit, schema.validate(appointmentReasonSchema), controller.cancel);
router.post("/appointments/:id/reschedule", permission.require("appointments.reschedule"), schema.validate(rescheduleSchema), controller.reschedule);
router.post("/appointments/:id/check-in", permission.require("appointments.check_in"), controller.checkIn);
router.post("/appointments/:id/complete", permission.require("appointments.complete"), controller.complete);
router.post("/appointments/:id/no-show", permission.require("appointments.complete"), schema.validate(optionalReasonSchema), controller.noShow);

router.get("/patients", permission.require("appointments.read_all"), schema.validate(patientSearchSchema), controller.searchPatients);

router.get("/walk-ins", permission.require("walkins.manage"), schema.validate(walkInQuerySchema), controller.listWalkIns);
router.post("/walk-ins", permission.require("walkins.manage"), schema.validate(registerWalkInSchema), controller.registerWalkIn);
router.post("/walk-ins/:id/call", permission.require("walkins.manage"), schema.validate(idParamsSchema), controller.callWalkIn);
router.post("/walk-ins/:id/start", permission.require("walkins.manage"), schema.validate(startWalkInSchema), controller.startWalkIn);
router.post("/walk-ins/:id/complete", permission.require("walkins.manage"), schema.validate(idParamsSchema), controller.completeWalkIn);
router.post("/walk-ins/:id/cancel", permission.require("walkins.manage"), schema.validate(idParamsSchema), controller.cancelWalkIn);

export default router;
