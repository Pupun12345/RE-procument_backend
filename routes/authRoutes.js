const express = require("express");
const { login, logout, register, forgotPassword, resetPassword} = require("../controllers/authController");
const auth = require("../middleware/auth");
const adminOnly = require("../middleware/adminOnly");

const router = express.Router();

// ✅ ADMIN ONLY
router.post("/register", auth, adminOnly, register);

// ✅ PUBLIC
router.post("/login", login);

// ✅ AUTHENTICATED
router.post("/logout", auth, logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
