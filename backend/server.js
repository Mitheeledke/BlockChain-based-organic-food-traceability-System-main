require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");
const authRoutes = require("./routes/authRoutes");
const { authenticate, authorize } = require("./middleware/authMiddleware");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// public auth endpoints (register/login).
app.use("/api/auth", authRoutes);

// every /api/admin/* route must first authenticate and then check authorization
app.use(
  "/api/admin",
  authenticate,
  authorize(["Admin"]),
  adminRoutes
);

// example of a single protected endpoint; additional routers should also be
// mounted with authenticate + authorize if they expose sensitive data.
app.get(
  "/api/protected",
  authenticate,
  authorize(["Admin"]),
  (req, res) => {
    res.json({ message: "Admin access granted" });
  }
);

// catch all for unhandled routes
app.use((req, res) => {
  res.status(404).json({ message: "Endpoint not found" });
});

sequelize.sync()
  .then(() => console.log("Database Connected"))
  .catch(err => console.error(err));

app.listen(5000, () => {
  console.log("Server running on port 5000");
});