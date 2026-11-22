import { Router } from "express";
import { z } from "zod";
import { PublicController } from "@/controllers/public-controller";
import { guestMiddleware } from "@/middlewares/guest-middleware";
import { SchemaMiddleware } from "@/middlewares/schema-middleware";
import {
  availabilityRateLimit,
  emailTriggerRateLimit,
  guestExchangeRateLimit,
  publicBookingRateLimit,
} from "@/middlewares/rate-limit";
import {
  availabilityQuerySchema,
  guestBookingSchema,
  guestCancelSchema,
  guestExchangeSchema,
} from "@/schema/public-schema";

const router = Router();
const controller = new PublicController();
const schema = new SchemaMiddleware();

const slugSchema = z.object({ params: z.object({ slug: z.string().min(1).max(80) }) });

router.get("/clinic", controller.clinic);
router.get("/services", controller.services);
router.get("/doctors", controller.doctors);
router.get("/doctors/:slug", schema.validate(slugSchema), controller.doctor);
router.get("/availability", availabilityRateLimit, schema.validate(availabilityQuerySchema), controller.availability);
router.post("/appointments", publicBookingRateLimit, schema.validate(guestBookingSchema), controller.createBooking);
router.post("/guest/exchange", guestExchangeRateLimit, schema.validate(guestExchangeSchema), controller.exchangeGuestToken);
router.get("/guest/appointment", guestMiddleware, controller.guestAppointment);
router.post(
  "/guest/cancel-request",
  guestMiddleware,
  emailTriggerRateLimit,
  schema.validate(guestCancelSchema),
  controller.guestCancelRequest,
);

export default router;
