document.addEventListener('DOMContentLoaded', () => {
    // ⬇️ Carregar novena automaticamente com base no localStorage
    const selectedNovena = localStorage.getItem('selectedNovena') || 'novenas/novena-maos-ensanguentadas.json';
    loadNovenaData(selectedNovena);

    // ⬇️ Event listener do botão
    document.getElementById('loadNovena').addEventListener('click', function() {
        loadSelectedNovena();
    });
});

// Variável global para armazenar os dados do JSON
let novenaContent = {};
let currentProgress = {
                        basicPrayers: false,
                        mysteries: [
                            { title: "Primeiro Mistério", completed: false, prayers: Array(10).fill(false) },
                            { title: "Segundo Mistério", completed: false, prayers: Array(10).fill(false) },
                            { title: "Terceiro Mistério", completed: false, prayers: Array(10).fill(false) },
                            { title: "Quarto Mistério", completed: false, prayers: Array(10).fill(false) },
                            { title: "Quinto Mistério", completed: false, prayers: Array(10).fill(false) }
                        ],
                        finalPrayer: false
                    };
let lastCompleted = null;

// Carregar dados do JSON
async function loadNovenaData(novenaFile = 'novenas/novena-maos-ensanguentadas.json') {
    try {
        // Salvar a novena selecionada
        localStorage.setItem('selectedNovena', novenaFile);

        const response = await fetch(novenaFile);
        const loadedJson = await response.json();

        // Se já houver dados salvos, usa eles; senão, salva o JSON recém-carregado
        const persisted = getData(null);
        if (persisted) {
            novenaContent = persisted;
        } else {
            novenaContent = loadedJson;
            saveData(novenaContent);
        }

        // Atualizar o título da página
        document.title = novenaContent.title || document.title;

        // Atualizar o cabeçalho
        updateHtml();

        // Preencher a oração inicial e final na página
        populateContent();

        // Renderizar a novena no container principal
        renderNovenaContainer();

        // Renderizar os dias da novena
        renderDayButtons();

        // Renderizar o terço no container principal
        renderRosarioContainer();

        // Atualizar progresso do terço
        updateRosaryProgress();

        // Atualizar botão do terço
        updateRosaryButton();

        // Fechar modal
        document.getElementById('closeModal').addEventListener('click', function() {
            document.getElementById('prayerModal').style.display = 'none';
        });
    } catch (error) {
        console.error('Erro ao carregar dados da novena:', error);
        alert('Erro ao carregar os dados da novena. Por favor, recarregue a página.');
    }
}

// Atualizar o header e o footer com os dados da novena
function updateHtml() {
    try {
        // Verifica se novenaContent está definido
        if (typeof novenaContent === 'undefined') {
            console.warn('novenaContent não está definido.');
            return;
        }

        // Seleciona o header e a div.novena-selector
        const header = document.querySelector('header');
        const novenaSelector = header ? header.querySelector('.novena-selector') : null;

        if (!header || !novenaSelector) {
            console.warn('Header ou .novena-selector não encontrado.');
            return;
        }

        // Cria ou atualiza o h1
        let headerTitle = header.querySelector('h1');
        if (!headerTitle) {
            headerTitle = document.createElement('h1');
            header.insertBefore(headerTitle, novenaSelector);
        }

        // Cria ou atualiza o p (com classe text-center)
        let headerSubtitle = header.querySelector('p.text-center');
        if (!headerSubtitle) {
            headerSubtitle = document.createElement('p');
            headerSubtitle.classList.add('text-center');
            header.insertBefore(headerSubtitle, novenaSelector);
        }

        // Atualiza os textos
        if (novenaContent.title) {
            headerTitle.textContent = novenaContent.title;
        }

        if (novenaContent.subtitle) {
            headerSubtitle.textContent = novenaContent.subtitle;
        }

        // Cria ou atualiza o footer
        let footer = document.querySelector('footer');
        if (!footer) {
            footer = document.createElement('footer');
            document.body.appendChild(footer);
        }

        const currentYear = new Date().getFullYear();
        footer.textContent = `© ${currentYear} - ${novenaContent.title}`;

    } catch (error) {
        console.error('Erro ao atualizar o HTML:', error);
    }
}

