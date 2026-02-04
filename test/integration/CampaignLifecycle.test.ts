// test/integration/CampaignLifecycle.test.ts
import { expect } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { deployBlockSparkFixture } from "../fixtures/deploy.fixture";

describe("Campaign → базове розгортання", function () {
    it("fixture успішно розгортає factory + campaign + token", async function () {
        const { 
            campaignFactory, 
            campaign, 
            token, 
            creator, 
            params, 
            campaignAddress,
            tokenAddress 
        } = await loadFixture(deployBlockSparkFixture);

        // Базові перевірки
        expect(await campaignFactory.getDeployedCampaigns()).to.include(campaignAddress);

        expect(await campaign.creator()).to.equal(await creator.getAddress());
        expect(await campaign.targetAmount()).to.equal(params.targetAmount);
        expect(await campaign.endTimestamp()).to.equal(params.endTimestamp);

        expect(await token.name()).to.equal(params.tokenName);
        expect(await token.symbol()).to.equal(params.tokenSymbol);

        // Перевірка, що токен прив'язаний саме до цієї кампанії
        expect(await token.owner()).to.equal(campaignAddress);   // бо в конструкторі Campaign передано address(this)

        console.log("✓ Fixture успішно виконався, всі основні перевірки пройшли");
    });
});