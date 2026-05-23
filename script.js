// ==========================================================================
//                           DAGPLANNING LOGICA
// ==========================================================================
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

// Algemene schermwissel (Nu bovenaan/veilig geplaatst zodat deze ALTIJD declareert)
function switchScreen(screenId) {
    document.querySelectorAll('.screen-section').forEach(screen => {
        screen.classList.remove('active-screen');
    });

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active-screen');
    }
}

// Opstarten van de basisfuncties bij laden van de pagina
document.addEventListener("DOMContentLoaded", () => {
    createTable();
    highlightCurrentTime();
    setInterval(highlightCurrentTime, 30000);
    setInterval(updateCurrentTime, 1000);
    updateCurrentTime();
    loadLeaderboard();
});


// ==========================================================================
//                           SUPABASE CONFIGURATIE & GAME
// ==========================================================================
const SUPABASE_URL = "https://jshmsmubgpzfstphasoo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_B4O8EAtcYJt04j1ilJ26mg_psPQT3kG"; 

let supabaseClient = null;

// VEILIGHEIDS-CHECK: Mocht de browser opslag blokkeren, vang de fout op zodat de rest blijft werken
try {
    let baseSupabase;
    if (typeof supabase !== 'undefined') {
        baseSupabase = supabase;
    } else if (window.supabase) {
        baseSupabase = window.supabase;
    }

    if (baseSupabase && typeof baseSupabase.createClient === 'function') {
        // We forceren auth storage op 'memory' om de Tracking Prevention blokkade te omzeilen
        supabaseClient = baseSupabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: false // Voorkomt dat Supabase in de geblokkeerde localStorage graaft
            }
        });
    }
} catch (e) {
    console.error("Supabase kon niet veilig starten wegens browser restricties:", e);
}

let currentTeamName = "";
let currentTeamScore = 0;
let isAdmin = false;

// Lijst met oplossingen en de bijbehorende punten per rebus of code
const gameAnswers = {
    "vispaleis": 50,
    "bakpan": 50,
    "cyber": 10,
    "wachtwoord": 20
};

// Universele codecontrole functionaliteit
async function submitSecretCode() {
    if (!supabaseClient) {
        alert("Functie tijdelijk niet beschikbaar door tracking-blokkade van je browser.");
        return;
    }

    const inputField = document.getElementById('secret-code-input');
    if (!inputField) return;
    
    const userTyped = inputField.value.trim().toLowerCase();

    if (!userTyped) {
        alert("Typ eerst een oplossing in!");
        return;
    }

    if (gameAnswers.hasOwnProperty(userTyped)) {
        const pointsWon = gameAnswers[userTyped];

        // 1. Check of deze specifieke code al door dit team is opgelost
        const { data: alreadySolved } = await supabaseClient
            .from('solved_codes')
            .select('*')
            .eq('team_name', currentTeamName)
            .eq('code', userTyped)
            .maybeSingle();

        if (alreadySolved) {
            alert("❌ Dit antwoord hebben jullie al eens ingeleverd!");
            inputField.value = "";
            return;
        }

        // 2. Registreer oplossing in de tabel 'solved_codes'
        await supabaseClient
            .from('solved_codes')
            .insert([{ team_name: currentTeamName, code: userTyped }]);

        // 3. Update score lokaal en live in de database
        currentTeamScore += pointsWon;
        document.getElementById('display-team-score').innerText = currentTeamScore;

        await supabaseClient
            .from('teams')
            .update({ score: currentTeamScore })
            .eq('team_name', currentTeamName);

        alert(`🎉 Correct! "${userTyped}" is juist. +${pointsWon} punten!`);
        inputField.value = ""; 
        loadLeaderboard(); 

    } else {
        alert("❌ Helaas, dat antwoord is niet juist. Kijk nog eens goed of controleer op typfouten!");
    }
}

