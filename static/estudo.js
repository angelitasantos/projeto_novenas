// ============================================================================================
// Evento: Quando o DOM estiver completamente carregado
// ============================================================================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        setupAccessibilityToggle();
        // ⬇️ Obtém a novena salva no localStorage ou usa a padrão
        const selectedNovena = localStorage.getItem('selectedNovena') 
                               || 'novenas/novena-maos-ensanguentadas.json';
        
        // ⬇️ Inicializa a novena selecionada
        await initNovena(selectedNovena);

        // ⬇️ Configura o botão "CARREGAR NOVENA"
        // Garantindo que o listener só será adicionado após o botão existir no DOM
        setupLoadNovenaButton();
    } catch (error) {
        console.error('Erro ao inicializar a página:', error);
        alert('Ocorreu um erro ao carregar a novena. Por favor, recarregue a página!');
    }
});

// Variável global para armazenar os dados do JSON
let novenaContent = {};
let lastCompleted = null;

///////////////////////////////////////////////////////////////////////////////////////////////

// ============================================================================================
// Função principal: inicializa a novena
// ============================================================================================
async function initNovena(novenaFile = 'novenas/novena-maos-ensanguentadas.json') {
    try {
        // ------------------------------------------------------------------------------------
        // Conceito: Web Storage API
        // Salva a novena selecionada no localStorage para persistência
        // ------------------------------------------------------------------------------------
        localStorage.setItem('selectedNovena', novenaFile);

        // ------------------------------------------------------------------------------------
        // Carregar os dados da novena (JSON)
        // Conceito: Fetch API + async/await
        // ------------------------------------------------------------------------------------
        const novenaContent = await loadJsonData(novenaFile);

        // ------------------------------------------------------------------------------------
        // Atualiza a interface da página (DOM Manipulation)
        // Conceito: HTML + JS
        // ------------------------------------------------------------------------------------
        initializePage(novenaContent);

        // ------------------------------------------------------------------------------------
        // Configura event listener do modal (evita duplicidade)
        // Conceito: Eventos em JS e Manipulação de DOM
        // ------------------------------------------------------------------------------------
        setupModalListener();

    } catch (error) {
        // ------------------------------------------------------------------------------------
        // Tratamento de erros
        // Conceito: try/catch, feedback ao usuário
        // ------------------------------------------------------------------------------------
        console.error('Erro ao carregar dados da novena:', error);
        alert('Erro ao carregar os dados da novena. Por favor, recarregue a página ou tente outra novena.');
    }
}

// ============================================================================================
// Função: Carrega o JSON da novena e trata dados persistidos
// ============================================================================================
async function loadJsonData(novenaFile) {
    try {
        const response = await fetch(novenaFile);

        // Tratamento se o arquivo JSON não existir ou estiver corrompido
        if (!response.ok) throw new Error(`Arquivo ${novenaFile} não encontrado`);

        const loadedJson = await response.json();

        // ------------------------------------------------------------------------------------
        // Conceito: Persistência de dados e verificação de estado
        // ------------------------------------------------------------------------------------
        const persisted = getData(null); // Função que retorna dados do localStorage
        if (persisted) {
            return persisted;
        } else {
            saveData(loadedJson); // Salva no localStorage
            return loadedJson;
        }
    } catch (error) {
        // Repassa o erro para ser tratado na função principal
        throw error;
    }
}

// ============================================================================================
// Função: Atualiza a interface da página com os dados da novena
// ============================================================================================
function initializePage(novenaContent) {
    // ------------------------------------------------------------------------------------
    // Conceito: Manipulação do DOM (document.title)
    // ------------------------------------------------------------------------------------
    document.title = novenaContent.title || document.title;

    // ------------------------------------------------------------------------------------
    // Conceito: Separação de responsabilidades
    // Atualiza HTML, conteúdo e renderiza containers
    // ------------------------------------------------------------------------------------
    updateHtml(novenaContent);                  // Atualiza cabeçalho, títulos, etc.
    populateContent(novenaContent);             // Preenche oração inicial e final
    renderNovenaContainer(novenaContent);       // Renderiza a novena no container principal
    renderDayButtons(novenaContent);            // Renderiza os dias da novena
    renderRosarioContainer(novenaContent);      // Renderiza o terço
    updateRosaryProgress(novenaContent);        // Atualiza progresso do terço
    updateRosaryButton(novenaContent);          // Atualiza botão do terço
    ensureCompletionUI(novenaContent);
    setupResetNovenaButton(novenaContent);
}

// ============================================================================================
// Função: Configura listener para fechar o modal
// ============================================================================================
function setupModalListener() {
    const closeBtn = document.getElementById('closeModal');

    // Remove listener existente para evitar duplicidade
    closeBtn.removeEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);

    function closeModal() {
        document.getElementById('prayerModal').style.display = 'none';
    }

    // Fechar modal com tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape") {
            const modal = document.getElementById('prayerModal');
            if (modal && modal.style.display === "block") {
                modal.style.display = "none";
            }
        }
    });
}

