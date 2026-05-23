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
        const firstRowMinutes = timeToMinutes(parseInt(rows[0].getAttribute('hour')), parseInt(rows[0].getAttribute('minute')));
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
    // Verberg alle schermen
    document.querySelectorAll('.screen-section').forEach(screen => {
        screen.classList.remove('active-screen');
    });
    
    // Toon het gekozen scherm
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active-screen');
    }
}

// ==========================================================================
//                           SUPABASE CONFIGURATIE
// ==========================================================================
const SUPABASE_URL = "https://jshmsmubgpzfstphasoo.supabase.co";
const SUPABASE_ANON_KEY = "PLAK_HIER_JOUW_LANGE_ANON_PUBLIC_KEY"; 

// Voorkom dubbele declaratie crash
let supabaseClient;
if (typeof supabase !== 'undefined') {
    supabaseClient = supabase;
} else if (window.supabase) {
    supabaseClient = window.supabase;
}

if (supabaseClient && typeof supabaseClient.createClient === 'function') {
    supabaseClient = supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    // Als er geen bestaande globale variabele is, maken we hem nu veilig aan
    window.supabaseApp = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
    supabaseClient = window.supabaseApp;
}

let currentTeamName = "";
let currentTeamScore = 0;
let isAdmin = false;

// Zorg dat het scorebord laadt zodra de app opstart
document.addEventListener("DOMContentLoaded", () => {
    loadLeaderboard();
});

// ==========================================================================
//                       TEAM REGISTRATIE / LOGIN
// ==========================================================================
async function registerOrLoginTeam() {
    if (!supabaseClient) {
        alert("Supabase is niet correct geladen. Controleer je internetverbinding of scripts.");
        return;
    }

    const input = document.getElementById('team-name-input');
    const name = input.value.trim();

    if (!name) {
        alert("Vul eerst een coole teamnaam in!");
        return;
    }

    // GEHEIME ADMIN LOGIN CHECK
    if (name.toUpperCase() === "ADMIN123") {
        isAdmin = true;
        document.getElementById('game-login-view').classList.add('hidden');
        document.getElementById('game-admin-view').classList.remove('hidden');
        loadAdminPanel();
        return;
    }

    // Check of het team al bestaat in de database
    const { data: existingTeam, error: fetchError } = await supabaseClient
        .from('teams')
        .select('*')
        .eq('team_name', name)
        .maybeSingle();

    if (existingTeam) {
        // Team bestaat al -> Log in en ga verder met bestaande score
        currentTeamName = existingTeam.team_name;
        currentTeamScore = existingTeam.score;
    } else {
        // Nieuw team -> Maak aan in de database
        const { data: newTeam, error: insertError } = await supabaseClient
            .from('teams')
            .insert([{ team_name: name, score: 0 }])
            .select()
            .single();

        if (insertError) {
            alert("Er ging iets mis bij het aanmaken van het team.");
            console.error(insertError);
            return;
        }
        currentTeamName = newTeam.team_name;
        currentTeamScore = 0;
    }

    // Schermen wisselen naar het speelveld
    document.getElementById('display-team-name').innerText = currentTeamName;
    document.getElementById('display-team-score').innerText = currentTeamScore;
    
    document.getElementById('game-login-view').classList.add('hidden');
    document.getElementById('game-play-view').classList.remove('hidden');
    
    loadLeaderboard();
}

// ==========================================================================
//                          REBUS CONTROLEREN
// ==========================================================================
async function checkRebus(rebusNumber, correctAnswer, points) {
    if (!supabaseClient) return;

    const inputField = document.getElementById(`rebus-${rebusNumber}-input`);
    const userAnswer = inputField.value.trim().toLowerCase();

    if (userAnswer === correctAnswer) {
        alert(`🎉 Correct! +${points} punten voor jullie team!`);
        
        // Bereken nieuwe score en update lokaal
        currentTeamScore += points;
        document.getElementById('display-team-score').innerText = currentTeamScore;

        // Verberg de rebuskaart zodat ze hem niet nog een keer kunnen invullen
        document.getElementById(`rebus-${rebusNumber}-container`).classList.add('hidden');

        // Update de score live in Supabase
        await supabaseClient
            .from('teams')
            .update({ score: currentTeamScore })
            .eq('team_name', currentTeamName);

        loadLeaderboard();
    } else {
        alert("❌ Helaas, dat antwoord is niet juist. Probeer het nog eens!");
    }
}

// ==========================================================================
//                          LIVE SCOREBORD INLADEN
// ==========================================================================
async function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList || !supabaseClient) return;
    
    const { data: teams, error } = await supabaseClient
        .from('teams')
        .select('team_name', 'score')
        .order('score', { ascending: false });

    if (error) {
        leaderboardList.innerHTML = `<p style="color:red;">Fout bij laden scores.</p>`;
        return;
    }

    if (teams.length === 0) {
        leaderboardList.innerHTML = `<p style="text-align:center;color:var(--text-muted);">Nog geen teams actief.</p>`;
        return;
    }

    // Bouw de rijen op voor het scorebord
    leaderboardList.innerHTML = teams.map((team, index) => {
        let medal = "";
        if (index === 0) medal = "🥇 ";
        if (index === 1) medal = "🥈 ";
        if (index === 2) medal = "🥉 ";

        return `
            <div class="leaderboard-row">
                <span>${medal}${index + 1}. ${team.team_name}</span>
                <span style="font-weight: bold; color: var(--accent-color);">${team.score} pts</span>
            </div>
        `;
    }).join('');
}

// ==========================================================================
//                          ADMIN PANEL LOGICA
// ==========================================================================
async function loadAdminPanel() {
    const adminList = document.getElementById('admin-teams-list');
    if (!adminList || !supabaseClient) return;
    
    const { data: teams, error } = await supabaseClient
        .from('teams')
        .select('*')
        .order('team_name', { ascending: true });

    if (error || !teams) return;

    adminList.innerHTML = teams.map(team => `
        <div class="admin-row">
            <span><strong>${team.team_name}</strong> (${team.score} pts)</span>
            <div class="admin-btn-group">
                <button class="admin-btn-min" onclick="adjustScore('${team.team_name}', ${team.score}, -10)">-10</button>
                <button class="admin-btn-plus" onclick="adjustScore('${team.team_name}', ${team.score}, 10)">+10</button>
            </div>
        </div>
    `).join('');
}

async function adjustScore(teamName, currentScore, amount) {
    if (!supabaseClient) return;

    const newScore = Math.max(0, currentScore + amount);
    
    await supabaseClient
        .from('teams')
        .update({ score: newScore })
        .eq('team_name', teamName);
        
    loadAdminPanel();
    loadLeaderboard();
}

function logoutAdmin() {
    isAdmin = false;
    document.getElementById('game-admin-view').classList.add('hidden');
    document.getElementById('game-login-view').classList.remove('hidden');
}
