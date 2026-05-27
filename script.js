// ==========================================
// 1. FIREBASE CONFIGURATIE & INITIALISATIE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDj_V67S2djpAWDxMuWk1B9BqFTPvK7mEE",
  authDomain: "topvakantie-game.firebaseapp.com",
  databaseURL: "https://topvakantie-game-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "topvakantie-game",
  storageBucket: "topvakantie-game.firebasestorage.app",
  messagingSenderId: "962032679607",
  appId: "1:962032679607:web:df8a1689af235c61576b32"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ==========================================
// 2. STATE & PLANNING DATA
// ==========================================
const schedule = [
  { time: '08:15', activity: 'Opstaan' },
  { time: '08:30', activity: 'Ochtendeten' },
  { time: '09:15', activity: 'Lesmoment 1' },
  { time: '10:45', activity: 'Pauze' },
  { time: '11:05', activity: 'Lesmoment 2' },
  { time: '12:30', activity: 'Middageten - Vrije tijd' },
  { time: '13:45', activity: 'Lesmoment 3' },
  { time: '15:15', activity: 'Pauze' },
  { time: '15:20', activity: 'Namiddagactiviteit' },
  { time: '17:45', activity: 'Vrije tijd' },
  { time: '18:30', activity: 'Avondeten - Vrije tijd' },
  { time: '19:45', activity: 'Avondactiviteit' },
  { time: '21:30', activity: 'Vrije tijd - Bar' },
  { time: '22:00', activity: 'Niet meer douchen' },
  { time: '22:00', activity: 'Iedereen naar de kamers' },
  { time: '22:30', activity: 'Lichten uit - Slapen' }
];

const betterSchedule = [];
let alleTeams = {};
let huidigTeam = localStorage.getItem('huidigKampTeam') || null;

// Cache veelgebruikte DOM-elementen voor betere prestaties
const DOM = {
  tbody: document.querySelector('#schedule-table tbody'),
  currentTime: document.getElementById('currentTime'),
  currentActivity: document.getElementById('currentActivity'),
  currentActivityFrom: document.getElementById('currentActivityFrom'),
  currentActivityTo: document.getElementById('currentActivityTo'),
  codeModal: document.getElementById('codeModal'),
  modalCodeInput: document.getElementById('modalCodeInput'),
  teamNameInput: document.getElementById('team-name-input'),
  rebusAnswerInput: document.getElementById('rebus-answer-input'),
  leaderboardRows: document.getElementById('leaderboard-rows'),
  chatMessageInput: document.getElementById('chat-message-input'),
  chatPopup: document.getElementById('chat-popup'),
  gameLoginView: document.getElementById('game-login-view'),
  gamePlayView: document.getElementById('game-play-view'),
  activeTeamDisplay: document.getElementById('active-team-display'),
  activeScoreDisplay: document.getElementById('active-score-display')
};

// ==========================================
// 3. HELPER FUNCTIES (TIJD)
// ==========================================
const parseTimeStr = (timeStr) => timeStr.split(':').map(Number);
const timeToMinutes = (hour, minute) => hour * 60 + minute;
const timeStringToMinutes = (timeStr) => {
  const [hour, minute] = parseTimeStr(timeStr);
  return timeToMinutes(hour, minute);
};

// Genereer de betere planning structuur
schedule.forEach((item, index, array) => {
  const minutes = timeStringToMinutes(item.time);
  const newValue = { activity: item.activity, startTime: item.time, startMinutes: minutes };

  if (index === array.length - 1) {
    newValue.endMinutes = 1439; // Tot 23:59
    newValue.endTime = "23:59";
  } else {
    const nextTime = array[index + 1].time;
    newValue.endMinutes = timeStringToMinutes(nextTime);
    newValue.endTime = nextTime;
  }
  betterSchedule.push(newValue);
});

// ==========================================
// 4. UI LOGICA & TIMERS
// ==========================================
function createTable() {
  if (!DOM.tbody) return;
  DOM.tbody.innerHTML = '';

  schedule.forEach((item) => {
    const [hour, minute] = parseTimeStr(item.time);
    const row = document.createElement('tr');
    row.dataset.hour = hour;
    row.dataset.minute = minute;
    row.classList.add('activity-row');

    const hourStr = String(hour).padStart(2, '0');
    const minuteStr = String(minute).padStart(2, '0');

    row.innerHTML = `
      <td class="cell cell-time"><span class="hour">${hourStr}</span>:${minuteStr}</td>
      <td class="cell cell-activity">${item.activity}</td>
    `;
    DOM.tbody.appendChild(row);
  });
}

