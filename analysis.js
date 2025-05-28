// Данные о звонке
let callData = {
    startTime: null,
    endTime: null,
    stages: [],
    analysis: {
        good: [],
        warning: [],
        error: []
    }
};

// Загрузка данных о звонке
function loadCallData() {
    const savedData = localStorage.getItem('callData');
    if (savedData) {
        callData = JSON.parse(savedData);
        updateAnalysis();
    }
}

// Сохранение данных о звонке
function saveCallData() {
    localStorage.setItem('callData', JSON.stringify(callData));
}

// Добавление записи в лог
function addLogEntry(stage, type, text, analysis) {
    const entry = {
        time: new Date().toLocaleTimeString(),
        stage,
        type,
        text,
        analysis
    };
    
    callData.stages.push(entry);
    
    if (type === 'good') {
        callData.analysis.good.push(entry);
    } else if (type === 'warning') {
        callData.analysis.warning.push(entry);
    } else if (type === 'error') {
        callData.analysis.error.push(entry);
    }
    
    saveCallData();
    updateAnalysis();
}

// Обновление анализа
function updateAnalysis() {
    const summaryContainer = document.querySelector('.analysis-summary');
    if (!summaryContainer) return;
    
    const recommendationsContainer = document.querySelector('.recommendations');
    if (!recommendationsContainer) return;
    
    // Обновление общего анализа
    const goodCount = callData.analysis.good.length;
    const warningCount = callData.analysis.warning.length;
    const errorCount = callData.analysis.error.length;
    
    // Обновление рекомендаций на основе анализа
    const recommendations = generateRecommendations();
    
    // Обновление DOM
    updateSummaryItems(summaryContainer, goodCount, warningCount, errorCount);
    updateRecommendations(recommendationsContainer, recommendations);
}

// Генерация рекомендаций на основе анализа
function generateRecommendations() {
    const recommendations = [];
    
    // Анализ начала разговора
    if (callData.analysis.error.some(e => e.stage === 'start')) {
        recommendations.push({
            title: 'Улучшение начала разговора',
            description: 'Начните разговор с вопроса о текущих проблемах клиента'
        });
    }
    
    // Анализ работы с возражениями
    if (callData.analysis.warning.some(e => e.stage === 'objections')) {
        recommendations.push({
            title: 'Работа с возражениями',
            description: 'Используйте технику "Согласие и развитие" при работе с возражениями'
        });
    }
    
    // Анализ закрытия сделки
    if (callData.analysis.error.some(e => e.stage === 'closing')) {
        recommendations.push({
            title: 'Закрытие сделки',
            description: 'Задавайте больше вопросов о процессе принятия решения'
        });
    }
    
    return recommendations;
}

// Обновление элементов анализа
function updateSummaryItems(container, goodCount, warningCount, errorCount) {
    const items = container.querySelectorAll('.summary-item');
    
    items[0].querySelector('.description').textContent = 
        `Найдено ${goodCount} успешных моментов в разговоре`;
    
    items[1].querySelector('.description').textContent = 
        `Найдено ${warningCount} моментов для улучшения`;
    
    items[2].querySelector('.description').textContent = 
        `Найдено ${errorCount} критических ошибок`;
}

// Обновление рекомендаций
function updateRecommendations(container, recommendations) {
    container.innerHTML = '<h3>Рекомендации</h3>';
    
    recommendations.forEach(rec => {
        const item = document.createElement('div');
        item.className = 'recommendation-item';
        item.innerHTML = `
            <div class="title">
                <i class="fas fa-lightbulb"></i>
                ${rec.title}
            </div>
            <div class="description">
                ${rec.description}
            </div>
        `;
        container.appendChild(item);
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeFileUpload();
    loadCallData();
});

// Инициализация загрузки файлов
function initializeFileUpload() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    // Обработка перетаскивания файла
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'text/plain') {
            handleFile(file);
        } else {
            showError('Пожалуйста, загрузите текстовый файл (.txt)');
        }
    });

    // Обработка выбора файла через кнопку
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type === 'text/plain') {
                handleFile(file);
            } else {
                showError('Пожалуйста, загрузите текстовый файл (.txt)');
            }
        }
    });
}

