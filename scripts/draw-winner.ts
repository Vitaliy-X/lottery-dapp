import { ethers } from "hardhat";
import { CONTRACT_ADDRESS } from "../constants/constants";

async function main() {
  const [signer] = await ethers.getSigners();
  const lottery = await ethers.getContractAt("Lottery", CONTRACT_ADDRESS, signer);
  
  const tx = await lottery.drawWinner();
  await tx.wait();
  
  console.log("Winner drawn!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
