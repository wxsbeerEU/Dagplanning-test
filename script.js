const schedule = [
    { time: '8:15', activity: 'Opstaan' },
    { time: '8:30', activity: 'Ochtendeten' },
    { time: '9:15', activity: 'Lesmoment 1' },
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
    { time: '22:00', activity: 'Iedereen gaan slapen' },
    { time: '22:30', activity: 'Lichten uit en in bed blijven kkr sukkels' }
];

let betterschedule = [];

schedule.forEach(function (item, index, array) {
    const [hour, minute] = item.time.split(':').map(Number);
    let minutes = timeToMinutes(hour, minute);

    let newvalue = { activity: item.activity, startTime: item.time };

    newvalue.startMinutes = minutes;

    const nextItem = array[(index + 1) % array.length]

    const nextMinutes = timeStringToMinutes(nextItem.time);

    newvalue.endMinutes = nextMinutes;

    newvalue.endTime = nextItem.time;

    betterschedule.push(newvalue);
})

function timeStringToMinutes(timestr) {
    const [hour, minute] = timestr.split(':').map(Number);
    return timeToMinutes(hour, minute);
}

function minutesToTimeString(minutes) {
    const hour = minutes / 60;
    const minute = minutes % 60;

    const hourStr = String(hour).padStart(2, '0')
    const minuteStr = String(minute).padStart(2, '0')

    return hourStr + ":" + minuteStr;
}

function createTable() {
    const tbody = document.querySelector('#schedule-table tbody');
    schedule.forEach((item, index) => {
        const [hour, minute] = item.time.split(':').map(Number);
        const row = document.createElement('tr');
        row.setAttribute('hour', hour);
        row.setAttribute('minute', minute);
        row.classList.add('activity');

        const hourStr = String(hour).padStart(2, '0'); // zorgt ervoor dat uur 5 -> 05
        const minuteStr = String(minute).padStart(2, '0'); // zorgt ervoor dat minuut 2 -> 02

        const timeCell = document.createElement('td');
        timeCell.classList.add("cell")
        timeCell.classList.add("cell-time")
        timeCell.innerHTML = `<span class="hour">${hourStr}</span>:<span class="minute">${minuteStr}</span>`;
        row.appendChild(timeCell);

        const activityCell = document.createElement('td');
        activityCell.classList.add("cell")
        activityCell.classList.add("cell-activity")
        activityCell.textContent = item.activity;
        row.appendChild(activityCell);

        tbody.appendChild(row);
    });
}

function timeToMinutes(hour, minute) {
    return hour * 60 + minute;
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

        let nextRowMinutes = Infinity;
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

    // If no row is highlighted and the time is after the last schedule item
    if (!highlighted) {
        const lastRow = rows[rows.length - 1];
        lastRow.classList.add('current-activity');
    }
}

function updateCurrentTime() {
    const now = new Date()
    const currentMinutes = timeToMinutes(now.getHours(), now.getMinutes())
    const currentTimeText = String(now.getHours()).padStart(2, '0') + ":" + String(now.getMinutes()).padStart(2, '0') + ":" + String(now.getSeconds()).padStart(2, '0');

    document.querySelector('#currentTime').innerHTML = currentTimeText;

    betterschedule.forEach(function (item, index, array) {
        if (currentMinutes <= item.endMinutes && currentMinutes >= item.startMinutes) {
            // this is the current item

            document.querySelector("#currentActivity").innerHTML = item.activity;
            document.querySelector("#currentActivityFrom").innerHTML = item.startTime;
            document.querySelector("#currentActivityTo").innerHTML = item.endTime;
        }

    })
}

// Generate the table on page load
createTable();

// Highlight current time on page load
highlightCurrentTime();

// Check every minute
setInterval(highlightCurrentTime, 60000);
setInterval(updateCurrentTime, 1000);
updateCurrentTime();