// Обработка файла
function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const transcript = e.target.result;
            if (!validateTranscript(transcript)) {
                throw new Error('Неверный формат транскрипции');
            }
            
            // Скрываем блок загрузки
            const uploadArea = document.querySelector('.transcript-upload');
            if (uploadArea) {
                uploadArea.style.display = 'none';
            }
            
            // Показываем блок анализа
            const transcriptAnalysis = document.getElementById('transcript-analysis');
            if (transcriptAnalysis) {
                transcriptAnalysis.style.display = 'block';
            }
            
            const analysis = analyzeTranscript(transcript);
            if (analysis) {
                saveAnalysisHistory(transcript, analysis);
                updateAnalysisUI(analysis);
            } else {
                throw new Error('Не удалось проанализировать транскрипцию');
            }
        } catch (error) {
            showError('Ошибка при анализе файла: ' + error.message);
        }
    };
    reader.onerror = () => {
        showError('Ошибка при чтении файла');
    };
    reader.readAsText(file);
}

// Валидация транскрипции
function validateTranscript(transcript) {
    if (!transcript || typeof transcript !== 'string') {
        return false;
    }
    
    // Проверяем минимальную длину
    if (transcript.length < 50) {
        return false;
    }
    
    // Проверяем наличие диалога
    const hasDialogue = transcript.includes(':') || transcript.includes('—');
    if (!hasDialogue) {
        return false;
    }
    
    return true;
}

// Анализ транскрипции
function analyzeTranscript(transcript) {
    try {
        // Разбиваем транскрипцию на диалоги
        const dialogues = parseTranscript(transcript);
        if (!dialogues || dialogues.length === 0) {
            throw new Error('Не удалось разобрать диалоги из транскрипции');
        }
        
        // Анализируем каждый этап
        const analysis = {
            greeting: analyzeGreeting(dialogues),
            needs: analyzeNeeds(dialogues),
            solution: analyzeSolution(dialogues),
            objections: analyzeObjections(dialogues)
        };

        // Обновляем UI
        updateAnalysisUI(analysis);
        
        // Показываем блок анализа
        const transcriptAnalysis = document.getElementById('transcript-analysis');
        if (transcriptAnalysis) {
            transcriptAnalysis.style.display = 'block';
        }

        // Обновляем общий анализ
        updateGeneralAnalysis(analysis);
        
        return analysis;
    } catch (error) {
        showError('Ошибка при анализе: ' + error.message);
        return null;
    }
}

// Разбор транскрипции на диалоги
function parseTranscript(transcript) {
    const lines = transcript.split('\n');
    const dialogues = [];
    let currentSpeaker = '';
    let currentText = '';

    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Определяем говорящего
        const speakerMatch = trimmedLine.match(/^([^:]+):/);
        if (speakerMatch) {
            if (currentSpeaker && currentText) {
                dialogues.push({
                    speaker: currentSpeaker,
                    text: currentText.trim(),
                    timestamp: new Date().toLocaleTimeString()
                });
            }
            currentSpeaker = speakerMatch[1].trim();
            currentText = trimmedLine.slice(speakerMatch[0].length).trim();
        } else {
            currentText += ' ' + trimmedLine;
        }
    });

    // Добавляем последний диалог
    if (currentSpeaker && currentText) {
        dialogues.push({
            speaker: currentSpeaker,
            text: currentText.trim(),
            timestamp: new Date().toLocaleTimeString()
        });
    }

    return dialogues;
}

// === Новый универсальный метод для анализа синонимичных групп ===
function analyzeBySynonymGroups(dialogues, groups, options = {}) {
    const {
        speaker = null, // если нужно фильтровать по говорящему
        firstN = null, // если нужно анализировать только первые N реплик
        foundTextPrefix = '',
        notFoundTextPrefix = '',
    } = options;
    let score = 0;
    let details = [];
    let foundGroups = 0;
    let usedDialogues = dialogues;
    if (firstN) {
        usedDialogues = dialogues.slice(0, firstN);
    }
    groups.forEach(group => {
        let found = false;
        let foundPattern = null;
        let foundContext = null;
        for (const pattern of group.patterns) {
            const foundDialogue = usedDialogues.find(d => {
                if (speaker && d.speaker !== speaker) return false;
                return d.text.toLowerCase().includes(pattern);
            });
            if (foundDialogue) {
                found = true;
                foundPattern = pattern;
                foundContext = foundDialogue.text;
                break;
            }
        }
        if (found) {
            score += group.weight;
            foundGroups++;
            details.push({
                found: true,
                text: `${foundTextPrefix}"${foundPattern}"`,
                context: foundContext
            });
        } else {
            details.push({
                found: false,
                text: `${notFoundTextPrefix}"${group.patterns[0]}"${group.patterns.length > 1 ? ' (или синонимы)' : ''}`
            });
        }
    });
    return {
        score: Math.round((score / groups.reduce((sum, g) => sum + g.weight, 0)) * 100),
        details: details,
        foundGroups: foundGroups
    };
}

