require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // This MUST be here to fix "Stack too deep"
    },
  },
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337, // Note: Ganache GUI usually uses 5777, CLI uses 1337
      accounts: [
        process.env.PRIVATE_KEY_1,
        process.env.PRIVATE_KEY_2,
        process.env.PRIVATE_KEY_3,
        process.env.PRIVATE_KEY_4
      ]
    }
  }
};