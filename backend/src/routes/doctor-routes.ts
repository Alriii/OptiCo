import { Router } from "express";
import { DoctorController } from "@/controllers/doctor-controller";
import { AuthMiddleware } from "@/middlewares/auth-middleware";
import { PermissionMiddleware } from "@/middlewares/permission-middleware";
import { SchemaMiddleware } from "@/middlewares/schema-middleware";
import { doctorScheduleQuerySchema, doctorStatusSchema } from "@/schema/appointment-schema";
import { paginationSchema } from "@/schema/common-schema";

const router = Router();
const controller = new DoctorController();
const auth = new AuthMiddleware();
const permission = new PermissionMiddleware();
const schema = new SchemaMiddleware();

router.use(auth.execute, permission.require("appointments.read_assigned"));

router.get("/schedule", schema.validate(doctorScheduleQuerySchema), controller.schedule);
router.get("/appointments", schema.validate(paginationSchema), controller.appointments);
router.get("/appointments/:id", controller.getAppointment);
router.get("/availability", controller.availability);
router.post("/appointments/:id/status", schema.validate(doctorStatusSchema), controller.changeStatus);

export default router;
