import express from "express";
import { createOrder, verifyPayment, getOrderHistory } from "../controllers/orderController.js";

const router = express.Router();

router.post("/create", createOrder);
router.get("/verify-payment", verifyPayment);
router.get("/history", getOrderHistory);

export default router;
