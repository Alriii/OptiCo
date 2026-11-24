import { Router } from "express";
import { z } from "zod";
import { PublicController } from "@/controllers/public-controller";
import { SchemaMiddleware } from "@/middlewares/schema-middleware";
import {
  availabilityRateLimit,
  publicBookingRateLimit,
} from "@/middlewares/rate-limit";
import {
  availabilityQuerySchema,
  guestBookingSchema,
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

export default router;
