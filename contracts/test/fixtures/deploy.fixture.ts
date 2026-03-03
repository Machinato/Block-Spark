import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
    CampaignFactory,
    MasterCampaign,
    MasterBlockSparkToken,
} from "../../typechain-types";
import { NUM_INVESTORS } from "../config";

export type BaseFixture = {
    factory: CampaignFactory,
    masterCampaign: MasterCampaign,
    masterBlockSparkToken: MasterBlockSparkToken,
    creator: HardhatEthersSigner,
    owner: HardhatEthersSigner,
    investors: HardhatEthersSigner[]
}

export async function deployBaseFixture(): Promise<BaseFixture> {
    const [owner, creator, ...rest]: HardhatEthersSigner[] = await ethers.getSigners();
    const investors = rest.slice(0, NUM_INVESTORS);

    const masterBlockSparkToken: MasterBlockSparkToken = await ethers
        .getContractFactory("MasterBlockSparkToken")
        .then(f => f.deploy())
        .then(f => f.waitForDeployment());

    const masterCampaign: MasterCampaign = await ethers
        .getContractFactory("MasterCampaign")
        .then(f => f.deploy())
        .then(f => f.waitForDeployment());

    const campaignFactory = await ethers.getContractFactory("CampaignFactory");
    const factory = await campaignFactory.deploy(
        await masterCampaign.getAddress(),
        await masterBlockSparkToken.getAddress()
    );

    await factory.waitForDeployment();

    return { factory, masterCampaign, masterBlockSparkToken, owner, creator, investors };
}