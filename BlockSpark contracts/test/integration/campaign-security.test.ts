import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { deployBlockSparkFixture } from "../fixtures/deploy.fixture";
import { CampaignUser } from "../pages/CampaignUser";
import { CampaignHelper } from '../helpers/CampaignHelper';
import { TEST_CONFIG } from '../config';
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { createLogger } from "../utils/logger";
import { claimTokensAndCheck, contributeAndCheck, createInvestors, simulateCampaignOutcome } from '../utils/test-helpers';
import winston from 'winston';
import { formatEther, parseEther } from "ethers";
import { ethers } from "hardhat";

const LOGGER_FILE_NAME = __filename;

/**
 * 🧪 INTEGRATION TESTS: Negative Scenarios & Security
 * 
 * Test Suite covers:
 * - Input validation (min/max contributions, zero values, invalid ranges)
 * - State validation (paused campaign, wrong status transitions)
 * - Security (double-spend attacks, unauthorized access, reentrancy)
 * - Constructor validation (deployment with invalid parameters)
 * - Access control (only creator can pause, only owner can mint)
 * 
 * These tests verify the contract correctly rejects invalid operations
 * and protects against common attack vectors.
 */
describe("Integration -> Negative Scenarios (Reverts & Security)", function () {
  let logger: winston.Logger;

  before(function () {
    logger = createLogger(LOGGER_FILE_NAME);
  });

  beforeEach(async function () {
    const fixture = await loadFixture(deployBlockSparkFixture);
    this.fixture = fixture;
    this.campaignAddress = await fixture.campaign.getAddress();
    this.campaign = fixture.campaign;
    this.campaignHelper = new CampaignHelper(this.campaignAddress, fixture.creator, logger);

    this.investors = fixture.investors;
    this.campaignFactory = fixture.campaignFactory;

    this.creatorUser = new CampaignUser("Creator", fixture.creator, this.campaignAddress, true, logger);
    this.firstInvestor = new CampaignUser("Inv-1", fixture.investors[0], this.campaignAddress, false, logger);

    const tokenAddress = await fixture.campaign.token();
    this.tokenContract = await ethers.getContractAt("BlockSparkToken", tokenAddress);

    this.investorsPool = fixture.investors.map((signer, i) =>
      new CampaignUser(`Pool-Inv-${i}`, signer, this.campaignAddress, false, logger)
    );
  });

  // ════════════════════════════════════════════════════════════════
  // SECTION 1: Double Spend / Reentrancy Protection Tests
  // ════════════════════════════════════════════════════════════════

  it("should prevent double refund attack", async function () {
    logger.info(`\n📋 TEST: Double refund prevention`);

    const minContrib = (await this.campaignHelper.getCampaignInfo()).minContrib;
    const safeAmountEth = formatEther(minContrib);

    await this.firstInvestor.invest(safeAmountEth);

    const endTs = (await this.campaignHelper.getCampaignInfo()).endTs;
    await time.increaseTo(endTs + 1n);
    expect(await this.campaignHelper.getCampaignStatus()).to.equal(TEST_CONFIG.CAMPAIGN_STATUS.FAILED);

    await this.firstInvestor.refund();

    await expect(this.firstInvestor.refund())
      .to.be.revertedWithCustomError(this.campaignHelper.contract, "AlreadyRefunded");

    logger.info(`✅ Double refund prevented`);
  });

  it("should prevent double token claim", async function () {
    logger.info(`\n📋 TEST: Double token claim prevention`);

    await simulateCampaignOutcome(
      logger,
      this.investorsPool,
      this.campaignHelper,
      null,
      TEST_CONFIG.CAMPAIGN_STATUS.SUCCESSFUL
    );

    const richInvestor = this.investorsPool[0];

    await richInvestor.claimTokens();

    await expect(richInvestor.claimTokens())
      .to.be.revertedWithCustomError(this.campaignHelper.contract, "AlreadyTokensClaimed");

    logger.info(`✅ Double claim prevented`);
  });

  it("should prevent token claim for investor with no contribution", async function () {
    logger.info(`\n📋 TEST: Token claim without contribution (NoRewards)`);
    const campaignInfo = await this.campaignHelper.getCampaignInfo(true);

    await expect(
      this.firstInvestor.claimTokens()
    ).to.be.revertedWithCustomError(this.campaignHelper.contract, "InvalidState");

    await expect(
      this.firstInvestor.refund()
    ).to.be.revertedWithCustomError(this.campaignHelper.contract, "InvalidState");

    await expect(
      this.firstInvestor.unpause()
    ).to.be.revertedWithCustomError(this.campaignHelper.contract, "IsNotCreator");

    await expect(
      this.firstInvestor.pause()
    ).to.be.revertedWithCustomError(this.campaignHelper.contract, "IsNotCreator");

    const newInvestors = createInvestors(
      1,
      this.investors,
      this.campaignAddress,
      1,
      logger
    )

    await simulateCampaignOutcome(logger, newInvestors, this.campaignHelper, '1', TEST_CONFIG.CAMPAIGN_STATUS.FAILED);

    await expect(
      this.firstInvestor.invest('1')
    ).to.be.revertedWithCustomError(this.campaignHelper.contract, "InvalidState");

    await expect(
      this.firstInvestor.refund()
    ).to.be.revertedWithCustomError(this.campaignHelper.contract, "NoContribution");

    logger.info(`✅ Token claim prevented for non-contributor`);
  });

  it("should enforce correct state transitions and access control", async function () {
    logger.info(`\n📋 TEST: State transitions and access control`);

    const [deployer] = await ethers.getSigners();
    const pastTime = (await time.latest()) - 100;
    const futureTime = (await time.latest()) + 3600;

    await expect(this.campaignFactory.createCampaign(
      ethers.parseEther("10"),
      ethers.parseEther("0.1"),
      ethers.parseEther("1"),
      pastTime, // ERROR
      "QmHash", "Token", "TKN"
    )).to.be.revertedWithCustomError(this.campaignFactory, "InvalidDeadline");

    await expect(this.campaignFactory.createCampaign(
      ethers.parseEther("10"),
      ethers.parseEther("1"),
      ethers.parseEther("0.5"), // ERROR
      futureTime,
      "QmHash", "Token", "TKN"
    )).to.be.revertedWithCustomError(this.campaignFactory, "InvalidContributionRange");

    await expect(this.campaignFactory.createCampaign(
      ethers.parseEther("10"),
      ethers.parseEther("0.1"),
      0, //ERROR
      futureTime,
      "QmHash", "Token", "TKN"
    )).to.be.revertedWithCustomError(this.campaignFactory, "InvalidMaxZero");

    await expect(this.campaignFactory.createCampaign(
      ethers.parseEther("10"),
      ethers.parseEther("0"), //ERROR
      ethers.parseEther("0.1"),
      futureTime,
      "QmHash", "Token", "TKN"
    )).to.be.revertedWithCustomError(this.campaignFactory, "InvalidMinZero");

    await expect(this.campaignFactory.createCampaign(
      ethers.parseEther("0"), //ERROR
      ethers.parseEther("0.1"),
      ethers.parseEther("0.2"),
      futureTime,
      "QmHash", "Token", "TKN"
    )).to.be.revertedWithCustomError(this.campaignFactory, "InvalidTargetAmount");

    await expect(this.campaignFactory.createCampaign(
      ethers.parseEther("1"),
      ethers.parseEther("2"),
      ethers.parseEther("3"),
      futureTime,
      "QmHash", "Token", "TKN"
    )).to.be.revertedWithCustomError(this.campaignFactory, "InvalidTargetTooLow");
  });


  it("should revert with 'Transfer failed' on refund if investor rejects ETH", async function () {
    // 1. Деплоїмо контракт-саботажник
    const RejectETHFactory = await ethers.getContractFactory("RejectETH");
    const rejector: any = await RejectETHFactory.deploy();
    await rejector.waitForDeployment();
    const rejectorAddress = await rejector.getAddress();

    // 2. Саботажник інвестує в кампанію
    // Ми викликаємо функцію investInCampaign і передаємо ETH (value)
    const investAmount = parseEther("1.0");
    await rejector.investInCampaign(this.campaignAddress, { value: investAmount });

    // Перевіряємо, що інвестиція зарахувалась
    expect(await this.campaign.contributions(rejectorAddress)).to.equal(investAmount);

    // 3. Робимо кампанію провальною (Failed), щоб став доступний Refund
    // Перемотуємо час за межі дедлайну
    const campaignInfo = await this.campaignHelper.getCampaignInfo();
    await time.increaseTo(campaignInfo.endTs + 1n);

    // 4. Викликаємо refund від імені Саботажника
    // Кампанія спробує повернути йому ETH -> Саботажник відповість "Revert" -> success буде false -> "Transfer failed"

    // ВАЖЛИВО: Очікуємо звичайний revert зі строкою, а не Custom Error, 
    // бо require(..., "String") видає саме string.
    await expect(
      rejector.refundFromCampaign(this.campaignAddress)
    ).to.be.revertedWithCustomError(this.campaign, "TransferFailed");
  });

  it("should revert claimFunds with 'Transfer failed' if Creator rejects ETH", async function () {
    const [deployer, investor] = await ethers.getSigners();

    // 1. Деплоїмо "злого" Creator'а (RejectETH)
    const RejectETHFactory = await ethers.getContractFactory("RejectETH");
    const badCreator: any = await RejectETHFactory.deploy();
    await badCreator.waitForDeployment();
    const badCreatorAddress = await badCreator.getAddress();

    // 2. Деплоїмо Кампанію ВРУЧНУ, де creator = badCreatorAddress
    const CampaignFactory = await ethers.getContractFactory("Campaign");
    const target = parseEther("10");
    const futureTime = (await time.latest()) + 3600;

    const campaign = await CampaignFactory.deploy(
      badCreatorAddress, // <--- ОСЬ ГОЛОВНИЙ ТРЮК: Creator це контракт, що не приймає ETH
      target,
      parseEther("0.1"),
      parseEther("100"),
      futureTime,
      "QmHash", "TKN", "T"
    );
    await campaign.waitForDeployment();
    const campaignAddr = await campaign.getAddress();

    // 3. Робимо кампанію Успішною (Successful)
    // Інвестуємо від звичайного юзера, щоб набрати суму
    await campaign.connect(investor).invest({ value: target }); // 10 ETH

    // 4. Злий Creator намагається забрати гроші
    // Ми викликаємо функцію на контракті RejectETH, а він викликає claimFunds на Кампанії

    // ВАЖЛИВО: Очікуємо "Transfer failed", бо Campaign спробує відправити ETH на badCreator,
    // а badCreator спрацює receive() -> revert -> success = false.
    await time.increaseTo(BigInt(futureTime) + 1n);

    await expect(
      (badCreator).claimFundsFromCampaign(campaignAddr)
    ).to.be.revertedWithCustomError(campaign, "TransferFailed");
  });
});