function highlightCurrentTime() {
  const now = new Date();
  const currentMinutes = timeToMinutes(now.getHours(), now.getMinutes());
  const rows = document.querySelectorAll('#schedule-table tbody tr');
  let highlighted = false;

  rows.forEach((row, index) => {
    const rowMinutes = timeToMinutes(parseInt(row.dataset.hour), parseInt(row.dataset.minute));
    let nextRowMinutes = 1439;

    if (index < rows.length - 1) {
      const nextRow = rows[index + 1];
      nextRowMinutes = timeToMinutes(parseInt(nextRow.dataset.hour), parseInt(nextRow.dataset.minute));
    }

    if (currentMinutes >= rowMinutes && currentMinutes < nextRowMinutes) {
      row.classList.add('current-activity');
      highlighted = true;
    } else {
      row.classList.remove('current-activity');
    }
  });

  // Indien vóór de eerste activiteit van de dag, highlight de eerste rij
  if (!highlighted && rows.length > 0) {
    const firstRowMinutes = timeToMinutes(parseInt(rows[0].dataset.hour), parseInt(rows[0].dataset.minute));
    if (currentMinutes < firstRowMinutes) {
      rows[0].classList.add('current-activity');
    }
  }
}

function updateCurrentTime() {
  const now = new Date();
  const currentMinutes = timeToMinutes(now.getHours(), now.getMinutes());

  if (DOM.currentTime) {
    DOM.currentTime.textContent = now.toLocaleTimeString('nl-BE', { hour12: false });
  }

  let activeItem = betterSchedule.find(item => currentMinutes >= item.startMinutes && currentMinutes < item.endMinutes);

  if (activeItem) {
    if (DOM.currentActivity) DOM.currentActivity.textContent = activeItem.activity;
    if (DOM.currentActivityFrom) DOM.currentActivityFrom.textContent = activeItem.startTime;
    if (DOM.currentActivityTo) DOM.currentActivityTo.textContent = activeItem.endTime;
  } else {
    if (DOM.currentActivity) DOM.currentActivity.textContent = "Slapen / Vrije tijd";
    if (DOM.currentActivityFrom) DOM.currentActivityFrom.textContent = "22:30";
    if (DOM.currentActivityTo) DOM.currentActivityTo.textContent = "08:15";
  }
}

// Navigatie schermen en tabs
function switchScreen(screenId) {
  document.querySelectorAll('.screen-section').forEach(screen => {
    screen.classList.remove('active-screen');
  });
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) targetScreen.classList.add('active-screen');
}

function switchTab(targetTab) {
  if (targetTab === 'moni') {
    openCodeModal();
    return;
  }
  executeTabSwitch(targetTab);
}

function executeTabSwitch(targetTab) {
  ['deelnemers', 'game', 'moni'].forEach(tab => {
    const tabEl = document.getElementById(`tab-${tab}`);
    const contentEl = document.getElementById(`content-${tab}`);
    
    if (tabEl) tabEl.classList.toggle('active', tab === targetTab);
    if (contentEl) contentEl.classList.toggle('hidden-tab-content', tab !== targetTab);
  });

  if (targetTab !== 'game') {
    switchScreen('main-menu');
  }
}

// Modal functionaliteit
function openCodeModal() {
  if (DOM.codeModal) DOM.codeModal.classList.remove('hidden');
  if (DOM.modalCodeInput) {
    DOM.modalCodeInput.value = '';
    DOM.modalCodeInput.focus();
  }
}

function closeCodeModal() {
  if (DOM.codeModal) DOM.codeModal.classList.add('hidden');
  executeTabSwitch('deelnemers');
}

// ==========================================
// 5. FIREBASE ACTIES & EVENT HANDLERS
// ==========================================
async function submitMoniCode() {
  if (!DOM.modalCodeInput || !DOM.codeModal) return;
  const enteredCode = DOM.modalCodeInput.value;

  try {
    const snapshot = await database.ref('settings/moniCode').once('value');
    const correctCode = snapshot.val();

    if (enteredCode == correctCode) {
      DOM.codeModal.classList.add('hidden');
      DOM.modalCodeInput.value = '';
      executeTabSwitch('moni');
    } else {
      DOM.modalCodeInput.style.borderColor = '#ff4a4a';
      DOM.modalCodeInput.value = '';
      DOM.modalCodeInput.placeholder = "Onjuiste code!";
      DOM.modalCodeInput.focus();
      setTimeout(() => { DOM.modalCodeInput.style.borderColor = ''; }, 2000);
    }
  } catch (error) {
    console.error("Fout bij ophalen uit database: ", error);
    alert("Er ging iets mis met de verbinding. Probeer het later opnieuw.");
  }
}

// Real-time luisteraar voor teams
database.ref('teams').on('value', (snapshot) => {
  alleTeams = snapshot.val() || {};

  if (huidigTeam && !alleTeams[huidigTeam]) {
    localStorage.removeItem('huidigKampTeam');
    huidigTeam = null;
    alert("Je team is verwijderd door een monitor.");
    location.reload();
    return;
  }

  renderLeaderboard();
  updateGameUI();
});

