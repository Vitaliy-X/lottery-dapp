import { ethers } from "ethers";
import { CONTRACT_ADDRESS, NETHERMIND_PROVIDER_URL } from "../constants/constants";
import { LOTTERY_ABI } from "../constants/lottery-abi";

async function main() {
  const provider = new ethers.JsonRpcProvider(NETHERMIND_PROVIDER_URL);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, LOTTERY_ABI, provider);

  const balanceWei = await contract.getBalance();

  console.log(`Owner: ${await contract.owner()}`);
  console.log(`Lottery balance: ${ethers.formatEther(balanceWei)} ETH`);
  console.log(`Tickets sold: ${await contract.ticketCount()}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
