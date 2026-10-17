// Friendly inline SVG illustrations. Colours come from CSS classes (.i-*)
// so they adapt to light and dark themes. All are decorative (aria-hidden).

const wrap = (body, label = "") =>
  `<svg class="illustration" viewBox="0 0 240 160" role="img" aria-hidden="true" focusable="false"${label ? ` aria-label="${label}"` : ""}>${body}</svg>`;

export const illustrations = {
  support: wrap(`
    <circle class="i-sand" cx="120" cy="84" r="64"/>
    <path class="i-line" d="M80 88a40 40 0 0 1 80 0" fill="none" stroke-width="8" stroke-linecap="round"/>
    <rect class="i-teal" x="70" y="84" width="20" height="34" rx="10"/>
    <rect class="i-teal" x="150" y="84" width="20" height="34" rx="10"/>
    <path class="i-line" d="M160 118c0 14-14 20-30 20" fill="none" stroke-width="6" stroke-linecap="round"/>
    <circle class="i-orange" cx="126" cy="138" r="7"/>
    <rect class="i-paper" x="164" y="30" width="56" height="34" rx="12"/>
    <path class="i-paper" d="M176 62l-6 12 16-12z"/>
    <circle class="i-teal" cx="180" cy="47" r="4"/><circle class="i-teal" cx="192" cy="47" r="4"/><circle class="i-teal" cx="204" cy="47" r="4"/>`),

  phase1: wrap(`
    <circle class="i-sand" cx="120" cy="88" r="62"/>
    <rect class="i-ink" x="52" y="44" width="136" height="84" rx="12"/>
    <rect class="i-screen" x="60" y="52" width="120" height="68" rx="6"/>
    <rect class="i-ink" x="36" y="128" width="168" height="12" rx="6"/>
    <rect class="i-teal" x="70" y="64" width="40" height="7" rx="3.5"/>
    <rect class="i-orange" x="80" y="78" width="54" height="7" rx="3.5"/>
    <rect class="i-teal" x="80" y="92" width="30" height="7" rx="3.5"/>
    <rect class="i-line-fill" x="70" y="106" width="70" height="7" rx="3.5"/>
    <path class="i-stroke-teal" d="M188 40c14 0 18 12 10 18s-22 4-22 14 12 12 20 8" stroke-width="9" stroke-linecap="round"/>
    <circle class="i-orange" cx="190" cy="40" r="6"/>`),

  phase2: wrap(`
    <circle class="i-sand" cx="120" cy="90" r="62"/>
    <rect class="i-teal" x="44" y="96" width="152" height="44" rx="10"/>
    <rect class="i-teal-dark" x="44" y="96" width="152" height="12" rx="6"/>
    <path class="i-orange" d="M104 92a16 16 0 0 1 32 0z"/>
    <rect class="i-orange" x="98" y="90" width="44" height="6" rx="3"/>
    <circle class="i-orange" cx="120" cy="72" r="4"/>
    <rect class="i-paper" x="30" y="30" width="70" height="34" rx="12"/>
    <text class="i-text" x="65" y="53" text-anchor="middle">GET</text>
    <rect class="i-paper" x="144" y="22" width="76" height="34" rx="12"/>
    <text class="i-text" x="182" y="45" text-anchor="middle">200 OK</text>`),

  phase3: wrap(`
    <circle class="i-sand" cx="120" cy="92" r="60"/>
    <path class="i-paper" d="M150 52a22 22 0 0 1 42 6 16 16 0 0 1-2 32h-56a18 18 0 0 1 4-36 22 22 0 0 1 12-2z"/>
    <rect class="i-teal" x="40" y="96" width="70" height="44" rx="6"/>
    <rect class="i-orange" x="114" y="96" width="70" height="44" rx="6"/>
    <rect class="i-teal-dark" x="76" y="56" width="70" height="40" rx="6"/>
    <path class="i-line" d="M52 104v28M64 104v28M76 104v28M88 104v28M126 104v28M138 104v28M150 104v28M162 104v28" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path class="i-line" d="M162 80l8 8 16-18" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),

  phase4: wrap(`
    <circle class="i-sand" cx="120" cy="88" r="62"/>
    <rect class="i-teal" x="40" y="58" width="120" height="76" rx="12" transform="rotate(-8 100 96)"/>
    <rect class="i-ink" x="40" y="74" width="120" height="14" transform="rotate(-8 100 96)"/>
    <rect class="i-orange" x="56" y="98" width="22" height="16" rx="3" transform="rotate(-8 100 96)"/>
    <path class="i-paper" d="M168 48l30 10v26c0 22-14 34-30 40-16-6-30-18-30-40V58z"/>
    <path class="i-line" d="M155 86l10 10 18-22" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`),

  developer: wrap(`
    <circle class="i-sand" cx="120" cy="86" r="64"/>
    <path class="i-teal" d="M84 140c0-26 16-40 36-40s36 14 36 40z"/>
    <circle class="i-skin" cx="120" cy="74" r="22"/>
    <path class="i-ink" d="M98 72c0-16 10-24 22-24s24 8 22 26c-6-8-16-10-26-10-6 0-12 4-18 8z"/>
    <rect class="i-ink" x="80" y="118" width="80" height="26" rx="6"/>
    <circle class="i-orange" cx="120" cy="131" r="5"/>
    <path class="i-line" d="M176 30v58" stroke-width="5" stroke-linecap="round" fill="none"/>
    <path class="i-orange" d="M178 30h36l-10 12 10 12h-36z"/>`),
};

export function illustration(name) {
  return illustrations[name] || illustrations.phase1;
}