// === Новый анализ приветствия ===
function analyzeGreeting(dialogues) {
    const greetingGroups = [
        { patterns: ['добрый день', 'доброе утро', 'добрый вечер', 'здравствуйте'], weight: 1 },
        { patterns: ['меня зовут'], weight: 1 },
        { patterns: ['компания контур'], weight: 1 },
        { patterns: ['звоню в организацию', 'звоню по организации'], weight: 1 },
        { patterns: ['все верно'], weight: 0.5 }
    ];
    const res = analyzeBySynonymGroups(
        dialogues,
        greetingGroups,
        { firstN: 3, foundTextPrefix: 'Найдено приветствие: ', notFoundTextPrefix: 'Отсутствует: ' }
    );
    return {
        score: res.score,
        details: res.details,
        recommendations: generateGreetingRecommendations(res.details)
    };
}

// === Новый анализ выявления потребностей ===
function analyzeNeeds(dialogues) {
    const needsGroups = [
        // Проверка удобства разговора
        { patterns: ['удобно разговаривать'], weight: 0.5 }, // Новый критерий
        // Установление истинности ЛПР
        { patterns: ['меня правильно сориентировали', 'лучше общаться с вами'], weight: 1 }, // Новый критерий
        // Вопросы о контактном лице
        { patterns: ['кто у вас занимается', 'кто отвечает за', 'с кем можно обсудить', 'правильно понимаю, что маркетингом в организации вы занимаетесь'], weight: 1 }, // Добавлен вопрос из возражений
        { patterns: ['как с ним связаться', 'как могу к нему обращаться', 'как к вам обращаться', 'у директора возможно есть рабочий или сотовый номер'], weight: 1 }, // Добавлен вопрос из возражений
        // Вопросы о бизнесе
        { patterns: ['какие именно товары продаете', 'какой ассортимент', 'какой объем номенклатуры', 'сколько товаров', 'сколько примерно наименований товаров'], weight: 1 }, // Расширено
        // Вопросы о системе лояльности
        { patterns: ['используете ли систему лояльности', 'есть ли программа лояльности'], weight: 1 }, // Оставлена основная группа
        { patterns: ['как работаете с клиентами', 'ведете с клиентами коммуникацию через какие-либо маркетинговые инструменты'], weight: 1 }, // Группа про работу/коммуникацию с клиентами
        { patterns: ['система лояльности работает на базе вашей учетной системы', 'интегрирована с вашей учетной системой'], weight: 1}, // Новый критерий про интеграцию
        // Вопросы о базе данных
        { patterns: ['какой объем оцифрованной клиентской базы', 'сколько клиентов в базе', 'сколько примерно клиентов у вас в базе', 'ведете ли базу клиентов'], weight: 1 }, // Расширено
        // Вопросы об учетной системе
        { patterns: ['какой учетной системой пользуетесь', 'какая у вас система учета', 'как ведете учет'], weight: 1 },
        // Вопросы о торговых точках
        { patterns: ['сколько у вас торговых точек', 'сколько магазинов', 'где расположены точки продаж'], weight: 1 },
        // Вопросы про уходящих клиентов/конкурентов
        { patterns: ['клиенты которые ходят не только к вам', 'ушли к конкуренту'], weight: 1 }, // Новый критерий
        // Вопросы про используемые маркетинговые инструменты и их эффективность
        { patterns: ['какие средства для общения с клиентами сейчас используете', 'как уведомляете об акциях'], weight: 1 }, // Новый критерий
        { patterns: ['оцифровывали результат', 'на сколько они эффективные'], weight: 1 }, // Новый критерий
        // Вопросы про задачи на улучшение коммуникаций
        { patterns: ['какие задачи сейчас есть на улучшение этих коммуникаций'], weight: 1 }, // Новый критерий
        // Вопросы про желание удерживать клиентов
        { patterns: ['хотели бы начать их удерживать', 'увеличивать выручку магазина'], weight: 1 } // Новый критерий
    ];
    // Подсчет вопросов
    let questionsCount = 0;
    dialogues.forEach(dialogue => {
        if (dialogue.speaker === 'Оператор') {
            if (dialogue.text.includes('?') ||
                dialogue.text.toLowerCase().includes('как') ||
                dialogue.text.toLowerCase().includes('что') ||
                dialogue.text.toLowerCase().includes('когда') ||
                dialogue.text.toLowerCase().includes('где') ||
                dialogue.text.toLowerCase().includes('почему')) {
                questionsCount++;
            }
        }
    });
    const res = analyzeBySynonymGroups(
        dialogues,
        needsGroups,
        { speaker: 'Оператор', foundTextPrefix: 'Найден вопрос о потребностях: ', notFoundTextPrefix: 'Отсутствует вопрос: ' }
    );
    return {
        score: res.score,
        details: res.details,
        questionsCount: questionsCount,
        recommendations: generateNeedsRecommendations(res.score, questionsCount)
    };
}

