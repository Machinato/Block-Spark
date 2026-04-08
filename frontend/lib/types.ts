export type CampaignStatus = "Active" | "Successful" | "Failed" | "Finished"

export type Campaign = {
  id: string // contract address
  creator: string // wallet address
  ipfsHash: string
  targetAmount: string // ETH as string e.g. "50"
  totalRaised: string // ETH as string
  minContribution: string
  maxContribution: string
  endTimestamp: number // unix timestamp
  investorsCount: number
  status: CampaignStatus
  fundsClaimed: boolean
  paused: boolean
  token: {
    id: string // token contract address
    name: string
    symbol: string
    totalMinted: string
  }
  // UI-only fields
  name: string
  description: string
}

export type Participation = {
  id: string
  campaign: Campaign
  totalContributed: string // ETH
  tokenRewards: string // token amount
  refunded: boolean
  tokensClaimed: boolean
  contributionCount: number
}

export type Contribution = {
  id: string
  amount: string // ETH
  tokenRewardsAfter: string // cumulative tokens after this contribution
  timestamp: number
  transactionHash: string
  investor: string // wallet address
}

export type PlatformStats = {
  totalCampaigns: number
  totalActiveCampaigns: number
  totalSuccessful: number
  totalRaisedETH: string
  totalInvestors: number
  totalCreators: number
}
