const dateInput = document.getElementById('date');
const timeSelect = document.getElementById('time');
const bookingForm = document.getElementById('bookingForm');

const masterLoginBtn = document.getElementById('masterLoginBtn');
const masterPanel = document.getElementById('masterPanel');
const newDateInput = document.getElementById('newDateInput');
const newTimeInput = document.getElementById('newTimeInput');
const addTimeBtn = document.getElementById('addTimeBtn');
const masterTimeList = document.getElementById('masterTimeList');
const clearBookingsBtn = document.getElementById('clearBookingsBtn');
const closeMasterBtn = document.getElementById('closeMasterBtn');

const MASTER_PASSWORD = '1234';

const today = new Date();
const year = today.getFullYear();
const month = String(today.getMonth() + 1).padStart(2, '0');
const day = String(today.getDate()).padStart(2, '0');
const todayString = `${year}-${month}-${day}`;

dateInput.setAttribute('min', todayString);
newDateInput.setAttribute('min', todayString);

function getMasterSchedule() {
    const saved = localStorage.getItem('masterScheduleByDate');
    return saved ? JSON.parse(saved) : [];
}

function saveMasterSchedule(schedule) {

    schedule.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    localStorage.setItem('masterScheduleByDate', JSON.stringify(schedule));
    renderMasterPanel();
    updateAvailableTimes();
}

function renderMasterPanel() {
    const schedule = getMasterSchedule();
    masterTimeList.innerHTML = '';

    if (schedule.length === 0) {
        masterTimeList.innerHTML = '<li style="color: #888; font-size: 14px;">Рабочие окна пока не добавлены</li>';
        return;
    }

    schedule.forEach((slot, index) => {
        const li = document.createElement('li');
        li.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: #f9f9f9; margin-bottom: 5px; border-radius: 5px;';
        li.innerHTML = `
            <span><strong>${slot.date}</strong> в <strong>${slot.time}</strong></span>
            <button type="button" data-index="${index}" style="background: none; border: none; color: #ff4d4f; cursor: pointer; font-weight: bold;">Удалить ✕</button>
        `;
        masterTimeList.appendChild(li);
    });
}

function updateAvailableTimes() {
    const selectedDate = dateInput.value;
    const schedule = getMasterSchedule();
    const bookedSlots = JSON.parse(localStorage.getItem('salonBookings')) || [];

    if (!selectedDate) {
        timeSelect.innerHTML = '<option value="" disabled selected>Сначала выберите дату</option>';
        return;
    }

    const timesForDate = schedule.filter(slot => slot.date === selectedDate);

    if (timesForDate.length === 0) {
        timeSelect.innerHTML = '<option value="" disabled selected>На эту дату свободных окон нет</option>';
        return;
    }

    timeSelect.innerHTML = '<option value="" disabled selected>Выберите время</option>';

    timesForDate.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.time;

        const isBooked = bookedSlots.some(
            b => b.date === selectedDate && b.time === slot.time
        );

        if (isBooked) {
            option.disabled = true;
            option.text = `${slot.time} (Занято)`;
        } else {
            option.disabled = false;
            option.text = slot.time;
        }

        timeSelect.appendChild(option);
    });
}

updateAvailableTimes();
dateInput.addEventListener('change', updateAvailableTimes);

masterLoginBtn.addEventListener('click', function(e) {
    e.preventDefault();
    if (masterPanel.style.display === 'block') {
        masterPanel.style.display = 'none';
        return;
    }
    const pass = prompt('Введите пароль мастера:');
    if (pass === MASTER_PASSWORD) {
        masterPanel.style.display = 'block';
        renderMasterPanel();
    } else if (pass !== null) {
        alert('Неверный пароль!');
    }
});

closeMasterBtn.addEventListener('click', () => {
    masterPanel.style.display = 'none';
});

addTimeBtn.addEventListener('click', () => {
    const newDate = newDateInput.value;
    const newTime = newTimeInput.value;

    if (!newDate || !newTime) {
        alert('Выберите и дату, и время!');
        return;
    }

    const schedule = getMasterSchedule();
    const exists = schedule.some(s => s.date === newDate && s.time === newTime);

    if (exists) {
        alert('Такое окно уже добавлено в расписание!');
        return;
    }

    schedule.push({ date: newDate, time: newTime });
    saveMasterSchedule(schedule);
    newTimeInput.value = '';
});

masterTimeList.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
        const indexToRemove = Number(e.target.getAttribute('data-index'));
        const schedule = getMasterSchedule();
        schedule.splice(indexToRemove, 1);
        saveMasterSchedule(schedule);
    }
});

clearBookingsBtn.addEventListener('click', () => {
    if (confirm('Точно очистить все занятые клиентами слоты?')) {
        localStorage.removeItem('salonBookings');
        updateAvailableTimes();
        alert('Все записи сброшены!');
    }
});

bookingForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const selectedDate = dateInput.value;
    const selectedTime = timeSelect.value;

    if (!selectedTime) {
        alert('Пожалуйста, выберите доступное время!');
        return;
    }

    const bookedSlots = JSON.parse(localStorage.getItem('salonBookings')) || [];
    bookedSlots.push({ date: selectedDate, time: selectedTime });
    localStorage.setItem('salonBookings', JSON.stringify(bookedSlots));

    const baseUrl = 'https://forms.yandex.ru/u/6af5a076b9e5ca320535b26b';
    const serviceSelect = document.getElementById('service');
    const serviceText = serviceSelect.options[serviceSelect.selectedIndex].text;

    const params = new URLSearchParams({
        'answer_short_text_9008993737108978': document.getElementById('name').value,
        'answer_short_text_9008993737183462': document.getElementById('phone').value,
        'answer_short_text_9008993737198440': serviceText,
        'answer_short_text_9008993737216126': selectedDate,
        'answer_short_text_9008993737229470': selectedTime
    });

    window.open(`${baseUrl}?${params.toString()}`, '_blank');

    this.reset();
    updateAvailableTimes();
});

