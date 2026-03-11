/**
 * TaskCard Molecule
 * Generates the HTML for a team task (Tarefas da Equipe).
 */
export const TaskCard = (p) => {
    return `
        <div class="bg-surface dark:bg-[#362011] p-4 rounded-xl border border-border dark:border-[#4a2815] mb-3 relative text-mainText dark:text-[#f5f0e6]">
            <h4 class="m-0 mb-2 font-bold text-[0.95rem] text-mainText dark:text-white">${p.descricao}</h4>
            <div class="text-[0.8rem] text-mutedText dark:text-[#d4bda8] mb-2 font-medium flex gap-2">
                <span><i class="ph ph-user"></i> ${p.demandante}</span>
                <span>|</span>
                <span><i class="ph ph-calendar"></i> ${p.dataOriginal ? new Date(p.dataOriginal).toLocaleDateString() : '-'}</span>
            </div>
            ${p.anexo ? `<a href="${p.anexo}" target="_blank" class="text-[0.8rem] text-brandBlue dark:text-[#60a5fa] block mb-2.5 hover:underline font-medium"><i class="ph ph-link"></i> Ver Documento</a>` : ''}
            <div class="flex justify-between items-center mt-2 pt-2 border-t border-border dark:border-[#4a2815] gap-2">
                <select onchange="window.atualizarStatusProjExp('${p.id}', this.value)" class="p-1.5 rounded-md border border-border dark:border-[#4a2815] bg-surface dark:bg-[#362011] text-mainText dark:text-white text-[0.8rem] focus:outline-none focus:ring-1 focus:ring-brandOrange transition-all flex-1 min-w-0">
                    <option value="Pendente" ${p.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="Em Andamento" ${p.status === 'Em Andamento' ? 'selected' : ''}>Andamento</option>
                    <option value="Concluído" ${p.status === 'Concluído' ? 'selected' : ''}>Concluído</option>
                </select>
                <button class="px-2.5 py-1.5 bg-[#fef2f2] text-brandRed dark:bg-brandRed/10 dark:text-[#f87171] border border-brandRed/20 hover:bg-brandRed hover:text-white dark:hover:bg-brandRed dark:hover:text-white rounded-md text-[0.8rem] transition-colors flex items-center justify-center shrink-0" onclick="window.deletarProjetoExp('${p.id}')"><i class="ph ph-trash"></i></button>
            </div>
        </div>
    `;
};
