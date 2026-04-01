const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "Name is required" }
    }
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      notEmpty: { msg: "Email is required" },
      isEmail: { msg: "Valid email is required" }
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "Password is required" }
    }
  },
  role: {
    type: DataTypes.ENUM("Admin","Farmer","Distributor","Retailer"),
    allowNull: false,
    validate: {
      notEmpty: { msg: "Role is required" }
    }
  },
  wallet_address: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "Wallet address is required" }
    }
  }
});

module.exports = User;