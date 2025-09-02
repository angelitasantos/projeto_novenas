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

// Carregar dados do JSON
async function loadNovenaData(novenaFile = 'novenas/novena-maos-ensanguentadas.json') {
    try {
        // Salvar a novena selecionada
        localStorage.setItem('selectedNovena', novenaFile);

        const response = await fetch(novenaFile);
        novenaContent = await response.json();

        // Atualizar o título da página
        document.title = novenaContent.title || document.title;

        // Atualizar o cabeçalho
        updateHtml();

        // Preencher a oração inicial e final na página
        populateContent();
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
