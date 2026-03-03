import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { deployBaseFixture } from "../fixtures/deploy.fixture";
import { createCampaign } from "../helpers/state-helpers";
import { campaignParams, futureTimestamp, PRESETS } from "../config";
import { createLogger } from "../utils/logger";

describe("Unit | CampaignFactory", () => {
    const log = createLogger(__filename);

    // ─── Constructor ──────────────────────────────────────────────────────

    describe("constructor", () => {
        it("should store masterCampaign and masterBlockSparkToken correctly", async () => {
            const { factory, masterCampaign, masterBlockSparkToken } = await loadFixture(deployBaseFixture);

            expect(await factory.masterCampaign()).to.equal(await masterCampaign.getAddress());
            expect(await factory.masterBlockSparkToken()).to.equal(await masterBlockSparkToken.getAddress());

            log.info("✅ constructor stores master addresses");
        });

        it("should revert when masterCampaign is zero address", async () => {
            const { masterBlockSparkToken } = await loadFixture(deployBaseFixture);
            const F = await ethers.getContractFactory("CampaignFactory");

            await expect(
                F.deploy(ethers.ZeroAddress, await masterBlockSparkToken.getAddress())
            ).to.be.revertedWithCustomError(F, "InvalidMasterAddress");

            log.info("✅ zero masterCampaign reverts");
        });

        it("should revert when masterBlockSparkToken is zero address", async () => {
            const { masterCampaign } = await loadFixture(deployBaseFixture);
            const F = await ethers.getContractFactory("CampaignFactory");

            await expect(
                F.deploy(await masterCampaign.getAddress(), ethers.ZeroAddress)
            ).to.be.revertedWithCustomError(F, "InvalidMasterAddress");

            log.info("✅ zero masterBlockSparkToken reverts");
        });
    });

    // ─── createCampaign: happy path ───────────────────────────────────────

    describe("createCampaign: happy path", () => {
        it("should emit CampaignCreated with all correct arguments", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const p = await campaignParams("STANDARD");

            const tx = await factory.connect(creator).createCampaign(
                p.targetAmount, p.minContribution, p.maxContribution,
                p.endTimestamp, p.ipfsHash, p.tokenName, p.tokenSymbol,
            );

            await expect(tx).to.emit(factory, "CampaignCreated")
                .withArgs(
                    // campaignAddress — динамічна, перевіряємо що це валідна адреса
                    (addr: string) => ethers.isAddress(addr),
                    // tokenAddress — теж динамічна
                    (addr: string) => ethers.isAddress(addr),
                    creator.address,
                    p.targetAmount,
                    p.minContribution,
                    p.maxContribution,
                    p.endTimestamp,
                    p.ipfsHash,
                    p.tokenName,
                    p.tokenSymbol,
                );

            log.info("✅ CampaignCreated emitted with correct args");
        });

        it("should register campaign in isCampaign mapping", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const { campaignAddress } = await createCampaign(factory, creator);

            expect(await factory.isCampaign(campaignAddress)).to.equal(true);
            log.info("✅ campaign registered in isCampaign");
        });

        it("should append to campaigns array and increment getCampaignsCount", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);

            expect(await factory.getCampaignsCount()).to.equal(0n);

            const { campaignAddress } = await createCampaign(factory, creator);

            expect(await factory.getCampaignsCount()).to.equal(1n);
            expect(await factory.campaigns(0)).to.equal(campaignAddress);

            log.info("✅ getCampaignsCount increments");
        });

        it("should track multiple campaigns per creator in getCampaignsByCreator", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);

            const c1 = await createCampaign(factory, creator, "STANDARD");
            const c2 = await createCampaign(factory, creator, "MINIMAL");

            const byCreator = await factory.getCampaignsByCreator(creator.address);
            expect(byCreator.length).to.equal(2);
            expect(byCreator[0]).to.equal(c1.campaignAddress);
            expect(byCreator[1]).to.equal(c2.campaignAddress);

            log.info("✅ getCampaignsByCreator tracks correctly");
        });

        it("should not register random address in isCampaign", async () => {
            const { factory, investors } = await loadFixture(deployBaseFixture);

            expect(await factory.isCampaign(investors[0].address)).to.equal(false);

            log.info("✅ random address not in isCampaign");
        });

        it("should create token clone with correct owner (campaign), name, symbol", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const { token, campaignAddress } = await createCampaign(factory, creator, "STANDARD");

            expect(await token.owner()).to.equal(campaignAddress);
            expect(await token.name()).to.equal(PRESETS.STANDARD.tokenName);
            expect(await token.symbol()).to.equal(PRESETS.STANDARD.tokenSymbol);
            expect(await token.totalSupply()).to.equal(0n);

            log.info("✅ token clone has correct owner, name, symbol");
        });

        it("should return campaign and token clone addresses from createCampaign", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const p = await campaignParams("STANDARD");

            const [returnedCampaign, returnedToken] = await factory
                .connect(creator)
                .createCampaign.staticCall(
                    p.targetAmount, p.minContribution, p.maxContribution,
                    p.endTimestamp, p.ipfsHash, p.tokenName, p.tokenSymbol,
                );

            expect(ethers.isAddress(returnedCampaign)).to.equal(true);
            expect(ethers.isAddress(returnedToken)).to.equal(true);

            log.info("✅ createCampaign returns addresses");
        });
    });

    // ─── createCampaign: validation ───────────────────────────────────────

    describe("createCampaign: input validation", () => {
        // Параметризований підхід — один it per error type
        // Уникаємо дублювання через масив тест-кейсів

        const validationCases: Array<{
            name: string;
            override: () => Promise<any[]>;
            error: string;
        }> = [
            {
                name: "zero targetAmount → InvalidTargetAmount",
                override: async () => [0n, parseEther("0.5"), parseEther("3"), await futureTimestamp(), "Qm", "T", "T"],
                error: "InvalidTargetAmount",
            },
            {
                name: "past endTimestamp → InvalidDeadline",
                override: async () => [parseEther("10"), parseEther("0.5"), parseEther("3"), BigInt((await time.latest()) - 1), "Qm", "T", "T"],
                error: "InvalidDeadline",
            },
            {
                name: "zero maxContribution → InvalidMaxZero",
                override: async () => [parseEther("10"), parseEther("0.5"), 0n, await futureTimestamp(), "Qm", "T", "T"],
                error: "InvalidMaxZero",
            },
            {
                name: "zero minContribution → InvalidMinZero",
                override: async () => [parseEther("10"), 0n, parseEther("3"), await futureTimestamp(), "Qm", "T", "T"],
                error: "InvalidMinZero",
            },
            {
                name: "min > max → InvalidContributionRange",
                override: async () => [parseEther("10"), parseEther("3"), parseEther("1"), await futureTimestamp(), "Qm", "T", "T"],
                error: "InvalidContributionRange",
            },
            {
                name: "target < min → InvalidTargetTooLow",
                override: async () => [parseEther("1"), parseEther("2"), parseEther("3"), await futureTimestamp(), "Qm", "T", "T"],
                error: "InvalidTargetTooLow",
            },
        ];

        for (const { name, override, error } of validationCases) {
            it(`should revert: ${name}`, async () => {
                const { factory, creator } = await loadFixture(deployBaseFixture);
                const args = await override();

                await expect(
                    (factory.connect(creator) as any).createCampaign(...args)
                ).to.be.revertedWithCustomError(factory, error);

                log.info(`✅ ${error}`);
            });
        }
    });

    // ─── getAllCampaigns ───────────────────────────────────────────────────

    describe("getAllCampaigns", () => {
        it("should return empty array initially", async () => {
            const { factory } = await loadFixture(deployBaseFixture);

            expect(await factory.getAllCampaigns()).to.deep.equal([]);

            log.info("✅ getAllCampaigns returns empty initially");
        });

        it("should return all created campaigns", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const c1 = await createCampaign(factory, creator, "STANDARD");
            const c2 = await createCampaign(factory, creator, "MINIMAL");

            const all = await factory.getAllCampaigns();
            expect(all).to.deep.equal([c1.campaignAddress, c2.campaignAddress]);

            log.info("✅ getAllCampaigns returns all campaigns");
        });
    });
});