// Carregar Novena Selecionada
function loadSelectedNovena() {
    try {
        const novenaSelect = document.getElementById('novenaSelect');
        if (!novenaSelect) {
            throw new Error('Elemento #novenaSelect não encontrado!');
        }

        const selectedNovena = novenaSelect.value;

        // Limpar o localStorage para começar uma nova novena
        localStorage.removeItem('novenaData');

        // Recarregar a página com a nova novena
        loadNovenaData(selectedNovena);
    } catch (error) {
        console.error('Erro ao carregar a novena selecionada:', error);
        alert('Ocorreu um erro ao carregar a novena. Por favor, tente novamente!');
    }
}

// Preencher oração inicial e final com os dados do JSON
function populateContent() {
    try {
        // Preencher primeira oração
        const firstPrayer = document.getElementById('firstPrayer');
        if (!firstPrayer) {
            console.warn("Elemento com id 'firstPrayer' não encontrado no DOM!");
            return;
        }

        let firstPrayerContent = document.getElementById('firstPrayerContent');
        if (!firstPrayerContent) {
            firstPrayerContent = document.createElement('div');
            firstPrayerContent.id = 'firstPrayerContent';
            firstPrayer.appendChild(firstPrayerContent);
        }
        firstPrayerContent.innerHTML = `
            <h2 class="text-center text-red">${novenaContent.firstPrayerContent.title}</h2>
            <hr class="margin-vertical">
            ${novenaContent.firstPrayerContent.content.map(paragraph => `<p>${paragraph}</p>`).join('')}
        `;
        
        // Preencher oração final
        const finalPrayer = document.getElementById('finalPrayer');
        if (!finalPrayer) {
            console.warn("Elemento com id 'finalPrayer' não encontrado no DOM!");
            return;
        }
        
        let finalPrayerContent = document.getElementById('finalPrayerContent');
        if (!finalPrayerContent) {
            finalPrayerContent = document.createElement('div');
            finalPrayerContent.id = 'finalPrayerContent';
            finalPrayer.appendChild(finalPrayerContent);
        }
        
        finalPrayerContent.innerHTML = `
            <h2 class="text-center text-red">${novenaContent.finalPrayerContent.title}</h2>
            <hr class="margin-vertical">
            ${novenaContent.finalPrayerContent.content.map(paragraph => {
                if (paragraph.startsWith('<strong>') && paragraph.endsWith('</strong>')) {
                    // Verificar se é uma oração compartilhada
                    const prayerTitle = paragraph.replace('<strong>', '').replace('</strong>', '').trim();
                    const sharedPrayer = Object.values(novenaContent.sharedPrayers).find(p => p.title === prayerTitle);
                    
                    if (sharedPrayer) {
                        return `<h4><strong>${sharedPrayer.title}</strong></h4><p>${sharedPrayer.content}</p>`;
                    }
                    
                    return `<h4>${paragraph}</h4>`;
                } else {
                    return `<p>${paragraph}</p>`;
                }
            }).join('')}
        `;
    } catch (error) {
        console.error("Erro ao incluir o conteúdo das orações inicial e final:", error);
    }

}

// Preencher o titulo da novena na parte dos dias
function renderNovenaContainer() {
    try {
        const novenaContainer = document.getElementById('novenaContainer');
        if (!novenaContainer) {
            console.warn("Elemento com id 'novenaContainer' não encontrado.");
            return;
        }

        let novenaTitle = document.getElementById('novenaTitle');
        if (!novenaTitle) {
            novenaTitle = document.createElement('div');
            novenaTitle.id = 'novenaTitle';
            novenaContainer.prepend(novenaTitle);
        }

        novenaTitle.innerHTML = `
            <h2 class="text-center text-red">${novenaContent.title}</h2>
            <hr class="margin-vertical">
            <p>${novenaContent.paragraph}</p>
        `;
    } catch (error) {
        console.error('Erro ao renderizar o novenaContainer:', error);
    }
}

