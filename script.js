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
