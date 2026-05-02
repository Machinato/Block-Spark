export type CampaignStatus = "Active" | "Successful" | "Failed" | "Finished"

export type Campaign = {
  id: string // contract address
  creator: string // wallet address
  ipfsHash: string
  targetAmount: string | bigint // ETH as string e.g. "50"
  totalRaised: string | bigint // ETH as string
  minContribution: string | bigint
  maxContribution: string | bigint
  endTimestamp: number // unix timestamp
  investorsCount: number
  status: CampaignStatus
  fundsClaimed: boolean
  paused: boolean
  token: {
    id: string // token contract address
    name: string
    symbol: string
    totalMinted: string | bigint
  }
  // UI-only fields
  name: string
  description: string
}

export type Participation = {
  id: string
  campaign: Campaign
  totalContributed: string | bigint // ETH
  tokenRewards: string | bigint // token amount
  refunded: boolean
  tokensClaimed: boolean
  contributionCount: number
}

export type Contribution = {
  id: string
  amount: string | bigint // ETH
  tokenRewardsAfter: string | bigint // cumulative tokens after this contribution
  timestamp: number
  transactionHash: string
  investor: string // wallet address
}

export type PlatformStats = {
  totalCampaigns: number
  totalActiveCampaigns: number
  totalSuccessful: number
  totalRaisedETH: string | bigint
  totalInvestors: number
  totalCreators: number
}