// === Новый анализ презентации решения ===
function analyzeSolution(dialogues) {
    const solutionGroups = [
        // Основные преимущества
        { patterns: ['маркетинговый инструмент с ии', 'искусственный интеллект'], weight: 1 },
        { patterns: ['повышает выручку магазина', 'увеличивает продажи', 'позволяет увеличивать выручку магазина'], weight: 1 },
        // Функциональность
        { patterns: ['позволяет попадать в актуальные потребности', 'определяет потребности клиентов'], weight: 1 },
        { patterns: ['без эффекта спама', 'персонализированные предложения'], weight: 1 },
        // Уникальность и стоимость
        { patterns: ['уникальное и доступное по цене', 'конкурентная цена'], weight: 1 },
        { patterns: ['внедрение в большинстве случаев бесплатное'], weight: 1 },
        { patterns: ['есть абонентская плата'], weight: 1 }
    ];
    // Подсчет упоминаний преимуществ
    let benefitsCount = 0;
    dialogues.forEach(dialogue => {
        if (dialogue.speaker === 'Оператор') {
            if (dialogue.text.toLowerCase().includes('преимущество') || 
                dialogue.text.toLowerCase().includes('выгода') ||
                dialogue.text.toLowerCase().includes('польза') ||
                dialogue.text.toLowerCase().includes('эффект')) {
                benefitsCount++;
            }
        }
    });
    const res = analyzeBySynonymGroups(
        dialogues,
        solutionGroups,
        { speaker: 'Оператор', foundTextPrefix: 'Найдено в презентации: ', notFoundTextPrefix: 'Отсутствует в презентации: ' }
    );
    return {
        score: res.score,
        details: res.details,
        benefitsCount: benefitsCount,
        recommendations: generateSolutionRecommendations(res.score, benefitsCount)
    };
}

// === Новый анализ работы с возражениями ===
function analyzeObjections(dialogues) {
    const objectionGroups = [
        // Ответы на возражения (группы синонимов)
        { patterns: ['кп я обязательно направлю'], weight: 1 },
        { patterns: ['номер телефона получен из открытых источников'], weight: 1 },
        { patterns: ['вы являетесь нашим клиентом'], weight: 1 },
        { patterns: ['будет удобно пообщаться сейчас'], weight: 1 },
        { patterns: ['услышал вас'], weight: 1 },
        { patterns: ['подскажите, а привлечением и удержанием клиентов'], weight: 1 },
        { patterns: ['наше решение новое и уникальное'], weight: 1 },
        { patterns: ['внедрение в большинстве случаев бесплатное'], weight: 1 },
        { patterns: ['давайте обсудим подробнее'], weight: 1 },
        { patterns: ['я понимаю ваши сомнения'], weight: 1 }
    ];
    // Подсчет возражений клиента (по старому списку)
    const objectionPatterns = [
        'отправьте все на почту',
        'откуда у вас мой номер',
        'у нас уже все есть',
        'что именно предлагаете',
        'нам ничего не нужно',
        'сколько стоит',
        'не интересно',
        'перезвоните позже'
    ];
    let objectionsCount = 0;
    dialogues.forEach(dialogue => {
        if (dialogue.speaker === 'Клиент') {
            objectionPatterns.forEach(pattern => {
                if (dialogue.text.toLowerCase().includes(pattern)) {
                    objectionsCount++;
                }
            });
        }
    });
    const res = analyzeBySynonymGroups(
        dialogues,
        objectionGroups,
        { speaker: 'Оператор', foundTextPrefix: 'Найдена работа с возражением: ', notFoundTextPrefix: 'Отсутствует ответ на возражение: ' }
    );
    return {
        score: res.score,
        details: res.details,
        objectionsCount: objectionsCount,
        recommendations: generateObjectionRecommendations(res.score, objectionsCount)
    };
}

