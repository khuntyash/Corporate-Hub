/**
 * ChemicalImage — smart chemical structure image component
 *
 * Fallback chain:
 *  1. Stored image URL (Cactus NCI or original)
 *  2. PubChem structure image (if CAS number is available)
 *  3. Clean SVG placeholder (molecule icon, no barrels)
 */
import { useState } from "react";

interface ChemicalImageProps {
    src?: string | null;
    alt: string;
    casNumber?: string | null;
    className?: string;
}

// Inline SVG placeholder — a generic molecule/flask icon
const CHEMICAL_SVG_PLACEHOLDER = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' fill='none'><rect width='200' height='200' fill='%23f8fafc'/><g transform='translate(100,100)'><circle cx='-30' cy='-20' r='14' stroke='%2394a3b8' stroke-width='3' fill='%23e2e8f0'/><circle cx='30' cy='-20' r='14' stroke='%2394a3b8' stroke-width='3' fill='%23e2e8f0'/><circle cx='0' cy='20' r='14' stroke='%2394a3b8' stroke-width='3' fill='%23e2e8f0'/><line x1='-17' y1='-16' x2='-3' y2='7' stroke='%2394a3b8' stroke-width='3'/><line x1='17' y1='-16' x2='3' y2='7' stroke='%2394a3b8' stroke-width='3'/><line x1='-16' y1='-20' x2='16' y2='-20' stroke='%2394a3b8' stroke-width='3'/></g><text x='100' y='168' text-anchor='middle' font-family='system-ui,sans-serif' font-size='11' fill='%23cbd5e1'>Structure unavailable</text></svg>`;

function buildPubChemUrl(cas: string | null | undefined): string | null {
    if (!cas || !cas.trim()) return null;
    return `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(cas.trim())}/PNG`;
}

export function ChemicalImage({ src, alt, casNumber, className }: ChemicalImageProps) {
    const initialSrc = src || CHEMICAL_SVG_PLACEHOLDER;
    const [currentSrc, setCurrentSrc] = useState(initialSrc);
    const [stage, setStage] = useState<"primary" | "pubchem" | "fallback">("primary");

    const handleError = () => {
        if (stage === "primary") {
            // Try PubChem next
            const pubchemUrl = buildPubChemUrl(casNumber);
            if (pubchemUrl) {
                setCurrentSrc(pubchemUrl);
                setStage("pubchem");
                return;
            }
        }
        // Final fallback: SVG placeholder
        setCurrentSrc(CHEMICAL_SVG_PLACEHOLDER);
        setStage("fallback");
    };

    return (
        <img
            src={currentSrc}
            alt={alt}
            loading="lazy"
            decoding="async"
            className={className}
            onError={handleError}
        />
    );
}
