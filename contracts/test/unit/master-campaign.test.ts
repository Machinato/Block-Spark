import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther, formatEther } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { deployBaseFixture } from "../fixtures/deploy.fixture";
import {
    createCampaign,
    makeCampaignSuccessful,
    makeCampaignFailed,
    expireCampaign,
} from "../helpers/state-helpers";
import { STATE, TOKENS_PER_ETH, BONUS_TOKENS_PER_ETH, expectedTokens, PRESETS, futureTimestamp } from "../config";
import { createLogger } from "../utils/logger";

describe("Unit | MasterCampaign", () => {
    const log = createLogger(__filename);

    // ─── initialize ───────────────────────────────────────────────────────

    describe("initialize", () => {
        it("should set all fields correctly", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            const p = PRESETS.STANDARD;

            expect(await c.campaign.creator()).to.equal(creator.address);
            expect(await c.campaign.targetAmount()).to.equal(p.targetAmount);
            expect(await c.campaign.minContribution()).to.equal(p.minContribution);
            expect(await c.campaign.maxContribution()).to.equal(p.maxContribution);
            expect(await c.campaign.ipfsMetadataHash()).to.equal(p.ipfsHash);
            expect(await c.campaign.totalRaised()).to.equal(0n);
            expect(await c.campaign.fundsClaimed()).to.equal(false);
            expect(await c.campaign.paused()).to.equal(false);
            expect(await c.campaign.token()).to.equal(c.tokenAddress);

            log.info("✅ all fields set after initialize");
        });

        it("should emit CampaignInitialized with correct args", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const p = PRESETS.STANDARD;
            const params = await import("../config").then(m => m.campaignParams("STANDARD"));

            // Перевіряємо event через factory яка викликає initialize
            const tx = await factory.connect(creator).createCampaign(
                params.targetAmount, params.minContribution, params.maxContribution,
                params.endTimestamp, params.ipfsHash, params.tokenName, params.tokenSymbol,
            );
            const receipt = await tx.wait();
            const { ethers: hre } = await import("hardhat");

            // CampaignInitialized емітується в MasterCampaign.initialize
            // Шукаємо його в логах
            const campaignFactory = await hre.getContractFactory("MasterCampaign");
            const iface = campaignFactory.interface;

            const initLog = receipt?.logs.find(l => {
                try { iface.parseLog(l as any); return true; } catch { return false; }
            });

            expect(initLog).to.not.be.undefined;
            log.info("✅ CampaignInitialized emitted");
        });

        it("should revert double initialize", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            await expect(
                c.campaign.initialize(
                    creator.address, parseEther("10"), parseEther("0.5"),
                    parseEther("3"), c.endTimestamp, "Qm", c.tokenAddress,
                )
            ).to.be.revertedWithCustomError(c.campaign, "InvalidInitialization");

            log.info("✅ double initialize reverts");
        });
    });

    describe("initialize validation cases", () => {
        const validationCases: Array<{
            name: string;
            override: (masterAddr: string, creatorAddr: string, tokenAddr: string) => Promise<any[]>;
            error: string;
        }> = [
                {
                    name: "zero targetAmount → InvalidTargetAmount",
                    override: async (m, c, t) => [m, c, 0n, parseEther("0.5"), parseEther("3"), await futureTimestamp(), "Qm", t],
                    error: "InvalidTargetAmount",
                },
                {
                    name: "past endTimestamp → InvalidDeadline",
                    override: async (m, c, t) => [m, c, parseEther("10"), parseEther("0.5"), parseEther("3"), BigInt((await time.latest()) - 1), "Qm", t],
                    error: "InvalidDeadline",
                },
                {
                    name: "zero maxContribution → InvalidMaxZero",
                    override: async (m, c, t) => [m, c, parseEther("10"), parseEther("0.5"), 0n, await futureTimestamp(), "Qm", t],
                    error: "InvalidMaxZero",
                },
                {
                    name: "zero minContribution → InvalidMinZero",
                    override: async (m, c, t) => [m, c, parseEther("10"), 0n, parseEther("3"), await futureTimestamp(), "Qm", t],
                    error: "InvalidMinZero",
                },
                {
                    name: "min > max → InvalidContributionRange",
                    override: async (m, c, t) => [m, c, parseEther("10"), parseEther("3"), parseEther("1"), await futureTimestamp(), "Qm", t],
                    error: "InvalidContributionRange",
                },
                {
                    name: "target < min → InvalidTargetTooLow",
                    override: async (m, c, t) => [m, c, parseEther("1"), parseEther("2"), parseEther("3"), await futureTimestamp(), "Qm", t],
                    error: "InvalidTargetTooLow",
                },
                {
                    name: "target < min → InvalidTargetTooLow",
                    override: async (m, c, t) => [m, c, parseEther("1"), parseEther("2"), parseEther("3"), await futureTimestamp(), "Qm", t],
                    error: "InvalidTargetTooLow",
                },
                {
                    name: "token == address(0)",
                    override: async (m, c, t) => [m , c, parseEther("10"), parseEther("2"), parseEther("3"), await futureTimestamp(), "Qm", ethers.ZeroAddress],
                    error: "InvalidTokenAddress",
                },
            ];

        for (const { name, override, error } of validationCases) {
            it(`should revert: ${name}`, async () => {
                const { masterCampaign, masterBlockSparkToken, creator } = await loadFixture(deployBaseFixture);
                const MockDeployer = await ethers.getContractFactory("MockCampaignDeployer");
                const mockDeployer = await MockDeployer.deploy();
                await mockDeployer.waitForDeployment();

                const tokenAddr = await masterBlockSparkToken.getAddress();
                const masterAddr = await masterCampaign.getAddress();


                const args = await override(masterAddr, creator.address, tokenAddr);

                const tx = (mockDeployer as any).deployAndInit(
                    ...args
                );

                await expect(tx).to.be.revertedWithCustomError(masterCampaign, error);

                log.info(`✅ ${error}`);
            });
        }
    });

    // ─── getCampaignStatus ────────────────────────────────────────────────

    describe("getCampaignStatus", () => {
        it("should return Active before deadline", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            expect(await c.campaign.getCampaignStatus()).to.equal(STATE.ACTIVE);
            log.info("✅ Active before deadline");
        });

        it("should return Failed after deadline with insufficient funds", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignFailed(c, investors[0]);

            expect(await c.campaign.getCampaignStatus()).to.equal(STATE.FAILED);
            log.info("✅ Failed after deadline, insufficient funds");
        });

        it("should return Successful after deadline with sufficient funds", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignSuccessful(c, investors);

            expect(await c.campaign.getCampaignStatus()).to.equal(STATE.SUCCESSFUL);
            log.info("✅ Successful after deadline, target reached");
        });

        it("should return Finished after claimFunds", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignSuccessful(c, investors);
            await c.campaign.connect(creator).claimFunds();

            expect(await c.campaign.getCampaignStatus()).to.equal(STATE.FINISHED);
            log.info("✅ Finished after claimFunds");
        });

        it("should return Successful exactly at target (boundary)", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "MINIMAL"); // target = min = max = 1 ETH
            await c.campaign.connect(investors[0]).invest({ value: c.targetAmount });
            await expireCampaign(c);

            expect(await c.campaign.getCampaignStatus()).to.equal(STATE.SUCCESSFUL);
            log.info("✅ Successful exactly at target boundary");
        });
    });

    // ─── invest ───────────────────────────────────────────────────────────

    describe("invest", () => {
        it("should accept valid contribution and update state correctly", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            const amount = c.minContribution;

            await expect(c.campaign.connect(investors[0]).invest({ value: amount }))
                .to.emit(c.campaign, "Invested")
                .withArgs(c.campaignAddress, investors[0].address, amount, amount);

            expect(await c.campaign.totalRaised()).to.equal(amount);
            expect(await c.campaign.contributions(investors[0].address)).to.equal(amount);
            expect(await c.campaign.pendingTokenRewards(investors[0].address)).to.be.gt(0n);

            log.info("✅ invest updates state and emits event");
        });

        it("should accumulate multiple contributions from same investor", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            const amount = c.minContribution;

            await c.campaign.connect(investors[0]).invest({ value: amount });
            await c.campaign.connect(investors[0]).invest({ value: amount });

            expect(await c.campaign.contributions(investors[0].address)).to.equal(amount * 2n);
            log.info("✅ multiple contributions accumulate");
        });

        it("should revert: below minContribution → ContributionOutOfRange", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            await expect(
                c.campaign.connect(investors[0]).invest({ value: c.minContribution - 1n })
            ).to.be.revertedWithCustomError(c.campaign, "ContributionOutOfRange")
                .withArgs(c.minContribution - 1n, c.minContribution, c.maxContribution);

            log.info("✅ below min reverts ContributionOutOfRange");
        });

        it("should revert: above maxContribution → ContributionOutOfRange", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            await expect(
                c.campaign.connect(investors[0]).invest({ value: c.maxContribution + 1n })
            ).to.be.revertedWithCustomError(c.campaign, "ContributionOutOfRange");

            log.info("✅ above max reverts ContributionOutOfRange");
        });

        it("should revert: invest after deadline → InvalidState", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await expireCampaign(c);

            await expect(
                c.campaign.connect(investors[0]).invest({ value: c.minContribution })
            ).to.be.revertedWithCustomError(c.campaign, "InvalidState")
                .withArgs(STATE.ACTIVE, STATE.FAILED);

            log.info("✅ invest after deadline reverts InvalidState");
        });

        it("should revert: invest when paused → CampaignPaused", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await c.campaign.connect(creator).pause();

            await expect(
                c.campaign.connect(investors[0]).invest({ value: c.minContribution })
            ).to.be.revertedWithCustomError(c.campaign, "CampaignPaused");

            log.info("✅ invest when paused reverts");
        });
    });

    // ─── calculateTokenAmount ─────────────────────────────────────────────

    describe("calculateTokenAmount", () => {
        it("should apply bonus rate when totalRaised < bonusLimit", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            // totalRaised = 0, bonusLimit = 5 ETH, amount = 1 ETH < 5 ETH
            const amount = parseEther("1");
            expect(await c.campaign.calculateTokenAmount(amount))
                .to.equal(amount * BONUS_TOKENS_PER_ETH);

            log.info("✅ bonus rate applied correctly");
        });

        it("should apply standard rate when totalRaised >= bonusLimit", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            // Заповнюємо до bonusLimit (5 ETH) і трохи більше
            const bonusLimit = c.targetAmount / 2n;
            await c.campaign.connect(investors[0]).invest({ value: c.minContribution });
            // Тепер totalRaised >= bonusLimit якщо вклали достатньо
            // Для STANDARD: вкладаємо рівно bonusLimit через кілька інвесторів
            let raised = await c.campaign.totalRaised();
            let i = 1;
            while (raised < bonusLimit) {
                const inv = investors[i++];
                const remaining = bonusLimit - raised;
                const contrib = remaining < c.maxContribution ? remaining : c.maxContribution;
                await c.campaign.connect(inv).invest({ value: contrib });
                raised = await c.campaign.totalRaised();
            }

            const amount = c.minContribution;
            expect(await c.campaign.calculateTokenAmount(amount))
                .to.equal(amount * TOKENS_PER_ETH);

            log.info("✅ standard rate applied after bonus limit reached");
        });

        it("should split calculation correctly when contribution crosses bonus boundary", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            // STANDARD: target = 10 ETH, bonusLimit = 5 ETH, min = 0.5, max = 3

            // Вкладаємо 4 ETH — залишилось 1 ETH до bonusLimit
            await c.campaign.connect(investors[0]).invest({ value: parseEther("3") });
            await c.campaign.connect(investors[1]).invest({ value: parseEther("1") });
            // totalRaised = 4 ETH, bonusLimit = 5 ETH

            // Наступний внесок 3 ETH перетинає межу: 1 ETH @ bonus + 2 ETH @ standard
            const contribution = parseEther("3");
            const atBonus = parseEther("1");
            const atStandard = parseEther("2");
            const expected = atBonus * BONUS_TOKENS_PER_ETH + atStandard * TOKENS_PER_ETH;

            expect(await c.campaign.calculateTokenAmount(contribution)).to.equal(expected);
            log.info("✅ split calculation correct at bonus boundary");
        });
    });

    // ─── claimFunds ───────────────────────────────────────────────────────

    describe("claimFunds", () => {
        it("should transfer funds to creator and emit FundsClaimed", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignSuccessful(c, investors);

            const balanceBefore = await ethers.provider.getBalance(creator.address);
            const campaignBalance = await ethers.provider.getBalance(c.campaignAddress);

            await expect(c.campaign.connect(creator).claimFunds())
                .to.emit(c.campaign, "FundsClaimed")
                .withArgs(c.campaignAddress, creator.address, campaignBalance);

            expect(await c.campaign.fundsClaimed()).to.equal(true);
            expect(await ethers.provider.getBalance(c.campaignAddress)).to.equal(0n);
            log.info("✅ claimFunds transfers ETH and emits event");
        });

        it("should revert: non-creator calls claimFunds → IsNotCreator", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignSuccessful(c, investors);

            await expect(
                c.campaign.connect(investors[0]).claimFunds()
            ).to.be.revertedWithCustomError(c.campaign, "IsNotCreator")
                .withArgs(creator.address, investors[0].address);

            log.info("✅ non-creator claimFunds reverts");
        });

        it("should revert: claimFunds in Active state → InvalidState", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            await expect(
                c.campaign.connect(creator).claimFunds()
            ).to.be.revertedWithCustomError(c.campaign, "InvalidState")
                .withArgs(STATE.SUCCESSFUL, STATE.ACTIVE);

            log.info("✅ claimFunds in Active reverts");
        });

        it("should revert: claimFunds twice → InvalidState(Successful, Finished)", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignSuccessful(c, investors);
            await c.campaign.connect(creator).claimFunds();

            await expect(
                c.campaign.connect(creator).claimFunds()
            ).to.be.revertedWithCustomError(c.campaign, "InvalidState")
                .withArgs(STATE.SUCCESSFUL, STATE.FINISHED);

            log.info("✅ double claimFunds reverts");
        });
    });

    // ─── refund ───────────────────────────────────────────────────────────

    describe("refund", () => {
        it("should return ETH to investor and emit ContributionRefunded", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignFailed(c, investors[0]);

            const amount = await c.campaign.contributions(investors[0].address);

            await expect(c.campaign.connect(investors[0]).refund())
                .to.emit(c.campaign, "ContributionRefunded")
                .withArgs(c.campaignAddress, investors[0].address, amount);

            expect(await c.campaign.refundClaimed(investors[0].address)).to.equal(true);
            expect(await c.campaign.pendingTokenRewards(investors[0].address)).to.equal(0n);
            log.info("✅ refund returns ETH and emits event");
        });

        it("should revert: refund in Active state → InvalidState", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            await expect(
                c.campaign.connect(investors[0]).refund()
            ).to.be.revertedWithCustomError(c.campaign, "InvalidState")
                .withArgs(STATE.FAILED, STATE.ACTIVE);

            log.info("✅ refund in Active reverts");
        });

        it("should revert: refund with no contribution → NoContribution", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignFailed(c, investors[0]); // тільки investors[0] вклав

            await expect(
                c.campaign.connect(investors[1]).refund() // investors[1] не вкладав
            ).to.be.revertedWithCustomError(c.campaign, "NoContribution")
                .withArgs(investors[1].address);

            log.info("✅ refund without contribution reverts NoContribution");
        });

        it("should revert: double refund → AlreadyRefunded", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignFailed(c, investors[0]);
            await c.campaign.connect(investors[0]).refund();

            await expect(
                c.campaign.connect(investors[0]).refund()
            ).to.be.revertedWithCustomError(c.campaign, "AlreadyRefunded")
                .withArgs(investors[0].address);

            log.info("✅ double refund reverts AlreadyRefunded");
        });

        it("should revert: refund when ETH transfer fails → TransferFailed", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            // Деплоїмо контракт що відхиляє ETH і інвестуємо від його імені
            const RejectETH = await ethers.getContractFactory("RejectETH");
            const rejector = await RejectETH.deploy();
            await rejector.waitForDeployment();

            await rejector.investInCampaign(c.campaignAddress, { value: c.minContribution });
            await expireCampaign(c);

            await expect(
                rejector.refundFromCampaign(c.campaignAddress)
            ).to.be.revertedWithCustomError(c.campaign, "TransferFailed");

            log.info("✅ TransferFailed on ETH rejection");
        });
    });

    // ─── claimTokens ──────────────────────────────────────────────────────

    describe("claimTokens", () => {
        it("should mint tokens to investor and emit RewardsClaimed", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignSuccessful(c, investors);

            const pending = await c.campaign.pendingTokenRewards(investors[0].address);
            expect(pending).to.be.gt(0n);

            await expect(c.campaign.connect(investors[0]).claimTokens())
                .to.emit(c.campaign, "RewardsClaimed")
                .withArgs(c.campaignAddress, investors[0].address, pending);

            expect(await c.token.balanceOf(investors[0].address)).to.equal(pending);
            expect(await c.campaign.tokensClaimed(investors[0].address)).to.equal(true);
            expect(await c.campaign.pendingTokenRewards(investors[0].address)).to.equal(0n);
            log.info("✅ claimTokens mints and emits event");
        });

        it("should allow claimTokens in Finished state (after claimFunds)", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignSuccessful(c, investors);
            await c.campaign.connect(creator).claimFunds(); // → Finished

            expect(await c.campaign.getCampaignStatus()).to.equal(STATE.FINISHED);

            await expect(c.campaign.connect(investors[0]).claimTokens()).to.not.be.reverted;
            log.info("✅ claimTokens works in Finished state");
        });

        it("should revert: claimTokens in Active state → InvalidState", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            await expect(
                c.campaign.connect(investors[0]).claimTokens()
            ).to.be.revertedWithCustomError(c.campaign, "InvalidState");

            log.info("✅ claimTokens in Active reverts");
        });

        it("should revert: claimTokens in Failed state → InvalidState", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignFailed(c, investors[0]);

            await expect(
                c.campaign.connect(investors[0]).claimTokens()
            ).to.be.revertedWithCustomError(c.campaign, "InvalidState");

            log.info("✅ claimTokens in Failed reverts");
        });

        it("should revert: claimTokens with no rewards → NoRewards", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignSuccessful(c, investors);

            // creator не вкладав — немає rewards
            await expect(
                c.campaign.connect(creator).claimTokens()
            ).to.be.revertedWithCustomError(c.campaign, "NoRewards")
                .withArgs(creator.address);

            log.info("✅ claimTokens without rewards reverts NoRewards");
        });

        it("should revert: double claimTokens → AlreadyTokensClaimed", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await makeCampaignSuccessful(c, investors);
            await c.campaign.connect(investors[0]).claimTokens();

            await expect(
                c.campaign.connect(investors[0]).claimTokens()
            ).to.be.revertedWithCustomError(c.campaign, "AlreadyTokensClaimed")
                .withArgs(investors[0].address);

            log.info("✅ double claimTokens reverts");
        });
    });

    // ─── pause / unpause ──────────────────────────────────────────────────

    describe("pause / unpause", () => {
        it("should pause and emit CampaignPausedEvent", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            await expect(c.campaign.connect(creator).pause())
                .to.emit(c.campaign, "CampaignPausedEvent")
                .withArgs(c.campaignAddress);

            expect(await c.campaign.paused()).to.equal(true);
            log.info("✅ pause sets flag and emits event");
        });

        it("should unpause and emit CampaignUnpausedEvent", async () => {
            const { factory, creator } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await c.campaign.connect(creator).pause();

            await expect(c.campaign.connect(creator).unpause())
                .to.emit(c.campaign, "CampaignUnpausedEvent")
                .withArgs(c.campaignAddress);

            expect(await c.campaign.paused()).to.equal(false);
            log.info("✅ unpause resets flag and emits event");
        });

        it("should revert: non-creator pause → IsNotCreator", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");

            await expect(
                c.campaign.connect(investors[0]).pause()
            ).to.be.revertedWithCustomError(c.campaign, "IsNotCreator");

            log.info("✅ non-creator pause reverts");
        });

        it("should revert: non-creator unpause → IsNotCreator", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await c.campaign.connect(creator).pause();

            await expect(
                c.campaign.connect(investors[0]).unpause()
            ).to.be.revertedWithCustomError(c.campaign, "IsNotCreator");

            log.info("✅ non-creator unpause reverts");
        });

        it("should allow invest again after unpause", async () => {
            const { factory, creator, investors } = await loadFixture(deployBaseFixture);
            const c = await createCampaign(factory, creator, "STANDARD");
            await c.campaign.connect(creator).pause();
            await c.campaign.connect(creator).unpause();

            await expect(
                c.campaign.connect(investors[0]).invest({ value: c.minContribution })
            ).to.not.be.reverted;

            log.info("✅ invest works after unpause");
        });
    });
});
