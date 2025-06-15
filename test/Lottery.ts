import {expect} from "chai";
import {ethers} from "ethers";
import {CONTRACT_ADDRESS, GETH_PROVIDER_URL} from "../constants/constants";
import {LOTTERY_ABI} from "../constants/lottery-abi";

const OWNER_PRIVATE_KEY = "bcdf20249abf0ed6d944c0288fad489e33f66b3960d9e6229c1cd214ed3bbe31";
const PLAYER_KEYS = [
    "53321db7c1e331d93a11a41d16f004d7ff63972ec8ec7c25db329728ceeb1710",
    "39725efee3fb28614de3bacaffe4cc4bd8c436257e2c8bb887c4b5c4be45e76d",
];

interface LotteryContract extends ethers.BaseContract {
    buyTickets: (count: number, overrides?: ethers.Overrides) => Promise<ethers.TransactionResponse>;
    ticketCount: () => Promise<number>;
    tickets: (index: number) => Promise<string>;
    owner: () => Promise<string>;
    ticketPrice: () => Promise<bigint>;
    drawWinner: () => Promise<ethers.TransactionResponse>;
}

describe("Lottery", function () {
    let provider: ethers.JsonRpcProvider;
    let owner: ethers.Wallet;
    let players: ethers.Wallet[];
    let lottery: LotteryContract;

    before(async function () {
        provider = new ethers.JsonRpcProvider(GETH_PROVIDER_URL);
        owner = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
        players = PLAYER_KEYS.map(key => new ethers.Wallet(key, provider));
        lottery = new ethers.Contract(CONTRACT_ADDRESS, LOTTERY_ABI, owner) as unknown as LotteryContract;
    });

    after(async function () {
        const count = await lottery.ticketCount();
        if (count > 0) {
            try {
                await (await lottery.drawWinner()).wait();
            } catch (e) {
                // ignore
            }
        }
    });

    it("should get the correct owner", async function () {
        expect(await lottery.owner()).to.equal(owner.address);
    });

    it("should allow custom players to buy tickets", async function () {
        const ticketCountToBuy = 5;

        const player = players[0];

        const ticketCountBefore = await lottery.ticketCount();

        const valueToSend = ethers.parseEther((
            ticketCountToBuy * Number(ethers.formatEther(await lottery.ticketPrice()))
        ).toString());

        const lotteryAsPlayer = lottery.connect(player) as LotteryContract;
        const tx = await lotteryAsPlayer.buyTickets(ticketCountToBuy, {
            value: valueToSend,
            gasLimit: 300_000,
        });
        await tx.wait();

        const currentTicketCount = await lottery.ticketCount();
        expect(currentTicketCount).to.equal(Number(ticketCountBefore) + ticketCountToBuy);

        for (let i = 0; i < ticketCountToBuy; i++) {
            const ticketOwner = await lottery.tickets(i);
            expect(ticketOwner).to.equal(player.address);
        }
    });

    it("should revert if incorrect ETH amount is sent", async function () {
        const player = players[0];
        const lotteryAsPlayer = lottery.connect(player) as LotteryContract;
        const wrongValue = ethers.parseEther("0.0015");

        await expect(
            lotteryAsPlayer.buyTickets(1, {value: wrongValue})
        ).to.be.revertedWith("Incorrect ETH amount");
    });

    it("should revert if trying to buy tickets without sending ETH", async function () {
        const lotteryAsPlayer = lottery.connect(players[0]) as LotteryContract;
        await expect(
            lotteryAsPlayer.buyTickets(1)
        ).to.be.revertedWith("Incorrect ETH amount");
    });

    it("should not allow buying zero tickets", async function () {
        const player = players[0];
        const lotteryAsPlayer = lottery.connect(player) as LotteryContract;

        await expect(
            lotteryAsPlayer.buyTickets(0, {value: 0})
        ).to.be.reverted;
    });

    it("should only allow the owner to draw a winner", async function () {
        const player = players[0];
        const lotteryAsPlayer = lottery.connect(player) as LotteryContract;

        await expect(
            lotteryAsPlayer.drawWinner()
        ).to.be.revertedWith("Access denied");
    });

    it("should emit WinnerDrawn and reset ticketCount after drawing winner", async function () {
        const player = players[0];
        const ticketCountToBuy = 3;
        const ticketPrice = await lottery.ticketPrice();
        const valueToSend = ticketPrice * BigInt(ticketCountToBuy);

        const lotteryAsPlayer = lottery.connect(player) as LotteryContract;
        await (await lotteryAsPlayer.buyTickets(ticketCountToBuy, {value: valueToSend})).wait();

        const tx = await lottery.drawWinner();
        const receipt = await tx.wait();

        const event = receipt?.logs
            .map(log => {
                try {
                    return lottery.interface.parseLog(log);
                } catch {
                    return null;
                }
            })
            .find(parsed => parsed && parsed.name === "WinnerDrawn");

        expect(event, "WinnerDrawn event should be emitted").to.not.be.undefined;

        const count = await lottery.ticketCount();
        expect(count).to.equal(0);
    });

    it("should transfer 10% of contract balance to owner after drawWinner", async function () {
        const player = players[0];
        const ticketCountToBuy = 2;
        const ticketPrice = await lottery.ticketPrice();
        const valueToSend = ticketPrice * BigInt(ticketCountToBuy);

        const lotteryAsPlayer = lottery.connect(player) as LotteryContract;
        await (await lotteryAsPlayer.buyTickets(ticketCountToBuy, {value: valueToSend})).wait();

        const ownerBalanceBefore = await provider.getBalance(owner.address);

        const tx = await lottery.drawWinner();
        const receipt = await tx.wait();

        if (!receipt) throw new Error("No receipt returned from drawWinner");

        const gasCost = receipt.gasUsed * receipt.gasPrice;
        const tolerance = gasCost;

        const ownerBalanceAfter = await provider.getBalance(owner.address);

        const expectedIncrease = valueToSend / BigInt(10);
        const actualIncrease = ownerBalanceAfter + gasCost - ownerBalanceBefore;

        expect(
            (actualIncrease >= expectedIncrease - tolerance) && (actualIncrease <= expectedIncrease + tolerance),
            `actualIncrease=${actualIncrease}, expectedIncrease=${expectedIncrease}, tolerance=${tolerance}`
        ).to.be.true;
    });
});