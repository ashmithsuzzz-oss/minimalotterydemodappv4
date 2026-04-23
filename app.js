// ===============================
// ⚙ CONFIG
// ===============================
const LOTTERY_ADDRESS = "0xA7F3C9B2E8D641";
const PRIZE_COIN_ID = "0xPRIZECOIN"; // <-- replace after creating prize coin
const DRAW_BLOCK = 100000;
const TICKET_PRICE = 0.0000001;

let entries = [];

// DOM
let entriesList, entryCount, walletStatus, yourStats, prizePool, timer;


// ===============================
// 🔧 WALLET SAFE EXTRACT
// ===============================
function getWalletAddress(res) {
    if (!res || !res.status) return null;

    const d = res.data;

    if (typeof d === "string") return d;
    if (typeof d === "object") return d.address || d.data;

    return null;
}


// ===============================
// INIT
// ===============================
window.onload = function () {

    entriesList = document.getElementById("entries");
    entryCount = document.getElementById("entryCount");
    walletStatus = document.getElementById("walletStatus");
    yourStats = document.getElementById("yourStats");
    prizePool = document.getElementById("prizePool");
    timer = document.getElementById("timer");

    if (typeof MINIMASK !== "undefined") {

        MINIMASK.init(function (msg) {

            if (msg.event === "MINIMASK_INIT") {

                if (!msg.data || !msg.data.data || !msg.data.data.loggedon) {
                    walletStatus.innerText = "❌ Not logged in";
                    return;
                }

                walletStatus.innerText = "✅ Connected";
                loadEntries();
            }

            if (msg.event === "MINIMASK_PENDING") {
                setTimeout(loadEntries, 6000);
            }
        });

    } else {
        walletStatus.innerText = "❌ MiniMask not found";
    }

    startBlockCheck();
};


// ===============================
// BUY TICKET (ON-CHAIN)
// ===============================
function buyTicket() {

    MINIMASK.account.getAddress(function (res) {

        const wallet = getWalletAddress(res);
        if (!wallet) return alert("Wallet error");

        MINIMASK.meg.listcoins(LOTTERY_ADDRESS, "0x00", "", function (resp) {

            let totalTickets = 0;

            if (resp && resp.data) {
                totalTickets = resp.data.length;
            }

            const ticketIndex = totalTickets;

            const state = {};
            state[0] = wallet;
            state[1] = "ROUND1";
            state[2] = ticketIndex;
            state[3] = Date.now();

            MINIMASK.account.send(
                TICKET_PRICE,
                LOTTERY_ADDRESS,
                "0x00",
                state,
                function (resp) {

                    if (resp.pending) {
                        alert("Approve transaction");
                    } else {
                        alert("Error");
                    }
                }
            );
        });
    });
}


// ===============================
// LOAD ENTRIES
// ===============================
function loadEntries() {

    MINIMASK.meg.listcoins(LOTTERY_ADDRESS, "0x00", "", function (resp) {

        entries = [];
        let html = "";

        if (!resp || !resp.data) {
            entriesList.innerHTML = "<li>No entries</li>";
            return;
        }

        for (let coin of resp.data) {

            if (!coin.state) continue;

            const wallet = coin.state[0];
            const index = coin.state[2];
            const time = coin.state[3];

            entries.push({ wallet, index, time });

            html += `
            <li>
                🎟 Ticket #${index}
                <br><small>${new Date(time).toLocaleString()}</small>
            </li>`;
        }

        entriesList.innerHTML = html;
        entryCount.innerText = entries.length;

        updatePool();
    });
}


// ===============================
// POOL
// ===============================
function updatePool() {
    const pool = entries.length * TICKET_PRICE;
    prizePool.innerText = pool.toFixed(8) + " MINIMA";
}


// ===============================
// BLOCK CHECK (NO FAKE TIMER)
// ===============================
function startBlockCheck() {

    setInterval(() => {

        MINIMASK.system.getblock(function (block) {

            const current = block.data.block;

            const left = DRAW_BLOCK - current;

            if (left <= 0) {
                timer.innerText = "DRAW READY";
            } else {
                timer.innerText = "Blocks left: " + left;
            }

        });

    }, 5000);
}


// ===============================
// HASH
// ===============================
function hashCode(str) {
    let hash = 0;
    str = String(str);

    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }

    return hash;
}


// ===============================
// CLAIM REWARD
// ===============================
function claimReward() {

    MINIMASK.system.getblock(function (block) {

        const blockNumber = block.data.block;

        const total = entries.length;

        if (total === 0) return alert("No tickets");

        const winnerIndex =
            Math.abs(hashCode(blockNumber + PRIZE_COIN_ID)) % total;

        MINIMASK.account.getAddress(function (res) {

            const wallet = getWalletAddress(res);

            let isWinner = false;

            for (let e of entries) {
                if (e.wallet === wallet && e.index == winnerIndex) {
                    isWinner = true;
                    break;
                }
            }

            if (!isWinner) {
                return alert("Not winner");
            }

            alert("You are winner! Submit claim TX in terminal.");
        });
    });
}


// ===============================
// AUTO REFRESH
// ===============================
setInterval(loadEntries, 8000);
