import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    hardhat: {

    },
  },
  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6"
  },
  mocha: {
    timeout: 60000,
    color: true,
    reporter: 'spec',
    slow: 5000, // Тести довші 5s вважаються "повільними"
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    outputFile: 'gas-report.txt',
    noColors: false,
  }
};

export default config;