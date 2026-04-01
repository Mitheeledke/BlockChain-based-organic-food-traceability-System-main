const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authenticate, authorize } = require("../middleware/authMiddleware");

// all routes mounted under /api/admin are already guarded by
// authenticate+authorize in server.js so the handlers can assume
// req.user.role === "Admin".
router.get("/users", async (req, res) => {
  const users = await User.findAll({
    attributes: ["id","name","email","role","wallet_address"],
  });
  res.json(users);
});

module.exports = router;