// ============================================================================================
// Função: Carrega a novena selecionada pelo usuário
// ============================================================================================
async function loadSelectedNovena() {
    try {
        // ------------------------------------------------------------------------------------
        // Conceito: Manipulação do DOM
        // Seleciona o elemento <select> com id 'novenaSelect'
        // ------------------------------------------------------------------------------------
        const novenaSelect = document.getElementById('novenaSelect');
        if (!novenaSelect) {
            throw new Error('Elemento #novenaSelect não encontrado!');
        }

        // ------------------------------------------------------------------------------------
        // Obtém a novena escolhida pelo usuário
        // ------------------------------------------------------------------------------------
        const selectedNovena = novenaSelect.value;

        // ------------------------------------------------------------------------------------
        // Limpa os dados da novena anterior no localStorage
        // ------------------------------------------------------------------------------------
        localStorage.removeItem('novenaData');

        // ------------------------------------------------------------------------------------
        // Atualiza a novena selecionada no localStorage
        // ------------------------------------------------------------------------------------
        localStorage.setItem('selectedNovena', selectedNovena);

        // ------------------------------------------------------------------------------------
        // Carrega a nova novena usando initNovena
        // ------------------------------------------------------------------------------------
        await initNovena(selectedNovena);

        // ------------------------------------------------------------------------------------
        // Configura novamente o botão "CARREGAR NOVENA"
        // (pois ele pode ser recriado no header)
        // ------------------------------------------------------------------------------------
        setupLoadNovenaButton();

    } catch (error) {
        console.error('Erro ao carregar a novena selecionada:', error);
        alert('Ocorreu um erro ao carregar a novena. Por favor, tente novamente!');
    }
}

// ============================================================================================
// Função: Configura o listener do botão "CARREGAR NOVENA"
// ============================================================================================
function setupLoadNovenaButton() {
    // Seleciona o botão após ele estar presente no DOM
    const loadBtn = document.getElementById('loadNovena');

    if (!loadBtn) {
        console.warn('Botão #loadNovena não encontrado. Será necessário garantir que ele exista no header.');
        return;
    }

    // Remove listener antigo (evita duplicidade caso a função seja chamada várias vezes)
    loadBtn.removeEventListener('click', loadSelectedNovena);
    
    // Adiciona listener para carregar a novena selecionada
    loadBtn.addEventListener('click', loadSelectedNovena);
}

