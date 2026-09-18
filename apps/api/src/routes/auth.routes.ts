import { Router } from "express";
import { registerUser, loginUser, logout, refreshToken, getMe } from "../controllers/auth.controller";
import validateSchema from "../middlewares/Validate_Schemas";
import { RegisterSchema, LoginSchema } from "../lib/AuthValidators";
import protectUser from "../middlewares/Protect_User";


const router = Router()


router.post("/register", validateSchema(RegisterSchema), registerUser)
router.post("/login", validateSchema(LoginSchema), loginUser)
router.post("/logout", logout)
router.post("/refresh", refreshToken)
router.get("/me", protectUser, getMe)


export default router