// Данные о тарифах
const tariffs = [
    {
        id: 'start',
        title: 'Тарифный план «Стартовый»',
        client_base: 'До 4000',
        price: 4900
    },
    {
        id: 'business',
        title: 'Тарифный план «Бизнес»',
        client_base: 'До 12000',
        price: 12000
    },
    {
        id: 'optimal_24',
        title: 'Тарифный план «Оптимальный»',
        client_base: 'До 24000',
        price: 24000
    },
    {
        id: 'optimal_36',
        title: 'Тарифный план «Оптимальный»',
        client_base: 'До 36000',
        price: 36000
    },
    {
        id: 'optimal_48',
        title: 'Тарифный план «Оптимальный»',
        client_base: 'До 48000',
        price: 48000
    },
    {
        id: 'optimal_60',
        title: 'Тарифный план «Оптимальный»',
        client_base: 'До 60000',
        price: 60000
    },
    {
        id: 'enterprise',
        title: 'Тарифный план «Энтерпрайз»',
        client_base: 'Свыше 60000',
        price: 70000
    }
];

// Загрузка данных о звонке
function loadCallData() {
    const savedData = localStorage.getItem('callData');
    if (savedData) {
        const callData = JSON.parse(savedData);
        renderCallSummary(callData);
    }
}

// Отрисовка итогов звонка
function renderCallSummary(callData) {
    const summaryContainer = document.getElementById('call-summary');
    
    // Определяем выбранный тариф на основе размера базы клиентов
    let selectedTariff = null;
    let clientCount = 0;
    
    // Ищем информацию о размере базы клиентов в логах
    callData.stages.forEach(stage => {
        if (stage.text.includes('клиентов')) {
            const match = stage.text.match(/(\d+)\s+клиент/);
            if (match) {
                clientCount = parseInt(match[1]);
            }
        }
    });
    
    // Выбираем тариф на основе размера базы
    if (clientCount <= 4000) {
        selectedTariff = tariffs.find(t => t.id === 'start');
    } else if (clientCount <= 12000) {
        selectedTariff = tariffs.find(t => t.id === 'business');
    } else if (clientCount <= 24000) {
        selectedTariff = tariffs.find(t => t.id === 'optimal_24');
    } else if (clientCount <= 36000) {
        selectedTariff = tariffs.find(t => t.id === 'optimal_36');
    } else if (clientCount <= 48000) {
        selectedTariff = tariffs.find(t => t.id === 'optimal_48');
    } else if (clientCount <= 60000) {
        selectedTariff = tariffs.find(t => t.id === 'optimal_60');
    } else {
        selectedTariff = tariffs.find(t => t.id === 'enterprise');
    }
    
    // Обновляем итоговую стоимость в боковой панели
    document.getElementById('total-price').textContent = selectedTariff.price;
    
    // Отображаем итоги звонка
    summaryContainer.innerHTML = `
        <div class="summary-item">
            <div class="label">Размер базы клиентов:</div>
            <div class="value">${clientCount} клиентов</div>
        </div>
        <div class="summary-item">
            <div class="label">Рекомендуемый тариф:</div>
            <div class="value">${selectedTariff.title}</div>
        </div>
    `;

    // Отрисовываем интерактивные карточки тарифов
    renderTariffCards(selectedTariff.id); // Вызываем новую функцию отрисовки карточек
}

// Отрисовка интерактивных карточек тарифов
function renderTariffCards(recommendedTariffId) {
     const container = document.getElementById('tariff-cards-container');
     container.innerHTML = ''; // Очищаем контейнер перед отрисовкой

     tariffs.forEach(tariff => {
         const card = document.createElement('div');
         card.className = `tariff-card ${tariff.id === recommendedTariffId ? 'selected' : ''}`;
         card.innerHTML = `
             <div class="title">${tariff.title}</div>
             <div class="price">${tariff.price} <small>₽/мес</small></div>
             <div class="features">
                 <ul>
                      <li><i class="fas fa-users"></i>${tariff.client_base} клиентов в базе</li>
                      <!-- Добавьте другие общие функции, если необходимо -->
                 </ul>
             </div>
         `;

         // Добавляем обработчик клика для выбора тарифа
         card.onclick = () => {
             // Убираем выделение со всех карточек
             document.querySelectorAll('.tariff-card').forEach(c => c.classList.remove('selected'));
             // Выделяем выбранную карточку
             card.classList.add('selected');
             // Обновляем итоговую стоимость в боковой панели
             document.getElementById('total-price').textContent = tariff.price;

             // Здесь можно добавить сохранение выбранного тарифа, если нужно
             // const callData = JSON.parse(localStorage.getItem('callData') || '{}');
             // callData.selectedTariff = tariff.id;
             // localStorage.setItem('callData', JSON.stringify(callData));
         };

         container.appendChild(card);
     });
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadCallData();
}); 