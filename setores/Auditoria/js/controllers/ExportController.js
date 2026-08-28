/**
 * ExportController.js
 * Centraliza a exportação e importação de dados para Excel (.xlsx) e JSON (.json).
 * Garante 100% de integridade e zero perda de dados para migrações e auditoria.
 */

// --- UTILITÁRIOS GERAIS DE ARQUIVO ---

window.exportarParaExcel = function (dados, filename) {
    try {
        if (!window.XLSX) {
            console.error("SheetJS (XLSX) não carregado.");
            showToast("Erro: Biblioteca de exportação não disponível.", "error");
            return;
        }

        const worksheet = XLSX.utils.json_to_sheet(dados);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");

        const dataStr = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `${filename}_${dataStr}_${new Date().getTime()}.xlsx`);
        showToast("Relatório Excel exportado com sucesso!", "success");
    } catch (e) {
        console.error("Erro ao exportar Excel:", e);
        showToast("Erro ao gerar relatório Excel: " + e.message, "error");
    }
};

window.exportarParaJSON = function (dados, filename) {
    try {
        const jsonStr = JSON.stringify(dados, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
        const dataStr = new Date().toISOString().slice(0, 10);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${dataStr}_${new Date().getTime()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        showToast("Backup JSON exportado com sucesso!", "success");
    } catch (e) {
        console.error("Erro ao exportar JSON:", e);
        showToast("Erro ao gerar backup JSON: " + e.message, "error");
    }
};

// Helper universal para parse de datas do Excel ou strings
window.parseDataUniversal = function (val) {
    if (!val && val !== 0) return "";
    try {
        // Serial numérico do Excel
        if (typeof val === 'number' || (!isNaN(val) && !val.toString().includes('-') && !val.toString().includes('/'))) {
            const serial = parseFloat(val);
            if (serial > 30000 && serial < 60000) {
                const dateObj = new Date(Math.round((serial - 25569) * 86400 * 1000));
                return dateObj.toISOString().split('T')[0];
            }
        }
        const str = val.toString().trim();
        if (str.includes('/')) {
            const parts = str.split('/');
            if (parts.length === 3) {
                // DD/MM/YYYY -> YYYY-MM-DD
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        } else if (str.includes('-')) {
            const parts = str.split(' ')[0].split('-');
            if (parts.length === 3) {
                return parts[0].length === 4 ? `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}` : `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
        }
        return str;
    } catch (e) {
        console.error("Erro parse data universal:", e);
        return String(val);
    }
};

// Helper para buscar loja por nome flexível (case-insensitive, trim, fuzzy)
window.getLojaByFlexName = function (nome) {
    if (!nome) return null;
    const lojas = window.lojasIniciais || [];
    const normalizado = nome.toString().trim().toUpperCase();
    // Busca exata
    let match = lojas.find(l => l.nome.toUpperCase() === normalizado);
    if (match) return match;
    // Busca parcial (contém)
    match = lojas.find(l => l.nome.toUpperCase().includes(normalizado) || normalizado.includes(l.nome.toUpperCase()));
    return match || null;
};

// Helper universal para ler arquivo Excel ou JSON
window.lerArquivoUniversal = function (file, onData) {
    if (!file) return;
    const isJson = file.name.endsWith('.json');
    const reader = new FileReader();

    reader.onload = async function (e) {
        try {
            if (isJson) {
                const text = e.target.result;
                const jsonData = JSON.parse(text);
                await onData(jsonData, 'json');
            } else {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                // Obtém como objetos e como array de cabeçalhos
                const jsonObjects = XLSX.utils.sheet_to_json(worksheet);
                const jsonArrays = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                await onData({ objects: jsonObjects, rawRows: jsonArrays }, 'excel');
            }
        } catch (err) {
            console.error("Erro ao ler arquivo:", err);
            showToast("Erro ao processar o arquivo: " + err.message, "error");
        }
    };

    if (isJson) {
        reader.readAsText(file);
    } else {
        reader.readAsArrayBuffer(file);
    }
};

// ==========================================
// 1. AUDITORIA ONLINE (NOTAS)
// ==========================================

window.exportarNotasPowerBI = function () {
    const notas = window.notasCache || [];
    if (notas.length === 0) {
        showToast("Não há notas para exportar.", "warning");
        return;
    }

    const dadosNormalizados = notas.map(n => ({
        ID_REGISTRO: n.id || '',
        DATA_AUDITORIA: n.data || '',
        LOJA: n.loja || '',
        REGIONAL: (window.lojasIniciais.find(l => l.nome === n.loja) || {}).estado || 'N/A',
        AUDITOR: n.auditor || 'Sistema',
        NOTA: parseFloat(n.nota) || 0,
        TIMESTAMP_SISTEMA: n.timestamp || ''
    }));

    window.exportarParaExcel(dadosNormalizados, "auditoria_notas_powerbi");
};

window.exportarNotasJSON = function () {
    const notas = window.notasCache || [];
    if (notas.length === 0) return showToast("Não há notas para exportar.", "warning");
    window.exportarParaJSON(notas, "auditoria_notas_backup");
};

window.importarNotasArquivo = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    window.lerArquivoUniversal(file, async (data, format) => {
        if (format === 'json') {
            await window.processarImportacaoNotas(data);
        } else {
            // Preferência por objetos se cabeçalhos conhecidos, senão rawRows
            const rows = (data.objects && data.objects.length > 0) ? data.objects : data.rawRows;
            await window.processarImportacaoNotas(rows);
        }
        event.target.value = '';
    });
};

window.processarImportacaoNotas = async function (dados) {
    if (!dados || dados.length === 0) {
        showToast("Arquivo vazio ou sem registros válidos.", "warning");
        return;
    }

    let sucessos = 0;
    let erros = 0;
    const total = Array.isArray(dados) ? dados.length : Object.keys(dados).length;
    window.showImportModal(total);

    for (let i = 0; i < dados.length; i++) {
        if (window.importCancelled) break;
        const row = dados[i];
        if (!row) continue;

        let rawLoja = '';
        let rawData = '';
        let rawNota = null;
        let rawAuditor = '';
        let rawId = '';

        if (Array.isArray(row)) {
            // Pular cabeçalho se na linha 0
            if (i === 0 && (row[0] === 'ID_REGISTRO' || row[1] === 'DATA_AUDITORIA' || row[0] === 'DATA')) continue;
            // Layout por array: [ID, DATA, LOJA, REGIONAL, AUDITOR, NOTA] ou [LOJA, DATA, NOTA]
            if (row.length >= 6) {
                rawId = row[0];
                rawData = row[1];
                rawLoja = row[2];
                rawAuditor = row[4];
                rawNota = row[5];
            } else {
                rawLoja = row[0];
                rawData = row[1];
                rawNota = row[2];
                rawAuditor = row[3] || '';
            }
        } else {
            rawLoja = row.LOJA || row.loja || row.Loja || row.nomeLoja || '';
            rawData = row.DATA_AUDITORIA || row.data || row.Data || row.DATA || '';
            rawNota = row.NOTA !== undefined ? row.NOTA : (row.nota !== undefined ? row.nota : row.Nota);
            rawAuditor = row.AUDITOR || row.auditor || row.Auditor || '';
            rawId = row.ID_REGISTRO || row.id || '';
        }

        const lojaNome = (rawLoja || '').toString().trim();
        const dataFormatada = window.parseDataUniversal(rawData);
        const nota = parseFloat(rawNota);

        if (!lojaNome || !dataFormatada || isNaN(nota)) {
            window.updateImportProgress(i + 1, total, `Linha ${i + 1}: Dados incompletos (${lojaNome || 'Sem loja'}, Data: ${rawData || 'Sem data'}, Nota: ${rawNota}).`, 'warning');
            continue;
        }

        const lojaValida = window.getLojaByFlexName(lojaNome);
        const nomeFinalLoja = lojaValida ? lojaValida.nome : lojaNome;

        const payload = {
            loja: nomeFinalLoja,
            data: dataFormatada,
            nota: nota,
            auditor: rawAuditor || window.currentUser || 'Sistema',
            timestamp: new Date().toISOString()
        };

        try {
            const exist = (window.notasCache || []).find(n => (rawId && n.id === rawId) || (n.loja === nomeFinalLoja && n.data === dataFormatada));
            if (exist) {
                await updateDoc(doc(db, "auditoria_notas", exist.id), payload);
            } else {
                await addDoc(collection(db, "auditoria_notas"), payload);
            }
            window.updateImportProgress(i + 1, total, `${nomeFinalLoja} (${dataFormatada}): Nota ${nota.toFixed(1)} salva.`, 'success');
            sucessos++;
        } catch (err) {
            console.error("Erro import nota:", err);
            window.updateImportProgress(i + 1, total, `${nomeFinalLoja}: Erro ao salvar (${err.message}).`, 'error');
            erros++;
        }

        if (i % 10 === 0) await new Promise(r => setTimeout(r, 20));
    }

    showToast(`Importação de Notas: ${sucessos} processadas, ${erros} erros.`, erros > 0 ? "warning" : "success");
};

// ==========================================
// 2. PLANEJAMENTO DE AUDITORIAS
// ==========================================

window.exportarPlanejamentoPowerBI = function () {
    const plane = window.planejamentoCache || [];
    if (plane.length === 0) {
        showToast("Não há planejamento para exportar.", "warning");
        return;
    }

    const dadosNormalizados = plane.map(p => {
        const ultima = (window.historicoMapeamento || [])
            .filter(m => m.nomeLoja === p.loja && m.realizada === 'SIM')
            .sort((a, b) => b.dataTentativa.localeCompare(a.dataTentativa))[0]?.dataTentativa || 'Nunca';

        return {
            ID_REGISTRO: p.docId || p.id || '',
            LOJA: p.loja || '',
            REGIONAL: p.regional || (window.lojasIniciais.find(l => l.nome === p.loja) || {}).estado || 'N/A',
            ULTIMA_AUDITORIA: ultima,
            DATA_PREVISTA: p.dataProxima || '',
            AUDITOR_RESPONSAVEL: p.auditor || 'A Definir',
            NOTAS_INTERNAS: p.notasInternas || ''
        };
    });

    window.exportarParaExcel(dadosNormalizados, "auditoria_planejamento_powerbi");
};

window.exportarPlanejamentoJSON = function () {
    const plane = window.planejamentoCache || [];
    if (plane.length === 0) return showToast("Não há planejamento para exportar.", "warning");
    window.exportarParaJSON(plane, "auditoria_planejamento_backup");
};

window.importarPlanejamentoArquivo = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    window.lerArquivoUniversal(file, async (data, format) => {
        if (format === 'json') {
            await window.processarImportacaoPlanejamentoJSON(data);
        } else {
            const rows = data.rawRows && data.rawRows.length > 1 ? data.rawRows : data.objects;
            if (Array.isArray(rows) && rows.length > 0 && !Array.isArray(rows[0])) {
                // Se for array de objetos convertemos para array
                const arrFormat = [["LOJA", "REGIONAL", "ULTIMA_AUDITORIA", "DATA_PREVISTA", "AUDITOR", "NOTAS_INTERNAS"]];
                rows.forEach(obj => {
                    arrFormat.push([
                        obj.LOJA || obj.loja || '',
                        obj.REGIONAL || obj.regional || '',
                        obj.ULTIMA_AUDITORIA || '',
                        obj.DATA_PREVISTA || obj.dataProxima || '',
                        obj.AUDITOR_RESPONSAVEL || obj.AUDITOR || obj.auditor || '',
                        obj.NOTAS_INTERNAS || obj.notasInternas || ''
                    ]);
                });
                await window.processarImportacaoPlanejamento(arrFormat);
            } else {
                await window.processarImportacaoPlanejamento(rows);
            }
        }
        event.target.value = '';
    });
};

window.processarImportacaoPlanejamentoJSON = async function (dados) {
    if (!Array.isArray(dados)) return showToast("Formato JSON inválido para planejamento.", "error");
    const arrFormat = [["LOJA", "REGIONAL", "ULTIMA_AUDITORIA", "DATA_PREVISTA", "AUDITOR", "NOTAS_INTERNAS"]];
    dados.forEach(p => {
        arrFormat.push([
            p.loja || '',
            p.regional || '',
            '',
            p.dataProxima || '',
            p.auditor || '',
            p.notasInternas || ''
        ]);
    });
    await window.processarImportacaoPlanejamento(arrFormat);
};

// ==========================================
// 3. MAPEAMENTO DE TENTATIVAS / VISITAS
// ==========================================

window.exportarMapeamentoPowerBI = function () {
    const map = window.historicoMapeamento || [];
    if (map.length === 0) {
        showToast("Não há mapeamentos para exportar.", "warning");
        return;
    }

    const dadosNormalizados = map.map(m => ({
        ID_REGISTRO: m.id || '',
        DATA_TENTATIVA: m.dataTentativa || '',
        HORARIO: m.horario || '',
        LOJA: m.nomeLoja || '',
        REGIONAL: m.estado || '',
        REALIZADA: m.realizada || 'SIM',
        MOTIVO_NEGATIVA: m.justificativa || '',
        AUDITOR: m.auditor || 'Sistema',
        N_TENTATIVA: parseInt(m.nTentativa) || 1,
        ESTA_NO_PRAZO: m.sla ? 'SIM' : 'NÃO',
        NOTAS_ADICIONAIS: m.notas || ''
    }));

    window.exportarParaExcel(dadosNormalizados, "auditoria_mapeamento_powerbi");
};

window.exportarMapeamentoJSON = function () {
    const map = window.historicoMapeamento || [];
    if (map.length === 0) return showToast("Não há mapeamentos para exportar.", "warning");
    window.exportarParaJSON(map, "auditoria_mapeamento_backup");
};

window.importarMapeamentoArquivo = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    window.lerArquivoUniversal(file, async (data, format) => {
        if (format === 'json') {
            await window.processarImportacaoMapeamentoJSON(data);
        } else {
            const rows = data.rawRows && data.rawRows.length > 1 ? data.rawRows : data.objects;
            if (Array.isArray(rows) && rows.length > 0 && !Array.isArray(rows[0])) {
                const arrFormat = [["DATA", "TENTATIVA", "UF", "LOJA", "REALIZADA", "POR_QUE", "RESPONSAVEL", "SLA", "NOTAS", "HORARIO"]];
                rows.forEach(m => {
                    arrFormat.push([
                        m.DATA_TENTATIVA || m.dataTentativa || '',
                        m.N_TENTATIVA || m.nTentativa || 1,
                        m.REGIONAL || m.estado || '',
                        m.LOJA || m.nomeLoja || '',
                        m.REALIZADA || m.realizada || 'SIM',
                        m.MOTIVO_NEGATIVA || m.justificativa || '',
                        m.AUDITOR || m.auditor || '',
                        m.ESTA_NO_PRAZO || (m.sla ? 'SIM' : 'NÃO'),
                        m.NOTAS_ADICIONAIS || m.notas || '',
                        m.HORARIO || m.horario || '08:00'
                    ]);
                });
                await window.processarImportacaoMapeamento(arrFormat);
            } else {
                await window.processarImportacaoMapeamento(rows);
            }
        }
        event.target.value = '';
    });
};

window.processarImportacaoMapeamentoJSON = async function (dados) {
    if (!Array.isArray(dados)) return showToast("Formato JSON inválido para mapeamento.", "error");
    const arrFormat = [["DATA", "TENTATIVA", "UF", "LOJA", "REALIZADA", "POR_QUE", "RESPONSAVEL", "SLA", "NOTAS", "HORARIO"]];
    dados.forEach(m => {
        arrFormat.push([
            m.dataTentativa || '',
            m.nTentativa || 1,
            m.estado || '',
            m.nomeLoja || '',
            m.realizada || 'SIM',
            m.justificativa || '',
            m.auditor || '',
            m.sla ? 'SIM' : 'NÃO',
            m.notas || '',
            m.horario || '08:00'
        ]);
    });
    await window.processarImportacaoMapeamento(arrFormat);
};

// ==========================================
// 4. TAREFAS DA EQUIPE (KANBAN)
// ==========================================

window.exportarTarefasExcel = function () {
    const projects = window.audiProjetos || {};
    const flatList = [];
    const seenIds = new Set();

    Object.keys(projects).forEach(membro => {
        (projects[membro] || []).forEach(p => {
            const id = p.firebaseId || p.id;
            if (id && seenIds.has(id)) return;
            if (id) seenIds.add(id);

            const resps = p.responsaveis && p.responsaveis.length > 0 ? p.responsaveis.join('; ') : (p.membroResponsavel || membro);
            const checklistStr = (p.checklist || []).map(c => `[${c.concluido ? 'X' : ' '}] ${c.texto}`).join(' | ');
            const comentariosStr = (p.comentarios || []).map(c => `${c.autor} (${c.data}): ${c.texto}`).join(' | ');

            flatList.push({
                ID_TASK: id || '',
                TITULO: p.desc || '',
                DETALHES: p.detalhes || '',
                DEMANDANTE: p.demandante || '',
                DATA_PRAZO: p.dataAtv || '',
                STATUS: p.status || 'Pendente',
                RESPONSAVEIS: resps,
                ANEXO_URL: p.anexoUrl || '',
                CHECKLIST_CONTEUDO: checklistStr,
                CHECKLIST_JSON: JSON.stringify(p.checklist || []),
                COMENTARIOS_CONTEUDO: comentariosStr,
                COMENTARIOS_JSON: JSON.stringify(p.comentarios || []),
                REGISTRADO_POR: p.autor || '',
                TIMESTAMP: p.timestamp || Date.now()
            });
        });
    });

    if (flatList.length === 0) {
        showToast("Não há tarefas para exportar.", "warning");
        return;
    }

    window.exportarParaExcel(flatList, "auditoria_tarefas_equipe");
};

window.exportarTarefasJSON = function () {
    const projects = window.audiProjetos || {};
    const projsArray = [];
    const seen = new Set();

    Object.values(projects).forEach(arr => {
        (arr || []).forEach(p => {
            const id = p.firebaseId || p.id;
            if (id && seen.has(id)) return;
            if (id) seen.add(id);
            projsArray.push(p);
        });
    });

    if (projsArray.length === 0) return showToast("Não há tarefas para exportar.", "warning");
    window.exportarParaJSON(projsArray, "auditoria_tarefas_backup");
};

window.importarTarefasArquivo = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    window.lerArquivoUniversal(file, async (data, format) => {
        if (format === 'json') {
            await window.processarImportacaoTarefas(data);
        } else {
            const rows = data.objects && data.objects.length > 0 ? data.objects : data.rawRows;
            await window.processarImportacaoTarefas(rows);
        }
        event.target.value = '';
    });
};

window.processarImportacaoTarefas = async function (dados) {
    if (!dados || dados.length === 0) {
        showToast("Arquivo de tarefas vazio ou inválido.", "warning");
        return;
    }

    let sucessos = 0;
    let erros = 0;
    const total = Array.isArray(dados) ? dados.length : Object.keys(dados).length;
    window.showImportModal(total);

    for (let i = 0; i < dados.length; i++) {
        if (window.importCancelled) break;
        const row = dados[i];
        if (!row) continue;

        let desc = '';
        let detalhes = '';
        let demandante = '';
        let dataAtv = '';
        let status = 'Pendente';
        let responsaveis = [];
        let anexoUrl = null;
        let checklist = [];
        let comentarios = [];
        let autor = window.currentUser || 'Sistema';
        let timestamp = Date.now();
        let firebaseId = '';

        if (Array.isArray(row)) {
            // Array bruto
            if (i === 0 && (row[0] === 'ID_TASK' || row[1] === 'TITULO' || row[0] === 'Responsavel')) continue;
            desc = row[1] || row[3] || row[0] || '';
            demandante = row[3] || row[4] || 'Diretoria';
            dataAtv = window.parseDataUniversal(row[4] || row[1] || '');
            status = row[5] || row[2] || 'Pendente';
            const rawResp = row[6] || row[0] || 'Geral';
            responsaveis = rawResp.toString().split(';').map(s => s.trim()).filter(Boolean);
        } else {
            // Objeto
            desc = row.TITULO || row.desc || row.Descricao || row.titulo || '';
            detalhes = row.DETALHES || row.detalhes || '';
            demandante = row.DEMANDANTE || row.demandante || 'Diretoria';
            dataAtv = row.DATA_PRAZO || row.dataAtv || row.data || '';
            status = row.STATUS || row.status || 'Pendente';
            anexoUrl = row.ANEXO_URL || row.anexoUrl || null;
            autor = row.REGISTRADO_POR || row.autor || window.currentUser || 'Sistema';
            timestamp = row.TIMESTAMP || row.timestamp || Date.now();
            firebaseId = row.ID_TASK || row.firebaseId || row.id || '';

            // Responsáveis
            if (row.RESPONSAVEIS || row.responsaveis) {
                const r = row.RESPONSAVEIS || row.responsaveis;
                responsaveis = Array.isArray(r) ? r : r.toString().split(';').map(s => s.trim()).filter(Boolean);
            } else if (row.membroResponsavel) {
                responsaveis = [row.membroResponsavel];
            }

            // Checklist
            if (row.CHECKLIST_JSON || row.checklist) {
                try {
                    const c = row.CHECKLIST_JSON || row.checklist;
                    checklist = typeof c === 'string' ? JSON.parse(c) : c;
                } catch (e) {
                    checklist = [];
                }
            }

            // Comentários
            if (row.COMENTARIOS_JSON || row.comentarios) {
                try {
                    const cm = row.COMENTARIOS_JSON || row.comentarios;
                    comentarios = typeof cm === 'string' ? JSON.parse(cm) : cm;
                } catch (e) {
                    comentarios = [];
                }
            }
        }

        if (!desc) {
            window.updateImportProgress(i + 1, total, `Linha ${i + 1}: Título ausente, ignorado.`, 'warning');
            continue;
        }

        if (responsaveis.length === 0) responsaveis = ['Geral'];

        // Ajustar formato da data se vier em YYYY-MM-DD para DD/MM/YYYY
        if (dataAtv.includes('-') && dataAtv.split('-')[0].length === 4) {
            const p = dataAtv.split('-');
            dataAtv = `${p[2]}/${p[1]}/${p[0]}`;
        }

        const payload = {
            desc,
            detalhes: detalhes || '',
            demandante: demandante || 'Diretoria',
            dataAtv: dataAtv || new Date().toLocaleDateString('pt-BR'),
            status: ['Pendente', 'Em Andamento', 'Concluído'].includes(status) ? status : 'Pendente',
            membroResponsavel: responsaveis[0] || 'Geral',
            responsaveis: responsaveis,
            anexoUrl: anexoUrl || null,
            checklist: checklist || [],
            comentarios: comentarios || [],
            autor: autor || 'Sistema',
            timestamp: typeof timestamp === 'number' ? timestamp : Date.now()
        };

        try {
            if (firebaseId) {
                await setDoc(doc(db, "auditoria_projetos", firebaseId), payload, { merge: true });
            } else {
                await addDoc(collection(db, "auditoria_projetos"), payload);
            }
            window.updateImportProgress(i + 1, total, `Tarefa salva: ${desc.substring(0, 30)}...`, 'success');
            sucessos++;
        } catch (err) {
            console.error("Erro import tarefa:", err);
            window.updateImportProgress(i + 1, total, `Erro em "${desc.substring(0, 20)}": ${err.message}`, 'error');
            erros++;
        }

        if (i % 10 === 0) await new Promise(r => setTimeout(r, 20));
    }

    showToast(`Tarefas importadas: ${sucessos} com sucesso, ${erros} erros.`, erros > 0 ? "warning" : "success");
};

// ==========================================
// 5. PROTOCOLOS DE CHAMADOS
// ==========================================

window.exportarProtocolosExcel = function () {
    const list = window.sysProtocolos || [];
    if (list.length === 0) return showToast("Não há protocolos para exportar.", "warning");

    const dados = list.map(p => ({
        ID_PROTOCOLO: p.firebaseId || p.id || '',
        SISTEMA: p.sistema || '',
        NUMERO_CODIGO: p.numero || '',
        RESPONSAVEL: p.responsavel || '',
        PRAZO_SLA: p.sla_prazo || '',
        STATUS: p.status || 'Pendente',
        DESCRICAO: p.descricao || '',
        DATA_REGISTRO: p.dataStr || '',
        COMENTARIOS_JSON: JSON.stringify(p.comentarios || []),
        AUTOR: p.autor || '',
        TIMESTAMP: p.timestamp || Date.now()
    }));

    window.exportarParaExcel(dados, "auditoria_protocolos_chamados");
};

window.exportarProtocolosJSON = function () {
    const list = window.sysProtocolos || [];
    if (list.length === 0) return showToast("Não há protocolos para exportar.", "warning");
    window.exportarParaJSON(list, "auditoria_protocolos_backup");
};

window.importarProtocolosArquivo = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    window.lerArquivoUniversal(file, async (data, format) => {
        if (format === 'json') {
            await window.processarImportacaoProtocolos(data);
        } else {
            const rows = data.objects && data.objects.length > 0 ? data.objects : data.rawRows;
            await window.processarImportacaoProtocolos(rows);
        }
        event.target.value = '';
    });
};

window.processarImportacaoProtocolos = async function (dados) {
    if (!dados || dados.length === 0) return showToast("Arquivo de protocolos vazio.", "warning");

    let sucessos = 0;
    let erros = 0;
    const total = Array.isArray(dados) ? dados.length : Object.keys(dados).length;
    window.showImportModal(total);

    for (let i = 0; i < dados.length; i++) {
        if (window.importCancelled) break;
        const row = dados[i];
        if (!row) continue;

        let sistema = 'Athenas';
        let numero = '';
        let responsavel = '';
        let sla_prazo = null;
        let descricao = '';
        let status = 'Pendente';
        let dataStr = '';
        let comentarios = [];
        let autor = window.currentUser || 'Sistema';
        let timestamp = Date.now();
        let firebaseId = '';

        if (Array.isArray(row)) {
            if (i === 0 && (row[0] === 'ID_PROTOCOLO' || row[1] === 'SISTEMA')) continue;
            sistema = row[1] || 'Athenas';
            numero = row[2] || '';
            responsavel = row[3] || '';
            sla_prazo = window.parseDataUniversal(row[4]);
            status = row[5] || 'Pendente';
            descricao = row[6] || '';
        } else {
            sistema = row.SISTEMA || row.sistema || 'Athenas';
            numero = row.NUMERO_CODIGO || row.numero || row.Numero || '';
            responsavel = row.RESPONSAVEL || row.responsavel || '';
            sla_prazo = window.parseDataUniversal(row.PRAZO_SLA || row.sla_prazo || '');
            status = row.STATUS || row.status || 'Pendente';
            descricao = row.DESCRICAO || row.descricao || '';
            dataStr = row.DATA_REGISTRO || row.dataStr || '';
            autor = row.AUTOR || row.autor || 'Sistema';
            timestamp = row.TIMESTAMP || row.timestamp || Date.now();
            firebaseId = row.ID_PROTOCOLO || row.firebaseId || row.id || '';

            if (row.COMENTARIOS_JSON || row.comentarios) {
                try {
                    const c = row.COMENTARIOS_JSON || row.comentarios;
                    comentarios = typeof c === 'string' ? JSON.parse(c) : c;
                } catch (e) {
                    comentarios = [];
                }
            }
        }

        if (!numero || !descricao) {
            window.updateImportProgress(i + 1, total, `Linha ${i + 1}: Protocolo sem número ou descrição, ignorado.`, 'warning');
            continue;
        }

        const payload = {
            sistema,
            numero: numero.toString().trim(),
            responsavel: responsavel || 'Auditoria',
            sla_prazo: sla_prazo || null,
            status: status === 'Resolvido' ? 'Resolvido' : 'Pendente',
            descricao: descricao.toString().trim(),
            dataStr: dataStr || new Date().toLocaleDateString('pt-BR'),
            comentarios: comentarios || [],
            autor: autor || 'Sistema',
            timestamp: typeof timestamp === 'number' ? timestamp : Date.now()
        };

        try {
            if (firebaseId) {
                await setDoc(doc(db, "protocolos_suporte", firebaseId), payload, { merge: true });
            } else {
                await addDoc(collection(db, "protocolos_suporte"), payload);
            }
            window.updateImportProgress(i + 1, total, `Protocolo ${numero} (${sistema}) salvo.`, 'success');
            sucessos++;
        } catch (err) {
            console.error("Erro import protocolo:", err);
            window.updateImportProgress(i + 1, total, `Erro no protocolo ${numero}: ${err.message}`, 'error');
            erros++;
        }

        if (i % 10 === 0) await new Promise(r => setTimeout(r, 20));
    }

    showToast(`Protocolos importados: ${sucessos} com sucesso, ${erros} erros.`, erros > 0 ? "warning" : "success");
};

// ==========================================
// 6. LINKS ÚTEIS
// ==========================================

window.exportarLinksExcel = function () {
    const list = window.allLinksCache || [];
    if (list.length === 0) return showToast("Não há links úteis para exportar.", "warning");

    const dados = list.map(l => ({
        ID_LINK: l.firebaseId || l.id || '',
        TITULO: l.titulo || '',
        URL: l.url || '',
        DESCRICAO: l.descricao || '',
        AUTOR: l.autor || '',
        DATA_REGISTRO: l.dataStr || '',
        TIMESTAMP: l.timestamp || Date.now()
    }));

    window.exportarParaExcel(dados, "auditoria_links_uteis");
};

window.exportarLinksJSON = function () {
    const list = window.allLinksCache || [];
    if (list.length === 0) return showToast("Não há links úteis para exportar.", "warning");
    window.exportarParaJSON(list, "auditoria_links_backup");
};

window.importarLinksArquivo = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    window.lerArquivoUniversal(file, async (data, format) => {
        if (format === 'json') {
            await window.processarImportacaoLinks(data);
        } else {
            const rows = data.objects && data.objects.length > 0 ? data.objects : data.rawRows;
            await window.processarImportacaoLinks(rows);
        }
        event.target.value = '';
    });
};

window.processarImportacaoLinks = async function (dados) {
    if (!dados || dados.length === 0) return showToast("Arquivo de links vazio.", "warning");

    let sucessos = 0;
    let erros = 0;
    const total = Array.isArray(dados) ? dados.length : Object.keys(dados).length;
    window.showImportModal(total);

    for (let i = 0; i < dados.length; i++) {
        if (window.importCancelled) break;
        const row = dados[i];
        if (!row) continue;

        let titulo = '';
        let url = '';
        let descricao = '';
        let autor = window.currentUser || 'Sistema';
        let dataStr = '';
        let timestamp = Date.now();
        let firebaseId = '';

        if (Array.isArray(row)) {
            if (i === 0 && (row[0] === 'ID_LINK' || row[1] === 'TITULO')) continue;
            titulo = row[1] || row[0] || '';
            url = row[2] || row[1] || '';
            descricao = row[3] || row[2] || '';
        } else {
            titulo = row.TITULO || row.titulo || row.Titulo || '';
            url = row.URL || row.url || row.Link || row.link || '';
            descricao = row.DESCRICAO || row.descricao || row.Descricao || '';
            autor = row.AUTOR || row.autor || 'Sistema';
            dataStr = row.DATA_REGISTRO || row.dataStr || '';
            timestamp = row.TIMESTAMP || row.timestamp || Date.now();
            firebaseId = row.ID_LINK || row.firebaseId || row.id || '';
        }

        if (!titulo || !url) {
            window.updateImportProgress(i + 1, total, `Linha ${i + 1}: Link sem título ou URL, ignorado.`, 'warning');
            continue;
        }

        let finalUrl = url.toString().trim();
        if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            finalUrl = 'https://' + finalUrl;
        }

        const payload = {
            titulo: titulo.toString().trim(),
            url: finalUrl,
            descricao: (descricao || '').toString().trim(),
            autor: autor || 'Sistema',
            dataStr: dataStr || new Date().toLocaleDateString('pt-BR'),
            timestamp: typeof timestamp === 'number' ? timestamp : Date.now()
        };

        try {
            if (firebaseId) {
                await setDoc(doc(db, "links_Auditoria", firebaseId), payload, { merge: true });
            } else {
                await addDoc(collection(db, "links_Auditoria"), payload);
            }
            window.updateImportProgress(i + 1, total, `Link salvo: ${titulo}`, 'success');
            sucessos++;
        } catch (err) {
            console.error("Erro import link:", err);
            window.updateImportProgress(i + 1, total, `Erro no link ${titulo}: ${err.message}`, 'error');
            erros++;
        }

        if (i % 10 === 0) await new Promise(r => setTimeout(r, 20));
    }

    showToast(`Links importados: ${sucessos} com sucesso, ${erros} erros.`, erros > 0 ? "warning" : "success");
};

// ==========================================
// 7. EQUIPE DE AUDITORIA (MEMBROS)
// ==========================================

window.exportarEquipeJSON = function () {
    const list = window.audiEquipe || [];
    if (list.length === 0) return showToast("Não há membros na equipe para exportar.", "warning");
    window.exportarParaJSON(list, "auditoria_equipe_backup");
};

window.importarEquipeArquivo = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    window.lerArquivoUniversal(file, async (data, format) => {
        if (format === 'json') {
            await window.processarImportacaoEquipe(data);
        } else {
            const rows = data.objects && data.objects.length > 0 ? data.objects : data.rawRows;
            await window.processarImportacaoEquipe(rows);
        }
        event.target.value = '';
    });
};

window.processarImportacaoEquipe = async function (dados) {
    if (!dados || dados.length === 0) return showToast("Arquivo de equipe vazio.", "warning");

    let sucessos = 0;
    const total = Array.isArray(dados) ? dados.length : Object.keys(dados).length;

    for (let i = 0; i < dados.length; i++) {
        const row = dados[i];
        if (!row) continue;
        let nome = '';
        if (typeof row === 'string') {
            nome = row.trim();
        } else if (Array.isArray(row)) {
            if (i === 0 && (row[0] === 'NOME' || row[0] === 'Nome')) continue;
            nome = (row[0] || '').toString().trim();
        } else {
            nome = (row.NOME || row.nome || row.Nome || '').toString().trim();
        }

        if (!nome) continue;
        const exists = (window.audiEquipe || []).some(m => m.nome.toLowerCase() === nome.toLowerCase());
        if (!exists) {
            try {
                await addDoc(collection(db, "auditoria_equipe"), { nome });
                sucessos++;
            } catch (e) {
                console.error("Erro ao importar membro equipe:", e);
            }
        }
    }

    showToast(`Equipe: ${sucessos} novos membros adicionados com sucesso!`, "success");
};

// ==========================================
// 8. BACKUP COMPLETO DO SETOR (1-CLIQUE)
// ==========================================

window.exportarBackupCompletoAuditoria = function () {
    try {
        const backup = {
            metadata: {
                version: "2.0",
                sector: "Auditoria",
                system: "Hub San Paolo",
                exportedAt: new Date().toISOString(),
                exportedBy: window.currentUser || 'Sistema'
            },
            auditoria_notas: window.notasCache || [],
            auditoria_planejamento: window.planejamentoCache || [],
            auditoria_mapeamento: window.historicoMapeamento || [],
            auditoria_projetos: (function () {
                const seen = new Set();
                const list = [];
                Object.values(window.audiProjetos || {}).forEach(arr => {
                    (arr || []).forEach(p => {
                        const id = p.firebaseId || p.id;
                        if (id && seen.has(id)) return;
                        if (id) seen.add(id);
                        list.push(p);
                    });
                });
                return list;
            })(),
            auditoria_equipe: window.audiEquipe || [],
            protocolos_suporte: window.sysProtocolos || [],
            links_Auditoria: window.allLinksCache || []
        };

        const totalRegistros = 
            backup.auditoria_notas.length + 
            backup.auditoria_planejamento.length + 
            backup.auditoria_mapeamento.length + 
            backup.auditoria_projetos.length + 
            backup.auditoria_equipe.length + 
            backup.protocolos_suporte.length + 
            backup.links_Auditoria.length;

        if (totalRegistros === 0) {
            showToast("Nenhum dado encontrado para backup.", "warning");
            return;
        }

        window.exportarParaJSON(backup, "backup_geral_auditoria_completo");
        showToast(`Backup Completo gerado com sucesso (${totalRegistros} itens)!`, "success");
    } catch (e) {
        console.error("Erro ao gerar backup completo:", e);
        showToast("Erro ao gerar backup completo: " + e.message, "error");
    }
};

window.importarBackupCompletoAuditoria = function (event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const text = e.target.result;
            const backup = JSON.parse(text);

            if (!backup.metadata && !backup.auditoria_notas && !backup.auditoria_planejamento && !backup.auditoria_mapeamento) {
                showToast("Arquivo JSON não é um backup válido do setor de Auditoria.", "error");
                return;
            }

            const total = 
                (backup.auditoria_equipe?.length || 0) +
                (backup.auditoria_notas?.length || 0) +
                (backup.auditoria_planejamento?.length || 0) +
                (backup.auditoria_mapeamento?.length || 0) +
                (backup.auditoria_projetos?.length || 0) +
                (backup.protocolos_suporte?.length || 0) +
                (backup.links_Auditoria?.length || 0);

            if (!confirm(`⚠️ RESTAURAÇÃO COMPLETA:\n\nForam encontrados ${total} registros no arquivo de backup.\nDeseja iniciar a importação de todos os módulos agora?`)) {
                event.target.value = '';
                return;
            }

            window.showImportModal(total);
            window.updateImportProgress(0, total, "Iniciando Restauração de Backup Completo...", "info");

            // 1. Equipe
            if (backup.auditoria_equipe && backup.auditoria_equipe.length > 0) {
                window.updateImportProgress(0, total, `Restaurando Equipe (${backup.auditoria_equipe.length} membros)...`, "info");
                for (const m of backup.auditoria_equipe) {
                    const nome = (m.nome || m).toString().trim();
                    if (!nome) continue;
                    const exists = (window.audiEquipe || []).some(x => x.nome.toLowerCase() === nome.toLowerCase());
                    if (!exists) {
                        try { await addDoc(collection(db, "auditoria_equipe"), { nome }); } catch (err) {}
                    }
                }
            }

            // 2. Notas
            if (backup.auditoria_notas && backup.auditoria_notas.length > 0) {
                window.updateImportProgress(0, total, `Restaurando Notas de Auditoria (${backup.auditoria_notas.length} notas)...`, "info");
                for (const n of backup.auditoria_notas) {
                    try {
                        const payload = {
                            loja: n.loja,
                            data: n.data,
                            nota: parseFloat(n.nota) || 0,
                            auditor: n.auditor || 'Sistema',
                            timestamp: n.timestamp || new Date().toISOString()
                        };
                        const id = n.id || n.firebaseId;
                        if (id) {
                            await setDoc(doc(db, "auditoria_notas", id), payload, { merge: true });
                        } else {
                            await addDoc(collection(db, "auditoria_notas"), payload);
                        }
                    } catch (err) { console.error(err); }
                }
            }

            // 3. Planejamento
            if (backup.auditoria_planejamento && backup.auditoria_planejamento.length > 0) {
                window.updateImportProgress(0, total, `Restaurando Planejamento (${backup.auditoria_planejamento.length} itens)...`, "info");
                for (const p of backup.auditoria_planejamento) {
                    try {
                        const payload = {
                            loja: p.loja,
                            dataProxima: p.dataProxima || '',
                            auditor: p.auditor || 'A Definir',
                            notasInternas: p.notasInternas || '',
                            regional: p.regional || 'N/A',
                            updatedAt: p.updatedAt || new Date().toISOString()
                        };
                        const id = p.docId || p.id;
                        if (id) {
                            await setDoc(doc(db, "auditoria_planejamento", id), payload, { merge: true });
                        } else {
                            await addDoc(collection(db, "auditoria_planejamento"), payload);
                        }
                    } catch (err) { console.error(err); }
                }
            }

            // 4. Mapeamento
            if (backup.auditoria_mapeamento && backup.auditoria_mapeamento.length > 0) {
                window.updateImportProgress(0, total, `Restaurando Mapeamento (${backup.auditoria_mapeamento.length} visitas)...`, "info");
                for (const m of backup.auditoria_mapeamento) {
                    try {
                        const payload = {
                            lojaId: m.lojaId || '',
                            nomeLoja: m.nomeLoja || '',
                            estado: m.estado || '',
                            dataTentativa: m.dataTentativa || '',
                            realizada: m.realizada || 'SIM',
                            justificativa: m.justificativa || null,
                            auditor: m.auditor || 'Sistema',
                            notas: m.notas || '',
                            nTentativa: parseInt(m.nTentativa) || 1,
                            sla: !!m.sla,
                            horario: m.horario || '08:00',
                            createdAt: new Date()
                        };
                        const id = m.id || m.firebaseId;
                        if (id) {
                            await setDoc(doc(db, "auditoria_mapeamento", id), payload, { merge: true });
                        } else {
                            await addDoc(collection(db, "auditoria_mapeamento"), payload);
                        }
                    } catch (err) { console.error(err); }
                }
            }

            // 5. Tarefas
            if (backup.auditoria_projetos && backup.auditoria_projetos.length > 0) {
                window.updateImportProgress(0, total, `Restaurando Tarefas Kanban (${backup.auditoria_projetos.length} tarefas)...`, "info");
                for (const t of backup.auditoria_projetos) {
                    try {
                        const payload = {
                            desc: t.desc || '',
                            detalhes: t.detalhes || '',
                            demandante: t.demandante || 'Diretoria',
                            dataAtv: t.dataAtv || new Date().toLocaleDateString('pt-BR'),
                            status: t.status || 'Pendente',
                            membroResponsavel: t.membroResponsavel || (t.responsaveis && t.responsaveis[0]) || 'Geral',
                            responsaveis: t.responsaveis || [t.membroResponsavel || 'Geral'],
                            anexoUrl: t.anexoUrl || null,
                            checklist: t.checklist || [],
                            comentarios: t.comentarios || [],
                            autor: t.autor || 'Sistema',
                            timestamp: typeof t.timestamp === 'number' ? t.timestamp : Date.now()
                        };
                        const id = t.firebaseId || t.id;
                        if (id) {
                            await setDoc(doc(db, "auditoria_projetos", id), payload, { merge: true });
                        } else {
                            await addDoc(collection(db, "auditoria_projetos"), payload);
                        }
                    } catch (err) { console.error(err); }
                }
            }

            // 6. Protocolos
            if (backup.protocolos_suporte && backup.protocolos_suporte.length > 0) {
                window.updateImportProgress(0, total, `Restaurando Protocolos (${backup.protocolos_suporte.length} chamados)...`, "info");
                for (const pr of backup.protocolos_suporte) {
                    try {
                        const payload = {
                            sistema: pr.sistema || 'Athenas',
                            numero: pr.numero || '',
                            responsavel: pr.responsavel || 'Auditoria',
                            sla_prazo: pr.sla_prazo || null,
                            status: pr.status || 'Pendente',
                            descricao: pr.descricao || '',
                            dataStr: pr.dataStr || new Date().toLocaleDateString('pt-BR'),
                            comentarios: pr.comentarios || [],
                            autor: pr.autor || 'Sistema',
                            timestamp: typeof pr.timestamp === 'number' ? pr.timestamp : Date.now()
                        };
                        const id = pr.firebaseId || pr.id;
                        if (id) {
                            await setDoc(doc(db, "protocolos_suporte", id), payload, { merge: true });
                        } else {
                            await addDoc(collection(db, "protocolos_suporte"), payload);
                        }
                    } catch (err) { console.error(err); }
                }
            }

            // 7. Links Úteis
            if (backup.links_Auditoria && backup.links_Auditoria.length > 0) {
                window.updateImportProgress(0, total, `Restaurando Links Úteis (${backup.links_Auditoria.length} links)...`, "info");
                for (const l of backup.links_Auditoria) {
                    try {
                        const payload = {
                            titulo: l.titulo || '',
                            url: l.url || '',
                            descricao: l.descricao || '',
                            autor: l.autor || 'Sistema',
                            dataStr: l.dataStr || new Date().toLocaleDateString('pt-BR'),
                            timestamp: typeof l.timestamp === 'number' ? l.timestamp : Date.now()
                        };
                        const id = l.firebaseId || l.id;
                        if (id) {
                            await setDoc(doc(db, "links_Auditoria", id), payload, { merge: true });
                        } else {
                            await addDoc(collection(db, "links_Auditoria"), payload);
                        }
                    } catch (err) { console.error(err); }
                }
            }

            window.updateImportProgress(total, total, "Backup Restaurado com Sucesso Total!", "success");
            showToast("Backup Geral de Auditoria restaurado com sucesso!", "success");
            event.target.value = '';
        } catch (err) {
            console.error("Erro fatal ao restaurar backup:", err);
            showToast("Erro ao restaurar backup: " + err.message, "error");
        }
    };
    reader.readAsText(file);
};
