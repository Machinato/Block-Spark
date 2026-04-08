import type { Campaign, Participation, Contribution, PlatformStats } from "./types"

export const MOCK_PLATFORM_STATS: PlatformStats = {
  totalCampaigns: 70,
  totalActiveCampaigns: 23,
  totalSuccessful: 47,
  totalRaisedETH: "1247.5",
  totalInvestors: 892,
  totalCreators: 156,
}

const now = Date.now()
const day = 24 * 60 * 60 * 1000

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: "0x1234567890abcdef1234567890abcdef12345678",
    creator: "0xabcdef1234567890abcdef1234567890abcdef12",
    ipfsHash: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    name: "DeFi Analytics Dashboard",
    description: "Real-time analytics for DeFi protocols on Base network. Our platform aggregates data from multiple sources and presents it in an intuitive interface for traders, investors, and protocol teams.",
    targetAmount: "50",
    totalRaised: "37.5",
    minContribution: "0.01",
    maxContribution: "5",
    endTimestamp: now + 7 * day,
    investorsCount: 143,
    status: "Active",
    fundsClaimed: false,
    paused: false,
    token: {
      id: "0xtoken1234567890abcdef1234567890abcdef1234",
      name: "DeFi Analytics Dashboard Token",
      symbol: "DAD",
      totalMinted: "4500",
    },
  },
  {
    id: "0x2345678901bcdef12345678901bcdef123456789",
    creator: "0xbcdef12345678901bcdef12345678901bcdef123",
    ipfsHash: "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
    name: "NFT Marketplace Protocol",
    description: "Decentralized NFT trading with zero platform fees. Buy, sell, and trade NFTs without intermediaries taking a cut of your profits.",
    targetAmount: "100",
    totalRaised: "100",
    minContribution: "0.05",
    maxContribution: "10",
    endTimestamp: now + 2 * day,
    investorsCount: 312,
    status: "Successful",
    fundsClaimed: false,
    paused: false,
    token: {
      id: "0xtoken2345678901bcdef12345678901bcdef1234",
      name: "NFT Marketplace Protocol Token",
      symbol: "NMP",
      totalMinted: "12000",
    },
  },
  {
    id: "0x3456789012cdef123456789012cdef1234567890",
    creator: "0xcdef123456789012cdef123456789012cdef1234",
    ipfsHash: "QmZoZZyPz8NCDgHbMhbVJzwPyBDVKqAr9VMjq2WUyCZKWv",
    name: "Web3 Social Graph",
    description: "Decentralized social connections for the open web. Build your on-chain social identity and connect with others without centralized platforms.",
    targetAmount: "30",
    totalRaised: "8.2",
    minContribution: "0.01",
    maxContribution: "3",
    endTimestamp: now + 14 * day,
    investorsCount: 67,
    status: "Active",
    fundsClaimed: false,
    paused: false,
    token: {
      id: "0xtoken3456789012cdef123456789012cdef1234",
      name: "Web3 Social Graph Token",
      symbol: "WSG",
      totalMinted: "984",
    },
  },
  {
    id: "0x456789abcdef0123456789abcdef01234567890a",
    creator: "0xdef0123456789abcdef0123456789abcdef01234",
    ipfsHash: "QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn",
    name: "Base Layer Bridge",
    description: "Fast and secure cross-chain bridge for Base network. Transfer assets between Ethereum mainnet and Base with minimal fees and instant finality.",
    targetAmount: "75",
    totalRaised: "12",
    minContribution: "0.02",
    maxContribution: "8",
    endTimestamp: now + 21 * day,
    investorsCount: 28,
    status: "Active",
    fundsClaimed: false,
    paused: false,
    token: {
      id: "0xtoken456789abcdef0123456789abcdef01234",
      name: "Base Layer Bridge Token",
      symbol: "BLB",
      totalMinted: "1440",
    },
  },
  {
    id: "0x56789abcdef01234567890abcdef012345678901",
    creator: "0xef01234567890abcdef01234567890abcdef0123",
    ipfsHash: "QmPChd2hVbrJ6bfo3WBcTW4iZnpHm8TEzWkLHmLpXhF68A",
    name: "DAO Governance Tools",
    description: "Comprehensive toolkit for DAO management. Proposal creation, voting mechanisms, treasury management, and member coordination all in one platform.",
    targetAmount: "40",
    totalRaised: "0",
    minContribution: "0.01",
    maxContribution: "5",
    endTimestamp: now - 5 * day,
    investorsCount: 0,
    status: "Failed",
    fundsClaimed: false,
    paused: false,
    token: {
      id: "0xtoken56789abcdef01234567890abcdef01234",
      name: "DAO Governance Tools Token",
      symbol: "DGT",
      totalMinted: "0",
    },
  },
  {
    id: "0x6789abcdef012345678901bcdef0123456789012",
    creator: "0xf012345678901bcdef012345678901bcdef01234",
    ipfsHash: "QmSsYRx3LpDAb1GZQm7zZ1AuHZjfbPkD6J7s9r41xu1mf8",
    name: "Prediction Market Protocol",
    description: "Decentralized prediction markets for real-world events. Create markets, trade outcomes, and earn rewards for accurate predictions.",
    targetAmount: "60",
    totalRaised: "60",
    minContribution: "0.02",
    maxContribution: "6",
    endTimestamp: now - 10 * day,
    investorsCount: 201,
    status: "Finished",
    fundsClaimed: true,
    paused: false,
    token: {
      id: "0xtoken6789abcdef012345678901bcdef01234",
      name: "Prediction Market Protocol Token",
      symbol: "PMP",
      totalMinted: "7200",
    },
  },
]