// ============================================================================================
// Função: Atualiza o header e footer com dados da novena
// ============================================================================================
function updateHtml(novenaContent) {
    try {
        // ------------------------------------------------------------------------------------
        // Conceito: Verificação de dados (defensivo)
        // Garante que novenaContent foi passado corretamente
        // ------------------------------------------------------------------------------------
        if (!novenaContent) {
            console.warn('novenaContent não foi fornecido.');
            return;
        }

        // ------------------------------------------------------------------------------------
        // Conceito: Manipulação do DOM (HTML)
        // Seleciona o header e a div.novena-selector dentro dele
        // ------------------------------------------------------------------------------------
        const header = document.querySelector('header');
        const novenaSelector = header ? header.querySelector('.novena-selector') : null;

        if (!header || !novenaSelector) {
            console.warn('Header ou .novena-selector não encontrado.');
            return;
        }

        // ------------------------------------------------------------------------------------
        // Conceito: Criar ou atualizar elementos no DOM
        // h1 para título da novena
        // ------------------------------------------------------------------------------------
        let headerTitle = header.querySelector('h1');
        if (!headerTitle) {
            headerTitle = document.createElement('h1');
            header.insertBefore(headerTitle, novenaSelector);
        }
        headerTitle.textContent = novenaContent.title || '';

        // ------------------------------------------------------------------------------------
        // Conceito: Criar ou atualizar parágrafo (p) com classe CSS
        // subtitle da novena
        // ------------------------------------------------------------------------------------
        let headerSubtitle = header.querySelector('p.text-center');
        if (!headerSubtitle) {
            headerSubtitle = document.createElement('p');
            headerSubtitle.classList.add('text-center');
            header.insertBefore(headerSubtitle, novenaSelector);
        }
        headerSubtitle.textContent = novenaContent.subtitle || '';

        // ------------------------------------------------------------------------------------
        // Conceito: Criar ou atualizar footer
        // ------------------------------------------------------------------------------------
        let footer = document.querySelector('footer');
        if (!footer) {
            footer = document.createElement('footer');
            document.body.appendChild(footer);
        }

        const currentYear = new Date().getFullYear();
        footer.textContent = `© ${currentYear} - ${novenaContent.title || ''}`;

    } catch (error) {
        // ------------------------------------------------------------------------------------
        // Conceito: Tratamento de erros
        // ------------------------------------------------------------------------------------
        console.error('Erro ao atualizar o HTML:', error);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////

// ============================================================================================
// Função: Preenche as orações inicial e final da novena
// ============================================================================================
function populateContent(novenaContent) {
    try {
        // ------------------------------------------------------------------------------------
        // Verifica se novenaContent foi passado corretamente
        // ------------------------------------------------------------------------------------
        if (!novenaContent) {
            console.warn("novenaContent não foi fornecido.");
            return;
        }

        // ======================================================
        // Preencher a primeira oração
        // ======================================================
        const firstPrayer = document.getElementById('firstPrayer');
        if (!firstPrayer) {
            console.warn("Elemento com id 'firstPrayer' não encontrado no DOM!");
            return;
        }

        // Cria container para o conteúdo se não existir
        let firstPrayerContent = document.getElementById('firstPrayerContent');
        if (!firstPrayerContent) {
            firstPrayerContent = document.createElement('div');
            firstPrayerContent.id = 'firstPrayerContent';
            firstPrayer.appendChild(firstPrayerContent);
        }

        // Preenche o conteúdo usando HTML dinâmico
        // Conceitos aplicados:
        // - Template literals para interpolação de strings
        // - map() para iterar sobre array de parágrafos
        // - innerHTML para atualizar o DOM
        firstPrayerContent.innerHTML = `
            <h2 class="text-center text-red">${novenaContent.firstPrayerContent.title}</h2>
            <hr class="margin-vertical">
            ${novenaContent.firstPrayerContent.content.map(paragraph => `<p>${paragraph}</p>`).join('')}
        `;

        // ======================================================
        // Preencher a oração final
        // ======================================================
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

        // Preenche o conteúdo da oração final
        finalPrayerContent.innerHTML = `
            <h2 class="text-center text-red">${novenaContent.finalPrayerContent.title}</h2>
            <hr class="margin-vertical">
            ${novenaContent.finalPrayerContent.content.map(paragraph => {
                
                // Verifica se o parágrafo é uma oração compartilhada
                if (paragraph.startsWith('<strong>') && paragraph.endsWith('</strong>')) {
                    const prayerTitle = paragraph.replace('<strong>', '').replace('</strong>', '').trim();
                    const sharedPrayer = Object.values(novenaContent.sharedPrayers).find(p => p.title === prayerTitle);

                    if (sharedPrayer) {
                        // Retorna título e conteúdo da oração compartilhada
                        return `<h4><strong>${sharedPrayer.title}</strong></h4><p>${sharedPrayer.content}</p>`;
                    }

                    // Caso não seja oração compartilhada
                    return `<h4>${paragraph}</h4>`;
                } else {
                    return `<p>${paragraph}</p>`;
                }

            }).join('')}
        `;

    } catch (error) {
        // ------------------------------------------------------------------------------------
        // Tratamento de erros
        // ------------------------------------------------------------------------------------
        console.error("Erro ao incluir o conteúdo das orações inicial e final:", error);
    }
}

// ============================================================================================
// Função: Renderiza o título da novena na seção dos dias
// ============================================================================================
function renderNovenaContainer(novenaContent) {
    try {
        // ------------------------------------------------------------------------------------
        // Verifica se novenaContent foi passado corretamente
        // ------------------------------------------------------------------------------------
        if (!novenaContent) {
            console.warn("novenaContent não foi fornecido.");
            return;
        }

        // ------------------------------------------------------------------------------------
        // Seleciona o container onde o título da novena será exibido
        // ------------------------------------------------------------------------------------
        const novenaContainer = document.getElementById('novenaContainer');
        if (!novenaContainer) {
            console.warn("Elemento com id 'novenaContainer' não encontrado.");
            return;
        }

        // ------------------------------------------------------------------------------------
        // Cria o elemento para o título da novena, caso não exista
        // ------------------------------------------------------------------------------------
        let novenaTitle = document.getElementById('novenaTitle');
        if (!novenaTitle) {
            novenaTitle = document.createElement('div');
            novenaTitle.id = 'novenaTitle';
            // prepend adiciona o elemento no início do container
            novenaContainer.prepend(novenaTitle);
        }

        // ------------------------------------------------------------------------------------
        // Atualiza o conteúdo HTML do título
        // Conceitos aplicados:
        // - Template literals para interpolação de strings
        // - Classes CSS aplicadas diretamente no HTML
        // - innerHTML para atualizar o DOM dinamicamente
        // ------------------------------------------------------------------------------------
        novenaTitle.innerHTML = `
            <h2 class="text-center text-red">${novenaContent.title}</h2>
            <hr class="margin-vertical">
            <p>${novenaContent.paragraph}</p>
        `;

    } catch (error) {
        // ------------------------------------------------------------------------------------
        // Tratamento de erros
        // ------------------------------------------------------------------------------------
        console.error('Erro ao renderizar o novenaContainer:', error);
    }
}

// ============================================================================================
// Função: Renderiza o conteúdo do Rosário na novena
// ============================================================================================
function renderRosarioContainer(novenaContent) {
    try {
        // ------------------------------------------------------------------------------------
        // Verifica se novenaContent foi passado corretamente
        // ------------------------------------------------------------------------------------
        if (!novenaContent) {
            console.warn("novenaContent não foi fornecido.");
            return;
        }

        // ------------------------------------------------------------------------------------
        // Seleciona o container principal do Rosário
        // ------------------------------------------------------------------------------------
        const rosarioContainer = document.getElementById('rosarioContainer');
        if (!rosarioContainer) {
            console.warn("Elemento com id 'rosarioContainer' não encontrado.");
            return;
        }

        // ------------------------------------------------------------------------------------
        // Cria ou atualiza o título do Rosário
        // ------------------------------------------------------------------------------------
        let rosaryTitle = document.getElementById('rosaryTitle');
        if (!rosaryTitle) {
            rosaryTitle = document.createElement('div');
            rosaryTitle.id = 'rosaryTitle';
            // prepend coloca o título no início do container
            rosarioContainer.prepend(rosaryTitle);
        }

        // ------------------------------------------------------------------------------------
        // Preenche o título e instrução do Rosário
        // Conceitos aplicados:
        // - Template literals para interpolar valores do JSON
        // - Classes CSS para estilização
        // - innerHTML para atualizar o DOM
        // ------------------------------------------------------------------------------------
        rosaryTitle.innerHTML = `
            <h2 class="text-center text-red">${novenaContent.rosaryContent.title}</h2>
            <hr class="margin-vertical">
            <p class="text-center">Reze primeiro a Novena e, em seguida, o Terço.</p>
        `;

        // ------------------------------------------------------------------------------------
        // Cria ou atualiza container para o conteúdo inicial do Terço
        // ------------------------------------------------------------------------------------
        let firstRosaryContent = document.getElementById('firstRosaryContent');
        if (!firstRosaryContent) {
            firstRosaryContent = document.createElement('div');
            firstRosaryContent.id = 'firstRosaryContent';
            // Insere logo após o título do Rosário
            rosaryTitle.after(firstRosaryContent);
        }

        // ------------------------------------------------------------------------------------
        // Preenche o conteúdo inicial do Terço
        // - map() para iterar sobre cada item do array
        // - verifica se o item é um título forte (<strong>) e transforma em <h4>
        // - caso contrário, insere como <p>
        // ------------------------------------------------------------------------------------
        firstRosaryContent.innerHTML = novenaContent.rosaryContent.content
            .map(item => {
                if (item.startsWith('<strong>') && item.endsWith('</strong>')) {
                    return `<h4>${item}</h4>`;
                } else {
                    return `<p>${item}</p>`;
                }
            }).join('');

    } catch (error) {
        // ------------------------------------------------------------------------------------
        // Tratamento de erros
        // ------------------------------------------------------------------------------------
        console.error('Erro ao renderizar o rosarioContainer:', error);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////

// ============================================================================================
// Função: Gera uma chave única para armazenar a novena no localStorage
// ============================================================================================
function getNovenaKey() {
    // ------------------------------------------------------------------------------------
    // Conceito: Web Storage API
    // Recupera o nome do arquivo da novena selecionada
    // ------------------------------------------------------------------------------------
    const novenaFile = localStorage.getItem('selectedNovena') 
                       || 'novenas/novena-maos-ensanguentadas.json';

    // -------------------------
    // Cria uma chave única baseada no nome do arquivo
    // Substitui caracteres que não sejam letras ou números por "_"
    // ------------------------------------------------------------------------------------
    return `${novenaFile.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

// ============================================================================================
// Função: Obter dados do localStorage
// Retorna os dados da novena salvos, ou um valor padrão
// ============================================================================================
function getData(defaultValue = null) {
    try {
        // ------------------------------------------------------------------------------------
        // Gera a chave única da novena
        // ------------------------------------------------------------------------------------
        const key = getNovenaKey();

        // ------------------------------------------------------------------------------------
        // Recupera os dados brutos do localStorage
        // ------------------------------------------------------------------------------------
        const raw = localStorage.getItem(key);

        // Retorna valor padrão caso não haja dados
        if (!raw) return defaultValue;

        // Converte string JSON de volta em objeto JS
        return JSON.parse(raw);

    } catch (e) {
        // ------------------------------------------------------------------------------------
        // Tratamento de erro
        // Caso o JSON esteja corrompido ou inválido
        // ------------------------------------------------------------------------------------
        console.error("Erro ao ler localStorage:", e);
        return defaultValue;
    }
}

// ============================================================================================
// Função: Salvar dados no localStorage
// ============================================================================================
function saveData(data) {
    try {
        // ------------------------------------------------------------------------------------
        // Gera a chave única da novena
        // ------------------------------------------------------------------------------------
        const key = getNovenaKey();

        // ------------------------------------------------------------------------------------
        // Converte o objeto em string JSON
        // ------------------------------------------------------------------------------------
        const jsonData = JSON.stringify(data);

        // ------------------------------------------------------------------------------------
        // Salva no localStorage
        // ------------------------------------------------------------------------------------
        localStorage.setItem(key, jsonData);

    } catch (error) {
        // ------------------------------------------------------------------------------------
        // Tratamento de erro
        // Pode ocorrer se o armazenamento estiver cheio
        // ------------------------------------------------------------------------------------
        console.error("Erro ao salvar dados da novena no localStorage:", error);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////

// ============================================================================================
// Função: Renderiza os botões de cada dia da novena
// ============================================================================================
function renderDayButtons(novenaContent) {
    try {
        // ------------------------------------------------------------------------------------
        // Seleciona o container dos botões de dia
        // ------------------------------------------------------------------------------------
        const daySelector = document.getElementById('daySelector');
        if (!daySelector) {
            console.warn("Elemento #daySelector não encontrado!");
            return;
        }

        // Limpa o container antes de criar os botões
        daySelector.innerHTML = "";

        // Obtém os dados da novena salvos no localStorage ou do JSON
        const data = getData() || novenaContent;

        if (!data || !data.days) {
            console.warn("Nenhum dado de dias encontrado no JSON!");
            return;
        }

        // ------------------------------------------------------------------------------------
        // Cria botão para cada dia
        // ------------------------------------------------------------------------------------
        data.days.forEach(dayData => {
            const dayBtn = document.createElement('button');
            dayBtn.className = 'btn-day';
            dayBtn.textContent = `Dia ${dayData.day}`;
            dayBtn.dataset.day = dayData.day;

            if (dayData.read) dayBtn.classList.add('completed');
            if (dayData.active) dayBtn.classList.add('active');

            // --------------------------------------------------------------------------------
            // Evento de clique para ativar/desativar o dia
            // --------------------------------------------------------------------------------
            dayBtn.addEventListener('click', () => {
                if (dayData.active) {
                    dayData.active = false;
                    saveData(data);
                    clearDayMessage();
                } else {
                    data.days.forEach(d => d.active = false);
                    dayData.active = true;
                    saveData(data);
                    showDayMessage(dayData, novenaContent);
                }

                // Re-renderiza os botões para atualizar classes CSS
                renderDayButtons(novenaContent);
            });

            daySelector.appendChild(dayBtn);
        });

        // ------------------------------------------------------------------------------------
        // Configura o botão "Marcar este dia como lido" / "Novena Concluída"
        // ------------------------------------------------------------------------------------
        const markDayReadBtn = document.getElementById('markDayRead');
        if (markDayReadBtn) {
            // Substitui por clone para evitar duplicidade de listeners
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

                    activeDay.read = true;
                    activeDay.active = false;
                    saveData(data);

                    // Atualiza a interface
                    renderDayButtons(novenaContent);
                    clearDayMessage(novenaContent);
                });
            }
        }

        updateCompletionSection(novenaContent);

    } catch (error) {
        console.error("Erro ao renderizar os botões dos dias:", error);
    }
}

// ============================================================================================
// Função: Mostra mensagem do dia selecionado
// ============================================================================================
function showDayMessage(dayData, novenaContent) {
    try {
        const messageDiv = document.getElementById('dailyMessage');
        if (!messageDiv) {
            console.warn("Elemento #dailyMessage não encontrado!");
            return;
        }

        // Preenche o conteúdo do dia
        messageDiv.innerHTML = `
            <h3><strong>${dayData.title || ''}</strong></h3>
            <p>${dayData.message1 || ''}</p>
            <p>${dayData.message2 || ''}</p>
            <p><strong>${dayData.message3 || ''}</strong></p>
            <p><em>${dayData.message4 || ''}</em></p>
        `;
    } catch (error) {
        console.error("Erro ao exibir mensagem do dia:", error);
    }
}

// ============================================================================================
// Função: Limpa a mensagem do dia
// ============================================================================================
function clearDayMessage(novenaContent) {
    try {
        const messageDiv = document.getElementById('dailyMessage');
        if (!messageDiv) return;

        messageDiv.innerHTML = '<p>Selecione um dia para visualizar a mensagem correspondente.</p>';

        // Remove a classe active de todos os botões
        document.querySelectorAll('.btn-day').forEach(btn => btn.classList.remove('active'));

        // Limpa o estado active no JSON e persiste
        const data = getData() || novenaContent;
        if (data && data.days) {
            data.days.forEach(d => d.active = false);
            saveData(data);
        }
    } catch (error) {
        console.error("Erro ao limpar mensagem do dia:", error);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////

// ============================================================================================
// Função: Inicia o Terço
// ============================================================================================
function startRosary(novenaContent) {
    try {
        // ------------------------------------------------------------------------------------
        // Obtém o progresso atual do terço do localStorage
        // ------------------------------------------------------------------------------------
        const progress = getRosaryProgress(novenaContent);

        // ------------------------------------------------------------------------------------
        // Se as orações básicas não foram feitas, exibe-as primeiro
        // ------------------------------------------------------------------------------------
        if (!progress.basicPrayers) {
            showBasicPrayers(novenaContent);
            return;
        }

        // ------------------------------------------------------------------------------------
        // Encontra o próximo mistério que não foi completado
        // ------------------------------------------------------------------------------------
        let nextMystery = null;
        for (let i = 0; i < progress.mysteries.length; i++) {
            if (!progress.mysteries[i].completed) {
                nextMystery = i;
                break;
            }
        }

        // ------------------------------------------------------------------------------------
        // Se todos os mistérios foram completados, exibe a oração final
        // ------------------------------------------------------------------------------------
        if (nextMystery === null) {
            if (!progress.finalPrayer) {
                showFinalPrayer(novenaContent);
            } else {
                alert('Você já completou o terço hoje!');
            }
            return;
        }

        // ------------------------------------------------------------------------------------
        // Exibe o próximo mistério
        // ------------------------------------------------------------------------------------
        showMystery(nextMystery, novenaContent);

    } catch (error) {
        console.error("Erro ao iniciar o Terço:", error);
    }
}

// ============================================================================================
// Função: Exibe as orações básicas antes do terço
// ============================================================================================
function showBasicPrayers(novenaContent) {
    try {
        const basicPrayers = novenaContent.rosaryPrayers.basicPrayers;

        // Cria o HTML do modal para as orações básicas
        let prayersHTML = `<h2 class="text-center text-red">${basicPrayers.title}</h2><hr class="margin-vertical">`;

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

        // ------------------------------------------------------------------------------------
        // Atualiza o conteúdo do modal e exibe
        // ------------------------------------------------------------------------------------
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = prayersHTML;

        document.getElementById('prayerModal').style.display = 'block';

        // ------------------------------------------------------------------------------------
        // Event listener para completar as orações básicas
        // ------------------------------------------------------------------------------------
        document.getElementById('completeBasicPrayers').addEventListener('click', function() {
            const data = getData();
            const progress = getRosaryProgress(novenaContent);

            progress.basicPrayers = true;
            data.rosary.currentProgress = progress;
            saveData(data);

            document.getElementById('prayerModal').style.display = 'none';

            // Inicia o primeiro mistério
            startRosary(novenaContent);
            updateRosaryProgress(novenaContent);
            updateRosaryButton(novenaContent);
        });

    } catch (error) {
        console.error("Erro ao exibir orações básicas:", error);
    }
}

// ============================================================================================
// Função: Exibe um mistério do terço
// ============================================================================================
function showMystery(mysteryIndex, novenaContent) {
    try {
        const mystery = novenaContent.mysteries[mysteryIndex];

        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h2 class="text-center text-red">${mystery.title}</h2>
            <hr class="margin-vertical">
            <p>Meditação:</p>
            <p class="meditation">${mystery.meditation}</p>
            <button class="btn btn-danger" id="completeMystery">Completar Meditação</button>
        `;

        document.getElementById('prayerModal').style.display = 'block';

        const botao = document.getElementById('completeMystery');


        // ------------------------------------------------------------------------------------
        // Event listener para marcar o mistério como completo
        // ------------------------------------------------------------------------------------
        botao.addEventListener('click', function() {
            const data = getData();
            const progress = getRosaryProgress(novenaContent);

            progress.mysteries[mysteryIndex].completed = true;
            data.rosary.currentProgress = progress;
            saveData(data);

            document.getElementById('prayerModal').style.display = 'none';

            // Exibe as 10 rezas do mistério
            showPrayers(mysteryIndex, novenaContent);
            updateRosaryProgress(novenaContent);
            updateRosaryButton(novenaContent);
        });

        if (window.innerWidth > 900) {
        document.addEventListener('keydown', function handleEnter(e) {
            if (e.key === "Enter") {
                botao.click();
                document.removeEventListener('keydown', handleEnter);
            }
        });
    }

    } catch (error) {
        console.error("Erro ao exibir o mistério:", error);
    }
}

// ============================================================================================
// Função: Mostrar as 10 rezas de um mistério
// ============================================================================================
function showPrayers(mysteryIndex, novenaContent) {
    try {
        // ------------------------------------------------------------------------------------
        // Recupera os dados do progresso do terço
        // ------------------------------------------------------------------------------------
        const progress = getRosaryProgress(novenaContent);
        const mystery = progress.mysteries[mysteryIndex];
        const mysteryContent = novenaContent.mysteries[mysteryIndex];
        const prayerText = novenaContent.rosaryPrayers.prayerText;

        // ------------------------------------------------------------------------------------
        // Encontrar a próxima oração não completada
        // ------------------------------------------------------------------------------------
        let nextPrayer = mystery.prayers.findIndex(prayer => !prayer);

        // ------------------------------------------------------------------------------------
        // Se todas as orações foram completadas, voltar para o fluxo do terço
        // ------------------------------------------------------------------------------------
        if (nextPrayer === -1) {
            startRosary(novenaContent);
            return;
        }

        // ------------------------------------------------------------------------------------
        // Atualiza o modal com a oração atual
        // ------------------------------------------------------------------------------------
        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h2 class="text-center text-red">${mysteryContent.title} - Oração ${nextPrayer + 1}/10</h2>
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

        // ------------------------------------------------------------------------------------
        // Event listener para marcar oração como completada
        // ------------------------------------------------------------------------------------
        document.getElementById('completePrayer').addEventListener('click', function() {
            const data = getData();
            const progress = getRosaryProgress(novenaContent);

            progress.mysteries[mysteryIndex].prayers[nextPrayer] = true;
            data.rosary.currentProgress = progress;
            saveData(data);

            document.getElementById('prayerModal').style.display = 'none';

            // Chama recursivamente para mostrar a próxima oração
            showPrayers(mysteryIndex, novenaContent);
            updateRosaryProgress(novenaContent);
            updateRosaryButton(novenaContent);
        });

    } catch (error) {
        console.error("Erro ao mostrar as orações do mistério:", error);
    }
}

// ============================================================================================
// Função: Mostrar Oração Final do Terço
// ============================================================================================
function showFinalPrayer(novenaContent) {
    try {
        const finalPrayer = novenaContent.rosaryPrayers.finalPrayer;

        const modalContent = document.getElementById('modalContent');
        modalContent.innerHTML = `
            <h2 class="text-center text-red">${finalPrayer.title}</h2>
            <hr class="margin-vertical">
            <p>${finalPrayer.content}</p>
            <button class="btn btn-danger" id="completeFinalPrayer">Completar Oração Final</button>
        `;

        document.getElementById('prayerModal').style.display = 'block';

        // ------------------------------------------------------------------------------------
        // Event listener para marcar oração final como completada
        // ------------------------------------------------------------------------------------
        document.getElementById('completeFinalPrayer').addEventListener('click', function() {
            const data = getData();
            const progress = getRosaryProgress(novenaContent);

            progress.finalPrayer = true;
            progress.lastCompleted = new Date().toDateString();
            data.rosary.currentProgress = progress;
            saveData(data);

            document.getElementById('prayerModal').style.display = 'none';

            // Atualiza a interface do terço
            updateRosaryProgress(novenaContent);
            updateRosaryButton(novenaContent);

            alert('Parabéns! Você completou o terço hoje!');
        });

    } catch (error) {
        console.error("Erro ao mostrar a oração final do terço:", error);
    }
}

// ============================================================================================
// Função: Atualizar a barra de progresso do terço
// ============================================================================================
function updateRosaryProgress(novenaContent) {
    try {
        const progress = getRosaryProgress(novenaContent);

        let completed = 0;
        let total = 0;

        // ------------------------------------------------------------------------------------
        // Contar oração básica
        // ------------------------------------------------------------------------------------
        total++;
        if (progress.basicPrayers) completed++;

        // ------------------------------------------------------------------------------------
        // Contar cada oração de cada mistério
        // ------------------------------------------------------------------------------------
        if (progress.mysteries && progress.mysteries.length) {
            progress.mysteries.forEach(mystery => {
                mystery.prayers.forEach(prayer => {
                    total++;
                    if (prayer) completed++;
                });
            });
        }

        // ------------------------------------------------------------------------------------
        // Contar oração final
        // ------------------------------------------------------------------------------------
        total++;
        if (progress.finalPrayer) completed++;

        // ------------------------------------------------------------------------------------
        // Calcula porcentagem de progresso
        // ------------------------------------------------------------------------------------
        const percentage = Math.round((completed / total) * 100);

        // ------------------------------------------------------------------------------------
        // Atualiza a barra de progresso e o texto
        // ------------------------------------------------------------------------------------
        const progressBar = document.getElementById('rosaryProgress');
        progressBar.style.width = `${percentage}%`;

        if (percentage === 100) {
            progressBar.classList.add('progress-completed');
        } else {
            progressBar.classList.remove('progress-completed');
        }

        const progressText = document.getElementById('progressText');
        if (progressText) progressText.textContent = `${percentage}%`;

        updateCompletionSection(novenaContent);

    } catch (error) {
        console.error("Erro ao atualizar a barra de progresso do terço:", error);
    }
}

// ============================================================================================
// Função: Atualizar o botão do terço
// ============================================================================================
function updateRosaryButton(novenaContent) {
    try {
        const progress = getRosaryProgress(novenaContent);
        const rosaryButtonContainer = document.getElementById('rosaryButtonContainer');

        if (!rosaryButtonContainer) return;

        // ------------------------------------------------------------------------------------
        // Verifica se o terço está completo
        // ------------------------------------------------------------------------------------
        const isRosaryCompleted = progress.finalPrayer;

        if (isRosaryCompleted) {
            rosaryButtonContainer.innerHTML = `
                <button class="btn btn-success" id="rosaryCompleted">Terço Concluído</button>
            `;
        } else {
            rosaryButtonContainer.innerHTML = `
                <button class="btn btn-danger" id="startRosary">Iniciar Terço</button>
            `;

            // --------------------------------------------------------------------------------
            // Re-adiciona event listener de forma segura
            // --------------------------------------------------------------------------------
            const startButton = document.getElementById('startRosary');
            if (startButton) {
                startButton.addEventListener('click', function() {
                    startRosary(novenaContent);
                });
            }
        }

    } catch (error) {
        console.error("Erro ao atualizar botão do terço:", error);
    }
}

// ============================================================================================
// Função: Garante que a estrutura do progresso do terço exista
// ============================================================================================
function getRosaryProgress(novenaContent) {
    try {
        const data = getData() || {};

        if (!data.rosary) {
            data.rosary = { currentProgress: {} };
        }

        if (!data.rosary.currentProgress.mysteries) {
            data.rosary.currentProgress = {
                basicPrayers: false,
                mysteries: (novenaContent.mysteries || []).map(() => ({
                    completed: false,
                    prayers: Array(10).fill(false)
                })),
                finalPrayer: false
            };
            saveData(data);
        }

        return data.rosary.currentProgress;

    } catch (error) {
        console.error("Erro ao obter progresso do terço:", error);
        // Retorna uma estrutura padrão em caso de falha
        return {
            basicPrayers: false,
            mysteries: (novenaContent.mysteries || []).map(() => ({
                completed: false,
                prayers: Array(10).fill(false)
            })),
            finalPrayer: false
        };
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////

// ============================================================================================
// UI de conclusão (cria a seção e delega os botões)
// ============================================================================================
function ensureCompletionUI(novenaContent) {
    const novenaContainer = document.getElementById('novenaContainer');
    if (!novenaContainer) return;

    let completionSection = document.getElementById('completionSection');
    if (!completionSection) {
        completionSection = document.createElement('section');
        completionSection.id = 'completionSection';
        completionSection.className = 'section';
        completionSection.innerHTML = `
            <h2 class="text-center">Progresso da Novena</h2>
            <div id="completionContent"></div>
        `;

        // insere logo depois da mensagem diária, se existir
        const dailyMessage = document.getElementById('dailyMessage');
        if (dailyMessage && dailyMessage.parentNode === novenaContainer) {
            novenaContainer.insertBefore(completionSection, dailyMessage.nextSibling);
        } else {
            novenaContainer.appendChild(completionSection);
        }
    }

    // delegação de eventos para os botões internos
    completionSection.removeEventListener('click', handleCompletionClick);
    completionSection.addEventListener('click', handleCompletionClick);

    function handleCompletionClick(e) {
        const el = e.target;
        if (!el || !el.id) return;
        if (el.id === 'completeDay') {
            completeDay(novenaContent);
        } else if (el.id === 'completeNovena') {
            completeNovena(novenaContent);
        }
    }

    updateCompletionSection(novenaContent);
}

// ============================================================================================
// Atualiza conteúdo/estado da seção de conclusão
// ============================================================================================
function updateCompletionSection(novenaContent) {
    const data = getData() || novenaContent;
    const section = document.getElementById('completionSection');
    if (!section || !data || !data.days) return;

    const content = section.querySelector('#completionContent') || section;

    const totalDays = data.days.length;
    const completedDays = data.days.filter(d => d.read).length;
    const allDaysRead = completedDays === totalDays;

    const rosaryDone = !!getRosaryProgress(novenaContent).finalPrayer;

    // procura o último dia lido mas ainda não marcado como concluído
    const pendingDayIndex = data.days.findIndex(d => d.read && !d.completedDay);

    let html = `
        <p class="text-center">Dias concluídos (lidos): <strong>${completedDays}/${totalDays}</strong></p>
    `;

    if (pendingDayIndex !== -1) {
        const pendingDay = data.days[pendingDayIndex];
        html += `<p class="text-center">Dia pendente para concluir: <strong>${pendingDay.day}</strong></p>`;
        html += `<button class="btn btn-danger" id="completeDay" ${rosaryDone ? '' : 'disabled'}>Completar Dia</button>`;
        if (!rosaryDone) {
            html += `<p class="text-center">Dica: conclua o Terço para habilitar o botão.</p>`;
        }
    } else if (allDaysRead && rosaryDone) {
        html += `<button class="btn btn-success" id="completeNovena">Finalizar Novena</button>`;
    } else {
        html += `<p class="text-center">Nenhum dia aguardando conclusão no momento.</p>`;
    }

    content.innerHTML = html;
}

// ============================================================================================
// Completar o dia atual (requer: dia ativo + lido + terço finalizado)
// ============================================================================================
function completeDay(novenaContent) {
    try {
        const data = getData() || novenaContent;
        if (!data || !data.days) {
            alert('Dados da novena indisponíveis.');
            return;
        }

        // pega o primeiro dia lido mas não concluído
        const idx = data.days.findIndex(d => d.read && !d.completedDay);
        if (idx === -1) {
            alert('Nenhum dia pendente para concluir.');
            return;
        }

        const progress = getRosaryProgress(novenaContent);
        if (!progress.finalPrayer) {
            alert('Conclua o Terço antes de finalizar o dia.');
            return;
        }

        // marca esse dia como concluído de fato
        data.days[idx].completedDay = true;
        data.days[idx].active = false;

        // ativa o próximo dia (se houver)
        if (idx + 1 < data.days.length) {
            data.days[idx + 1].active = true;
            data.days[idx + 1].read = false;
        }

        // reseta o progresso do terço
        data.rosary.currentProgress = {
            basicPrayers: false,
            mysteries: (novenaContent.mysteries || []).map(() => ({
                completed: false,
                prayers: Array(10).fill(false)
            })),
            finalPrayer: false
        };

        saveData(data);

        // atualiza UI
        clearDayMessage(novenaContent);
        renderDayButtons(novenaContent);
        updateRosaryProgress(novenaContent);
        updateRosaryButton(novenaContent);
        updateCompletionSection(novenaContent);

        alert(`Dia ${data.days[idx].day} concluído!${idx + 1 < data.days.length ? ` Avance para o dia ${data.days[idx + 1].day}.` : ''}`);
    } catch (error) {
        console.error('Erro em completeDay:', error);
        alert('Ocorreu um erro ao completar o dia.');
    }
}

// ============================================================================================
// Finalizar a novena inteira (e reiniciar tudo)
// ============================================================================================
function completeNovena(novenaContent) {
    try {
        const data = getData() || novenaContent;
        if (!data || !data.days) return;

        if (!confirm('Finalizar a novena e reiniciar tudo?')) return;

        // zera todos os dias
        data.days.forEach(d => { d.read = false; d.active = false; });
        if (data.days.length) data.days[0].active = true;

        // zera o terço
        data.rosary = data.rosary || {};
        data.rosary.currentProgress = {
            basicPrayers: false,
            mysteries: (novenaContent.mysteries || []).map(() => ({
                completed: false,
                prayers: Array(10).fill(false)
            })),
            finalPrayer: false
        };

        saveData(data);

        // atualiza UI
        clearDayMessage(novenaContent);
        renderDayButtons(novenaContent);
        updateRosaryProgress(novenaContent);
        updateRosaryButton(novenaContent);
        updateCompletionSection(novenaContent);

        alert('Novena finalizada e reiniciada. Bom recomeço!');
    } catch (error) {
        console.error('Erro em completeNovena:', error);
        alert('Ocorreu um erro ao finalizar a novena.');
    }
}

// ============================================================================================
// Botão "Reiniciar Novena" (se existir no HTML)
// ============================================================================================
function setupResetNovenaButton(novenaContent) {
    const btn = document.getElementById('resetNovena');
    if (!btn) return;

    // remove listeners antigos clonando
    const clone = btn.cloneNode(true);
    btn.parentNode.replaceChild(clone, btn);

    clone.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja reiniciar toda a Novena? Isso apagará o progresso atual.')) {
            completeNovena(novenaContent);
        }
    });
}

///////////////////////////////////////////////////////////////////////////////////////////////

// ------------------------------------------------------------------------------------
// Acessibilidade: botão de "Modo Acessível" e atalho no teclado (F2)
// ------------------------------------------------------------------------------------
function setupAccessibilityToggle() {
    const accessibilityBtn = document.getElementById('toggleAccessibility');
    if (!accessibilityBtn) {
        console.warn("Botão de acessibilidade (#toggleAccessibility) não encontrado.");
        return;
    }

    // Alternar classe no <body> ao clicar no botão
    accessibilityBtn.addEventListener('click', () => {
        document.body.classList.toggle('accessible-mode');

        const isActive = document.body.classList.contains('accessible-mode');
        accessibilityBtn.textContent = isActive 
            ? "♿" 
            : "♿";
    });

    // Atalho de teclado: F2 também ativa/desativa
    document.addEventListener('keydown', (e) => {
        if (e.key === "F2") {
            e.preventDefault(); // evita conflito
            accessibilityBtn.click();
        }
    });
}
