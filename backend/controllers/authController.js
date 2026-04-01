const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const VALID_ROLES = ["Admin", "Farmer", "Distributor", "Retailer"];
const PASSWORD_MIN_LENGTH = 6; // enforce some complexity

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, wallet_address } = req.body;

    // basic required-field check
    if (!name || !email || !password || !role || !wallet_address) {
      return res.status(400).json({ message: "name, email, password, role and wallet_address are required" });
    }

    // simple email validator
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: `role must be one of: ${VALID_ROLES.join(", ")}` });
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({ message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` });
    }

    // check unique constraints first before hashing
    const [existingWallet, existingEmail] = await Promise.all([
      User.findOne({ where: { wallet_address } }),
      User.findOne({ where: { email } }),
    ]);
    if (existingWallet) {
      return res.status(400).json({ message: "Wallet address already registered" });
    }
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS || "10", 10));

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      wallet_address,
    });

    res.json({ message: "User registered successfully", user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      wallet_address: user.wallet_address
    } });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.name === "SequelizeValidationError" || error.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role, wallet: user.wallet_address },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "1d" }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
