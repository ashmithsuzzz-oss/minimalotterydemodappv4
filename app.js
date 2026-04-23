const ADDRESS = "MxG086HDR94WWW3ZJE24E807D5SQ7F5WUDQFNN9N221P89D698ZET9YK8832YJQ";
const PRICE = 0.0000001;

let wallet = null;
let pixels = {};


// =====================
// INIT
// =====================
window.onload = function () {

    if (typeof MINIMASK === "undefined") {
        setStatus("❌ MiniMask not found");
        return;
    }

    MINIMASK.init(function (msg) {

        console.log(msg);

        if (msg.event === "MINIMASK_INIT") {

            if (!msg.data.data.loggedon) {
                setStatus("❌ Not logged in");
                return;
            }

            // GET WALLET FIRST
            MINIMASK.account.getAddress(function (res) {

                wallet = extract(res);

                if (!wallet) {
                    setStatus("❌ Wallet error");
                    return;
                }

                setStatus("✅ Connected: " + wallet.slice(0,8)+"...");
                createGrid();
                loadPixels();
            });
        }
    });
};


// =====================
// HELPERS
// =====================
function setStatus(text) {
    document.getElementById("status").innerText = text;
}

function extract(res) {
    if (!res || !res.status) return null;
    if (typeof res.data === "string") return res.data;
    return res.data.address || res.data.data;
}


// =====================
// GRID
// =====================
function createGrid() {

    const grid = document.getElementById("grid");
    grid.innerHTML = "";

    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(10,30px)";
    grid.style.gap = "4px";

    for (let y=0;y<10;y++) {
        for (let x=0;x<10;x++) {

            const div = document.createElement("div");
            div.style.width="30px";
            div.style.height="30px";
            div.style.background = pixels[`${x},${y}`] || "#ddd";
            div.style.cursor="pointer";

            div.onclick = () => paint(x,y);

            grid.appendChild(div);
        }
    }
}


// =====================
// SEND TRANSACTION
// =====================
function paint(x,y) {

    if (!wallet) {
        alert("Wallet not ready");
        return;
    }

    const color = document.getElementById("color").value;

    const state = {};
    state[0] = `${x},${y}`;
    state[1] = color;

    console.log("Sending...", state);

    MINIMASK.account.send(
        PRICE,
        ADDRESS,
        "0x00",
        state,
        function(resp){

            console.log("RESP:", resp);

            if (resp.pending) {
                alert("Approve in MiniMask");

                setTimeout(loadPixels, 6000);
            } else {
                alert("Error");
            }
        }
    );
}


// =====================
// LOAD PIXELS
// =====================
function loadPixels() {

    MINIMASK.meg.listcoins(ADDRESS,"0x00","",function(resp){

        console.log("LOAD:", resp);

        pixels = {};

        if (!resp || !resp.data) return;

        for (let coin of resp.data) {

            if (!coin.state) continue;

            const pos = coin.state[0];
            const col = coin.state[1];

            if (pos && col) {
                pixels[pos] = col;
            }
        }

        createGrid();
    });
}
