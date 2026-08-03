import { Router } from "express";
import { loginUser, logoutUser, registerUser , refreshTokenUser} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 }, // Required
    { name: "coverImage", maxCount: 1 }, // Optional
  ]),
  (req, res, next) => {
    console.log("\n🔴 REGISTER ROUTE HIT!");
    console.log("📦 Request body:", JSON.stringify(req.body, null, 2));
    console.log("📎 Files:", req.files);
    console.log("📦 Content-Type:", req.headers["content-type"]);
    next();
  },
  registerUser
);

router.post("/login", loginUser);
router.post("/logout", verifyJWT,  logoutUser)
router.post('/register', refreshTokenUser )
export default router;
