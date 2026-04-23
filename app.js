// ===============================
// ⚙ CONFIG
// ===============================
const LOTTERY_ADDRESS = "0xA7F3C9B2E8D641";
const TICKET_PRICE = 0.0000001;

let entries = [];

// DOM refs
let entriesList, entryCount, walletStatus, yourStats, prizePool, timer, winnerPopup, winnerText;


// ===============================
// 🔧 SAFE WALLET EXTRACT
// ===============================
function getWalletAddress(res) {
    if (!res || !res.status) return null;

    const d = res.data;

    if (typeof d === "string") return d;
    if (typeof d === "object") return d.address || d.data;

    return null;
}


// ===============================
// 🔌 INIT
// ===============================
window.onload = function () {

    // ✅ FIX: DOM elements loaded safely
    entriesList = document.getElementById("entries");
    entryCount = document.getElementById("entryCount");
    walletStatus = document.getElementById("walletStatus");
    yourStats = document.getElementById("yourStats");
    prizePool = document.getElementById("prizePool");
    timer = document.getElementById("timer");
    winnerPopup = document.getElementById("winnerPopup");
    winnerText = document.getElementById("winnerText");

    if (typeof MINIMASK !== "undefined") {

        MINIMASK.init(function (msg) {

            console.log("MiniMask:", msg);

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

    startTimer();
};



// ===============================
// 🎟 BUY TICKET
// ===============================
function buyTicket() {

    MINIMASK.account.getAddress(function (res) {

        const wallet = getWalletAddress(res);

        if (!wallet) {
            alert("Wallet error");
            return;
        }

        const time = new Date().toLocaleString();

        const state = {};
        state[99] = wallet + "|" + time;

        console.log("Sending from:", wallet);

        MINIMASK.account.send(
            TICKET_PRICE,
            LOTTERY_ADDRESS,
            "0x00",
            state,
            function (resp) {

                console.log("Send response:", resp);

                if (resp.pending) {
                    alert("Approve transaction in MiniMask");
                } else {
                    alert("Error: " + (resp.error || "Unknown"));
                }
            }
        );
    });
}



// ===============================
// 📥 LOAD ENTRIES
// ===============================
function loadEntries() {

    console.log("🔄 Loading entries from:", LOTTERY_ADDRESS);

    MINIMASK.meg.listcoins(LOTTERY_ADDRESS, "0x00", "", function (resp) {

        console.log("RAW RESPONSE:", resp);

        entries = [];
        let html = "";

        if (!resp || !resp.data || resp.data.length === 0) {
            entriesList.innerHTML = "<li>No entries</li>";
            entryCount.innerText = 0;
            updateStats(null);
            updatePool();
            return;
        }

        MINIMASK.account.getAddress(function (res) {

            const myWallet = getWalletAddress(res);

            for (let coin of resp.data) {

                if (!coin.state) continue;

                for (let key in coin.state) {

                    let raw = coin.state[key];

                    if (!raw) continue;

                    try { raw = decodeURI(raw); } catch {}

                    const parts = String(raw).split("|");

                    if (parts.length >= 2) {

                        const wallet = parts[0];
                        const time = parts[1];

                        entries.push({ wallet, time });

                        const isMine = wallet === myWallet;

                        html += `
                        <li class="${isMine ? "mine" : ""}">
                            🎟 Ticket<br>
                            <small>${time}</small>
                        </li>`;
                    }
                }
            }

            entriesList.innerHTML = html || "<li>No valid entries</li>";
            entryCount.innerText = entries.length;

            updateStats(myWallet);
            updatePool();
        });
    });
}



// ===============================
// 📊 STATS
// ===============================
function updateStats(myWallet) {

    if (!myWallet) {
        yourStats.innerText = "Not connected";
        return;
    }

    let count = 0;

    for (let e of entries) {
        if (e.wallet === myWallet) count++;
    }

    yourStats.innerText = "Your Tickets: " + count;
}



// ===============================
// 💰 POOL (Prize = Total Tickets × Ticket Price)
// ===============================
function updatePool() {

    const pool = entries.length * TICKET_PRICE;

    prizePool.innerText = pool.toFixed(8) + " MINIMA";
}



// ===============================
// ⏳ TIMER (24 HOURS)
// ===============================
const ROUND_DURATION = 24 * 60 * 60 * 1000;

let startTime = Date.now();

function startTimer() {

    setInterval(() => {

        const diff = ROUND_DURATION - (Date.now() - startTime);

        if (diff <= 0) {
            startTime = Date.now();
            showWinner();
            return;
        }

        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        timer.innerText =
            `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;

    }, 1000);
}



// ===============================
// 🎉 WINNER POPUP
// ===============================
function showWinner() {

    if (entries.length === 0) return;

    const winner = entries[Math.floor(Math.random() * entries.length)];
    const prizeAmount = entries.length * TICKET_PRICE;

    winnerText.innerText = `🎉 Winner Selected!\nPrize: ${prizeAmount.toFixed(8)} MINIMA`;

    winnerPopup.classList.remove("hidden");

    setTimeout(() => {
        winnerPopup.classList.add("hidden");
    }, 4000);
}



// ===============================
// 🔄 LIVE UPDATE
// ===============================
setInterval(loadEntries, 8000);
