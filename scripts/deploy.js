// scripts/deploy.js
// Run: npx hardhat run scripts/deploy.js --network baseSepolia
const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const BountyEscrow = await hre.ethers.getContractFactory("BountyEscrow");
  const escrow = await BountyEscrow.deploy(deployer.address);
  await escrow.waitForDeployment();
  const addr = await escrow.getAddress();
  console.log("BountyEscrow deployed:", addr);

  // Whitelist USDC Base Sepolia
  const tx = await escrow.whitelistToken("0x036CbD53842c5426634e7929541eC2318f3dCF7e", true);
  await tx.wait();
  console.log("USDC whitelisted");

  // Verify
  try {
    await hre.run("verify:verify", { address: addr, constructorArguments: [deployer.address] });
  } catch (e) { console.log("Verify:", e.message); }

  console.log("\nNEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET=" + addr);
}

main().catch(e => { console.error(e); process.exitCode = 1; });
