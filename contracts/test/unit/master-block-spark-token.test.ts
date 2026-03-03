import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers";
import { deployBaseFixture } from "../fixtures/deploy.fixture";
import { createCampaign } from "../helpers/state-helpers";
import { createLogger } from "../utils/logger";

describe("Unit | MasterBlockSparkToken", () => {
    const log = createLogger(__filename);

    // ─── Master protection ────────────────────────────────────────────────

    describe("master: _disableInitializers protection", () => {
        it("should revert initialize() on master contract", async () => {
            const { masterBlockSparkToken, owner } = await loadFixture(deployBaseFixture);

            await expect(
                masterBlockSparkToken.initialize("Hack", "HCK", owner.address)
            ).to.be.revertedWithCustomError(masterBlockSparkToken, "InvalidInitialization");

            log.info("✅ master initialize blocked");
        });

        it("should revert mint() on master contract (owner is dead address)", async () => {
            const { masterBlockSparkToken, owner } = await loadFixture(deployBaseFixture);

            // Master має owner = 0xdead (з Ownable constructor) або заблокований
            // В будь-якому випадку mint не повинен пройти
            await expect(
                masterBlockSparkToken.mint(owner.address, parseEther("1"))
            ).to.be.revertedWithCustomError(masterBlockSparkToken, "OwnableUnauthorizedAccount");

            log.info("✅ master mint blocked");
        });
    });

    // ─── Clone: initialize ────────────────────────────────────────────────

    describe("clone: initialize", () => {
        it("should set name, symbol, owner correctly after initialize", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const { token, campaign } = await createCampaign(factory, creator, "STANDARD");

            expect(await token.name()).to.equal("BlockSpark Token");
            expect(await token.symbol()).to.equal("BST");
            expect(await token.decimals()).to.equal(18);
            expect(await token.owner()).to.equal(await campaign.getAddress());
            expect(await token.totalSupply()).to.equal(0n);

            log.info("✅ clone initialized correctly");
        });

        it("should revert second initialize() — double-init attack", async () => {
            const { factory, creator, owner } = await loadFixture(deployBaseFixture);
            const { token } = await createCampaign(factory, creator, "STANDARD");

            await expect(
                token.initialize("Hack", "HCK", owner.address)
            ).to.be.revertedWithCustomError(token, "InvalidInitialization");

            log.info("✅ double-init blocked on clone");
        });
    });

    // ─── Clone: mint ──────────────────────────────────────────────────────

    describe("clone: mint", () => {
        it("should allow owner (campaign) to mint and emit Transfer", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const { token, campaignAddress } = await createCampaign(factory, creator, "STANDARD");

            // Impersonate campaign address — вона є owner токена
            await ethers.provider.send("hardhat_impersonateAccount", [campaignAddress]);
            await ethers.provider.send("hardhat_setBalance", [campaignAddress, "0x" + parseEther("1").toString(16)]);
            const campaignSigner = await ethers.getSigner(campaignAddress);

            const mintAmount = parseEther("500");

            await expect(token.connect(campaignSigner).mint(investors[0].address, mintAmount))
                .to.emit(token, "Transfer")
                .withArgs(ethers.ZeroAddress, investors[0].address, mintAmount);

            expect(await token.balanceOf(investors[0].address)).to.equal(mintAmount);
            expect(await token.totalSupply()).to.equal(mintAmount);

            await ethers.provider.send("hardhat_stopImpersonatingAccount", [campaignAddress]);
            log.info("✅ mint by owner emits Transfer");
        });

        it("should revert mint() from non-owner (creator)", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const { token } = await createCampaign(factory, creator, "STANDARD");

            await expect(
                token.connect(creator).mint(creator.address, parseEther("1"))
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount")
             .withArgs(creator.address);

            log.info("✅ mint by non-owner reverts");
        });

        it("should revert mint() from random investor", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const { token } = await createCampaign(factory, creator, "STANDARD");

            await expect(
                token.connect(investors[0]).mint(investors[0].address, parseEther("1"))
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");

            log.info("✅ mint by investor reverts");
        });
    });

    // ─── Clone: ownership ─────────────────────────────────────────────────

    describe("clone: ownership", () => {
        it("should have campaign as owner — not factory, not creator", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const { token, campaignAddress } = await createCampaign(factory, creator, "STANDARD");
            const factoryAddress = await factory.getAddress();

            expect(await token.owner()).to.equal(campaignAddress);
            expect(await token.owner()).to.not.equal(factoryAddress);
            expect(await token.owner()).to.not.equal(creator.address);

            log.info("✅ token owner is campaign");
        });

        it("should revert transferOwnership from non-owner", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const { token } = await createCampaign(factory, creator, "STANDARD");

            await expect(
                token.connect(investors[0]).transferOwnership(investors[0].address)
            ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");

            log.info("✅ transferOwnership by non-owner reverts");
        });
    });

    // ─── Clone: storage isolation ─────────────────────────────────────────

    describe("clone: each clone has independent storage", () => {
        it("two clones have different addresses and independent name/symbol", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const c1 = await createCampaign(factory, creator, "STANDARD");
            const c2 = await createCampaign(factory, creator, "MINIMAL");

            expect(c1.tokenAddress).to.not.equal(c2.tokenAddress);
            expect(await c1.token.name()).to.equal("BlockSpark Token");
            expect(await c2.token.name()).to.equal("Minimal BlockSpark Token");
            expect(await c1.token.symbol()).to.equal("BST");
            expect(await c2.token.symbol()).to.equal("MBSP");

            log.info("✅ token clones are independent");
        });
    });
});
