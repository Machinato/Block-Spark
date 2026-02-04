import { ethers } from "hardhat";
import { faker } from "@faker-js/faker";
import { TEST_CONFIG } from "../config";

export interface CampaignParams {
    targetAmount: bigint,
    minContribution: bigint,
    maxContribution: bigint,
    endTimestamp: bigint,
    ipfsMetadataHash: string,
    tokenName: string,
    tokenSymbol: string,
}

export async function generateRandomCampaignParams(): Promise<CampaignParams> {
    const targetAmount: bigint = TEST_CONFIG.parseEth(faker.number.float({
        min: parseFloat(TEST_CONFIG.TARGET_AMOUNT_MIN_ETH),
        max: parseFloat(TEST_CONFIG.TARGET_AMOUNT_MAX_ETH),
        fractionDigits: parseFloat(TEST_CONFIG.TARGET_AMOUNT_FRACTION_DIGITS),
        // multipleOf: parseFloat(TEST_CONFIG.TARGET_AMOUNT_STEP_ETH)
    }).toFixed(2)); 


    const minContribution: bigint = TEST_CONFIG.parseEth(faker.number.float({
        min: parseFloat(TEST_CONFIG.MIN_CONTRIBUTION_MIN_ETH),
        max: parseFloat(TEST_CONFIG.MIN_CONTRIBUTION_MAX_ETH),
        fractionDigits: parseFloat(TEST_CONFIG.TARGET_AMOUNT_FRACTION_DIGITS),
        // multipleOf: parseFloat(TEST_CONFIG.MIN_CONTRIBUTION_STEP_ETH)
    }).toFixed(2));


    const maxContribution: bigint = TEST_CONFIG.parseEth(faker.number.float({
        min: parseFloat(TEST_CONFIG.MAX_CONTRIBUTION_MIN_ETH),
        max: parseFloat(TEST_CONFIG.MAX_CONTRIBUTION_MAX_ETH),
        fractionDigits: parseFloat(TEST_CONFIG.TARGET_AMOUNT_FRACTION_DIGITS),
        // multipleOf: parseFloat(TEST_CONFIG.MAX_CONTRIBUTION_STEP_ETH)
    }).toFixed(2));

    const latestBlock = await ethers.provider.getBlock('latest');
    const currentTimestamp = BigInt(latestBlock?.timestamp || 0);

    const endTimestamp: bigint = currentTimestamp + BigInt(faker.number.int({
        min: TEST_CONFIG.END_TIMESTAMP_OFFSET_MIN_SECONDS,
        max: TEST_CONFIG.END_TIMESTAMP_OFFSET_MAX_SECONDS
    }));


    const ipfsMetadataHash: string = `${TEST_CONFIG.IPFS_METADATA_HASH_BASE}_${faker.string.uuid()}`;

    const fakeTokenName: string = faker.company.name();

    const tokenName: string = `${TEST_CONFIG.TOKEN_NAME_BASE}_${fakeTokenName}`;
    const tokenSymbol: string = `${TEST_CONFIG.TOKEN_SYMBOL_BASE}_${(fakeTokenName.match(/[A-Z]/g) || []).join('')}`;

    const dateString = new Date(Number(endTimestamp) * 1000).toLocaleString();

    console.log(`
                🎲 --- [GENERATED CAMPAIGN PARAMS] --- 🎲
                -------------------------------------------
                🎯 Target Amount:     ${ethers.formatEther(targetAmount)} ETH
                ⬇️  Min Contribution: ${ethers.formatEther(minContribution)} ETH
                ⬆️  Max Contribution: ${ethers.formatEther(maxContribution)} ETH
                ⏰ Deadline:          ${dateString} (Timestamp: ${endTimestamp})
                🏷️  Token Name:       ${tokenName}
                🔤 Token Symbol:      ${tokenSymbol}
                -------------------------------------------
            `);

    return {
        targetAmount,
        minContribution,
        maxContribution,
        endTimestamp,
        ipfsMetadataHash,
        tokenName,
        tokenSymbol,
    };
}