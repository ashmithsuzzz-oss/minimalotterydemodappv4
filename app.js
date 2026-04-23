// ===============================
// CONFIG
// ===============================
const ADDRESS = "MxG086HDR94WWW3ZJE24E807D5SQ7F5WUDQFNN9N221P89D698ZET9YK8832YJQ";
const PRICE = 0.0000001;

let pixels = {};
let status;


// ===============================
// WALLET EXTRACT (your method)
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

    status = document.getElementById("status");

    if (typeof MINIMASK !== "undefined") {

        MINIMASK.init(function (msg) {

            console.log("MiniMask:", msg);

            if (msg.event === "MINIMASK_INIT") {

                if (!msg.data || !msg.data.data || !msg.data.data.loggedon) {
                    status.innerText = "❌ Not logged in";
                    return;
                }

                status.innerText = "✅ Connected";

                loadPixels();
            }

            if (msg.event === "MINIMASK_PENDING") {
                setTimeout(loadPixels, 6000);
            }
        });

    } else {
        status.innerText = "❌ MiniMask not found";
    }

    createGrid();
};


// ===============================
// GRID
// ===============================
function createGrid() {

    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {

            const div = document.createElement("div");
            div.className = "pixel";

            const key = x + "," + y;

            if (pixels[key]) {
                div.style.background = pixels[key];
            }

            div.onclick = () => paintPixel(x, y);

            grid.appendChild(div);
        }
    }
}


// ===============================
// SEND TRANSACTION
// ===============================
function paintPixel(x, y) {

    MINIMASK.account.getAddress(function (res) {

        const wallet = getWalletAddress(res);

        if (!wallet) {
            alert("Wallet error");
            return;
        }

        let color = document.getElementById("colorPicker").value;

        // 🔥 FIX: remove #
        color = color.replace("#", "");

        const state = {};
        state[0] = x + "," + y;
        state[1] = color;

        console.log("Sending:", state);

        MINIMASK.account.send(
            PRICE,
            ADDRESS,
            "0x00",
            state,
            function (resp) {

                console.log("Send response:", resp);

                if (resp.pending) {
                    alert("Approve in MiniMask");

                    setTimeout(loadPixels, 6000);
                } else {
                    alert("Error: " + (resp.error || "Unknown"));
                }
            }
        );
    });
}


// ===============================
// LOAD FROM BLOCKCHAIN
// ===============================
function loadPixels() {

    console.log("Loading from:", ADDRESS);

    MINIMASK.meg.listcoins(ADDRESS, "0x00", "", function (resp) {

        console.log("RAW:", resp);

        pixels = {};

        if (!resp || !resp.data) {
            createGrid();
            return;
        }

        for (let coin of resp.data) {

            if (!coin.state) continue;

            let pos = coin.state[0];
            let color = coin.state[1];

            if (!pos || !color) continue;

            try { pos = decodeURI(pos); } catch {}
            try { color = decodeURI(color); } catch {}

            // 🔥 FIX: add # back
            pixels[pos] = "#" + color;
        }

        console.log("PIXELS:", pixels);

        createGrid();
    });
}


// ===============================
// AUTO REFRESH
// ===============================
setInterval(loadPixels, 8000);
