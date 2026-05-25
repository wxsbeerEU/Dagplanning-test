// 1. Firebase configuratie
const firebaseConfig = {
  apiKey: "AIzaSyDj_V67S2djpAWDxMuWk1B9BqFTPvK7mEE",
  authDomain: "topvakantie-game.firebaseapp.com",
  databaseURL: "https://topvakantie-game-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "topvakantie-game",
  storageBucket: "topvakantie-game.firebasestorage.app",
  messagingSenderId: "962032679607",
  appId: "1:962032679607:web:df8a1689af235c61576b32"
};

// 2. Initialiseer Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// JOUW VOLLEDIGE DAGPLANNING IS HIER WEER INTEGRAL TERUG:
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

let betterschedule = [];

function timeToMinutes(hour, minute) {
    return hour * 60 + minute;
}

function timeStringToMinutes(timestr) {
    const [hour, minute] = timestr.split(':').map(Number);
    return timeToMinutes(hour, minute);
}

schedule.forEach(function (item, index, array) {
    const [hour, minute] = item.time.split(':').map(Number);
    let minutes = timeToMinutes(hour, minute);

    let newvalue = { activity: item.activity, startTime: item.time };
    newvalue.startMinutes = minutes;

    if (index === array.length - 1) {
        newvalue.endMinutes = 1439;
        newvalue.endTime = "23:59";
    } else {
        const nextItem = array[index + 1];
        newvalue.endMinutes = timeStringToMinutes(nextItem.time);
        newvalue.endTime = nextItem.time;
    }

    betterschedule.push(newvalue);
});

function createTable() {
    const tbody = document.querySelector('#schedule-table tbody');
    if(!tbody) return;
    tbody.innerHTML = ''; 

    schedule.forEach((item) => {
        const [hour, minute] = item.time.split(':').map(Number);
        const row = document.createElement('tr');
        row.setAttribute('hour', hour);
        row.setAttribute('minute', minute);
        row.classList.add('activity-row');

        const hourStr = String(hour).padStart(2, '0');
        const minuteStr = String(minute).padStart(2, '0');

        const timeCell = document.createElement('td');
        timeCell.classList.add("cell", "cell-time");
        timeCell.innerHTML = `<span class="hour">${hourStr}</span>:${minuteStr}`;
        row.appendChild(timeCell);

        const activityCell = document.createElement('td');
        activityCell.classList.add("cell", "cell-activity");
        activityCell.textContent = item.activity;
        row.appendChild(activityCell);

        tbody.appendChild(row);
    });
}

function highlightCurrentTime() {
    const now = new Date();
    const currentMinutes = timeToMinutes(now.getHours(), now.getMinutes());
    const rows = document.querySelectorAll('tbody tr');

    let highlighted = false;

    rows.forEach((row, index) => {
        const rowHour = parseInt(row.getAttribute('hour'));
        const rowMinute = parseInt(row.getAttribute('minute'));
        const rowMinutes = timeToMinutes(rowHour, rowMinute);

        let nextRowMinutes = 1439; 
        if (index < rows.length - 1) {
            const nextRowHour = parseInt(rows[index + 1].getAttribute('hour'));
            const nextRowMinute = parseInt(rows[index + 1].getAttribute('minute'));
            nextRowMinutes = timeToMinutes(nextRowHour, nextRowMinute);
        }

        if (currentMinutes >= rowMinutes && currentMinutes < nextRowMinutes) {
            row.classList.add('current-activity');
            highlighted = true;
        } else {
            row.classList.remove('current-activity');
        }
    });

    if (!highlighted && rows.length > 0) {
        const firstRowHour = parseInt(rows[0].getAttribute('hour'));
        const firstRowMinute = parseInt(rows[0].getAttribute('minute'));
        const firstRowMinutes = timeToMinutes(firstRowHour, firstRowMinute);
        if (currentMinutes < firstRowMinutes) {
            rows[0].classList.add('current-activity');
        }
    }
}

