// Firebase configuratie van jouw project
const firebaseConfig = {
  apiKey: "AIzaSyDj_V67S2djpAWDxMuWk1B9BqFTPvK7mEE",
  authDomain: "topvakantie-game.firebaseapp.com",
  databaseURL: "https://topvakantie-game-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "topvakantie-game",
  storageBucket: "topvakantie-game.firebasestorage.app",
  messagingSenderId: "962032679607",
  appId: "1:962032679607:web:df8a1689af235c61576b32"
};

// Initialiseer Firebase via de compat SDK
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

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

    // Als er op de Game-tab wordt geklikt, openen we direct het game-scherm
    if (targetTab === 'game') {
        switchScreen('game-screen');
    } else {
        // Zorg dat we terug naar het hoofdmenu gaan als de andere tabbladen worden geklikt
        switchScreen('main-menu');

        const alleKnoppen = document.querySelectorAll('.cyber-btn');
        alleKnoppen.forEach(knop => {
            if (knop.classList.contains(`${targetTab}-content`)) {
                knop.classList.remove('hidden-tab-content');
            } else {
                knop.classList.add('hidden-tab-content');
            }
        });
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
    
    const tabDeelnemers = document.getElementById('tab-deelnemers');
    const tabGame = document.getElementById('tab-game');
    const tabMoni = document.getElementById('tab-moni');
    if (tabDeelnemers) tabDeelnemers.classList.add('active');
    if (tabGame) tabGame.classList.remove('active');
    if (tabMoni) tabMoni.classList.remove('active');
}

function submitMoniCode() {
    const input = document.getElementById('modalCodeInput');
    const modal = document.getElementById('codeModal');
    
    if (input && input.value === '1234') {
        if (modal) modal.classList.add('hidden');
        executeTabSwitch('moni'); 
    } else {
        if (input) {
            input.style.borderColor = '#ff4a4a';
            input.value = '';
            input.placeholder = "Onjuiste code! Probeer opnieuw...";
            input.focus();
            
            input.addEventListener('input', () => {
                input.style.borderColor = '';
                input.placeholder = "Wachtwoord...";
            }, { once: true });
        }
    }
}

// ================= REALTIME GAME LOGICA VIA FIREBASE =================

const rebusOplossingen = {
    "hallo": 10,
    "topvakantie": 20,
    "koksijde": 15,
    "hotelschool": 30,
    "monitors": 10
};

let alleTeams = {};
let huidigTeam = localStorage.getItem('huidigKampTeam') || null;

// Luister live naar updates uit de Firebase Cloud
database.ref('teams').on('value', (snapshot) => {
    alleTeams = snapshot.val() || {};
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

    document.getElementById('game-login-view').classList.add('hidden');
    document.getElementById('game-play-view').classList.remove('hidden');

    updateGameUI();
}

function submitAnswer() {
    const input = document.getElementById('rebus-answer-input');
    if (!input || input.value.trim() === "") return;

    const ingevoerdAntwoord = input.value.trim().toLowerCase();

    if (rebusOplossingen[ingevoerdAntwoord] !== undefined) {
        let teamData = alleTeams[huidigTeam] || { score: 0, opgelost: [] };
        if (!teamData.opgelost) teamData.opgelost = [];

        if (teamData.opgelost.includes(ingevoerdAntwoord)) {
            alert("Je team heeft deze rebus al eens opgelost! Zoek snel naar een andere.");
            input.value = '';
            return;
        }

        const verdiendePunten = rebusOplossingen[ingevoerdAntwoord];
        const nieuweScore = teamData.score + verdiendePunten;
        teamData.opgelost.push(ingevoerdAntwoord);

        database.ref('teams/' + huidigTeam).update({
            score: nieuweScore,
            opgelost: teamData.opgelost
        });

        alert(`🎉 Super! +${verdiendePunten} punten voor je team!`);
        input.value = '';
    } else {
        alert("❌ Helaas, dat antwoord is onjuist. Kijk nog eens goed naar de rebus!");
        input.value = '';
    }
}

function updateGameUI() {
    if (!huidigTeam) return;
    
    document.getElementById('game-login-view').classList.add('hidden');
    document.getElementById('game-play-view').classList.remove('hidden');

    const mijnTeamData = alleTeams[huidigTeam] || { score: 0 };
    document.getElementById('active-team-display').textContent = `Team: ${huidigTeam}`;
    document.getElementById('active-score-display').textContent = `${mijnTeamData.score} pts`;
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
        container.innerHTML = '<div style="font-style: italic; opacity: 0.6; text-align: center; padding: 10px 0;">Nog geen teams actief...</div>';
        return;
    }

    sorteerbareTeams.forEach((team, index) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.justifyContent = 'space-between';
        row.style.padding = '6px 10px';
        row.style.background = 'rgba(255,255,255,0.05)';
        row.style.borderRadius = '4px';
        row.innerHTML = `<span>${index + 1}. ${team.naam}</span> <strong>${team.score} pts</strong>`;
        container.appendChild(row);
    });
}

if(huidigTeam) {
    updateGameUI();
}

switchTab('deelnemers');


// ================= CHAT / SUGGESTIE LOGICA (FIREBASE) =================

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

    // Als de gebruiker is ingelogd met een teamnaam bij het spel, sturen we die mee als afzender
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

    // Pushen naar de 'suggesties' node in jouw database
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
