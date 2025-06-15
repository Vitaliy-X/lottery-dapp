import { ethers } from "ethers";
import { CONTRACT_ADDRESS, NETHERMIND_PROVIDER_URL } from "../constants/constants";
import { LOTTERY_ABI } from "../constants/lottery-abi";

async function main() {
  const provider = new ethers.JsonRpcProvider(NETHERMIND_PROVIDER_URL);
  const iface = new ethers.Interface(LOTTERY_ABI);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, LOTTERY_ABI, provider);

  const filter = contract.filters.WinnerDrawn();
  const currentBlock = await provider.getBlockNumber();
  const fromBlock = Math.max(0, currentBlock - 10000);
  const events = await contract.queryFilter(filter, fromBlock, currentBlock);

  if (events.length > 0) {
    const last = events[events.length - 1];
    const decoded = iface.decodeEventLog("WinnerDrawn", last.data, last.topics);
    console.log(`Winner: ${decoded.winner}`);
    console.log(`Ticket ID: ${decoded.ticketId}`);
    console.log(`Prize: ${ethers.formatEther(decoded.prize)} ETH`);
  } else {
    console.log("The winner has not yet been determined.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
