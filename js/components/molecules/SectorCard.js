/**
 * SectorCard Molecule
 * Generates a grid card for a specific sector 
 */
window.SectorCard = function({ title, id, icon, active, brandColor, onClickDir }) {
    if (!active) return '';

    const defaultStyles = "flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all cursor-pointer hover:-translate-y-1";
    let activeStyles = "border-transparent bg-surface shadow-md text-mainText hover:border-gray-300";
    let iconStyles = "text-gray-500";

    // Específico para Diretoria manter o Branding
    if (brandColor) {
        activeStyles = `shadow-md bg-gradient-to-br from-surface border-brandOrange text-mainText`;
        iconStyles = `text-brandOrange`;
    }

    return `
        <div id="hub-card-${id}" onclick="${onClickDir}" class="${defaultStyles} ${activeStyles}">
            <i class="${icon} text-4xl mb-3 ${iconStyles}"></i>
            <h3 class="text-xl font-semibold text-center">${title}</h3>
        </div>
    `;
};
