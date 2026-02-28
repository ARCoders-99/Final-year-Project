import express from "express";
import { isAuthenticated, isAuthorized } from "../middlewares/authMiddleware.js";
import {
    createPaymentIntent,
    getPaymentStatus,
    getAllPayments,
} from "../controller/paymentController.js";

const router = express.Router();

router.post("/create-payment-intent/:bookId", isAuthenticated, createPaymentIntent);
router.get("/payment-status", isAuthenticated, getPaymentStatus);
router.get("/admin/payments", isAuthenticated, isAuthorized("Admin"), getAllPayments);

export default router;
