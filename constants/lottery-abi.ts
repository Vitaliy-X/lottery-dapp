export const LOTTERY_ABI = [
  "function owner() public view returns (address)",
  "function getBalance() public view returns (uint256)",
  "function ticketCount() public view returns (uint256)",
  "function buyTickets(uint256 _count) public payable",
  "function ticketPrice() public view returns (uint256)",
  "function tickets(uint256) public view returns (address)",
  "function drawWinner() public",
  "event WinnerDrawn(address indexed winner, uint256 ticketId, uint256 prize)",
];