function loginTeam() {
  if (!DOM.teamNameInput) return;
  const teamNaam = DOM.teamNameInput.value.trim();
  if (teamNaam === "") return alert("Vul eerst een geldige teamnaam in!");

  if (!alleTeams[teamNaam]) {
    database.ref('teams/' + teamNaam).set({
      score: 0,
      opgelost: ["init"]
    });
  }

  huidigTeam = teamNaam;
  localStorage.setItem('huidigKampTeam', teamNaam);
  updateGameUI();
}

async function submitAnswer() {
  if (!DOM.rebusAnswerInput) return;
  const antwoord = DOM.rebusAnswerInput.value.toLowerCase().trim();

  if (!antwoord) return;
  if (!huidigTeam) return alert("Log eerst in met een teamnaam!");

  try {
    const rebusSnapshot = await database.ref('rebus/' + antwoord).once('value');

    if (!rebusSnapshot.exists()) {
      alert("Helaas, dat is niet de juiste code.");
      DOM.rebusAnswerInput.value = '';
      return;
    }

    const punten = rebusSnapshot.val();
    const teamRef = database.ref('teams/' + huidigTeam);
    const teamSnapshot = await teamRef.once('value');
    const teamData = teamSnapshot.val() || {};

    if (teamData.opgelost && teamData.opgelost.includes(antwoord)) {
      alert("Dit team heeft deze code al ingevoerd!");
      DOM.rebusAnswerInput.value = '';
      return;
    }

    const nieuweScore = (teamData.score || 0) + punten;
    const nieuweOpgelostLijst = teamData.opgelost ? [...teamData.opgelost, antwoord] : [antwoord];

    await teamRef.update({
      score: nieuweScore,
      opgelost: nieuweOpgelostLijst
    });

    alert(`Goed zo! Je hebt ${punten} punten verdiend.`);
    DOM.rebusAnswerInput.value = '';
  } catch (error) {
    console.error("Fout bij updaten score:", error);
    alert("Er ging iets mis bij het opslaan van je punten.");
  }
}

function updateGameUI() {
  if (!huidigTeam) return;

  if (DOM.gameLoginView) DOM.gameLoginView.classList.add('hidden');
  if (DOM.gamePlayView) DOM.gamePlayView.classList.remove('hidden');

  const mijnTeamData = alleTeams[huidigTeam] || { score: 0 };
  if (DOM.activeTeamDisplay) DOM.activeTeamDisplay.textContent = `Team: ${huidigTeam}`;
  if (DOM.activeScoreDisplay) DOM.activeScoreDisplay.textContent = `${mijnTeamData.score} pts`;
}

function renderLeaderboard() {
  if (!DOM.leaderboardRows) return;
  DOM.leaderboardRows.innerHTML = '';

  const sorteerbareTeams = Object.keys(alleTeams).map(name => ({
    naam: name,
    score: alleTeams[name].score || 0
  })).sort((a, b) => b.score - a.score);

  if (sorteerbareTeams.length === 0) {
    DOM.leaderboardRows.innerHTML = '<div class="leaderboard-row" style="font-style: italic; opacity: 0.6; justify-content: center;">Nog geen teams actief...</div>';
    return;
  }

  sorteerbareTeams.forEach((team, index) => {
    const row = document.createElement('div');
    row.classList.add('leaderboard-row');
    row.innerHTML = `<span>${index + 1}. ${team.naam}</span> <strong>${team.score} pts</strong>`;
    DOM.leaderboardRows.appendChild(row);
  });
}

function toggleChatPopup() {
  if (DOM.chatPopup) DOM.chatPopup.classList.toggle('hidden');
}

async function sendSuggestion() {
  if (!DOM.chatMessageInput) return;
  const message = DOM.chatMessageInput.value.trim();

  if (message === "") {
    alert("Typ eerst even een berichtje voor je het verstuurt! 😉");
    return;
  }

  const afzender = huidigTeam ? `Team: ${huidigTeam}` : "Anoniem (Deelnemer/Moni)";
  const timestamp = new Date().toLocaleString("nl-BE");

  const suggestionData = {
    wie: afzender,
    bericht: message,
    tijd: timestamp
  };

  try {
    await database.ref('suggesties').push(suggestionData);
    alert("Super! Je idee of melding is succesvol verstuurd naar de database. 🎉");
    DOM.chatMessageInput.value = "";
    toggleChatPopup();
  } catch (error) {
    console.error("Firebase chat fout:", error);
    alert("Er ging iets mis bij het versturen. Probeer het opnieuw!");
  }
}

// ==========================================
// 6. INITIALISATIE & RUN
// ==========================================
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(err => console.log("SW error:", err));
}

// Start de applicatie
createTable();
highlightCurrentTime();
updateCurrentTime();

// Start Timers
setInterval(highlightCurrentTime, 30000);
setInterval(updateCurrentTime, 1000);

if (huidigTeam) {
  updateGameUI();
}

executeTabSwitch('game');
