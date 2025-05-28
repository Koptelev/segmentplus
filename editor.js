let scenarios = [];
let currentStageId = null;

// Загрузка сценариев при старте
async function loadScenarios() {
    try {
        const response = await fetch('scenarios.json');
        if (!response.ok) throw new Error('Не удалось загрузить scenarios.json');
        const data = await response.json();
        scenarios = data.scenarios;
        renderStagesList();
    } catch (error) {
        alert('Ошибка загрузки сценариев: ' + error.message);
    }
}

// Отрисовка списка этапов
function renderStagesList() {
    const stagesList = document.getElementById('stages-list');
    stagesList.innerHTML = '';

    scenarios.forEach(stage => {
        const stageItem = document.createElement('div');
        stageItem.className = `stage-item ${stage.id === currentStageId ? 'active' : ''}`;
        stageItem.innerHTML = `
            <div class="stage-header">
                <div class="stage-id">Этап ${stage.id}</div>
                <button class="btn-icon delete" onclick="event.stopPropagation(); deleteStage(${stage.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="stage-text">${stage.text}</div>
        `;
        stageItem.onclick = () => selectStage(stage.id);
        stagesList.appendChild(stageItem);
    });
}

// Выбор этапа для редактирования
function selectStage(stageId) {
    currentStageId = stageId;
    const stage = scenarios.find(s => s.id === stageId);
    if (!stage) return;

    document.getElementById('stage-id').value = stage.id;
    document.getElementById('stage-text').value = stage.text;
    
    const optionsList = document.getElementById('options-list');
    optionsList.innerHTML = '';
    
    stage.options.forEach((option, index) => {
        const optionItem = createOptionElement(option, index);
        optionsList.appendChild(optionItem);
    });

    renderStagesList();
}

// Создание элемента варианта ответа
function createOptionElement(option, index) {
    const optionItem = document.createElement('div');
    optionItem.className = 'option-item';
    optionItem.innerHTML = `
        <div class="option-header">
            <label>Вариант ${index + 1}</label>
            <div class="option-actions">
                <button class="btn-icon delete" onclick="deleteOption(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="form-group">
            <textarea class="option-text" placeholder="Текст варианта ответа...">${option.text}</textarea>
        </div>
        <div class="form-group">
            <label>Следующий этап</label>
            <select class="option-next">
                <option value="">Выберите этап</option>
                ${scenarios.map(s => `
                    <option value="${s.id}" ${option.next === s.id ? 'selected' : ''}>
                        Этап ${s.id}${s.text ? `: ${s.text.substring(0, 30)}...` : ''}
                    </option>
                `).join('')}
            </select>
        </div>
    `;
    return optionItem;
}

// Добавление нового варианта ответа
function addOption() {
    const optionsList = document.getElementById('options-list');
    const newOption = {
        text: '',
        next: 0
    };
    const optionItem = createOptionElement(newOption, optionsList.children.length);
    optionsList.appendChild(optionItem);
}

// Удаление варианта ответа
function deleteOption(index) {
    if (!confirm('Удалить этот вариант ответа?')) return;
    
    const optionsList = document.getElementById('options-list');
    optionsList.children[index].remove();
}

// Сохранение изменений этапа
function saveStage() {
    if (currentStageId === null) return;

    const stageText = document.getElementById('stage-text').value;
    const optionsList = document.getElementById('options-list');
    const options = [];

    for (let optionItem of optionsList.children) {
        const text = optionItem.querySelector('.option-text').value;
        const next = parseInt(optionItem.querySelector('.option-next').value);
        
        if (text.trim()) {
            options.push({ text, next });
        }
    }

    const stageIndex = scenarios.findIndex(s => s.id === currentStageId);
    if (stageIndex !== -1) {
        scenarios[stageIndex] = {
            id: currentStageId,
            text: stageText,
            options: options
        };
    }

    saveToFile();
    renderStagesList();
}

// Добавление нового этапа
function addNewStage() {
    const newId = Math.max(...scenarios.map(s => s.id)) + 1;
    const newStage = {
        id: newId,
        text: "Новый этап",
        options: []
    };
    
    scenarios.push(newStage);
    renderStagesList();
    selectStage(newId);
    saveScenarios();
}

// Удаление этапа
function deleteStage(stageId) {
    if (!confirm('Вы уверены, что хотите удалить этот этап? Это может нарушить связи между этапами.')) {
        return;
    }

    // Удаляем этап
    scenarios = scenarios.filter(s => s.id !== stageId);
    
    // Обновляем ссылки на следующий этап
    scenarios.forEach(stage => {
        stage.options = stage.options.filter(option => option.next !== stageId);
    });

    // Если удалили текущий этап, выбираем первый доступный
    if (currentStageId === stageId) {
        currentStageId = scenarios.length > 0 ? scenarios[0].id : null;
    }

    saveToFile();
    renderStagesList();
    
    if (currentStageId !== null) {
        selectStage(currentStageId);
    } else {
        // Очищаем форму, если нет этапов
        document.getElementById('stage-id').value = '';
        document.getElementById('stage-text').value = '';
        document.getElementById('options-list').innerHTML = '';
    }
}

// Сохранение в файл
async function saveToFile() {
    try {
        const response = await fetch('scenarios.json', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ scenarios }, null, 2)
        });
        
        if (!response.ok) throw new Error('Не удалось сохранить файл');
        alert('Изменения сохранены');
    } catch (error) {
        alert('Ошибка сохранения: ' + error.message);
    }
}

// Инициализация обработчиков событий
document.getElementById('add-option').onclick = addOption;
document.getElementById('save-stage').onclick = saveStage;
document.getElementById('add-stage').onclick = addNewStage;

// Загрузка сценариев при загрузке страницы
loadScenarios();
