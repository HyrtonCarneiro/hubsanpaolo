/**
 * Button Atom
 * Generates an atomic HTML string for a stylized button
 */
export const Button = ({ text, id, onClick, variant = 'primary', icon = '', fullWidth = false, type = 'button' }) => {
    const baseClass = "inline-flex items-center justify-center font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
        primary: "bg-brandOrange text-white hover:bg-orange-700 px-4 py-2",
        outline: "border border-gray-300 bg-white text-mainText hover:bg-gray-50 px-4 py-2"
    };

    const widthClass = fullWidth ? "w-full" : "";
    const idAttr = id ? `id="${id}"` : "";
    const clickAttr = onClick ? `onclick="${onClick}"` : "";

    return `
        <button type="${type}" ${idAttr} ${clickAttr} class="${baseClass} ${variants[variant]} ${widthClass}">
            ${icon} ${text}
        </button>
    `;
};
