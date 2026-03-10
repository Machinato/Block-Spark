import { ethers, run, network } from "hardhat";
import * as fs from "fs";
import * as path from "path";

type Deployments = {
    masterToken?: string;
    masterCampaign?: string;
    campaignFactory?: string;
};

const DEPLOYMENTS_DIR = path.join(__dirname, "../deployments");
const DEPLOYMENTS_FILE = path.join(DEPLOYMENTS_DIR, `${network.name}.json`);

function loadDeployments(): Deployments {
    if (!fs.existsSync(DEPLOYMENTS_FILE)) return {};
    return JSON.parse(fs.readFileSync(DEPLOYMENTS_FILE, "utf8"));
}

function saveDeployments(data: Deployments): void {
    if (!fs.existsSync(DEPLOYMENTS_DIR)) {
        fs.mkdirSync(DEPLOYMENTS_DIR, { recursive: true });
    }
    fs.writeFileSync(DEPLOYMENTS_FILE, JSON.stringify(data, null, 2));
}

function requireEnv(key: string): string {
    const value = process.env[key];
    if (!value) throw new Error(`❌ Missing required env variable: ${key}`);
    return value;
}

async function main() {

    const isLocalNetwork = network.name === "hardhat" || network.name === "localhost";

    if (!isLocalNetwork) {
        requireEnv("PRIVATE_KEY");
        requireEnv("ETHERSCAN_API_KEY");
    }

    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const deployments = loadDeployments();
    let currentNonce = await deployer.getNonce("pending");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  BlockSpark — Deploy");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  Network:  ${network.name}`);
    console.log(`  Deployer: ${deployer.address}`);
    console.log(`  Balance:  ${ethers.formatEther(balance)} ETH`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    let masterTokenAddress: string;

    if (deployments.masterToken) {
        masterTokenAddress = deployments.masterToken;
        console.log(`\n[1/3] MasterBlockSparkToken — already deployed`);
        console.log(`      ⏭️  ${masterTokenAddress}`);
    } else {
        console.log("\n[1/3] Deploying MasterBlockSparkToken...");
        const MasterToken = await ethers.getContractFactory("MasterBlockSparkToken");
        const masterToken = await MasterToken.deploy({ nonce: currentNonce++ });
        await masterToken.waitForDeployment();
        masterTokenAddress = await masterToken.getAddress();

        deployments.masterToken = masterTokenAddress;
        saveDeployments(deployments);
        console.log(`      ✅ ${masterTokenAddress}`);
    }


    let masterCampaignAddress: string;

    if (deployments.masterCampaign) {
        masterCampaignAddress = deployments.masterCampaign;
        console.log(`\n[2/3] MasterCampaign — already deployed`);
        console.log(`      ⏭️  ${masterCampaignAddress}`);
    } else {
        console.log("\n[2/3] Deploying MasterCampaign...");
        const MasterCampaign = await ethers.getContractFactory("MasterCampaign");
        const masterCampaign = await MasterCampaign.deploy({ nonce: currentNonce++ });
        await masterCampaign.waitForDeployment();
        masterCampaignAddress = await masterCampaign.getAddress();

        deployments.masterCampaign = masterCampaignAddress;
        saveDeployments(deployments);
        console.log(`      ✅ ${masterCampaignAddress}`);
    }


    let factoryAddress: string;

    if (deployments.campaignFactory) {
        factoryAddress = deployments.campaignFactory;
        console.log(`\n[3/3] CampaignFactory — already deployed`);
        console.log(`      ⏭️  ${factoryAddress}`);
    } else {
        console.log("\n[3/3] Deploying CampaignFactory...");
        const Factory = await ethers.getContractFactory("CampaignFactory");
        const factory = await Factory.deploy(masterCampaignAddress, masterTokenAddress, { nonce: currentNonce++ });
        await factory.waitForDeployment();
        factoryAddress = await factory.getAddress();

        deployments.campaignFactory = factoryAddress;
        saveDeployments(deployments);
        console.log(`      ✅ ${factoryAddress}`);
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  Deployed addresses:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`  MASTER_TOKEN_ADDRESS=${masterTokenAddress}`);
    console.log(`  MASTER_CAMPAIGN_ADDRESS=${masterCampaignAddress}`);
    console.log(`  FACTORY_ADDRESS=${factoryAddress}`);
    console.log(`\n  Saved to: deployments/${network.name}.json`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (isLocalNetwork) {
        console.log("\n  ℹ️  Local network — skipping verification.\n");
        return;
    }

    console.log("\n  ⏳ Waiting 20s for Basescan to index contracts...");
    await new Promise(r => setTimeout(r, 20_000));

    console.log("\n  🔍 Verifying on Basescan...\n");

    await tryVerify("MasterBlockSparkToken", masterTokenAddress, []);
    await tryVerify("MasterCampaign", masterCampaignAddress, []);
    await tryVerify("CampaignFactory", factoryAddress, [masterCampaignAddress, masterTokenAddress]);

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("  🎉 Done!");
    console.log(`  🔗 https://sepolia.basescan.org/address/${factoryAddress}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

async function tryVerify(
    name: string,
    address: string,
    constructorArguments: unknown[],
): Promise<void> {
    try {
        await run("verify:verify", { address, constructorArguments });
        console.log(`  ✅ ${name} verified`);
    } catch (error: unknown) {
        if (error instanceof Error && error.message.includes("Already Verified")) {
            console.log(`  ⏭️  ${name} already verified`);
        } else {
            console.warn(`  ⚠️  ${name} verification failed: ${String(error)}`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});