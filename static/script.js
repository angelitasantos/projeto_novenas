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
