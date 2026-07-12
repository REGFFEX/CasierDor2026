import React from 'react';

interface HighlightQueryProps {
    text: string;
    query: string;
    className?: string;
}

/**
 * Composant pour mettre en évidence les caractères recherchés dans un texte
 * Style : Texte blanc, contour bleu semi-transparent (glow)
 */
const HighlightQuery: React.FC<HighlightQueryProps> = ({ text, query, className = "" }) => {
    if (!query || !text) return <span className={className}>{text}</span>;

    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

    return (
        <span className={className}>
            {parts.map((part, i) =>
                part.toLowerCase() === query.toLowerCase() ? (
                    <span
                        key={i}
                        className="bg-blue-600 text-white px-0.5 rounded shadow-[0_0_8px_rgba(37,99,235,0.6)] font-black"
                        style={{ textShadow: '0 0 2px rgba(255,255,255,0.5)' }}
                    >
                        {part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
};

export default HighlightQuery;
