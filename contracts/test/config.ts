import { ethers } from "hardhat";
import { parseEther } from "ethers";

export const PRESETS = {
    STANDARD: {
        targetAmount:     parseEther("10"),
        minContribution:  parseEther("0.5"),
        maxContribution:  parseEther("3"),
        tokenName:        "BlockSpark Token",
        tokenSymbol:      "BST",
        ipfsHash:         "QmStandardCampaignHash"
    },
    MINIMAL: {
        targetAmount:     parseEther("1"),
        minContribution:  parseEther("1"),
        maxContribution:  parseEther("1"),
        tokenName:        "Minimal BlockSpark Token",
        tokenSymbol:      "MBSP",
        ipfsHash:         "QmMinimalCampaignHash"
    },
    LARGE: {
        targetAmount:     parseEther("1000"),
        minContribution:  parseEther("10"),
        maxContribution:  parseEther("100"),
        tokenName:        "Large BlockSpark Token",
        tokenSymbol:      "LBSP",
        ipfsHash:         "QmLargeCampaignHash"
    },
} as const;

export type PresetKey = keyof typeof PRESETS;


export const DURATION = {
    ONE_HOUR: 3_600,
    ONE_DAY: 86_400,
    ONE_WEEK: 604_800
} as const;

export async function futureTimestamp(offsetSeconds = DURATION.ONE_HOUR): Promise<bigint>{
    const block = await ethers.provider.getBlock("latest");
    return BigInt(block!.timestamp + offsetSeconds);
}

export async function campaignParams(
    preset: PresetKey = "STANDARD",
    offsetSeconds = DURATION.ONE_HOUR
) {
    const p = PRESETS[preset]
    return {
        ...p,
        endTimestamp: await futureTimestamp(offsetSeconds)
    }
}

export const STATE = {
    ACTIVE: 0n,
    SUCCESSFUL: 1n,
    FAILED: 2n,
    FINISHED: 3n
}

export const TOKENS_PER_ETH       = 100n;
export const BONUS_TOKENS_PER_ETH = 120n;

export function expectedTokens(ethAmount: bigint, totalRaisedBefore: bigint, targetAmount: bigint): bigint {
    const bonusLimit = targetAmount / 2n;

    if (totalRaisedBefore >= bonusLimit) {
        return ethAmount * TOKENS_PER_ETH;
    }

    if (totalRaisedBefore + ethAmount <= bonusLimit) {
        return ethAmount * BONUS_TOKENS_PER_ETH;
    }

    const atBonus    = bonusLimit - totalRaisedBefore;
    const atStandard = ethAmount - atBonus;
    return atBonus * BONUS_TOKENS_PER_ETH + atStandard * TOKENS_PER_ETH;
}

export const NUM_INVESTORS = 15;

// export const TEST_CONFIG = {
//     TARGET_AMOUNT_MIN_ETH: '5',
//     TARGET_AMOUNT_MAX_ETH: '10',
//     TARGET_AMOUNT_FRACTION_DIGITS: '2',
//     TARGET_AMOUNT_STEP_ETH: '0,25',

//     MIN_CONTRIBUTION_MAX_ETH: '1',
//     MIN_CONTRIBUTION_MIN_ETH: '0.5',
//     MIN_CONTRIBUTION_FRACTION_DIGITS: '5',
//     MIN_CONTRIBUTION_STEP_ETH: '0.0001',

//     MAX_CONTRIBUTION_MAX_ETH: '5',
//     MAX_CONTRIBUTION_MIN_ETH: '1',
//     MAX_CONTRIBUTION_FRACTION_DIGITS: '5',
//     MAX_CONTRIBUTION_STEP_ETH: '0.1',

//     MAX_TOTAL_RAISED: '0',
//     MIN_TOTAL_RAISED: '0',
//     MAX_TOTAL_RAISED_DIGITS: '5',
//     MAX_TOTAL_RAISED_STEP_ETH: '0.1',

//     END_TIMESTAMP_OFFSET_MIN_SECONDS: 3600,
//     END_TIMESTAMP_OFFSET_MAX_SECONDS: 3600 * 24 * 7,

//     NUM_INVESTORS: 10,

//     IPFS_METADATA_HASH_BASE: 'QmTestHash',
//     TOKEN_NAME_BASE: 'BlockSparkToken',
//     TOKEN_SYMBOL_BASE: 'BST',

//     TIME_TO_JUMP_AFTER_DEADLINE: 3600 * 24,

//     SMALL_CONTRIBUTION_ETH: '0.1',
//     LARGE_CONTRIBUTION_ETH: '2.0',
//     CROSS_BOUNDARY_CONTRIBUTION_ETH: '3',
    
//     FAILED_TO_ECTRACT_CAMPAIDN_ADDRESS_ERROR: "Failed to extract campaign address",

//     CAMPAIGN_STATUS: { ACTIVE: "Active", SUCCESSFUL: "Successful", FAILED: "Failed", FINISHED: "Finished" },

//     parseEth(amount: string){
//         return parseEther(amount);
//     },
// };