import { ethers } from "hardhat";
import { EventLog } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { CampaignFactory, MasterCampaign, MasterBlockSparkToken } from "../../typechain-types";
import { campaignParams, PresetKey } from "../config";

export type CreatedCampaign = {
    campaign:        MasterCampaign;
    token:           MasterBlockSparkToken;
    campaignAddress: string;
    tokenAddress:    string;
    targetAmount:    bigint;
    minContribution: bigint;
    maxContribution: bigint;
    endTimestamp:    bigint;
};

export async function createCampaign(
    factory: CampaignFactory,
    creator: HardhatEthersSigner,
    preset: PresetKey = "STANDARD",
    offsetSeconds?: any
): Promise<CreatedCampaign> {
    const p  = await campaignParams(preset, offsetSeconds);
    const tx = await factory.connect(creator).createCampaign(
        p.targetAmount,
        p.minContribution,
        p.maxContribution,
        p.endTimestamp,
        p.ipfsHash,
        p.tokenName,
        p.tokenSymbol,
    );
    const receipt = await tx.wait();

    const event = receipt?.logs.find(
        (l): l is EventLog => "fragment" in l && l.fragment.name === "CampaignCreated"
    );
    if (!event) throw new Error("CampaignCreated event not found");

    const campaignAddress = event.args[0] as string;
    const tokenAddress    = event.args[1] as string;

    const campaign = await ethers.getContractAt("MasterCampaign", campaignAddress) as MasterCampaign;
    const token    = await ethers.getContractAt("MasterBlockSparkToken", tokenAddress) as MasterBlockSparkToken;

    return {
        campaign,
        token,
        campaignAddress,
        tokenAddress,
        targetAmount:    p.targetAmount,
        minContribution: p.minContribution,
        maxContribution: p.maxContribution,
        endTimestamp:    p.endTimestamp,
    };
}

export async function fundCampaignToSuccess(
    c: CreatedCampaign,
    investors: HardhatEthersSigner[],
): Promise<HardhatEthersSigner[]> {
    const { campaign, targetAmount, maxContribution } = c;
    let raised = 0n;
    const participants: HardhatEthersSigner[] = [];

    for (const investor of investors) {
        if (raised >= targetAmount) break;
        const remaining  = targetAmount - raised;
        const contribution = remaining < maxContribution ? remaining : maxContribution;
        await campaign.connect(investor).invest({ value: contribution });
        raised += contribution;
        participants.push(investor);
    }

    if (raised < targetAmount) {
        throw new Error(`Not enough investors to reach target. Raised: ${raised}, Target: ${targetAmount}`);
    }

    return participants;
}


export async function expireCampaign(c: CreatedCampaign): Promise<void> {
    await time.increaseTo(c.endTimestamp + 1n);
}

export async function makeCampaignSuccessful(
    c: CreatedCampaign,
    investors: HardhatEthersSigner[],
): Promise<HardhatEthersSigner[]> {
    const participants = await fundCampaignToSuccess(c, investors);
    await expireCampaign(c);
    return participants;
}

export async function makeCampaignFailed(
    c: CreatedCampaign,
    investor: HardhatEthersSigner,
): Promise<void> {
    // Вносимо менше ніж target (тільки один внесок по min)
    await c.campaign.connect(investor).invest({ value: c.minContribution });
    await expireCampaign(c);
}
