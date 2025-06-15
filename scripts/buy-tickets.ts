import { ethers } from "ethers"
import { CONTRACT_ADDRESS, NETHERMIND_PROVIDER_URL } from "../constants/constants";
import { LOTTERY_ABI } from "../constants/lottery-abi";

const [, , privateKey, ticketCountStr] = process.argv;

if (!privateKey || !ticketCountStr) {
  console.error("Usage: npx ts-node scripts/buy-tickets.ts <PRIVATE_KEY> <TICKET_COUNT>");
  process.exit(1);
}

const ticketCount = parseInt(ticketCountStr, 10);

async function main() {
  const provider = new ethers.JsonRpcProvider(NETHERMIND_PROVIDER_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, LOTTERY_ABI, wallet);

  const ticketPrice = await contract.ticketPrice();
  const totalPrice = ticketPrice * BigInt(ticketCount);

  const tx = await contract.buyTickets(ticketCount, { value: totalPrice });
  console.log("Transaction sent:", tx.hash);
  await tx.wait();
  const balance = await contract.getBalance();
  console.log(`Bought ${ticketCount} tickets! \nLottery balance: ${ethers.formatEther(balance)} ETH`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
