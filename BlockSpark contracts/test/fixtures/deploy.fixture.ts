import { ethers } from "hardhat";
import { EventLog } from "ethers";
import { BlockSparkToken, CampaignFactory } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { TEST_CONFIG } from "../config";
import { CampaignParams, generateRandomCampaignParams } from '../helpers/generateCampaignParams';

export async function deployBlockSparkFixture() {
    const [creator, ...allInvestors]: HardhatEthersSigner[] = await ethers.getSigners();
    const investors = allInvestors.slice(0, TEST_CONFIG.NUM_INVESTORS);

    console.log("\n🏭 Deploying CampaignFactory...");
    
    const CampaignFactory = await ethers.getContractFactory("CampaignFactory");
    const campaignFactory: CampaignFactory = await CampaignFactory.deploy();
    await campaignFactory.waitForDeployment();

    console.log(`   ✅ Deployed at: ${await campaignFactory.getAddress()}`);

    const generatedCampaignPrams: CampaignParams = await generateRandomCampaignParams();

    const newCampaign = await campaignFactory.createCampaign(
        generatedCampaignPrams.targetAmount,
        generatedCampaignPrams.minContribution,
        generatedCampaignPrams.maxContribution,
        generatedCampaignPrams.endTimestamp,
        generatedCampaignPrams.ipfsMetadataHash,
        generatedCampaignPrams.tokenName,
        generatedCampaignPrams.tokenSymbol
    );

    const receipt = await newCampaign.wait();
    const events: EventLog | undefined = receipt?.logs.find(
        (log): log is EventLog => "fragment" in log && log.fragment.name === 'CampaignCreated' );

    const newCampaignAdress = events?.args[0];

    if (!newCampaignAdress) throw new Error(TEST_CONFIG.FAILED_TO_ECTRACT_CAMPAIDN_ADRESS_ERROR);

    const campaign = await ethers.getContractAt("Campaign", newCampaignAdress);

    const tokenAddress = await campaign.token();
    const token = await ethers.getContractAt("BlockSparkToken", tokenAddress);

    const dateString = new Date(Number(generatedCampaignPrams.endTimestamp) * 1000).toLocaleString();

    console.log(`
                🎲 --- [CREATED CAMPAIGN WITH PARAMS] --- 🎲
                -------------------------------------------
                📍 Campaign address:   ${newCampaignAdress}
                🎯 Target Amount:     ${ethers.formatEther(generatedCampaignPrams.targetAmount)} ETH
                ⬇️  Min Contribution: ${ethers.formatEther(generatedCampaignPrams.minContribution)} ETH
                ⬆️  Max Contribution: ${ethers.formatEther(generatedCampaignPrams.maxContribution)} ETH
                ⏰ Deadline:          ${dateString} (Timestamp: ${generatedCampaignPrams.endTimestamp})
                📍 Token address:      ${tokenAddress}
                🏷️  Token Name:       ${generatedCampaignPrams.tokenName}
                🔤 Token Symbol:      ${generatedCampaignPrams.tokenSymbol}
                -------------------------------------------
            `);

    return {
        campaignFactory,
        campaign,
        token,
        
        creator,
        investors, 

        params: generatedCampaignPrams,
        campaignAddress: newCampaignAdress,
        tokenAddress
    };
}