// Team registratie / login
async function registerOrLoginTeam() {
    if (!supabaseClient) {
        alert("Supabase is geblokkeerd door je browser-beveiliging. Zet 'Tracking Prevention' uit of gebruik een andere browser.");
        return;
    }

    const input = document.getElementById('team-name-input');
    const name = input.value.trim();

    if (!name) {
        alert("Vul een teamnaam in!");
        return;
    }

    // Geheime admin code check
    if (name.toUpperCase() === "ADMIN123") {
        isAdmin = true;
        document.getElementById('game-login-view').classList.add('hidden');
        document.getElementById('game-admin-view').classList.remove('hidden');
        loadAdminPanel();
        return;
    }

    const { data: existingTeam } = await supabaseClient
        .from('teams')
        .select('*')
        .eq('team_name', name)
        .maybeSingle();

    if (existingTeam) {
        currentTeamName = existingTeam.team_name;
        currentTeamScore = existingTeam.score;
    } else {
        const { data: newTeam, error } = await supabaseClient
            .from('teams')
            .insert([{ team_name: name, score: 0 }])
            .select()
            .single();

        if (error) {
            alert("Fout bij aanmaken van team.");
            return;
        }
        currentTeamName = newTeam.team_name;
        currentTeamScore = 0;
    }

    document.getElementById('display-team-name').innerText = currentTeamName;
    document.getElementById('display-team-score').innerText = currentTeamScore;
    
    document.getElementById('game-login-view').classList.add('hidden');
    document.getElementById('game-play-view').classList.remove('hidden');
    
    loadLeaderboard();
}

// Live scorebord inladen en sorteren
async function loadLeaderboard() {
    const leaderboardList = document.getElementById('leaderboard-list');
    if (!leaderboardList || !supabaseClient) return;
    
    const { data: teams, error } = await supabaseClient
        .from('teams')
        .select('team_name', 'score')
        .order('score', { ascending: false });

    if (error || !teams) {
        leaderboardList.innerHTML = `<p style="color:red; text-align:center;">Fout bij laden.</p>`;
        return;
    }

    if (teams.length === 0) {
        leaderboardList.innerHTML = `<p style="text-align:center; color:gray;">Nog geen teams actief.</p>`;
        return;
    }

    leaderboardList.innerHTML = teams.map((team, index) => {
        let medal = index === 0 ? "🥇 " : index === 1 ? "🥈 " : index === 2 ? "🥉 " : "";
        return `
            <div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid rgba(255,255,255,0.1); font-size:0.95rem;">
                <span>${medal}${index + 1}. ${team.team_name}</span>
                <span style="font-weight:bold; color:#58a6ff;">${team.score} pts</span>
            </div>
        `;
    }).join('');
}

// Admin panel opbouwen met actieve knoppen
async function loadAdminPanel() {
    const adminList = document.getElementById('admin-teams-list');
    if (!adminList || !supabaseClient) return;
    
    const { data: teams } = await supabaseClient
        .from('teams')
        .select('*')
        .order('team_name', { ascending: true });

    if (!teams) return;

    adminList.innerHTML = teams.map(team => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(255,255,255,0.03); margin-bottom:5px; border-radius:6px;">
            <span><strong>${team.team_name}</strong> (${team.score} pts)</span>
            <div>
                <button style="padding:5px 10px; background:#da3637; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;" onclick="adjustScore('${team.team_name}', ${team.score}, -10)">-10</button>
                <button style="padding:5px 10px; background:#2ea44f; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;" onclick="adjustScore('${team.team_name}', ${team.score}, 10)">+10</button>
            </div>
        </div>
    `).join('');
}

// Handmatige score-aanpassingen vanuit admin
async function adjustScore(teamName, currentScore, amount) {
    if (!supabaseClient) return;

    const newScore = Math.max(0, currentScore + amount);
    await supabaseClient.from('teams').update({ score: newScore }).eq('team_name', teamName);
    
    loadAdminPanel();
    loadLeaderboard();
}

// Admin uitloggen
function logoutAdmin() {
    isAdmin = false;
    document.getElementById('game-admin-view').classList.add('hidden');
    document.getElementById('game-login-view').classList.remove('hidden');
}