// Gerar uma chave única para cada novena no localStorage
function getNovenaKey() {
    const novenaFile = localStorage.getItem('selectedNovena') || 'novenas/novena-maos-ensanguentadas.json';
    // Criar uma chave única baseada no nome do arquivo
    return `${novenaFile.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

// Obter dados do localStorage
function getData(defaultValue = null) {
    try {
        const key = getNovenaKey();
        const raw = localStorage.getItem(key);
        if (!raw) return defaultValue;
        return JSON.parse(raw);
    } catch (e) {
        console.error("Erro ao ler localStorage:", e);
        return defaultValue;
    }
}

// Salvar dados no localStorage
function saveData(data) {
    try {
        const key = getNovenaKey();
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error("Erro ao salvar dados da novena no localStorage:", error);
    }
}

// Carrega os dias da novena
function renderDayButtons() {
    try {
        const daySelector = document.getElementById('daySelector');
        if (!daySelector) {
            console.warn("Elemento #daySelector não encontrado!");
            return;
        }

        daySelector.innerHTML = "";

        const data = getData() || novenaContent;

        if (!data || !data.days) {
            console.warn("Nenhum dado de dias encontrado no JSON!");
            return;
        }

        data.days.forEach(dayData => {
            const dayBtn = document.createElement('button');
            dayBtn.className = 'btn-day';
            dayBtn.textContent = `Dia ${dayData.day}`;
            dayBtn.dataset.day = dayData.day;

            if (dayData.read) dayBtn.classList.add('completed');
            if (dayData.active) dayBtn.classList.add('active');

            dayBtn.addEventListener('click', () => {
                if (dayData.active) {
                    // se já estava ativo -> desativa e limpa mensagem
                    dayData.active = false;
                    saveData(data);
                    clearDayMessage();
                } else {
                    // ativa somente este dia e mostra a mensagem
                    data.days.forEach(d => d.active = false);
                    dayData.active = true;
                    saveData(data);
                    showDayMessage(dayData.day);
                }
                renderDayButtons();
            });

            daySelector.appendChild(dayBtn);
        });

        // Botão "Marcar este dia como lido" / "Novena Concluída"
        const markDayReadBtn = document.getElementById('markDayRead');
        if (markDayReadBtn) {
            // remove listeners duplicados substituindo pelo clone
            const newBtn = markDayReadBtn.cloneNode(true);
            markDayReadBtn.parentNode.replaceChild(newBtn, markDayReadBtn);

            const allCompleted = data.days.every(d => d.read);

            if (allCompleted) {
                newBtn.textContent = "Novena Concluída";
                newBtn.disabled = true;
                newBtn.classList.remove('btn-danger');
                newBtn.classList.add('btn-success', 'completed');
            } else {
                newBtn.textContent = "Marcar este dia como lido";
                newBtn.disabled = false;

                newBtn.addEventListener('click', () => {
                    const activeDay = data.days.find(d => d.active);
                    if (!activeDay) {
                        alert("Selecione um dia antes de marcar como lido!");
                        return;
                    }

                    // marca como lido, remove active (oculta a mensagem) e salva
                    activeDay.read = true;
                    activeDay.active = false;
                    saveData(data);

                    // re-renderiza e limpa a mensagem
                    renderDayButtons();
                    clearDayMessage();
                });
            }
        }

    } catch (error) {
        console.error("Erro ao renderizar os botões dos dias:", error);
    }
}

// Mostrar mensagem do dia selecionado
function showDayMessage(day) {
    const data = getData() || novenaContent;
    const dayIndex = data.days.findIndex(d => d.day === Number(day));
    if (dayIndex === -1) {
        clearDayMessage();
        return;
    }
    const dayData = data.days[dayIndex];

    const messageDiv = document.getElementById('dailyMessage');
    messageDiv.innerHTML = `
        <h3><strong>${dayData.title || ''}</strong></h3>
        <p>${dayData.message1 || ''}</p>
        <p>${dayData.message2 || ''}</p>
        <p><strong>${dayData.message3 || ''}</strong></p>
        <p><em>${dayData.message4 || ''}</em></p>
    `;
}

// Limpar a mensagem do dia
function clearDayMessage() {
    const messageDiv = document.getElementById('dailyMessage');
    messageDiv.innerHTML = '<p>Selecione um dia para visualizar a mensagem correspondente.</p>';

    // remove a class active do DOM
    document.querySelectorAll('.btn-day').forEach(btn => btn.classList.remove('active'));

    // garante que o estado active no JSON esteja limpo e persiste (somente por segurança)
    const data = getData() || novenaContent;
    if (data && data.days) {
        data.days.forEach(d => d.active = false);
        saveData(data);
    }
}

// Preencher o titulo da novena na parte dos dias
function renderRosarioContainer() {
    try {
        const rosarioContainer = document.getElementById('rosarioContainer');
        if (!rosarioContainer) {
            console.warn("Elemento com id 'rosarioContainer' não encontrado.");
            return;
        }

        let rosaryTitle = document.getElementById('rosaryTitle');
        if (!rosaryTitle) {
            rosaryTitle = document.createElement('div');
            rosaryTitle.id = 'rosaryTitle';
            rosarioContainer.prepend(rosaryTitle);
        }

        rosaryTitle.innerHTML = `
            <h2 class="text-center text-red">${novenaContent.rosaryContent.title}</h2>
            <hr class="margin-vertical">
            <p class="text-center">Reze primeiro a Novena e, em seguida, o Terço.</p>
        `;

        let firstRosaryContent = document.getElementById('firstRosaryContent');
        if (!firstRosaryContent) {
            firstRosaryContent = document.createElement('div');
            firstRosaryContent.id = 'firstRosaryContent';
            rosaryTitle.after(firstRosaryContent);
        }

        // Preencher conteúdo inicial do terço
        firstRosaryContent.innerHTML = `
            ${novenaContent.rosaryContent.content.map(item => {
                if (item.startsWith('<strong>') && item.endsWith('</strong>')) {
                    return `<h4>${item}</h4>`;
                } else {
                    return `<p>${item}</p>`;
                }
            }).join('')}
        `;
    } catch (error) {
        console.error('Erro ao renderizar o rosarioContainer:', error);
    }
}

// Iniciar o terço
function startRosary() {
    const data = getData();
    const progress = currentProgress;
    
    // Verificar se precisa começar pelas orações básicas
    if (!progress.basicPrayers) {
        showBasicPrayers();
        return;
    }
    
    // Encontrar o próximo mistério não completado
    let nextMystery = null;
    for (let i = 0; i < progress.mysteries.length; i++) {
        if (!progress.mysteries[i].completed) {
            nextMystery = i;
            break;
        }
    }
    
    // Se todos os mistérios foram completados, mostrar oração final
    if (nextMystery === null) {
        if (!progress.finalPrayer) {
            showFinalPrayer();
        } else {
            alert('Você já completou o terço hoje!');
        }
        return;
    }
    
    // Mostrar o mistério encontrado
    showMystery(nextMystery);
}

// Mostrar orações básicas
function showBasicPrayers() {
    const basicPrayers = novenaContent.rosaryPrayers.basicPrayers;
    
    let prayersHTML = `<h2 class="text-center">${basicPrayers.title}</h2><hr class="margin-vertical">`;
    
    basicPrayers.prayers.forEach(prayerItem => {
        const prayer = novenaContent.sharedPrayers[prayerItem.prayer];
        const repetitions = prayerItem.repetitions || 1;
        
        prayersHTML += `
            <h4><strong>${prayer.title}${repetitions > 1 ? ` (${repetitions}x)` : ''}</strong></h4>
            <p>${prayer.content}</p>
            ${repetitions > 1 ? `<p><em>(Repetir ${repetitions} vezes)</em></p>` : ''}
        `;
    });
    
    prayersHTML += `<button class="btn btn-danger" id="completeBasicPrayers">Completar Orações Iniciais</button>`;
    
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = prayersHTML;
    
    document.getElementById('prayerModal').style.display = 'block';
    
    document.getElementById('completeBasicPrayers').addEventListener('click', function() {
        const data = getData();
        currentProgress.basicPrayers = true;
        saveData(data);
        document.getElementById('prayerModal').style.display = 'none';
        
        // Iniciar o primeiro mistério
        startRosary();
    });
}

// Mostrar mistério
function showMystery(mysteryIndex) {
    const mystery = novenaContent.mysteries[mysteryIndex];
    
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <h2>${mystery.title}</h2>
        <hr class="margin-vertical">
        <p>Meditação:</p>
        <p class="meditation">${mystery.meditation}</p>
        <button class="btn btn-danger" id="completeMystery">Completar Meditação</button>
    `;
    
    document.getElementById('prayerModal').style.display = 'block';
    
    document.getElementById('completeMystery').addEventListener('click', function() {
        const data = getData();
        currentProgress.mysteries[mysteryIndex].completed = true;
        saveData(data);
        document.getElementById('prayerModal').style.display = 'none';
        
        // Mostrar as 10 rezas deste mistério
        showPrayers(mysteryIndex);
    });
}