function updateCurrentTime() {
    const now = new Date();
    const currentMinutes = timeToMinutes(now.getHours(), now.getMinutes());

    const currentTimeText = String(now.getHours()).padStart(2, '0') + ":" + 
                            String(now.getMinutes()).padStart(2, '0') + ":" + 
                            String(now.getSeconds()).padStart(2, '0');

    const timeEl = document.querySelector('#currentTime');
    if(timeEl) timeEl.innerHTML = currentTimeText;

    let activeFound = false;
    betterschedule.forEach(function (item) {
        if (currentMinutes >= item.startMinutes && currentMinutes < item.endMinutes) {
            if(document.querySelector("#currentActivity")) document.querySelector("#currentActivity").innerHTML = item.activity;
            if(document.querySelector("#currentActivityFrom")) document.querySelector("#currentActivityFrom").innerHTML = item.startTime;
            if(document.querySelector("#currentActivityTo")) document.querySelector("#currentActivityTo").innerHTML = item.endTime;
            activeFound = true;
        }
    });

    if (!activeFound) {
        if(document.querySelector("#currentActivity")) document.querySelector("#currentActivity").innerHTML = "Slapen / Vrije tijd";
        if(document.querySelector("#currentActivityFrom")) document.querySelector("#currentActivityFrom").innerHTML = "22:30";
        if(document.querySelector("#currentActivityTo")) document.querySelector("#currentActivityTo").innerHTML = "08:15";
    }
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log("SW error:", err));
}

createTable();
highlightCurrentTime();
setInterval(highlightCurrentTime, 30000);
setInterval(updateCurrentTime, 1000);
updateCurrentTime();

