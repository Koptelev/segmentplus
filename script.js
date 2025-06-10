let scenarios = [];
let currentStage = 0;
let history = [];
let currentScenario = 'retail';
let clientData = {
    lprName: "не указано",
    companyName: "не указано",
    managerName: "не указано"
};

async function loadScenarios() {
    try {
        const response = await fetch('scenarios.json');
        if (!response.ok) throw new Error('Не удалось загрузить scenarios.json');
        const data = await response.json();
        scenarios = data.scenarios;
        displayStage(0);
    } catch (error) {
        document.getElementById("stage-text").innerText = "Ошибка загрузки сценариев: " + error.message;
    }
}

function replacePlaceholders(text) {
    const businessTypes = {
        retail: "розничной торговли",
        beauty: "бьюти-индустрии",
        medical: "медицинской сферы"
    };

    return text
        .replace(/\[Имя\]/g, clientData.managerName)
        .replace(/\[Имя ЛПР\]/g, clientData.lprName)
        .replace(/\[Имя менеджера\]/g, clientData.managerName)
        .replace(/\[Название организации\]/g, clientData.companyName)
        .replace(/\[сфера клиента\]/g, businessTypes[currentScenario] || "розничной торговли");
}

function displayStage(stageId) {
    const stage = scenarios.find(s => s.id === stageId);
    if (!stage) return;

    history.push(currentStage);
    currentStage = stageId;

    const stageText = replacePlaceholders(stage.text);
    document.getElementById("stage-text").innerText = stageText;

    // Добавляем отображение функционала (features) и цен (price)
    let additionalInfoHtml = '';

    if (stage.features && stage.features.length > 0) {
        additionalInfoHtml += '<h4>Функционал:</h4><ul>';
        stage.features.forEach(feature => {
            additionalInfoHtml += `<li>${feature}</li>`;
        });
        additionalInfoHtml += '</ul>';
    }

    if (stage.price && stage.price.length > 0) {
        additionalInfoHtml += '<h4>Прайс-лист:</h4><pre>';
        stage.price.forEach(line => {
            additionalInfoHtml += `${line}\n`;
        });
        additionalInfoHtml += '</pre>';
    }

    // Вставляем дополнительную информацию после текста сценария
    document.getElementById("stage-text").innerHTML += additionalInfoHtml;

    const optionsDiv = document.getElementById("options");
    optionsDiv.innerHTML = "";
    
    stage.options.forEach(option => {
        const optionCard = document.createElement("div");
        optionCard.className = "option-card";
        
        const optionText = replacePlaceholders(option.text);
        
        optionCard.innerHTML = `
            <div class="option-text">${optionText}</div>
        `;
        
        optionCard.onclick = () => {
            document.querySelectorAll('.option-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            optionCard.classList.add('selected');
            
            setTimeout(() => {
                if (option.next === 'analysis') {
                    saveCallData();
                    window.location.href = 'analysis.html';
                } else if (option.next === 'proposal') {
                    saveCallData();
                    window.location.href = 'proposal.html';
                } else {
                    displayStage(option.next);
                }
            }, 300);
        };
        
        optionsDiv.appendChild(optionCard);
    });

    const backBtn = document.getElementById("back-btn");
    backBtn.style.display = history.length > 0 ? "block" : "none";
}

function goBack() {
    if (history.length > 0) {
        currentStage = history.pop();
        displayStage(currentStage);
    }
}

function goHome() {
    history = [];
    currentStage = 0;
    displayStage(0);
}

document.getElementById("back-btn").onclick = goBack;
document.getElementById("home-btn").onclick = goHome;

document.getElementById("lpr-name").addEventListener("input", () => {
    clientData.lprName = document.getElementById("lpr-name").value || "не указано";
    displayStage(currentStage);
});

document.getElementById("company-name").addEventListener("input", () => {
    clientData.companyName = document.getElementById("company-name").value || "не указано";
    displayStage(currentStage);
});

document.getElementById("manager-name").addEventListener("input", () => {
    clientData.managerName = document.getElementById("manager-name").value || "не указано";
    displayStage(currentStage);
});

// Добавление записи в лог звонка
function addCallLogEntry(stage, type, text, analysis) {
    if (!callData.stages) {
        callData.stages = [];
    }
    
    const entry = {
        time: new Date().toLocaleTimeString(),
        stage,
        type,
        text,
        analysis
    };
    
    callData.stages.push(entry);
    
    if (!callData.analysis) {
        callData.analysis = {
            good: [],
            warning: [],
            error: []
        };
    }
    
    if (type === 'good') {
        callData.analysis.good.push(entry);
    } else if (type === 'warning') {
        callData.analysis.warning.push(entry);
    } else if (type === 'error') {
        callData.analysis.error.push(entry);
    }
}

// Сохранение данных о звонке
function saveCallData() {
    callData.endTime = new Date().toLocaleTimeString();
    localStorage.setItem('callData', JSON.stringify(callData));
}

// Загрузка данных о звонке
function loadCallData() {
    const savedData = localStorage.getItem('callData');
    if (savedData) {
        callData = JSON.parse(savedData);
    } else {
        callData = {
            startTime: new Date().toLocaleTimeString(),
            endTime: null,
            stages: [],
            analysis: {
                good: [],
                warning: [],
                error: []
            }
        };
    }
}

// Функция для переключения сценариев
function switchScenario(scenario) {
    currentScenario = scenario;
    history = [];
    currentStage = 0;
    
    // Обновляем активную кнопку
    document.querySelectorAll('.scenario-buttons .btn-primary').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${scenario}-scenario`).classList.add('active');
    
    // Обновляем текст в зависимости от сценария
    const scenarioTexts = {
        retail: "розничной торговли",
        beauty: "бьюти-индустрии",
        medical: "медицинской сферы"
    };

    const scenarioTitles = {
        retail: "Розница",
        beauty: "Бьюти",
        medical: "Медицина"
    };
    
    // Обновляем заголовок
    document.querySelector('.content-header h1').textContent = `Умный помощник продаж. ${scenarioTitles[scenario]}`;
    
    clientData = {
        ...clientData,
        businessType: scenarioTexts[scenario]
    };
    
    displayStage(0);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadScenarios();
    loadCallData();
    
    // Устанавливаем начальный сценарий
    switchScenario('retail');
    
    // Добавляем обработчики для кнопок сценариев
    document.getElementById('retail-scenario').addEventListener('click', () => switchScenario('retail'));
    document.getElementById('beauty-scenario').addEventListener('click', () => switchScenario('beauty'));
    document.getElementById('medical-scenario').addEventListener('click', () => switchScenario('medical'));
    
    // Добавляем кнопку завершения звонка
    const endCallBtn = document.createElement('button');
    endCallBtn.className = 'btn-secondary';
    endCallBtn.innerHTML = '<i class="fas fa-phone-slash"></i> Завершить звонок';
    endCallBtn.onclick = () => {
        currentStage = 59; // ID сценария завершения звонка
        displayStage(currentStage);
    };
    
    document.querySelector('.buttons').appendChild(endCallBtn);
});
