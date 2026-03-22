import express from "express";
import {
  getAllUsers,
  registerNewAdmin,
  getAdmin,
} from "../controller/userController.js";
import {
  isAuthenticated,
  isAuthorized,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/all", isAuthenticated, isAuthorized("Admin"), getAllUsers);
router.post(
  "/add/new-admin",
  isAuthenticated,
  isAuthorized("Admin"),
  registerNewAdmin
);
router.get("/admin", isAuthenticated, getAdmin);
export default router;