function switchScreen(screenId) {
    document.querySelectorAll('.screen-section').forEach(screen => {
        screen.classList.remove('active-screen');
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active-screen');
    }
}

function switchTab(targetTab) {
    if (targetTab === 'moni') {
        openCodeModal();
        return; 
    }
    executeTabSwitch(targetTab);
}

function executeTabSwitch(targetTab) {
    const tabDeelnemers = document.getElementById('tab-deelnemers');
    const tabGame = document.getElementById('tab-game');
    const tabMoni = document.getElementById('tab-moni');
    
    if (tabDeelnemers) tabDeelnemers.classList.remove('active');
    if (tabGame) tabGame.classList.remove('active');
    if (tabMoni) tabMoni.classList.remove('active');
    
    const activeTabEl = document.getElementById(`tab-${targetTab}`);
    if (activeTabEl) {
        activeTabEl.classList.add('active');
    }

    if (targetTab !== 'game') {
        switchScreen('main-menu');
    }

    const gameContent = document.getElementById('content-game');
    const deelnemersContent = document.getElementById('content-deelnemers');
    const moniContent = document.getElementById('content-moni');

    if (gameContent) gameContent.classList.add('hidden-tab-content');
    if (deelnemersContent) deelnemersContent.classList.add('hidden-tab-content');
    if (moniContent) moniContent.classList.add('hidden-tab-content');

    if (targetTab === 'game' && gameContent) {
        gameContent.classList.remove('hidden-tab-content');
    } else if (targetTab === 'deelnemers' && deelnemersContent) {
        deelnemersContent.classList.remove('hidden-tab-content');
    } else if (targetTab === 'moni' && moniContent) {
        moniContent.classList.remove('hidden-tab-content');
    }
}

function openCodeModal() {
    const modal = document.getElementById('codeModal');
    const input = document.getElementById('modalCodeInput');
    if (modal) modal.classList.remove('hidden');
    if (input) {
        input.value = ''; 
        input.focus();    
    }
}

function closeCodeModal() {
    const modal = document.getElementById('codeModal');
    if (modal) modal.classList.add('hidden');
    executeTabSwitch('deelnemers');
}

async function submitMoniCode() {
    const input = document.getElementById('modalCodeInput');
    const modal = document.getElementById('codeModal');
    const enteredCode = input.value;

    const db = firebase.database();
    const codeRef = db.ref('settings/moniCode');
    
    codeRef.once('value').then((snapshot) => {
        const correctCode = snapshot.val();

        if (enteredCode == correctCode) {
            modal.classList.add('hidden');
            input.value = ''; 
            executeTabSwitch('moni'); 
        } else {
            input.style.borderColor = '#ff4a4a';
            input.value = '';
            input.placeholder = "Onjuiste code!";
            input.focus();
            setTimeout(() => { input.style.borderColor = ''; }, 2000);
        }
    }).catch((error) => {
        console.error("Fout bij ophalen uit database: ", error);
        alert("Er ging iets mis met de verbinding. Probeer het later opnieuw.");
    });
}

let alleTeams = {};
let huidigTeam = localStorage.getItem('huidigKampTeam') || null;

database.ref('teams').on('value', (snapshot) => {
    alleTeams = snapshot.val() || {};
    
    // CONTROLE: Bestaat ons team nog wel?
    if (huidigTeam && (!alleTeams || !alleTeams[huidigTeam])) {
        // Het team is uit de database verwijderd!
        localStorage.removeItem('huidigKampTeam');
        huidigTeam = null;
        alert("Je team is verwijderd door een monitor.");
        location.reload(); // Herlaad de pagina zodat de gebruiker weer moet inloggen
        return; // Stop de functie hier
    }
    
    renderLeaderboard();
    updateGameUI();
});

function loginTeam() {
    const input = document.getElementById('team-name-input');
    if (!input || input.value.trim() === "") return alert("Vul eerst een geldige teamnaam in!");

    const teamNaam = input.value.trim();

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
    const input = document.getElementById('rebus-answer-input');
    const antwoord = input.value.toLowerCase().trim();
    
    if (!antwoord) return;
    if (!huidigTeam) return alert("Log eerst in met een teamnaam!");

    const db = firebase.database();
    
    const rebusSnapshot = await db.ref('rebus/' + antwoord).once('value');
    
    if (!rebusSnapshot.exists()) {
        alert("Helaas, dat is niet de juiste code.");
        input.value = '';
        return;
    }

    const punten = rebusSnapshot.val();
    
    const teamRef = db.ref('teams/' + huidigTeam);
    const teamSnapshot = await teamRef.once('value');
    const teamData = teamSnapshot.val();
    
    if (teamData.opgelost && teamData.opgelost.includes(antwoord)) {
        alert("Dit team heeft deze code al ingevoerd!");
        input.value = '';
        return;
    }

    const nieuweScore = (teamData.score || 0) + punten;
    const nieuweOpgelostLijst = teamData.opgelost ? [...teamData.opgelost, antwoord] : [antwoord];

    try {
        await teamRef.update({
            score: nieuweScore,
            opgelost: nieuweOpgelostLijst
        });
        alert("Goed zo! Je hebt " + punten + " punten verdiend.");
        input.value = '';
    } catch (error) {
        console.error("Fout bij updaten score:", error);
        alert("Er ging iets mis bij het opslaan van je punten.");
    }
}

function updateGameUI() {
    if (!huidigTeam) return;
    
    const loginView = document.getElementById('game-login-view');
    const playView = document.getElementById('game-play-view');
    
    if(loginView) loginView.classList.add('hidden');
    if(playView) playView.classList.remove('hidden');

    const mijnTeamData = alleTeams[huidigTeam] || { score: 0 };
    if(document.getElementById('active-team-display')) document.getElementById('active-team-display').textContent = `Team: ${huidigTeam}`;
    if(document.getElementById('active-score-display')) document.getElementById('active-score-display').textContent = `${mijnTeamData.score} pts`;
}

function renderLeaderboard() {
    const container = document.getElementById('leaderboard-rows');
    if (!container) return;
    container.innerHTML = '';

    let sorteerbareTeams = [];
    for (let team in alleTeams) {
        sorteerbareTeams.push({ naam: team, score: alleTeams[team].score });
    }

    sorteerbareTeams.sort((a, b) => b.score - a.score);

    if (sorteerbareTeams.length === 0) {
        container.innerHTML = '<div class="leaderboard-row" style="font-style: italic; opacity: 0.6; justify-content: center;">Nog geen teams actief...</div>';
        return;
    }

    sorteerbareTeams.forEach((team, index) => {
        const row = document.createElement('div');
        row.classList.add('leaderboard-row');
        row.innerHTML = `<span>${index + 1}. ${team.naam}</span> <strong>${team.score} pts</strong>`;
        container.appendChild(row);
    });
}

if(huidigTeam) {
    updateGameUI();
}

executeTabSwitch('game');

function toggleChatPopup() {
    const popup = document.getElementById('chat-popup');
    if (popup) {
        popup.classList.toggle('hidden');
    }
}

function sendSuggestion() {
    const inputEl = document.getElementById('chat-message-input');
    if (!inputEl) return;
    
    const message = inputEl.value.trim();

    if (message === "") {
        alert("Typ eerst even een berichtje voor je het verstuurt! 😉");
        return;
    }

    let afzender = "Anoniem (Deelnemer/Moni)";
    if (huidigTeam) {
        afzender = "Team: " + huidigTeam;
    }

    const timestamp = new Date().toLocaleString("nl-BE");

    const suggestionData = {
        wie: afzender,
        bericht: message,
        tijd: timestamp
    };

    database.ref('suggesties').push(suggestionData)
    .then(() => {
        alert("Super! Je idee of melding is succesvol verstuurd naar de database. 🎉");
        inputEl.value = ""; 
        toggleChatPopup();  
    })
    .catch((error) => {
        console.error("Firebase chat fout:", error);
        alert("Er ging iets mis bij het versturen. Probeer het opnieuw!");
    });
}
