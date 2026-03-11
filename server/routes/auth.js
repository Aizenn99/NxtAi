const express = require("express");
const router = express.Router();
const {
  register,
  login,
  checkAuth,
  logout,
} = require("./../controllers/auth/auth-controller");

router.post("/register", register);
router.post("/login", login);
router.get("/checkAuth", checkAuth);
router.post("/logout", logout);

module.exports = router;
