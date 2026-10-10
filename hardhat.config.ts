import { defineConfig } from "hardhat/config";
export default defineConfig({
  solidity: { version: "0.8.31", settings: { evmVersion: "osaka", optimizer: { enabled: true, runs: 200 } } },
  paths: { sources: "./contracts", tests: "./tests" },
  networks: { default: { type: "edr-simulated", chainType: "l1", chainId: 31337, hardfork: "osaka" } }
});
