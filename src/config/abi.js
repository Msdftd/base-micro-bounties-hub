export const BOUNTY_ESCROW_ABI = [
  // ─── Read Functions ────────────────────────────────────
  {
    name: "bountyCount",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "platformFeeBps",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "getBounty",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_bountyId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "creator", type: "address" },
          { name: "title", type: "string" },
          { name: "description", type: "string" },
          { name: "reward", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "tokenType", type: "uint8" },
          { name: "tokenAddress", type: "address" },
          { name: "contributor", type: "address" },
          { name: "submissionURI", type: "string" },
          { name: "tags", type: "string[]" },
          { name: "createdAt", type: "uint256" },
        ],
      },
    ],
  },
  {
    name: "getCreatorBounties",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_creator", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "getContributorBounties",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_contributor", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }],
  },
  {
    name: "whitelistedTokens",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "_token", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },

  // ─── Write Functions ───────────────────────────────────
  {
    name: "createBountyETH",
    type: "function",
    stateMutability: "payable",
    inputs: [
      { name: "_title", type: "string" },
      { name: "_description", type: "string" },
      { name: "_deadline", type: "uint256" },
      { name: "_tags", type: "string[]" },
    ],
    outputs: [],
  },
  {
    name: "createBountyERC20",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_title", type: "string" },
      { name: "_description", type: "string" },
      { name: "_reward", type: "uint256" },
      { name: "_deadline", type: "uint256" },
      { name: "_tokenAddress", type: "address" },
      { name: "_tags", type: "string[]" },
    ],
    outputs: [],
  },
  {
    name: "submitWork",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "_bountyId", type: "uint256" },
      { name: "_submissionURI", type: "string" },
    ],
    outputs: [],
  },
  {
    name: "approveSubmission",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_bountyId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "refund",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_bountyId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "cancelBounty",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "_bountyId", type: "uint256" }],
    outputs: [],
  },

  // ─── Events ────────────────────────────────────────────
  {
    name: "BountyCreated",
    type: "event",
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "title", type: "string", indexed: false },
      { name: "reward", type: "uint256", indexed: false },
      { name: "deadline", type: "uint256", indexed: false },
      { name: "tokenType", type: "uint8", indexed: false },
      { name: "tokenAddress", type: "address", indexed: false },
    ],
  },
  {
    name: "SubmissionMade",
    type: "event",
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "contributor", type: "address", indexed: true },
      { name: "submissionURI", type: "string", indexed: false },
    ],
  },
  {
    name: "PaymentReleased",
    type: "event",
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "contributor", type: "address", indexed: true },
      { name: "payout", type: "uint256", indexed: false },
      { name: "fee", type: "uint256", indexed: false },
    ],
  },
  {
    name: "Refunded",
    type: "event",
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    name: "BountyCancelled",
    type: "event",
    inputs: [
      { name: "bountyId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
    ],
  },
];

// Minimal ERC20 ABI for approve + balance checks
export const ERC20_ABI = [
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
];
