import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// ✅ Register route with multer middleware for file uploads
router.post(
    "/register",
    upload.fields([
        { name: "avatar", maxCount: 1 },      // Required
        { name: "coverImage", maxCount: 1 }   // Optional
    ]),
    (req, res, next) => {
        console.log("\n🔴 REGISTER ROUTE HIT!");
        console.log("📦 Request body:", JSON.stringify(req.body, null, 2));
        console.log("📎 Files:", req.files);
        console.log("📦 Content-Type:", req.headers['content-type']);
        next();
    },
    registerUser
);

export default router;