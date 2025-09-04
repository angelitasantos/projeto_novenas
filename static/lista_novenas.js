async function loadNovenaOptions() {
    try {
        const response = await fetch("novenas/index.json");
        const novenas = await response.json();

        const select = document.getElementById("novenaSelect");
        select.innerHTML = ""; // limpar opções

        novenas.forEach(novena => {
            const option = document.createElement("option");
            option.value = novena.file;
            option.textContent = novena.title;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Erro ao carregar lista de novenas:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadNovenaOptions);
