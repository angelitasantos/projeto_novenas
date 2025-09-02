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
    const headerTitle = document.querySelector('header h1');
    const headerSubtitle = document.querySelector('header p');

    if (headerTitle && novenaContent.title) {
        headerTitle.textContent = novenaContent.title;
    }

    if (headerSubtitle && novenaContent.subtitle) {
        headerSubtitle.textContent = novenaContent.subtitle;
    }

    if (footerText && novenaContent.title) {
        const currentYear = new Date().getFullYear();
        footerText.textContent = `© ${currentYear} - ${novenaContent.title}`;
    }
}

// Carregar Novena Selecionada
function loadSelectedNovena() {
    const novenaSelect = document.getElementById('novenaSelect');
    const selectedNovena = novenaSelect.value;

    // Limpar o localStorage para começar uma nova novena
    localStorage.removeItem('novenaData');

    // Recarregar a página com a nova novena
    loadNovenaData(selectedNovena);
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
