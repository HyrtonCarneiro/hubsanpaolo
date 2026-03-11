window.GanttController = {
    renderGantt(obrasCache) {
        const wrapper = document.getElementById('gantt-wrapper');
        if (!wrapper) return;

        const obrasTimeline = obrasCache.filter(o => o.dataInicio || o.dataFim);
        
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const startDate = new Date(hoje);
        startDate.setMonth(startDate.getMonth() - 1);
        startDate.setDate(1); 

        const endDate = new Date(hoje);
        endDate.setMonth(endDate.getMonth() + 3);
        endDate.setDate(0); 

        const ONE_DAY = 1000 * 60 * 60 * 24;
        const totalVisDays = Math.round((endDate - startDate) / ONE_DAY) + 1;
        const DAY_WIDTH = 30; 

        let monthsHtml = '';
        let daysHtml = '';

        let currentHtmlDate = new Date(startDate);
        let currentMonth = currentHtmlDate.getMonth();
        let daysInMonth = 0;

        const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

        for (let i = 0; i < totalVisDays; i++) {
            const d = new Date(startDate.getTime() + (i * ONE_DAY));
            const dayOfWeek = d.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

            daysHtml += `<div class="flex-shrink-0 flex items-center justify-center border-l w-[30px] border-border dark:border-[#4a2815] text-[0.7rem] font-medium text-mutedText dark:text-[#d4bda8] bg-surface dark:bg-[#362011] ${isWeekend ? 'bg-black/5 dark:bg-white/5 text-brandRed font-bold' : ''}">${d.getDate()}</div>`;
            daysInMonth++;

            const nextDay = new Date(d.getTime() + ONE_DAY);
            if (nextDay.getMonth() !== currentMonth || i === totalVisDays - 1) {
                monthsHtml += `<div class="flex-shrink-0 flex items-center justify-center border-l border-b border-border dark:border-[#4a2815] text-[0.75rem] font-bold text-mainText dark:text-white uppercase tracking-wider bg-[#f8f9fa] dark:bg-[#2a170a]" style="min-width: ${daysInMonth * DAY_WIDTH}px">${monthNames[currentMonth]} ${d.getFullYear()}</div>`;
                currentMonth = nextDay.getMonth();
                daysInMonth = 0;
            }
        }

        let rowsHtml = '';
        const obrasOrd = [...obrasTimeline].sort((a, b) => (a.loja || '').localeCompare(b.loja || ''));

        obrasOrd.forEach(obra => {
            let dInicio = obra.dataInicio ? new Date(obra.dataInicio) : null;
            let dFim = obra.dataFim ? new Date(obra.dataFim) : null;

            if (dInicio) dInicio.setHours(0, 0, 0, 0);
            else dInicio = dFim ? new Date(dFim.getTime() - (7 * ONE_DAY)) : null; 

            if (dFim) dFim.setHours(0, 0, 0, 0);
            else dFim = dInicio ? new Date(dInicio.getTime() + (7 * ONE_DAY)) : null;

            if (!dInicio || !dFim) return; 

            const startOffsetDays = Math.round((dInicio - startDate) / ONE_DAY);
            const durationDays = Math.round((dFim - dInicio) / ONE_DAY) + 1; 

            const leftPx = startOffsetDays * DAY_WIDTH;
            const widthPx = durationDays * DAY_WIDTH;

            const isCompleted = obra.status === 'concluido';
            const isDelayed = !isCompleted && dFim < hoje;
            let barClass = '';
            if (isCompleted) barClass = 'completed';
            else if (isDelayed) barClass = 'delayed';

            const mapFases = { 'backlog': 'Triagem', 'planejamento': 'Pré-Obra', 'fase1': 'Mobilização', 'fase2': 'Instalações', 'fase3': 'Acabamento', 'concluido': 'Concluído' };
            const faseNome = mapFases[obra.status] || obra.status;

            rowsHtml += `
                <div class="flex border-b border-border dark:border-[#4a2815] min-h-[50px] bg-surface dark:bg-[#362011] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors relative group">
                    <div class="w-[250px] flex-shrink-0 p-3 bg-surface dark:bg-[#362011] border-r border-border dark:border-[#4a2815] flex flex-col justify-center sticky left-0 z-10 box-border text-left shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        <h4 class="m-0 text-[0.85rem] text-mainText dark:text-white font-bold whitespace-nowrap overflow-hidden text-ellipsis line-clamp-1" title="${obra.titulo}">${obra.titulo}</h4>
                        <span class="text-[0.7rem] text-mutedText dark:text-[#d4bda8] mt-1 line-clamp-1 break-words">${obra.loja} • ${faseNome}</span>
                    </div>
                    <div class="relative bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSI1MCI+PHBhdGggZD0iTTI5Ljc1IDBMMjkuNzUgNTAiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4=')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMCIgaGVpZ2h0PSI1MCI+PHBhdGggZD0iTTI5Ljc1IDBMMjkuNzUgNTAiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIwLjUiLz48L3N2Zz4=')]" style="width: ${totalVisDays * DAY_WIDTH}px; min-width: ${totalVisDays * DAY_WIDTH}px">
                        <div class="absolute top-1/2 -translate-y-1/2 h-7 rounded-full text-[0.7rem] font-bold text-white leading-7 px-2.5 whitespace-nowrap overflow-hidden text-ellipsis shadow-sm cursor-pointer transition-all hover:brightness-110 hover:-translate-y-[calc(50%+1px)] hover:shadow-md ${isCompleted ? 'bg-brandGreen border border-[#1b5e20]' : isDelayed ? 'bg-brandRed border border-[#b71c1c]' : 'bg-brandBlue border border-[#0d47a1]'}" 
                             style="left: ${leftPx}px; width: ${widthPx}px" 
                             title="${obra.titulo}\nInício: ${obra.dataInicio}\nFim: ${obra.dataFim}\nStatus: ${faseNome}" 
                             onclick="window.abrirModalCardExpansao('${obra.id}')">
                            ${obra.titulo}
                        </div>
                    </div>
                </div>
            `;
        });

        const hojeOffsetDays = Math.round((hoje - startDate) / ONE_DAY);
        const hojeLinePx = hojeOffsetDays * DAY_WIDTH + (DAY_WIDTH / 2); 

        wrapper.innerHTML = `
            <div class="flex sticky top-0 z-[11] shadow-[0_2px_5px_rgba(0,0,0,0.05)] border-b border-border dark:border-[#4a2815]">
                <div class="w-[250px] flex-shrink-0 p-3 bg-surface dark:bg-[#362011] border-r border-border dark:border-[#4a2815] sticky left-0 z-[12] h-auto shadow-[2px_0_5px_rgba(0,0,0,0.02)]"></div>
                <div id="gantt-header-scroll" class="flex flex-col overflow-hidden flex-1 min-w-0">
                    <div style="display:flex; width: ${totalVisDays * DAY_WIDTH}px">${monthsHtml}</div>
                    <div class="flex h-[30px] border-b border-border dark:border-[#4a2815]" style="width: ${totalVisDays * DAY_WIDTH}px">
                        ${daysHtml}
                    </div>
                </div>
            </div>
            <div class="overflow-auto min-w-0 relative flex-1" id="gantt-body-scroll" onscroll="document.getElementById('gantt-header-scroll').scrollLeft = this.scrollLeft">
                <div style="display: flex; min-width: ${(totalVisDays * DAY_WIDTH) + 250}px">
                    <div class="w-[250px] flex-shrink-0 z-10 bg-surface dark:bg-[#362011]">
                    </div>
                </div>
            </div>
        `;

        let finalBodyHtml = `<div style="min-width: ${(totalVisDays * DAY_WIDTH) + 250}px; position:relative;">`;
        finalBodyHtml += rowsHtml;
        finalBodyHtml += `<div class="absolute top-0 bottom-0 w-0.5 bg-[rgba(255,94,0,0.5)] z-[5] pointer-events-none shadow-[0_0_5px_rgba(255,94,0,0.5)] flex flex-col items-center" style="left: ${hojeLinePx + 250}px;" title="Hoje"><div class="absolute top-0 w-2 h-2 rounded-full bg-brandOrange shadow-[0_0_4px_rgba(255,94,0,0.8)]"></div></div></div>`;

        wrapper.querySelector('.gantt-body').innerHTML = finalBodyHtml;

        setTimeout(() => {
            const body = document.getElementById('gantt-body-scroll');
            if (body && hojeOffsetDays > 0) {
                body.scrollLeft = Math.max(0, (hojeOffsetDays - 10) * DAY_WIDTH);
            }
        }, 100);
    }
};
