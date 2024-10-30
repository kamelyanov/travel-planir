const routes = [];

document.getElementById('routeForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const location = document.getElementById('location').value;
    const arrivalDate = document.getElementById('arrivalDate').value;
    const arrivalTime = document.getElementById('arrivalTime').value;
    const departureTime = document.getElementById('departureTime').value;
    const duration = document.getElementById('duration').value;
    const details = document.getElementById('details').value;
    const editableDuration = document.getElementById('editableDuration').checked;
    const editableDepartureTime = document.getElementById('editableDepartureTime').checked;

    const route = {
        location,
        arrivalDate,
        arrivalTime,
        departureTime,
        duration,
        details,
        editable: {
            duration: editableDuration,
            departureTime: editableDepartureTime,
        }
    };

    routes.push(route);
    renderRoutes();
    this.reset();
});

function renderRoutes() {
    const routeList = document.getElementById('routeList');
    routeList.innerHTML = '';

    routes.forEach((route, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div>
                <strong>${route.location}</strong> | Дата: ${route.arrivalDate} | Время прибытия: ${route.arrivalTime} | Время отправления: ${route.departureTime} | Длительность: ${route.duration}
                ${route.details ? `<div>Примечание: ${route.details}</div>` : ''}
            </div>
        `;

        routeList.appendChild(listItem);
    });
}

// Функция для пересчета времени отправления и длительности
document.getElementById('duration').addEventListener('input', function() {
    const duration = this.value.split(':');
    if (duration.length === 2) {
        const hours = parseInt(duration[0]);
        const minutes = parseInt(duration[1]);
        const arrivalTime = document.getElementById('arrivalTime').value.split(':');
        const arrivalHours = parseInt(arrivalTime[0]);
        const arrivalMinutes = parseInt(arrivalTime[1]);

        if (!isNaN(hours) && !isNaN(minutes)) {
            const departureDate = new Date();
            departureDate.setHours(arrivalHours + hours);
            departureDate.setMinutes(arrivalMinutes + minutes);
            document.getElementById('departureTime').value = departureDate.toTimeString().slice(0, 5);
        }
    }
});

document.getElementById('departureTime').addEventListener('input', function() {
    const departureTime = this.value.split(':');
    const arrivalTime = document.getElementById('arrivalTime').value.split(':');
    const arrivalHours = parseInt(arrivalTime[0]);
    const arrivalMinutes = parseInt(arrivalTime[1]);

    const departureHours = parseInt(departureTime[0]);
    const departureMinutes = parseInt(departureTime[1]);

    if (!isNaN(departureHours) && !isNaN(departureMinutes)) {
        const durationHours = departureHours - arrivalHours;
        const durationMinutes = departureMinutes - arrivalMinutes;

        if (durationMinutes < 0) {
            durationHours--;
            durationMinutes += 60;
        }

        document.getElementById('duration').value = `${durationHours}:${durationMinutes < 10 ? '0' : ''}${durationMinutes}`;
    }
});