// Генерация рекомендаций для приветствия
function generateGreetingRecommendations(details) {
    const recommendations = [];
    const foundCount = details.filter(d => d.found).length;
    
    if (foundCount === 0) {
        recommendations.push('Начните разговор с приветствия и представления компании');
    } else if (foundCount < 3) {
        recommendations.push('Добавьте уточняющий вопрос о времени клиента');
    }
    
    return recommendations;
}

// Генерация рекомендаций для выявления потребностей
function generateNeedsRecommendations(score, questionsCount) {
    const recommendations = [];
    
    if (questionsCount < 3) {
        recommendations.push('Задавайте больше открытых вопросов о потребностях клиента');
    }
    if (score < 50) {
        recommendations.push('Используйте больше вопросов из скрипта для выявления потребностей');
    }
    
    return recommendations;
}

// Генерация рекомендаций для презентации решения
function generateSolutionRecommendations(score, benefitsCount) {
    const recommendations = [];
    
    if (benefitsCount < 2) {
        recommendations.push('Подчеркните больше преимуществ вашего решения');
    }
    if (score < 50) {
        recommendations.push('Используйте больше аргументов из скрипта при презентации');
    }
    
    return recommendations;
}

// Генерация рекомендаций для работы с возражениями
function generateObjectionRecommendations(score, objectionsCount) {
    const recommendations = [];
    
    if (objectionsCount > 0 && score < 50) {
        recommendations.push('Используйте техники работы с возражениями из скрипта');
    }
    if (objectionsCount > 3) {
        recommendations.push('Попробуйте предвосхитить основные возражения клиента');
    }
    
    return recommendations;
}

// Обновление деталей анализа
function updateDetails(elementId, details) {
    const element = document.getElementById(elementId);
    if (!element) return;

    if (!Array.isArray(details)) {
        element.innerHTML = '<div class="error-message">Нет данных для отображения</div>';
        return;
    }

    element.innerHTML = details.map(detail => {
        let contextText = '';
        if (detail.context) {
            // Находим позицию совпадения в контексте
            const pattern = detail.text.match(/"([^"]+)"/)?.[1];
            if (pattern) {
                const contextLower = detail.context.toLowerCase();
                const patternLower = pattern.toLowerCase();
                const index = contextLower.indexOf(patternLower);
                
                if (index !== -1) {
                    // Берем 50 символов до и после совпадения
                    const start = Math.max(0, index - 50);
                    const end = Math.min(contextLower.length, index + pattern.length + 50);
                    contextText = '...' + detail.context.slice(start, end) + '...';
                }
            }
        }

        return `
            <div class="detail-item ${detail.found ? 'found' : 'missing'}">
                <i class="fas fa-${detail.found ? 'check' : 'times'}"></i>
                <div class="detail-content">
                    <div class="detail-text">${detail.text || ''}</div>
                    ${contextText ? `<div class="detail-context">${contextText}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Обновление UI с результатами анализа
function updateAnalysisUI(analysis) {
    if (!analysis || typeof analysis !== 'object') {
        showError('Нет данных для анализа');
        return;
    }

    try {
        // Обновляем оценки
        const updateScore = (elementId, score) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = `${score || 0}%`;
            }
        };

        updateScore('greeting-score', analysis.greeting?.score);
        updateScore('needs-score', analysis.needs?.score);
        updateScore('solution-score', analysis.solution?.score);
        updateScore('objections-score', analysis.objections?.score);

        // Обновляем детали с компактным отображением
        if (analysis.greeting) {
            updateDetails('greeting-details', analysis.greeting.details.map(detail => ({
                ...detail,
                text: detail.found ? 
                    `Найдено приветствие: "${detail.text.match(/"([^"]+)"/)?.[1] || ''}"` :
                    detail.text
            })));
        }
        
        if (analysis.needs) {
            updateDetails('needs-details', analysis.needs.details.map(detail => ({
                ...detail,
                text: detail.found ? 
                    `Найден вопрос: "${detail.text.match(/"([^"]+)"/)?.[1] || ''}"` :
                    detail.text
            })));
        }
        
        if (analysis.solution) {
            updateDetails('solution-details', analysis.solution.details.map(detail => ({
                ...detail,
                text: detail.found ? 
                    `Найдено в презентации: "${detail.text.match(/"([^"]+)"/)?.[1] || ''}"` :
                    detail.text
            })));
        }
        
        if (analysis.objections) {
            updateDetails('objections-details', analysis.objections.details.map(detail => ({
                ...detail,
                text: detail.found ? 
                    `Найдена работа с возражением: "${detail.text.match(/"([^"]+)"/)?.[1] || ''}"` :
                    detail.text
            })));
        }

        // Обновляем рекомендации
        updateRecommendations(analysis);

        // Обновляем общий анализ
        updateGeneralAnalysis(analysis);
    } catch (error) {
        showError('Ошибка при обновлении интерфейса: ' + error.message);
    }
}