export const MOCK_PARTICIPATIONS: Participation[] = [
  {
    id: "p1",
    campaign: MOCK_CAMPAIGNS[0],
    totalContributed: "2.0",
    tokenRewards: "240",
    refunded: false,
    tokensClaimed: false,
    contributionCount: 2,
  },
  {
    id: "p2",
    campaign: MOCK_CAMPAIGNS[1],
    totalContributed: "2.0",
    tokenRewards: "240",
    refunded: false,
    tokensClaimed: false,
    contributionCount: 1,
  },
  {
    id: "p3",
    campaign: MOCK_CAMPAIGNS[2],
    totalContributed: "1.1",
    tokenRewards: "132",
    refunded: false,
    tokensClaimed: false,
    contributionCount: 3,
  },
]

export const MOCK_CONTRIBUTIONS: Contribution[] = [
  {
    id: "c1",
    amount: "0.5",
    tokenRewardsAfter: "60",
    timestamp: now - 2 * 60 * 60 * 1000, // 2 hours ago
    transactionHash: "0xabc123def456789012345678901234567890abcdef1234567890abcdef123456",
    investor: "0x1234567890abcdef1234567890abcdef12345678",
  },
  {
    id: "c2",
    amount: "2.0",
    tokenRewardsAfter: "240",
    timestamp: now - 5 * 60 * 60 * 1000, // 5 hours ago
    transactionHash: "0xbcd234ef5678901234567890123456789012bcdef2345678901bcdef234567",
    investor: "0xabcdef1234567890abcdef1234567890abcdef01",
  },
  {
    id: "c3",
    amount: "0.1",
    tokenRewardsAfter: "12",
    timestamp: now - 1 * day, // 1 day ago
    transactionHash: "0xcde345f67890123456789012345678901234cdef3456789012cdef345678",
    investor: "0x9876543210fedcba9876543210fedcba98765432",
  },
  {
    id: "c4",
    amount: "1.5",
    tokenRewardsAfter: "180",
    timestamp: now - 1 * day - 6 * 60 * 60 * 1000, // 1 day ago
    transactionHash: "0xdef456078901234567890123456789012345def4567890123def456789",
    investor: "0xdeadbeef1234567890abcdef1234567890deadbe",
  },
  {
    id: "c5",
    amount: "3.0",
    tokenRewardsAfter: "360",
    timestamp: now - 2 * day, // 2 days ago
    transactionHash: "0xef5670189012345678901234567890123456ef56789012345ef5678901",
    investor: "0xcafebabe1234567890abcdef1234567890cafeba",
  },
]

// Extended description for campaign detail page
export const MOCK_CAMPAIGN_FULL_DESCRIPTION = `DeFi Analytics Dashboard provides real-time, on-chain analytics for DeFi protocols deployed on Base network. Our platform aggregates data from multiple sources and presents it in an intuitive interface for traders, investors, and protocol teams.

Key Features:
- Real-time price feeds and liquidity data
- Portfolio tracking across multiple protocols
- Advanced charting with technical indicators
- Protocol health monitoring and alerts
- Historical data analysis and trends
- Gas optimization recommendations

Our team has extensive experience building analytics tools for the DeFi ecosystem. We've previously worked on analytics platforms serving over 100,000 users and processing billions of dollars in transaction data.

The DAD token will be used for:
- Premium feature access
- Governance voting on new features
- Staking rewards for data providers
- Fee discounts on the platform`
