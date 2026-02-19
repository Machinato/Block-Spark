import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { deployBlockSparkFixture } from "../fixtures/deploy.fixture"
import { CampaignUser } from "../pages/CampaignUser";
import { faker } from "@faker-js/faker";
import { parseEther, formatEther } from 'ethers';
import { CampaignHelper } from '../helpers/CampaignHelper';
import { TEST_CONFIG } from '../config';
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { createLogger } from "../utils/logger";
import winston from 'winston';
import { createInvestors, contributeAndCheck, refundAndCheck, claimTokensAndCheck, simulateCampaignOutcome } from '../utils/test-helpers';

const LOGGER_FILE_NAME = __filename;

/**
 * 🧪 INTEGRATION TESTS: Campaign Basic Flow
 * 
 * Test Suite covers:
 * 1. Single investor contribution and state updates
 * 2. Multiple investors → Failed campaign → Refunds
 * 3. Multiple investors → Successful campaign → Token distribution + Fund claim
 * 
 * These tests verify the complete happy path and basic failure scenarios
 * of the campaign lifecycle.
 */
describe("integration. Campaign -> Basic Flow (Investment & State Update)", function () {
    const logger: winston.Logger = createLogger(LOGGER_FILE_NAME);

    beforeEach(async function () {
        const fixture = await loadFixture(deployBlockSparkFixture);

        this.fixture = fixture;
        this.creator = fixture.creator;
        this.investors = fixture.investors;
        this.campaignAddress = await fixture.campaign.getAddress();

        this.creatorUser = new CampaignUser(
            `${faker.person.firstName()}-Creator`,
            this.creator,
            this.campaignAddress,
            true,
            logger
        )

        this.firstInvestor = new CampaignUser(
            `${faker.person.firstName()}`,
            this.investors[0],
            this.campaignAddress,
            false,
            logger
        )

        this.campaignHelper = new CampaignHelper(this.campaignAddress, this.creator, logger)

        await this.creatorUser.getUserInfo(true);
        await this.firstInvestor.getUserInfo(true);

        logger.info("→ beforeEach: fresh campaign deployed at " + this.campaignAddress);
    });
    it("allows a single investor to contribute ETH and updates state correctly", async function () {
        logger.info(`\n═══════════════════════════════════════════════════════`);
        logger.info(`TEST 1: Single Investor Contribution & State Updates`);
        logger.info(`═══════════════════════════════════════════════════════\n`);

        const contributionAmountEth = "1"; //ETH
        const amountWei = parseEther(contributionAmountEth);

        //

        const initialRaised: bigint = await this.campaignHelper.getTotalRaised();
        expect(initialRaised).to.equal(0n);
        logger.info(`Initial raised: ${initialRaised}`);

        const initialStatus = await this.campaignHelper.getCampaignStatus();
        expect(initialStatus).to.equal(TEST_CONFIG.CAMPAIGN_STATUS.ACTIVE);
        logger.info(`Initial status: ${initialStatus}`);

        //

        await this.firstInvestor.invest(contributionAmountEth);

        //

        const totalRaisedAfterDonation: bigint = await this.campaignHelper.getTotalRaised();
        expect(totalRaisedAfterDonation).to.equal(amountWei);

        const firstUserContribution: bigint = (await this.firstInvestor.getUserInfo(true)).investedAmount;
        expect(firstUserContribution).to.equal(amountWei);

        const expectedPendingRewards = await this.campaignHelper.calculateTokenAmount(amountWei);
        expect(expectedPendingRewards).to.be.gt(0n);


        const pendingRewards: bigint = (await this.firstInvestor.getUserInfo()).pendingRewards;
        expect(pendingRewards).to.equal(expectedPendingRewards);

        const Status = await this.campaignHelper.getCampaignStatus();
        expect(Status).to.equal(TEST_CONFIG.CAMPAIGN_STATUS.ACTIVE);

        await this.campaignHelper.getCampaignInfo();

        await time.increaseTo(((await this.campaignHelper.getCampaignInfo()).endTs + BigInt(1)));

        const statusAfterDeadline = await this.campaignHelper.getCampaignStatus();
        expect(statusAfterDeadline).to.equal(TEST_CONFIG.CAMPAIGN_STATUS.FAILED);

        logger.info("✓ TEST 1 passed");
    });
    it("allows multiple investors to contribute and finish campaign as FAILED", async function () {
        logger.info(`\n═══════════════════════════════════════════════════════`);
        logger.info(`TEST 2: Multiple Investors → Failed Campaign → Refunds`);
        logger.info(`═══════════════════════════════════════════════════════\n`);

        const newInvestors = createInvestors(
            3,
            this.investors,
            this.campaignAddress,
            1,
            logger
        )

        await simulateCampaignOutcome(
            logger,
            [this.firstInvestor, ...newInvestors],
            this.campaignHelper,
            "1",
            TEST_CONFIG.CAMPAIGN_STATUS.FAILED
        );

        await refundAndCheck([...newInvestors, this.firstInvestor], this.campaignHelper, logger);

        logger.info("✓ TEST 2 passed");
    });
    it("allow a few investors to contribute ETH and finish campaign succsessfully", async function () {
        logger.info(`\n═══════════════════════════════════════════════════════`);
        logger.info(`TEST 3: Successful Campaign → Token Distribution → Fund Claim`);
        logger.info(`═══════════════════════════════════════════════════════\n`);

        const campaignInfo = await this.campaignHelper.getCampaignInfo(true);
        const contributionAmountEth = formatEther(campaignInfo.maxContrib); //ETH
        logger.info(`Contribution amount ETH: ${contributionAmountEth}`);

        const neededInvestors: number = Math.ceil(Number(campaignInfo.target) / Number(campaignInfo.maxContrib));
        logger.info(`Needed investors: ${neededInvestors}`);

        const newInvestors = createInvestors(
            neededInvestors,
            this.investors,
            this.campaignAddress,
            1,
            logger
        )

        //

        await simulateCampaignOutcome(
            logger,
            [this.firstInvestor, ...newInvestors],
            this.campaignHelper,
            null,
            TEST_CONFIG.CAMPAIGN_STATUS.SUCCESSFUL
        );

        //

        await claimTokensAndCheck([...newInvestors, this.firstInvestor], this.campaignHelper, logger);

        await expect(this.creatorUser.claimTokens()).to.be.revertedWithCustomError(this.campaignHelper.contract, "NoRewards");

        await this.creatorUser.claimFunds();
        expect(await this.campaignHelper.isFundsClaimed()).equal(true);

        await expect(this.creatorUser.claimFunds()).to.be.revertedWithCustomError(this.campaignHelper.contract, "InvalidState").withArgs(1, 3);

        logger.info("✓ TEST 3 passed");
    });
});