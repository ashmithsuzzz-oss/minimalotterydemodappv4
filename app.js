// Global state
let lotteryState = {
  connected: false,
  loggedIn: false,
  account: null,
  totalTickets: 0,
  userTickets: 0,
  prizePool: 0,
  participants: [],
  winners: [],
  entries: []
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeMinimask();
  startTimer();
  setupNavigation();
  loadLotteryData();
});

// =====================================
// MINIMASK INTEGRATION
// =====================================

function initializeMinimask() {
  if (typeof MINIMASK !== 'undefined') {
    lotteryState.connected = true;
    updateWalletStatus();
    
    // Detect if already logged in
    MINIMASK.init(() => {
      if (MINIMASK.loggedon) {
        lotteryState.loggedIn = true;
        lotteryState.account = MINIMASK.account.get();
        updateWalletStatus();
        loadUserData();
      } else {
        // Extension available but not logged in
        showStatus('Please log in to Minimask to participate', 'error');
        updateWalletStatus();
      }
    });
  } else {
    showStatus('Minimask wallet not detected. Please install Minimask extension.', 'error');
    disableBuyButton();
  }
}

function updateWalletStatus() {
  const statusEl = document.getElementById('walletStatus');
  const buyBtn = document.getElementById('buyBtn');
  
  if (!lotteryState.connected) {
    statusEl.textContent = '❌ Minimask Not Detected';
    buyBtn.disabled = true;
  } else if (!lotteryState.loggedIn) {
    statusEl.textContent = '⚠️ Login to Minimask';
    buyBtn.disabled = true;
  } else {
    statusEl.textContent = `✅ Connected: ${lotteryState.account.substring(0, 8)}...`;
    buyBtn.disabled = false;
  }
}

function disableBuyButton() {
  document.getElementById('buyBtn').disabled = true;
  document.getElementById('ticketAmount').disabled = true;
}

// =====================================
// LOTTERY LOGIC
// =====================================

function loadLotteryData() {
  // Simulate loading data from chain via MINIMASK.meg.listcoins()
  // In real implementation, this would fetch from on-chain data
  
  if (lotteryState.connected && MINIMASK.meg) {
    try {
      MINIMASK.meg.listcoins((coins) => {
        // Parse coin data for lottery entries
        if (coins && coins.length > 0) {
          lotteryState.entries = coins.map((coin, idx) => ({
            id: coin.coinid,
            amount: coin.amount,
            account: coin.address ? coin.address.substring(0, 8) + '...' : 'Unknown',
            timestamp: new Date().toLocaleTimeString()
          }));
          
          // Calculate totals
          lotteryState.totalTickets = lotteryState.entries.length;
          lotteryState.prizePool = lotteryState.entries.reduce((sum, e) => sum + parseInt(e.amount || 0), 0);
          lotteryState.participants = [...new Set(lotteryState.entries.map(e => e.account))].length;
          
          updateUI();
        }
      });
    } catch (e) {
      console.log('Loadings lottery data:', e);
      // Use mock data for demonstration
      generateMockData();
    }
  } else {
    generateMockData();
  }
}

function generateMockData() {
  // Generate realistic mock data for demo purposes
  const mockParticipants = ['0x12ab...', '0x34cd...', '0x56ef...', '0x78gh...', '0x90ij...'];
  lotteryState.entries = mockParticipants.map((addr, idx) => ({
    id: `tx_${idx}`,
    amount: Math.random() > 0.5 ? 5 : 1,
    account: addr,
    timestamp: new Date(Date.now() - Math.random() * 86400000).toLocaleTimeString()
  }));
  
  lotteryState.totalTickets = lotteryState.entries.reduce((sum, e) => sum + e.amount, 0);
  lotteryState.prizePool = lotteryState.totalTickets;
  lotteryState.participants = mockParticipants.length;
  
  // Add some past winners
  lotteryState.winners = [
    { account: mockParticipants[0], prize: 45, date: '2 hours ago' },
    { account: mockParticipants[1], prize: 52, date: '1 day ago' },
    { account: mockParticipants[2], prize: 38, date: '3 days ago' }
  ];
}

function buyTicket() {
  if (!lotteryState.loggedIn) {
    showStatus('Please login to Minimask first', 'error');
    return;
  }
  
  const ticketAmount = parseInt(document.getElementById('ticketAmount').value) || 1;
  
  if (ticketAmount < 1 || ticketAmount > 100) {
    showStatus('Enter between 1 and 100 tickets', 'error');
    return;
  }
  
  const btnEl = document.getElementById('buyBtn');
  btnEl.disabled = true;
  btnEl.textContent = 'Processing...';
  
  // Send transaction via Minimask
  MINIMASK.account.send({
    address: 'LOTTERY_CONTRACT_ADDRESS', // Replace with actual contract
    amount: ticketAmount.toString(),
    data: 'lottery_ticket'
  }, (result) => {
    btnEl.disabled = false;
    btnEl.textContent = 'Buy Ticket';
    
    if (result && result.success) {
      showStatus(`✅ Successfully purchased ${ticketAmount} ticket(s)!`, 'success');
      
      // Update user's tickets
      lotteryState.userTickets += ticketAmount;
      document.getElementById('ticketAmount').value = '1';
      
      // Reload data
      setTimeout(() => {
        loadLotteryData();
        loadUserData();
      }, 1000);
    } else {
      showStatus('❌ Transaction failed. Please try again.', 'error');
    }
  });
}

function loadUserData() {
  if (!lotteryState.loggedIn) return;
  
  // Count user's tickets in entries
  lotteryState.userTickets = lotteryState.entries
    .filter(e => e.account === lotteryState.account.substring(0, 8) + '...')
    .reduce((sum, e) => sum + e.amount, 0);
  
  updateUI();
}

