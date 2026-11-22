import { Router } from "express";
import authRoutes from "@/routes/auth-routes";
import publicRoutes from "@/routes/public-routes";
import patientRoutes from "@/routes/patient-routes";
import doctorRoutes from "@/routes/doctor-routes";
import staffRoutes from "@/routes/staff-routes";
import adminRoutes from "@/routes/admin-routes";
import healthRoutes from "@/routes/health-routes";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/public", publicRoutes);
router.use("/patient", patientRoutes);
router.use("/doctor", doctorRoutes);
router.use("/staff", staffRoutes);
router.use("/admin", adminRoutes);

export default router;
