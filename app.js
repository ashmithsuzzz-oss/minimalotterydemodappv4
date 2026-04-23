// ===============================
// ⚙ CONFIG
// ===============================
const ADDRESS = "MxG086HDR94WWW3ZJE24E807D5SQ7F5WUDQFNN9N221P89D698ZET9YK8832YJQ";
const PRICE = 0.0000001;

let pixels = {};
let grid;


// ===============================
// 🔧 INIT
// ===============================
window.onload = function () {

    if (typeof MINIMASK !== "undefined") {

        MINIMASK.init(function (msg) {

            console.log("MiniMask:", msg);

            if (msg.event === "MINIMASK_INIT") {

                if (!msg.data || !msg.data.data || !msg.data.data.loggedon) {
                    document.getElementById("status").innerText = "❌ Not logged in";
                    return;
                }

                document.getElementById("status").innerText = "✅ Connected";

                loadPixels();
            }

            if (msg.event === "MINIMASK_PENDING") {
                setTimeout(loadPixels, 6000);
            }
        });

    } else {
        document.getElementById("status").innerText = "❌ MiniMask not found";
    }

    createGrid();
};



// ===============================
// 🎨 CREATE GRID
// ===============================
function createGrid() {

    grid = document.getElementById("grid");
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
// 💸 PAINT PIXEL (PAY TO DRAW)
// ===============================
function paintPixel(x, y) {

    const color = document.getElementById("colorPicker").value;

    const state = {};
    state[0] = x + "," + y;
    state[1] = color;

    MINIMASK.account.send(
        PRICE,
        ADDRESS,
        "0x00",
        state,
        function (resp) {

            console.log("Send:", resp);

            if (resp.pending) {
                alert("Approve payment in MiniMask");

                setTimeout(loadPixels, 5000);

            } else {
                alert("Error: " + (resp.error || "Unknown"));
            }
        }
    );
}



// ===============================
// 📥 LOAD PIXELS FROM BLOCKCHAIN
// ===============================
function loadPixels() {

    console.log("Loading pixels from:", ADDRESS);

    MINIMASK.meg.listcoins(ADDRESS, "0x00", "", function (resp) {

        console.log("RAW:", resp);

        pixels = {};

        if (!resp || !resp.data) {
            createGrid();
            return;
        }

        for (let coin of resp.data) {

            if (!coin.state) continue;

            const pos = coin.state[0];
            const color = coin.state[1];

            if (!pos || !color) continue;

            pixels[pos] = color;
        }

        createGrid();
    });
}



// ===============================
// 🔄 AUTO REFRESH
// ===============================
setInterval(loadPixels, 10000);
