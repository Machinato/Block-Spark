import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { formatEther, parseEther } from "ethers";
import { createLogger } from "../utils/logger";

const LOGGER_FILE_NAME = __filename;

/**
 * 🧪 UNIT TESTS: BlockSparkToken Contract
 * 
 * Tests ERC20 token functionality and access control
 */
describe("Unit → BlockSparkToken Contract", function () {
  const logger = createLogger(LOGGER_FILE_NAME);

  async function deployTokenFixture() {
    const [owner, user1, user2] = await ethers.getSigners();
    const TokenFactory = await ethers.getContractFactory("BlockSparkToken");
    const token = await TokenFactory.deploy("BlockSpark Token", "BST", owner.address);
    await token.waitForDeployment();

    return { token, owner, user1, user2 };
  }

  describe("ERC20 Standard Compliance", function () {
    
    it("should have correct name and symbol", async function () {
      const { token } = await loadFixture(deployTokenFixture);

      expect(await token.name()).to.equal("BlockSpark Token");
      expect(await token.symbol()).to.equal("BST");
      logger.info(`[ERC20 Check] Name: BlockSpark Token, Symbol: BST`);
    });

    it("should have 18 decimals", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.decimals()).to.equal(18);
      logger.info(`[ERC20 Check] Decimals: 18`);
    });

    it("should start with zero total supply", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.totalSupply()).to.equal(0);
      logger.info(`[ERC20 Check] Initial supply: 0`);
    });
  });

  describe("Minting", function () {
    
    it("should allow owner to mint", async function () {
      const { token, owner, user1 } = await loadFixture(deployTokenFixture);
      const mintAmount = parseEther("100");

      await expect(
        token.connect(owner).mint(user1.address, mintAmount)
      ).to.not.be.reverted;

      expect(await token.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await token.totalSupply()).to.equal(mintAmount);
      logger.info(`[Mint Check] Owner minted ${formatEther(mintAmount)} to ${user1.address.slice(0, 6)}...`);
    });

    it("should revert if non-owner tries to mint", async function () {
      const { token, user1, user2 } = await loadFixture(deployTokenFixture);
      const mintAmount = parseEther("100");

      await expect(
        token.connect(user1).mint(user2.address, mintAmount)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
        .withArgs(user1.address);
      logger.info(`[Mint Check] Non-owner mint reverted for ${user1.address.slice(0, 6)}...`);
    });

    it("should emit Transfer event on mint", async function () {
      const { token, owner, user1 } = await loadFixture(deployTokenFixture);
      const mintAmount = parseEther("100");

      await expect(
        token.connect(owner).mint(user1.address, mintAmount)
      ).to.emit(token, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, mintAmount);
      logger.info(`[Mint Event] Transfer emitted for ${formatEther(mintAmount)} from zero to ${user1.address.slice(0, 6)}...`);
    });
  });

  describe("Ownership", function () {
    
    it("should have correct initial owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.owner()).to.equal(owner.address);
      logger.info(`[Ownership Check] Initial owner: ${owner.address.slice(0, 6)}...`);
    });

    it("should allow owner transfer", async function () {
      const { token, owner, user1 } = await loadFixture(deployTokenFixture);

      await token.connect(owner).transferOwnership(user1.address);
      expect(await token.owner()).to.equal(user1.address);
      logger.info(`[Ownership Check] Transferred to ${user1.address.slice(0, 6)}...`);
    });

    it("should revert ownership transfer from non-owner", async function () {
      const { token, user1, user2 } = await loadFixture(deployTokenFixture);

      await expect(
        token.connect(user1).transferOwnership(user2.address)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
      logger.info(`[Ownership Check] Non-owner transfer reverted for ${user1.address.slice(0, 6)}...`);
    });
  });
});