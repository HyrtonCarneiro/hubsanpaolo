/**
 * KanbanCard Molecule
 * Generates the HTML for an obra card in the Kanban board.
 */
window.KanbanCard = function(obra) {
    let dataFim = obra.dataFim ? new Date(obra.dataFim) : null;
    let hoje = new Date();
    let isLate = dataFim && hoje > dataFim && obra.status !== 'concluido';

    let totalChecks = (obra.checklists || []).length;
    let concluidosChecks = (obra.checklists || []).filter(c => c.checked).length;
    let checkPerc = totalChecks > 0 ? Math.round((concluidosChecks / totalChecks) * 100) : 0;

    let tagClasses = '';
    if (obra.tag === 'Urgente') tagClasses = 'bg-brandRed dark:bg-[#8f0810]';
    if (obra.tag === 'Nova Loja') tagClasses = 'bg-[#00bcd4]';
    if (obra.tag === 'Obras') tagClasses = 'bg-brandBlue';
    if (obra.tag === 'Manutenção') tagClasses = 'bg-brandGreen dark:bg-[#2f4521] text-white dark:text-[#a7f3d0]';
    if (obra.tag === 'Retrofit') tagClasses = 'bg-brandOrange';

    return `
        <div class="bg-surface dark:bg-[#362011] p-3.5 sm:p-4 rounded-xl shadow-sm border ${isLate ? 'border-brandRed' : 'border-border dark:border-[#4a2815]'} relative mb-3 cursor-grab hover:shadow-md hover:-translate-y-0.5 transition-all text-mainText dark:text-[#f5f0e6] text-left break-words active:cursor-grabbing border-l-4 ${isLate ? 'border-l-brandRed' : 'border-l-transparent'}" draggable="true" ondragstart="window.dragExpansao(event)" id="card-${obra.id}" data-id="${obra.id}" onclick="window.abrirModalCardExpansao('${obra.id}')">
            
            <div class="flex flex-wrap gap-1.5 mb-2.5">
                ${obra.tag ? `<span class="px-2 py-0.5 rounded text-[0.65rem] font-bold uppercase tracking-wider text-white ${tagClasses}">${obra.tag}</span>` : ''}
            </div>

            <p class="m-0 mb-1.5 text-[0.8rem] text-mutedText dark:text-[#d4bda8] flex items-center gap-1.5 break-words line-clamp-1" title="${obra.loja || 'Sem Loja'}"><i class="ph ph-map-pin"></i> ${obra.loja || 'Sem Loja'}</p>
            <h4 class="m-0 mb-3 text-[0.95rem] font-bold text-mainText dark:text-white leading-snug line-clamp-2" title="${obra.titulo || 'Sem Título'}">${obra.titulo || 'Sem Título'}</h4>

            <div class="h-1.5 bg-background dark:bg-[#1a0f07] rounded-full overflow-hidden mt-2.5 mb-2.5">
                <div class="h-full bg-brandGreen transition-all duration-300" style="width: ${checkPerc}%"></div>
            </div>

            <div class="flex justify-between text-[0.75rem] text-mutedText dark:text-[#d4bda8] flex-wrap gap-1.5 mt-2.5 border-t border-border dark:border-[#4a2815] pt-2.5">
                <div class="flex items-center gap-1.5 ${isLate ? 'text-brandRed dark:text-[#f87171] font-bold' : ''}" title="${dataFim ? 'Prev: ' + obra.dataFim : 'Sem Prazo'}">
                    <i class="ph ph-clock"></i> <span>${dataFim ? dataFim.toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '-'}</span>
                </div>
                <div class="flex items-center gap-1.5" title="${concluidosChecks}/${totalChecks} concluídos">
                    <i class="ph ph-check-square-offset"></i> <span>${checkPerc}%</span>
                </div>
                ${(obra.anexos || []).length > 0 ? `<div class="flex items-center gap-1.5 text-brandBlue dark:text-[#60a5fa] font-medium"><i class="ph ph-paperclip"></i> ${(obra.anexos || []).length}</div>` : ''}
            </div>
        </div>
    `;
};
