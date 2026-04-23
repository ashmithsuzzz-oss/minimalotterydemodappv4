// ===============================
// ⚙ CONFIG
// ===============================
const APP_ADDRESS = "0xA7F3C9B2E8D641";
const FEE = 0.0000001;

let entries = [];

// DOM
let walletStatus, entriesList, verifyResult;


// ===============================
// 🔧 INIT
// ===============================
window.onload = function () {

    walletStatus = document.getElementById("walletStatus");
    entriesList = document.getElementById("entries");
    verifyResult = document.getElementById("verifyResult");

    if (typeof MINIMASK !== "undefined") {

        MINIMASK.init(function (msg) {

            if (msg.event === "MINIMASK_INIT") {

                if (!msg.data.data.loggedon) {
                    walletStatus.innerText = "❌ Not logged in";
                    return;
                }

                walletStatus.innerText = "✅ Connected";
                loadData();
            }
        });

    } else {
        walletStatus.innerText = "❌ MiniMask not found";
    }
};


// ===============================
// 🔐 SAVE DATA
// ===============================
function saveData() {

    const text = document.getElementById("dataInput").value;

    if (!text) {
        alert("Enter something");
        return;
    }

    const time = new Date().toISOString();

    const state = {};
    state[0] = text;
    state[1] = time;

    MINIMASK.account.send(
        FEE,
        APP_ADDRESS,
        "0x00",
        state,
        function (resp) {

            if (resp.pending) {
                alert("Saved! Approve in MiniMask");
                setTimeout(loadData, 5000);
            } else {
                alert("Error: " + (resp.error || "Unknown"));
            }
        }
    );
}


// ===============================
// 📥 LOAD DATA
// ===============================
function loadData() {

    MINIMASK.meg.listcoins(APP_ADDRESS, "0x00", "", function (resp) {

        entries = [];
        let html = "";

        if (!resp || !resp.data) {
            entriesList.innerHTML = "<li>No data</li>";
            return;
        }

        for (let coin of resp.data) {

            if (!coin.state) continue;

            const text = coin.state[0];
            const time = coin.state[1];

            if (!text) continue;

            entries.push({ text, time });

            html += `
            <li>
                📄 ${text}<br>
                <small>${time}</small>
            </li>`;
        }

        entriesList.innerHTML = html || "<li>No data yet</li>";
    });
}


// ===============================
// 🔍 VERIFY DATA
// ===============================
function verifyData() {

    const input = document.getElementById("verifyInput").value;

    if (!input) {
        verifyResult.innerText = "Enter something";
        return;
    }

    const found = entries.find(e => e.text === input);

    if (found) {
        verifyResult.innerText = "✅ Verified! Exists since: " + found.time;
    } else {
        verifyResult.innerText = "❌ Not found on blockchain";
    }
}


// ===============================
// 🔄 AUTO REFRESH
// ===============================
setInterval(loadData, 10000);
