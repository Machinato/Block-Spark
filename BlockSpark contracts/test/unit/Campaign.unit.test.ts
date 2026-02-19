import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { deployBlockSparkFixture } from "../fixtures/deploy.fixture";
import { CampaignUser } from "../pages/CampaignUser";
import { CampaignHelper } from '../helpers/CampaignHelper';
import { createLogger } from "../utils/logger";
import { formatEther, parseEther } from "ethers";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";

const LOGGER_FILE_NAME = __filename;

/**
 * 🧪 UNIT TESTS: Campaign Contract
 * 
 * Tests individual functions in isolation:
 * - Constructor validation
 * - Contribution validation (min/max)
 * - Access control (onlyCreator)
 * - Pause/unpause functionality
 * - State checks
 */
describe("Unit → Campaign Contract", function () {
  const logger = createLogger(LOGGER_FILE_NAME);

  beforeEach(async function () {
    const fixture = await loadFixture(deployBlockSparkFixture);
    this.campaign = fixture.campaign;
    this.campaignAddress = await fixture.campaign.getAddress();
    this.campaignHelper = new CampaignHelper(this.campaignAddress, fixture.creator, logger);
    this.creator = fixture.creator;
    this.investors = fixture.investors;
    
    this.creatorUser = new CampaignUser(
      "Creator",
      fixture.creator,
      this.campaignAddress,
      true,
      logger
    );

    this.investorUser = new CampaignUser(
      "Investor-1",
      fixture.investors[0],
      this.campaignAddress,
      false,
      logger
    );
  });

  describe("Constructor Validation", function () {
    
    it("should revert if deadline is in the past", async function () {
      const [deployer] = await ethers.getSigners();
      const CampaignContract = await ethers.getContractFactory("Campaign");
      const pastTimestamp = (await time.latest()) - 100;

      await expect(
        CampaignContract.deploy(
          deployer.address,
          parseEther("10"),
          parseEther("0.1"),
          parseEther("1"),
          pastTimestamp,
          "QmHash", "Token", "TKN"
        )
      ).to.be.revertedWithCustomError(CampaignContract, "InvalidDeadline");
    });

    it("should revert if maxContribution <= minContribution", async function () {
      const [deployer] = await ethers.getSigners();
      const CampaignContract = await ethers.getContractFactory("Campaign");
      const futureTimestamp = (await time.latest()) + 3600;

      await expect(
        CampaignContract.deploy(
          deployer.address,
          parseEther("10"),
          parseEther("1"),
          parseEther("0.5"),
          futureTimestamp,
          "QmHash", "Token", "TKN"
        )
      ).to.be.revertedWithCustomError(CampaignContract, "InvalidContributionRange");
    });

    it("should revert if maxContribution is zero", async function () {
      const [deployer] = await ethers.getSigners();
      const CampaignContract = await ethers.getContractFactory("Campaign");
      const futureTimestamp = (await time.latest()) + 3600;

      await expect(
        CampaignContract.deploy(
          deployer.address,
          parseEther("10"),
          parseEther("0.1"),
          0,
          futureTimestamp,
          "QmHash", "Token", "TKN"
        )
      ).to.be.revertedWithCustomError(CampaignContract, "InvalidMaxZero");
    });

    it("should revert if minContribution is zero", async function () {
      const [deployer] = await ethers.getSigners();
      const CampaignContract = await ethers.getContractFactory("Campaign");
      const futureTimestamp = (await time.latest()) + 3600;

      await expect(
        CampaignContract.deploy(
          deployer.address,
          parseEther("10"),
          0,
          parseEther("1"),
          futureTimestamp,
          "QmHash", "Token", "TKN"
        )
      ).to.be.revertedWithCustomError(CampaignContract, "InvalidMinZero");
    });

    it("should revert if targetAmount is zero", async function () {
      const [deployer] = await ethers.getSigners();
      const CampaignContract = await ethers.getContractFactory("Campaign");
      const futureTimestamp = (await time.latest()) + 3600;

      await expect(
        CampaignContract.deploy(
          deployer.address,
          0,
          parseEther("0.1"),
          parseEther("1"),
          futureTimestamp,
          "QmHash", "Token", "TKN"
        )
      ).to.be.revertedWithCustomError(CampaignContract, "InvalidTargetAmount");
    });

    it("should revert if targetAmount < minContribution", async function () {
      const [deployer] = await ethers.getSigners();
      const CampaignContract = await ethers.getContractFactory("Campaign");
      const futureTimestamp = (await time.latest()) + 3600;

      await expect(
        CampaignContract.deploy(
          deployer.address,
          parseEther("1"),
          parseEther("2"),
          parseEther("3"),
          futureTimestamp,
          "QmHash", "Token", "TKN"
        )
      ).to.be.revertedWithCustomError(CampaignContract, "InvalidTargetTooLow");
    });
  });

  describe("Contribution Validation", function () {
    
    it("should revert contribution below minimum", async function () {
      const campaignInfo = await this.campaignHelper.getCampaignInfo();
      const tooSmallWei = campaignInfo.minContrib - 1n;
      const tooSmallEth = formatEther(tooSmallWei);

      await expect(
        this.investorUser.invest(tooSmallEth)
      ).to.be.revertedWithCustomError(this.campaign, "ContributionOutOfRange");
    });

    it("should revert contribution above maximum", async function () {
      const campaignInfo = await this.campaignHelper.getCampaignInfo();
      const tooBigWei = campaignInfo.maxContrib + 1n;
      const tooBigEth = formatEther(tooBigWei);

      await expect(
        this.investorUser.invest(tooBigEth)
      ).to.be.revertedWithCustomError(this.campaign, "ContributionOutOfRange");
    });

    it("should accept contribution within valid range", async function () {
      const campaignInfo = await this.campaignHelper.getCampaignInfo();
      const validAmountEth = formatEther(campaignInfo.minContrib);

      await this.investorUser.invest(validAmountEth);

      const userContribution = await this.campaign.contributions(
        await this.investorUser.getAddress()
      );
      expect(userContribution).to.equal(campaignInfo.minContrib);
    });
  });

  describe("Access Control", function () {
    
    it("should allow only creator to pause", async function () {
      await expect(
        this.investorUser.pause()
      ).to.be.revertedWithCustomError(this.campaign, "IsNotCreator");

      await expect(
        this.creatorUser.pause()
      ).to.not.be.reverted;
    });

    it("should allow only creator to unpause", async function () {
      await this.creatorUser.pause();

      await expect(
        this.investorUser.unpause()
      ).to.be.revertedWithCustomError(this.campaign, "IsNotCreator");

      await expect(
        this.creatorUser.unpause()
      ).to.not.be.reverted;
    });

    it("should allow only creator to claim funds", async function () {
      await expect(
        this.investorUser.claimFunds()
      ).to.be.revertedWithCustomError(this.campaign, "IsNotCreator");
    });
  });

  describe("Pause Functionality", function () {
    
    it("should block investments when paused", async function () {
      const campaignInfo = await this.campaignHelper.getCampaignInfo();
      const validAmountEth = formatEther(campaignInfo.minContrib);
      
      await this.creatorUser.pause();

      await expect(
        this.investorUser.invest(validAmountEth)
      ).to.be.revertedWithCustomError(this.campaign, "CampaignPaused");
    });

    it("should allow investments after unpause", async function () {
      const campaignInfo = await this.campaignHelper.getCampaignInfo();
      const validAmountEth = formatEther(campaignInfo.minContrib);
      
      await this.creatorUser.pause();
      await this.creatorUser.unpause();

      await expect(
        this.investorUser.invest(validAmountEth)
      ).to.not.be.reverted;
    });
  });

  describe("State Validation", function () {
    
    it("should revert token claim during ACTIVE state", async function () {
      await expect(
        this.investorUser.claimTokens()
      ).to.be.revertedWithCustomError(this.campaign, "InvalidState");
    });

    it("should revert refund during ACTIVE state", async function () {
      await expect(
        this.investorUser.refund()
      ).to.be.revertedWithCustomError(this.campaign, "InvalidState");
    });

    it("should revert contribution after campaign ends", async function () {
      const campaignInfo = await this.campaignHelper.getCampaignInfo();
      
      await time.increaseTo(campaignInfo.endTs + 1n);

      const validAmountEth = formatEther(campaignInfo.minContrib);
      
      await expect(
        this.investorUser.invest(validAmountEth)
      ).to.be.revertedWithCustomError(this.campaign, "InvalidState");
    });
  });
});