const routes = JSON.parse(localStorage.getItem('routes')) || [];

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
    localStorage.setItem('routes', JSON.stringify(routes));
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
                <button onclick="deleteRoute(${index})">Удалить</button>
            </div>
        `;
        routeList.appendChild(listItem);
    });
}

function deleteRoute(index) {
    routes.splice(index, 1);
    localStorage.setItem('routes', JSON.stringify(routes));
    renderRoutes();
}

// Валидация и обработка времени
// (оставьте существующий код, добавив валидацию)
