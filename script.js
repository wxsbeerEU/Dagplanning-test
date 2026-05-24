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
        const firstRowMinutes = timeToMinutes(parseInt(rows[0].getAttribute('hour')), parseInt(rows[0].['minute']));
        const firstRowMinute = parseInt(rows[0].getAttribute('minute'));
        const firstRowMinutesCalc = timeToMinutes(parseInt(rows[0].getAttribute('hour')), firstRowMinute);
        if (currentMinutes < firstRowMinutesCalc) {
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

// Service worker registratie voor de gsm-app functionaliteit
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log("SW error:", err));
}

createTable();
highlightCurrentTime();
setInterval(highlightCurrentTime, 30000);
setInterval(updateCurrentTime, 1000);
updateCurrentTime();

// Functie om te wisselen tussen de schermen
function switchScreen(screenId) {
    document.querySelectorAll('.screen-section').forEach(screen => {
        screen.classList.remove('active-screen');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active-screen');
    }
}

// ================= TABBLADEN STRATEGIE MET CUSTOM POP-UP (MONI) =================
function switchTab(targetTab) {
    // Als men naar het Moni-scherm wil, openen we de custom pop-up
    if (targetTab === 'moni') {
        openCodeModal();
        return; 
    }

    // Deelnemers switcht direct
    executeTabSwitch(targetTab);
}

function executeTabSwitch(targetTab) {
    const tabDeelnemers = document.getElementById('tab-deelnemers');
    const tabMoni = document.getElementById('tab-moni');
    
    if (tabDeelnemers) tabDeelnemers.classList.remove('active');
    if (tabMoni) tabMoni.classList.remove('active');
    
    const activeTabEl = document.getElementById(`tab-${targetTab}`);
    if (activeTabEl) {
        activeTabEl.classList.add('active');
    }

    const alleKnoppen = document.querySelectorAll('.cyber-btn');
    alleKnoppen.forEach(knop => {
        if (knop.classList.contains(`${targetTab}-content`)) {
            knop.classList.remove('hidden-tab-content');
        } else {
            knop.classList.add('hidden-tab-content');
        }
    });
}

// Custom Pop-up Acties
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
    
    // Reset visualisatie naar Deelnemers bij annuleren
    const tabDeelnemers = document.getElementById('tab-deelnemers');
    const tabMoni = document.getElementById('tab-moni');
    if (tabDeelnemers) tabDeelnemers.classList.add('active');
    if (tabMoni) tabMoni.classList.remove('active');
}

function submitMoniCode() {
    const input = document.getElementById('modalCodeInput');
    const modal = document.getElementById('codeModal');
    
    // MONI CODE (Nu ingesteld op '1234')
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

// ================= GAME LOGICA (REBUSSEN & SCOREBORD) =================

// De database met geldige rebus-oplossingen en hun respectievelijke puntenwaarde
const rebusOplossingen = {
    "hallo": 10,
    "topvakantie": 20,
    "koksijde": 15,
    "hotelschool": 30,
    "monitors": 10
};

let alleTeams = JSON.parse(localStorage.getItem('kampTeams')) || {};
let huidigTeam = null;

function loginTeam() {
    const input = document.getElementById('team-name-input');
    if (!input || input.value.trim() === "") return alert("Vul eerst een geldige teamnaam in!");

    const teamNaam = input.value.trim();

    // Als de teamnaam nog niet bestaat in de database, maak hem dan onmiddellijk aan
    if (!alleTeams[teamNaam]) {
        alleTeams[teamNaam] = {
            score: 0,
            opgelost: []
        };
        saveTeams();
    }

    huidigTeam = teamNaam;

    // Wissel de spelweergaven om
    document.getElementById('game-login-view').classList.add('hidden');
    document.getElementById('game-play-view').classList.remove('hidden');

    updateGameUI();
}

function submitAnswer() {
    const input = document.getElementById('rebus-answer-input');
    if (!input || input.value.trim() === "") return;

    // Zet de invoer om naar kleine letters om fouten met mobiele hoofdletters te vermijden
    const ingevoerdAntwoord = input.value.trim().toLowerCase();

    if (rebusOplossingen[ingevoerdAntwoord] !== undefined) {
        // Controleer of dit team deze specifieke rebus al eens gekraakt heeft
        if (alleTeams[huidigTeam].opgelost.includes(ingevoerdAntwoord)) {
            alert("Je team heeft deze rebus al eens opgelost! Zoek snel naar een andere.");
            input.value = '';
            return;
        }

        // Voeg punten toe en markeer als opgelost
        const verdiendePunten = rebusOplossingen[ingevoerdAntwoord];
        alleTeams[huidigTeam].score += verdiendePunten;
        alleTeams[huidigTeam].opgelost.push(ingevoerdAntwoord);

        saveTeams();
        updateGameUI();

        alert(`🎉 Super! +${verdiendePunten} punten voor je team!`);
        input.value = '';
    } else {
        alert("❌ Helaas, dat antwoord is onjuist. Kijk nog eens goed naar de rebus!");
        input.value = '';
    }
}

function saveTeams() {
    localStorage.setItem('kampTeams', JSON.stringify(alleTeams));
    renderLeaderboard();
}

function updateGameUI() {
    if (!huidigTeam) return;
    document.getElementById('active-team-display').textContent = `Team: ${huidigTeam}`;
    document.getElementById('active-score-display').textContent = `${alleTeams[huidigTeam].score} pts`;
    renderLeaderboard();
}

function renderLeaderboard() {
    const container = document.getElementById('leaderboard-rows');
    if (!container) return;
    container.innerHTML = '';

    let sorteerbareTeams = [];
    for (let team in alleTeams) {
        sorteerbareTeams.push({ naam: team, score: alleTeams[team].score });
    }

    // Sorteer de teams van de hoogste naar de laagste score
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

// Initialiseer het scorebord direct bij het inladen
renderLeaderboard();

// Zorg dat bij het laden van de pagina meteen de juiste knoppen klaarstaan
switchTab('deelnemers');
