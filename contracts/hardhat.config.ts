import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });

const config: HardhatUserConfig = {

    solidity: {
        version: "0.8.28",
        settings: {
            optimizer: { enabled: true, runs: 200 },
        },
    },

    networks: {
        hardhat: {},

        "base-sepolia": {
            // url:      `https://base-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY ?? ""}`,
            url: "https://sepolia.base.org",
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            chainId: 84532,
        },
    },

    etherscan: {
        apiKey: process.env.ETHERSCAN_API_KEY ?? "",
    },

    typechain: {
        outDir: "typechain-types",
        target: "ethers-v6",
    },

    mocha: {
        timeout: 60000,
        color: true,
        reporter: "spec",
        slow: 5000,
    },

    gasReporter: {
        enabled: !!process.env.REPORT_GAS,
        currency: "USD",
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
        outputFile: "gas-report.txt",
        noColors: false,
    },
};

export default config;