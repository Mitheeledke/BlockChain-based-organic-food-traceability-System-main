const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");
const User = require("../models/User");

router.post("/register", authController.register);
router.post("/login", authController.login);

router.get("/me",
  authenticate,
  async (req, res) => {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id","name","email","role","wallet_address"]
    });
    res.json(user);
  }
);

module.exports = router;