// Обновление рекомендаций
function updateRecommendations(analysis) {
    const recommendationsContainer = document.querySelector('.recommendations');
    if (!recommendationsContainer) return;
    
    recommendationsContainer.innerHTML = '<h3>Рекомендации</h3>';

    // Проверяем наличие всех необходимых данных
    if (!analysis || typeof analysis !== 'object') {
        recommendationsContainer.innerHTML += '<div class="error-message">Нет данных для анализа</div>';
        return;
    }

    const allRecommendations = [];
    
    // Добавляем рекомендации из каждого раздела, если они существуют
    if (analysis.greeting && Array.isArray(analysis.greeting.recommendations)) {
        allRecommendations.push(...analysis.greeting.recommendations);
    }
    
    if (analysis.needs && Array.isArray(analysis.needs.recommendations)) {
        allRecommendations.push(...analysis.needs.recommendations);
    }
    
    if (analysis.solution && Array.isArray(analysis.solution.recommendations)) {
        allRecommendations.push(...analysis.solution.recommendations);
    }
    
    if (analysis.objections && Array.isArray(analysis.objections.recommendations)) {
        allRecommendations.push(...analysis.objections.recommendations);
    }

    // Если нет рекомендаций, показываем сообщение
    if (allRecommendations.length === 0) {
        recommendationsContainer.innerHTML += '<div class="no-recommendations">Нет доступных рекомендаций</div>';
        return;
    }

    // Отображаем рекомендации
    allRecommendations.forEach(rec => {
        if (typeof rec === 'string') {
            const item = document.createElement('div');
            item.className = 'recommendation-item';
            item.innerHTML = `
                <div class="title">
                    <i class="fas fa-lightbulb"></i>
                    ${rec}
                </div>
            `;
            recommendationsContainer.appendChild(item);
        }
    });
}

// Обновление общего анализа
function updateGeneralAnalysis(analysis) {
    const generalAnalysis = document.getElementById('general-analysis');
    if (!generalAnalysis) return;

    if (!analysis || typeof analysis !== 'object') {
        generalAnalysis.innerHTML = '<div class="error-message">Нет данных для общего анализа</div>';
        return;
    }

    const scores = [
        analysis.greeting?.score || 0,
        analysis.needs?.score || 0,
        analysis.solution?.score || 0,
        analysis.objections?.score || 0
    ];

    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // Обновляем общий счет
    const scoreElement = generalAnalysis.querySelector('.score');
    if (scoreElement) {
        scoreElement.textContent = `${averageScore}%`;
    }

    // Создаем диаграмму
    const ctx = document.getElementById('analysisChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Приветствие', 'Выявление потребностей', 'Презентация решения', 'Работа с возражениями'],
                datasets: [{
                    label: 'Соответствие скрипту',
                    data: scores,
                    backgroundColor: 'rgba(37, 99, 235, 0.2)',
                    borderColor: 'rgba(37, 99, 235, 1)',
                    pointBackgroundColor: 'rgba(37, 99, 235, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(37, 99, 235, 1)'
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: {
                            display: true
                        },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

// Показ ошибок
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    document.querySelector('.transcript-upload').prepend(errorDiv);
    
    // Автоматически скрываем через 5 секунд
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Сохранение истории анализов
function saveAnalysisHistory(transcript, analysis) {
    if (!transcript || !analysis) {
        console.warn('Недостаточно данных для сохранения истории анализа');
        return;
    }

    const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
    const newAnalysis = {
        date: new Date().toISOString(),
        transcript: transcript,
        results: {
            greeting: analysis.greeting?.score || 0,
            needs: analysis.needs?.score || 0,
            solution: analysis.solution?.score || 0,
            objections: analysis.objections?.score || 0
        }
    };
    
    history.unshift(newAnalysis);
    // Храним только последние 10 анализов
    if (history.length > 10) {
        history.pop();
    }
    
    localStorage.setItem('analysisHistory', JSON.stringify(history));
} 