// Ticket price constant
const TICKET_PRICE = 0.0000001;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  initMinimask();
  startCountdown();
  loadEntries();
});

function initMinimask() {
  if (typeof MINIMASK !== 'undefined') {
    MINIMASK.init();
    checkStatus();
  }
}

function checkStatus() {
  if (MINIMASK.loggedon) {
    document.getElementById('walletStatus').innerHTML = '✅ Connected';
    document.getElementById('buyBtn').disabled = false;
  } else {
    document.getElementById('walletStatus').innerHTML = '❌ Not Connected';
    document.getElementById('buyBtn').disabled = true;
  }
}

function buyTicket() {
  if (!MINIMASK.loggedon) {
    alert('Please login to Minimask');
    return;
  }

  const ticketCount = parseInt(document.getElementById('ticketCount').value) || 1;
  const totalAmount = (ticketCount * TICKET_PRICE).toFixed(7);

  MINIMASK.account.send({
    address: 'LOTTERY_CONTRACT',
    amount: totalAmount,
    tokenid: 'MINIMA'
  }, function(res) {
    if (res.status) {
      alert('✅ Tickets purchased: ' + ticketCount);
      
      // Add to prize pool
      let currentPool = parseFloat(document.getElementById('prizePool').innerText) || 0;
      currentPool += parseFloat(totalAmount);
      document.getElementById('prizePool').innerText = currentPool.toFixed(7);
      
      // Add entry
      addEntry('You', ticketCount, totalAmount);
      
      document.getElementById('ticketCount').value = '1';
    } else {
      alert('❌ Transaction failed');
    }
  });
}

function addEntry(user, tickets, amount) {
  const entryList = document.getElementById('entries');
  const li = document.createElement('li');
  li.innerHTML = `${user}: ${tickets} tickets (${amount} MINIMA)`;
  entryList.insertBefore(li, entryList.firstChild);
  
  // Update count
  const count = entryList.getElementsByTagName('li').length;
  document.getElementById('entryCount').innerText = count;
  
  // Update total tickets
  let stats = document.getElementById('yourStats').innerText;
  let currentTickets = parseInt(stats) || 0;
  document.getElementById('yourStats').innerText = (currentTickets + tickets) + ' tickets';
}

function loadEntries() {
  // Mock entries
  const mockEntries = [
    { user: '0x123...', tickets: 5, amount: 0.0000005 },
    { user: '0x456...', tickets: 10, amount: 0.0000010 },
    { user: '0x789...', tickets: 3, amount: 0.0000003 }
  ];

  let totalPrizePool = 0;
  mockEntries.forEach(entry => {
    addEntry(entry.user, entry.tickets, entry.amount.toFixed(7));
    totalPrizePool += entry.amount;
  });

  document.getElementById('prizePool').innerText = totalPrizePool.toFixed(7);
}

function startCountdown() {
  function update() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diff = tomorrow - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    document.getElementById('timer').innerText = 
      String(h).padStart(2, '0') + ':' + 
      String(m).padStart(2, '0') + ':' + 
      String(s).padStart(2, '0');
  }
  
  update();
  setInterval(update, 1000);
}