// Mostrar as 10 rezas de um mistério
function showPrayers(mysteryIndex) {
    const data = getData();
    const mystery = currentProgress.mysteries[mysteryIndex];
    const prayerText = novenaContent.rosaryPrayers.prayerText;
    
    // Encontrar a próxima oração não completada
    let nextPrayer = mystery.prayers.findIndex(prayer => !prayer);
    
    // Se todas as orações foram completadas, voltar para o terço
    if (nextPrayer === -1) {
        startRosary();
        return;
    }
    
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <h2>${mystery.title} - Oração ${nextPrayer + 1}/10</h2>
        <hr class="margin-vertical">
        <p>${nextPrayer + 1} - ${prayerText}</p>
        <div class="prayer-counter">
            ${mystery.prayers.map((prayer, index) => `
                <div class="btn btn-counter ${prayer ? 'active' : ''}">${index + 1}</div>
            `).join('')}
        </div>
        <button class="btn btn-danger" id="completePrayer">Próxima Oração</button>
    `;
    
    document.getElementById('prayerModal').style.display = 'block';
    
    document.getElementById('completePrayer').addEventListener('click', function() {
        const data = getData();
        currentProgress.mysteries[mysteryIndex].prayers[nextPrayer] = true;
        saveData(data);
        document.getElementById('prayerModal').style.display = 'none';
        
        // Mostrar a próxima oração ou voltar para o terço
        showPrayers(mysteryIndex);
    });
}

// Mostrar Oração Final do Terço
function showFinalPrayer() {
    const finalPrayer = novenaContent.rosaryPrayers.finalPrayer;
    
    const modalContent = document.getElementById('modalContent');
    modalContent.innerHTML = `
        <h2 class="text-center">${finalPrayer.title}</h2>
        <hr class="margin-vertical">
        <p>${finalPrayer.content}</p>
        <button class="btn btn-danger" id="completeFinalPrayer">Completar Oração Final</button>
    `;
    
    document.getElementById('prayerModal').style.display = 'block';
    
    document.getElementById('completeFinalPrayer').addEventListener('click', function() {
        const data = getData();
        
        // Garantir que a estrutura existe
        if (!data.rosary) data.rosary = { currentProgress: {} };
        if (!currentProgress) currentProgress = {};
        
        currentProgress.finalPrayer = true;
        lastCompleted = new Date().toDateString();
        
        saveData(data);
        document.getElementById('prayerModal').style.display = 'none';
        
        alert('Parabéns! Você completou o terço hoje!');
    });
}

// Atualizar a barra de progresso do terço
function updateRosaryProgress() {
    const data = getData();
    const progress = currentProgress;
    
    let completed = 0;
    let total = 1; // Inicia com 1 para as orações básicas
    
    // Verificar orações básicas
    if (progress.basicPrayers) completed++;
    
    // Verificar oração final
    total++;
    if (progress.finalPrayer) completed++;
    
    const percentage = Math.round((completed / total) * 100);
    const progressBar = document.getElementById('rosaryProgress');
    progressBar.style.width = `${percentage}%`;
    
    // Alterar cor da barra de progresso se estiver completa
    if (percentage === 100) {
        progressBar.classList.add('progress-completed');
    } else {
        progressBar.classList.remove('progress-completed');
    }
    
    document.getElementById('progressText').textContent = `${percentage}%`;
}

// Atualizar o botão do terço
function updateRosaryButton() {
    const data = getData();
    const rosaryButtonContainer = document.getElementById('rosaryButtonContainer');
    const progress = currentProgress;
    
    // Verificar se o terço está completo
    const isRosaryCompleted = progress.finalPrayer;
    
    if (isRosaryCompleted) {
        rosaryButtonContainer.innerHTML = `
            <button class="btn btn-completed" id="rosaryCompleted">Terço Concluído</button>
        `;
    } else {
        rosaryButtonContainer.innerHTML = `
            <button class="btn btn-danger" id="startRosary">Iniciar Terço</button>
        `;
        
        // Re-adicionar o event listener
        document.getElementById('startRosary').addEventListener('click', function() {
            startRosary();
        });
    }
}
