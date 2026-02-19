import { ethers } from "hardhat";

async function main() {
  const Campaign = await ethers.getContractFactory("Campaign");
  const bytecode = Campaign.bytecode;
  const size = Buffer.from(bytecode.slice(2), "hex").length; // без 0x
  console.log(`Campaign bytecode size: ${size} bytes`);

  const Token = await ethers.getContractFactory("BlockSparkToken");
  const tokenSize = Buffer.from(Token.bytecode.slice(2), "hex").length;
  console.log(`BlockSparkToken bytecode size: ${tokenSize} bytes`);
}

main().catch(console.error);