// =====================================
// UI UPDATES
// =====================================

function updateUI() {
  // Prize Pool
  document.getElementById('prizePool').textContent = `${lotteryState.prizePool} MINIMA`;
  document.getElementById('participantCount').textContent = `${lotteryState.participants} participant${lotteryState.participants !== 1 ? 's' : ''}`;
  
  // Entries
  const entriesEl = document.getElementById('entries');
  entriesEl.innerHTML = '';
  
  lotteryState.entries.slice(0, 5).forEach(entry => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${entry.account}</strong> <span>${entry.amount} ticket${entry.amount > 1 ? 's' : ''}</span>`;
    entriesEl.appendChild(li);
  });
  
  if (lotteryState.entries.length === 0) {
    entriesEl.innerHTML = '<li style="color: #999;">No entries yet. Be the first!</li>';
  }
  
  document.getElementById('entryCount').textContent = lotteryState.entries.length;
  
  // User Stats
  const probability = lotteryState.totalTickets > 0 
    ? ((lotteryState.userTickets / lotteryState.totalTickets) * 100).toFixed(2)
    : 0;
  
  document.getElementById('yourStats').textContent = `${lotteryState.userTickets} ticket${lotteryState.userTickets !== 1 ? 's' : ''} purchased`;
  document.getElementById('winProbability').textContent = `${probability}%`;
  
  // My Tickets Tab
  document.getElementById('myTicketsList').textContent = `You have ${lotteryState.userTickets} active ticket${lotteryState.userTickets !== 1 ? 's' : ''} in the lottery.`;
  
  // Winners Tab
  const winnersListEl = document.getElementById('winnersList');
  winnersListEl.innerHTML = '';
  
  if (lotteryState.winners.length > 0) {
    lotteryState.winners.forEach(winner => {
      const li = document.createElement('li');
      li.innerHTML = `🏆 <strong>${winner.account}</strong> won <strong>${winner.prize} MINIMA</strong> ${winner.date}`;
      winnersListEl.appendChild(li);
    });
  } else {
    winnersListEl.innerHTML = '<li style="color: #999;">No winners announced yet</li>';
  }
}

// =====================================
// TIMER
// =====================================

function startTimer() {
  function updateTimer() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const diff = tomorrow - now;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    document.getElementById('timer').textContent = 
      `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // Check if draw time (every 24 hours)
    if (hours === 0 && minutes === 0 && seconds === 0) {
      announceLotteryWinner();
    }
  }
  
  updateTimer();
  setInterval(updateTimer, 1000);
}

// =====================================
// WINNER ANNOUNCEMENT
// =====================================

function announceLotteryWinner() {
  if (lotteryState.totalTickets === 0) return;
  
  // Select random winner based on ticket probability
  let randomValue = Math.random() * lotteryState.totalTickets;
  let winner = null;
  
  for (let entry of lotteryState.entries) {
    randomValue -= entry.amount;
    if (randomValue <= 0) {
      winner = entry;
      break;
    }
  }
  
  if (winner) {
    showWinner(winner, lotteryState.prizePool);
    
    // Add to winners list
    lotteryState.winners.unshift({
      account: winner.account,
      prize: lotteryState.prizePool,
      date: 'just now'
    });
    
    // Reset lottery
    lotteryState.entries = [];
    lotteryState.totalTickets = 0;
    lotteryState.prizePool = 0;
    lotteryState.participants = 0;
    updateUI();
  }
}

function showWinner(winner, prize) {
  const modal = document.getElementById('winnerPopup');
  document.getElementById('winnerText').textContent = `🎉 ${winner.account} has won!`;
  document.getElementById('winnerAmount').textContent = `Prize: ${prize} MINIMA`;
  modal.classList.remove('hidden');
  
  // Auto-close after 8 seconds
  setTimeout(() => {
    closeWinner();
  }, 8000);
}

function closeWinner() {
  document.getElementById('winnerPopup').classList.add('hidden');
}

// =====================================
// STATUS MESSAGES
// =====================================

function showStatus(message, type = 'success') {
  const msgEl = document.getElementById('statusMessage');
  msgEl.textContent = message;
  msgEl.className = `status-message ${type === 'error' ? 'error' : ''}`;
  msgEl.classList.remove('hidden');
  
  setTimeout(() => {
    msgEl.classList.add('hidden');
  }, 4000);
}

// =====================================
// NAVIGATION
// =====================================

function setupNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item, idx) => {
    item.addEventListener('click', () => {
      switchTab(['home', 'tickets', 'winners', 'info'][idx]);
    });
  });
}

function switchTab(tabName) {
  // Hide all tabs
  document.getElementById('tickets-tab').classList.add('hidden');
  document.getElementById('winners-tab').classList.add('hidden');
  document.getElementById('info-tab').classList.add('hidden');
  document.querySelector('.app').style.display = tabName === 'home' ? 'block' : 'none';
  
  // Update nav
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  if (tabName === 'home') {
    document.querySelectorAll('.nav-item')[0].classList.add('active');
  } else if (tabName === 'tickets') {
    document.querySelectorAll('.nav-item')[1].classList.add('active');
    document.getElementById('tickets-tab').classList.remove('hidden');
  } else if (tabName === 'winners') {
    document.querySelectorAll('.nav-item')[2].classList.add('active');
    document.getElementById('winners-tab').classList.remove('hidden');
  } else if (tabName === 'info') {
    document.querySelectorAll('.nav-item')[3].classList.add('active');
    document.getElementById('info-tab').classList.remove('hidden');
  }
}
