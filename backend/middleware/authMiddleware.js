const jwt = require("jsonwebtoken");

// verifies a bearer token in Authorization header
exports.authenticate = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ message: "Authorization header missing" });
  }

  const parts = header.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Malformed authorization header" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, wallet, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// returns middleware enforcing that authenticated user has one of the
// provided roles. an empty array means "any authenticated user".
exports.authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient rights" });
    }
    next();
  };
};