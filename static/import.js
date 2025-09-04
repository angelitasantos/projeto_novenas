document.getElementById('importBtn').addEventListener('click', () => {
    const fileInput = document.getElementById('uploadExcel');
    const file = fileInput.files[0];
    if (!file) {
        alert('Por favor, selecione um arquivo Excel primeiro!');
        return;
    }
    handleFile(file);
});

function handleFile(file) {
    const baseName = file.name.replace(/\.[^/.]+$/, ''); 

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Ler abas do Excel
        const configSheet     = XLSX.utils.sheet_to_json(workbook.Sheets['Config'], { header: 1 });
        const firstPrayerSheet = XLSX.utils.sheet_to_json(workbook.Sheets['FirstPrayer'], { header: 1 });
        const finalPrayerSheet = XLSX.utils.sheet_to_json(workbook.Sheets['FinalPrayer'], { header: 1 });
        const daysSheet        = XLSX.utils.sheet_to_json(workbook.Sheets['Days'], { header: 1 });
        const rosarySheet      = XLSX.utils.sheet_to_json(workbook.Sheets['RosaryContent'], { header: 1 });
        const mysteriesSheet   = XLSX.utils.sheet_to_json(workbook.Sheets['Mysteries'], { header: 1 });
        const sharedPrayersSheet = XLSX.utils.sheet_to_json(workbook.Sheets['SharedPrayers'], { header: 1 });
        const rosaryPrayersSheet = XLSX.utils.sheet_to_json(workbook.Sheets['RosaryPrayers'], { header: 1 });

        // Pegar dados da aba Config
        const config = {};
        configSheet.forEach(row => {
            if (row[0] && row[1]) {
                config[row[0].trim()] = row[1].trim();
            }
        });

        // Processar SharedPrayers
        const sharedPrayers = {};
        sharedPrayersSheet.slice(1).forEach(row => {
            if (row[0] && row[1] && row[2]) {
                sharedPrayers[row[0]] = {
                    title: row[1],
                    content: row[2]
                };
            }
        });

        // Processar RosaryPrayers
        const rosaryPrayers = {
            basicPrayers: {
                title: 'Orações Iniciais do Terço',
                prayers: []
            }
        };

        rosaryPrayersSheet.slice(1).forEach(row => {
            if (row[0] === 'basic') {
                rosaryPrayers.basicPrayers.prayers.push({
                    prayer: row[1],
                    repetitions: row[2] || 1
                });
            } else if (row[0] === 'text') {
                rosaryPrayers.prayerText = config.rosaryPrayerText;
            } else if (row[0] === 'final') {
                rosaryPrayers.finalPrayer = {
                    title: row[3],
                    content: row[4]
                };
            }
        });

        // Montar objeto JSON completo
        const novenaJson = {
            title: config.title || baseName.replace(/_/g, ' '),
            subtitle: config.subtitle || baseName.toUpperCase(),
            paragraph: config.paragraph || 'Gerado a partir de Excel.',
            firstPrayerContent: {
                title: config.firstPrayerTitle,
                content: firstPrayerSheet.slice(1).map(r => r[0]).filter(Boolean)
            },
            finalPrayerContent: {
                title: config.finalPrayerTitle,
                content: finalPrayerSheet.slice(1).map(r => r[0]).filter(Boolean)
            },
            days: daysSheet.slice(1).map(r => ({
                day: r[0],
                title: r[1],
                message1: r[2],
                message2: r[3],
                message3: r[4],
                message4: r[5],
                read: false,
                active: false
            })),
            rosaryContent: {
                title: config.rosaryTitle || 'Terço da Novena',
                content: rosarySheet.slice(1).map(r => r[0]).filter(Boolean)
            },
            mysteries: mysteriesSheet.slice(1).map(r => ({
                title: r[0],
                meditation: r[1],
                completed: false,
                prayers: Array(10).fill(false)
            })),
            sharedPrayers: sharedPrayers,
            rosaryPrayers: rosaryPrayers
        };

        // Mostrar no console e na tela
        console.log('JSON gerado:', novenaJson);
        document.getElementById('output').textContent = JSON.stringify(novenaJson, null, 2);

        // Baixar JSON da novena
        downloadJson(novenaJson, `${baseName}.json`);

        // Atualizar index.json
        updateIndexFile(`novenas/${baseName}.json`, novenaJson.title);

        // Mensagem de sucesso e redirecionamento
        alert('✅ Novena importada com sucesso!');
        window.location.href = 'index.html';
    };
    reader.readAsArrayBuffer(file);
}

// Função para baixar JSON no navegador
function downloadJson(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}

// Atualizar index.json (em memória) e baixar versão atualizada
function updateIndexFile(newFile, newTitle) {
    fetch('novenas/index.json')
        .then(res => res.json())
        .then(indexData => {
            const exists = indexData.some(n => n.file === newFile);
            if (!exists) {
                indexData.push({ file: newFile, title: newTitle });
            }
            downloadJson(indexData, 'index.json');
        })
        .catch(() => {
            const indexData = [{ file: newFile, title: newTitle }];
            downloadJson(indexData, 'index.json');
        });
}
