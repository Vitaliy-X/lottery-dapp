// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Lottery {
    address public owner;
    uint256 public ticketPrice = 0.001 ether;
    uint256 public ticketCount = 0;

    mapping(uint256 => address payable) public tickets;

    event WinnerDrawn(address indexed winner, uint256 ticketId, uint256 prize);

    constructor() {
        owner = msg.sender;
    }

    function buyTickets(uint256 _count) public payable {
        require(_count > 0, "Ticket count must be greater than zero");
        require(msg.value == ticketPrice * _count, "Incorrect ETH amount");

        for (uint256 i = 0; i < _count; i++) {
            tickets[ticketCount] = payable(msg.sender);
            ticketCount++;
        }
    }

    function random() private view returns (uint256) {
        return
            uint256(
            keccak256(
                abi.encodePacked(
                    block.prevrandao,
                    block.timestamp,
                    ticketCount
                )
            )
        );
    }

    function drawWinner() public onlyOwner {
        require(ticketCount > 0, "No tickets sold");

        uint256 winnerTicket = random() % ticketCount;
        address payable winner = tickets[winnerTicket];

        uint256 contractBalance = address(this).balance;
        uint256 prize = (contractBalance * 90) / 100;

        ticketCount = 0;  // reset lottery

        winner.transfer(prize);
        payable(owner).transfer(contractBalance - prize);

        emit WinnerDrawn(winner, winnerTicket, prize);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Access denied");
        _;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
