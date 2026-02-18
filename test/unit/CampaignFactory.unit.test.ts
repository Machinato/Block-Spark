import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { parseEther } from "ethers";
import { createLogger } from "../utils/logger";

const LOGGER_FILE_NAME = __filename;

/**
 * 🧪 UNIT TESTS: CampaignFactory Contract
 * 
 * Tests factory creation and validation logic:
 * - Campaign creation with valid parameters
 * - Parameter validation (deadline, ranges, zero values)
 * - Campaign registry tracking
 */
describe("Unit → CampaignFactory Contract", function () {
  const logger = createLogger(LOGGER_FILE_NAME);

  async function deployCampaignFactoryFixture() {
    const [deployer, creator1, creator2] = await ethers.getSigners();
    const CampaignFactory = await ethers.getContractFactory("CampaignFactory");
    const factory = await CampaignFactory.deploy();
    await factory.waitForDeployment();

    return { factory, deployer, creator1, creator2 };
  }

  describe("Campaign Creation", function () {
    
    it("should create campaign with valid parameters", async function () {
      const { factory, creator1 } = await loadFixture(deployCampaignFactoryFixture);
      const futureTimestamp = (await time.latest()) + 3600;

      await expect(
        factory.connect(creator1).createCampaign(
          parseEther("10"),
          parseEther("0.1"),
          parseEther("1"),
          futureTimestamp,
          "QmHash",
          "TestToken",
          "TTK"
        )
      ).to.emit(factory, "CampaignCreated");
      logger.info(`[Creation Check] Campaign created with target 10 ETH, min 0.1, max 1`);
    });

    it("should revert with past deadline", async function () {
      const { factory, creator1 } = await loadFixture(deployCampaignFactoryFixture);
      const pastTimestamp = (await time.latest()) - 100;

      await expect(
        factory.connect(creator1).createCampaign(
          parseEther("10"),
          parseEther("0.1"),
          parseEther("1"),
          pastTimestamp,
          "QmHash",
          "Token",
          "TKN"
        )
      ).to.be.revertedWithCustomError(factory, "InvalidDeadline");
      logger.info(`[Validation Check] Revert on past deadline`);
    });

    it("should revert with invalid contribution range", async function () {
      const { factory, creator1 } = await loadFixture(deployCampaignFactoryFixture);
      const futureTimestamp = (await time.latest()) + 3600;

      await expect(
        factory.connect(creator1).createCampaign(
          parseEther("10"),
          parseEther("1"),
          parseEther("0.5"),
          futureTimestamp,
          "QmHash",
          "Token",
          "TKN"
        )
      ).to.be.revertedWithCustomError(factory, "InvalidContributionRange");
      logger.info(`[Validation Check] Revert on min > max contribution`);
    });

    it("should revert with zero maxContribution", async function () {
      const { factory, creator1 } = await loadFixture(deployCampaignFactoryFixture);
      const futureTimestamp = (await time.latest()) + 3600;

      await expect(
        factory.connect(creator1).createCampaign(
          parseEther("10"),
          parseEther("0.1"),
          0,
          futureTimestamp,
          "QmHash",
          "Token",
          "TKN"
        )
      ).to.be.revertedWithCustomError(factory, "InvalidMaxZero");
      logger.info(`[Validation Check] Revert on zero maxContribution`);
    });

    it("should revert with zero minContribution", async function () {
      const { factory, creator1 } = await loadFixture(deployCampaignFactoryFixture);
      const futureTimestamp = (await time.latest()) + 3600;

      await expect(
        factory.connect(creator1).createCampaign(
          parseEther("10"),
          0,
          parseEther("1"),
          futureTimestamp,
          "QmHash",
          "Token",
          "TKN"
        )
      ).to.be.revertedWithCustomError(factory, "InvalidMinZero");
      logger.info(`[Validation Check] Revert on zero minContribution`);
    });

    it("should revert with zero targetAmount", async function () {
      const { factory, creator1 } = await loadFixture(deployCampaignFactoryFixture);
      const futureTimestamp = (await time.latest()) + 3600;

      await expect(
        factory.connect(creator1).createCampaign(
          0,
          parseEther("0.1"),
          parseEther("1"),
          futureTimestamp,
          "QmHash",
          "Token",
          "TKN"
        )
      ).to.be.revertedWithCustomError(factory, "InvalidTargetAmount");
      logger.info(`[Validation Check] Revert on zero targetAmount`);
    });

    it("should revert with targetAmount < minContribution", async function () {
      const { factory, creator1 } = await loadFixture(deployCampaignFactoryFixture);
      const futureTimestamp = (await time.latest()) + 3600;

      await expect(
        factory.connect(creator1).createCampaign(
          parseEther("1"),
          parseEther("2"),
          parseEther("3"),
          futureTimestamp,
          "QmHash",
          "Token",
          "TKN"
        )
      ).to.be.revertedWithCustomError(factory, "InvalidTargetTooLow");
      logger.info(`[Validation Check] Revert on target < minContribution`);
    });
  });
});