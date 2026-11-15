import { escapeHtml } from "./formatters.mjs";

function renderDestinationBody(destination) {
  const bodies = {
    bennu: `
      <path class="preparation1__body-silhouette" d="M37 9l8 3 6-1 7 6 8 2 4 8 6 5-2 8 4 7-5 7-2 8-8 3-5 7-9-2-8 4-7-5-9 1-5-7-8-3-1-9-5-6 3-8-1-8 7-5 3-8 9-2z"/>
      <g class="preparation1__body-rocks">
        <circle cx="27" cy="31" r="5"/><circle cx="40" cy="19" r="3.4"/><circle cx="55" cy="25" r="5.2"/>
        <circle cx="65" cy="39" r="3.8"/><circle cx="52" cy="44" r="6.5"/><circle cx="33" cy="50" r="4.6"/>
        <circle cx="45" cy="65" r="5.5"/><circle cx="63" cy="58" r="3.2"/><circle cx="21" cy="43" r="2.8"/>
        <path d="M24 28l5-3m10-9 4 1m11 5 5 3m7 11 3 3m-16 2 5 2m-29 5 4 2m13 14 5 2m11-11 5-1"/>
      </g>
      <circle class="preparation1__body-crater" cx="37" cy="37" r="4.4"/>
      <circle class="preparation1__body-crater" cx="58" cy="51" r="3"/>
      <circle class="preparation1__body-glint" cx="33" cy="24" r="2"/>
    `,
    ryugu: `
      <path class="preparation1__body-silhouette" d="M40 7l10 4 9-2 5 9 10 5 1 11 6 7-4 9 1 9-9 5-5 9-11-2-8 5-9-7-10 1-4-10-9-4 2-11-5-8 7-8 1-9 10-3z"/>
      <g class="preparation1__body-rocks">
        <path d="M24 31l5-8 7 2 2 8-6 5z"/><path d="M46 17l7-2 5 7-3 6-8-2z"/>
        <path d="M60 34l8-4 5 7-3 8-8 1z"/><path d="M32 47l8-4 7 5-2 8-9 2z"/>
        <path d="M51 53l7-4 7 5-2 8-8 2z"/><path d="M40 65l3-6 7 1 2 6-6 4z"/>
        <path d="M20 39l4-4 3 5-2 6z"/><path d="M61 23l4 2 2 5-5 1z"/>
      </g>
      <circle class="preparation1__body-crater" cx="42" cy="37" r="5"/>
      <circle class="preparation1__body-crater" cx="62" cy="49" r="2.6"/>
      <path class="preparation1__body-fracture" d="M31 28l8 4 3 7-5 6m20 3-5 5-1 7"/>
      <circle class="preparation1__body-glint" cx="35" cy="19" r="2"/>
    `,
    itokawa: `
      <path class="preparation1__body-silhouette" d="M7 39l5-10 9-3 7-9 13-2 9 6 8-2 7 6 11 2 6 8 8 3 4 9-6 7-12 1-8 6-10-2-8 6-10-3-8 2-7-7-10-1-4-9-8-2z"/>
      <g class="preparation1__body-rocks">
        <circle cx="22" cy="34" r="5"/><circle cx="37" cy="25" r="4"/><circle cx="52" cy="28" r="3"/>
        <circle cx="68" cy="35" r="4.8"/><circle cx="80" cy="43" r="3"/><circle cx="59" cy="47" r="5.6"/>
        <circle cx="41" cy="46" r="4.4"/><circle cx="26" cy="49" r="3.2"/><circle cx="72" cy="53" r="2.8"/>
        <path d="M19 30l4-2m11-6 4 1m12 1 4 1m13 6 5 1m9 10 4 1m-28 1 5 2m-37 1 4 1m39 6 4-1"/>
      </g>
      <circle class="preparation1__body-crater" cx="43" cy="36" r="3.6"/>
      <circle class="preparation1__body-crater" cx="65" cy="43" r="2.5"/>
      <circle class="preparation1__body-glint" cx="33" cy="29" r="1.8"/>
    `,
    "67p": `
      <path class="preparation1__body-silhouette" d="M34 12l10 1 7 7 3 8-3 7 8-1 7-9 11-2 9 5 5 10-1 12-6 9-11 4-12-2-8-8-7-2-5 9-10 7-12-2-8-8-3-12 4-11 9-7z"/>
      <g class="preparation1__body-rocks">
        <circle cx="34" cy="24" r="4"/><circle cx="43" cy="34" r="3.2"/><circle cx="27" cy="41" r="5"/>
        <circle cx="36" cy="53" r="4.3"/><circle cx="61" cy="32" r="3.2"/><circle cx="72" cy="38" r="5"/>
        <circle cx="78" cy="50" r="3.5"/><circle cx="63" cy="55" r="4.8"/><circle cx="48" cy="48" r="3"/>
        <path d="M30 21l4-2m-11 19 4-1m9 13 3 3m26-25 4-1m8 13 4 1m-18 15 4 1"/>
      </g>
      <circle class="preparation1__body-crater" cx="29" cy="44" r="2.7"/>
      <circle class="preparation1__body-crater" cx="70" cy="45" r="3.8"/>
      <path class="preparation1__body-neck" d="M48 33c3 4 4 10 1 16"/>
      <circle class="preparation1__body-glint" cx="30" cy="31" r="1.8"/>
    `,
    wild2: `
      <path class="preparation1__body-silhouette" d="M38 8l9 3 7-3 8 7 9 1 3 9 8 6-2 10 4 7-6 7-2 9-10 2-7 8-9-4-8 4-8-7-9 1-4-9-8-4 2-9-5-7 6-8v-9l9-4z"/>
      <g class="preparation1__body-rocks">
        <circle cx="30" cy="28" r="5"/><circle cx="47" cy="19" r="4"/><circle cx="62" cy="25" r="5.4"/>
        <circle cx="70" cy="41" r="4"/><circle cx="54" cy="42" r="6"/><circle cx="34" cy="46" r="4"/>
        <circle cx="45" cy="61" r="5.3"/><circle cx="63" cy="57" r="3.6"/><circle cx="25" cy="39" r="2.8"/>
        <path d="M27 25l4-2m13-8 4 1m14 6 5 3m7 14 4 2m-22-1 5 2m-36 4 4 1m17 14 4 2m13-9 4-1"/>
      </g>
      <circle class="preparation1__body-crater" cx="39" cy="36" r="4.2"/>
      <circle class="preparation1__body-crater" cx="61" cy="50" r="3.4"/>
      <circle class="preparation1__body-glint" cx="35" cy="20" r="1.8"/>
    `,
  };
  const isComet = destination.id === "67p" || destination.id === "wild2";
  const viewBox = destination.id === "itokawa" ? "0 0 100 72" : "0 0 100 82";

  return `
    <svg class="preparation1__body-art preparation1__body-art--${escapeHtml(destination.id)}${isComet ? " is-comet" : ""}"
      viewBox="${viewBox}" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="p1-rock-${escapeHtml(destination.id)}" x1="0.12" y1="0.1" x2="0.82" y2="0.92">
          <stop offset="0" stop-color="${destination.id === "67p" || destination.id === "wild2" ? "#88877d" : "#8a8172"}"/>
          <stop offset="0.38" stop-color="${destination.id === "bennu" || destination.id === "ryugu" ? "#514a42" : "#55534c"}"/>
          <stop offset="1" stop-color="#1b2228"/>
        </linearGradient>
        <radialGradient id="p1-rock-light-${escapeHtml(destination.id)}" cx="0.3" cy="0.22" r="0.8">
          <stop offset="0" stop-color="#eee0bf" stop-opacity=".46"/>
          <stop offset=".48" stop-color="#c5b696" stop-opacity=".12"/>
          <stop offset="1" stop-color="#141b20" stop-opacity=".48"/>
        </radialGradient>
        <filter id="p1-rock-shadow-${escapeHtml(destination.id)}" x="-35%" y="-35%" width="180%" height="190%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur"/>
          <feOffset dy="4" result="offset"/>
          <feComponentTransfer><feFuncA type="linear" slope=".62"/></feComponentTransfer>
          <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id="p1-comet-tail-${escapeHtml(destination.id)}" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#7ebbd0" stop-opacity="0"/>
          <stop offset="1" stop-color="#b2d8e2" stop-opacity=".58"/>
        </linearGradient>
        <filter id="p1-rock-texture-${escapeHtml(destination.id)}" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency=".16" numOctaves="3" seed="${["bennu", "ryugu", "itokawa", "67p", "wild2"].indexOf(destination.id) + 4}" result="grain"/>
          <feColorMatrix in="grain" type="saturate" values="0" result="monochrome"/>
          <feComponentTransfer in="monochrome" result="fine-grain">
            <feFuncA type="table" tableValues="0 .26"/>
          </feComponentTransfer>
          <feComposite in="fine-grain" in2="SourceAlpha" operator="in" result="surface-grain"/>
          <feBlend in="SourceGraphic" in2="surface-grain" mode="soft-light"/>
        </filter>
      </defs>
      ${isComet ? `<path class="preparation1__comet-tail preparation1__comet-tail--${escapeHtml(destination.id)}" d="${destination.id === "67p"
        ? "M48 38C32 29 22 17 9 10c13 4 28 11 43 23z"
        : "M48 37C31 27 23 16 10 8c14 5 28 12 43 25z"}"/>` : ""}
      <g filter="url(#p1-rock-shadow-${escapeHtml(destination.id)})">
        ${bodies[destination.id]}
        <path class="preparation1__body-light" d="${destination.id === "itokawa"
          ? "M17 31l8-9 12-4 7 4-14 3-8 9z"
          : "M37 12l8-2 8 5-8-1-8 4-8 7 3-9z"}"/>
        <path class="preparation1__body-shade" d="${destination.id === "itokawa"
          ? "M79 42l8 2-6 7-12 2-7 5 8-9 9-3z"
          : "M69 51l8-3 4 5-6 10-9 5 6-8z"}"/>
      </g>
    </svg>
  `;
}

export function renderDestinationMap(destinations, selectedDestinationId) {
  const selected = destinations.find((destination) => destination.id === selectedDestinationId);
  return `
    <div class="preparation1__shell preparation1__map-screen">
      <header class="preparation1__header">
        <p class="preparation1__eyebrow">Mission Design / Stage 01</p>
        <h1>Choose your destination.</h1>
        <p class="preparation1__intro">
          Begin on Earth, then choose a small body to investigate. Every destination is open for selection.
        </p>
      </header>
      <div class="preparation1__map-layout">
        <section class="preparation1__panel preparation1__map-panel" aria-label="Illustrative destination map">
          <div class="preparation1__map-topline">
            <span>DEPARTURE: <strong>EARTH</strong></span>
            <span class="preparation1__map-note">Stylized navigation view · not to scale</span>
          </div>
          <div class="preparation1__map" role="group" aria-label="Select one of five destinations">
            <svg class="preparation1__routes" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <radialGradient id="p1-sun-core">
                    <stop offset="0" stop-color="#fff5ce"/>
                    <stop offset=".45" stop-color="#f6c875"/>
                    <stop offset="1" stop-color="#db8e48"/>
                  </radialGradient>
                  <radialGradient id="p1-earth-globe" cx=".28" cy=".25">
                    <stop offset="0" stop-color="#9de4ec"/>
                    <stop offset=".52" stop-color="#337eaa"/>
                    <stop offset="1" stop-color="#102c50"/>
                  </radialGradient>
                  <filter id="p1-sun-glow" x="-150%" y="-150%" width="400%" height="400%">
                    <feGaussianBlur stdDeviation="14"/>
                  </filter>
                </defs>
                <path class="preparation1__map-grid" d="M0 125H1000M0 250H1000M0 375H1000M250 0V500M500 0V500M750 0V500"/>
                <ellipse class="preparation1__orbit-guide" cx="440" cy="250" rx="270" ry="166"/>
                <ellipse class="preparation1__orbit-guide" cx="570" cy="250" rx="380" ry="217"/>
                <ellipse class="preparation1__orbit-guide" cx="695" cy="250" rx="470" ry="258"/>
                <circle class="preparation1__sun-glow" cx="94" cy="250" r="30" filter="url(#p1-sun-glow)"/>
                <circle class="preparation1__sun" cx="94" cy="250" r="15"></circle>
                <circle class="preparation1__sun-corona" cx="94" cy="250" r="23"></circle>
                <circle class="preparation1__earth-halo" cx="190" cy="250" r="23"></circle>
                <circle class="preparation1__earth-globe" cx="190" cy="250" r="12"></circle>
                <path class="preparation1__earth-land" d="M183 243l5-3 3 3 4 1-2 4 3 3-5 2-3-2-4 1-2-4zM192 257l4-2 2 3-3 3z"/>
                <text class="preparation1__map-label" x="94" y="296">SUN</text>
                <text class="preparation1__map-label preparation1__earth-label" x="190" y="296">EARTH / START</text>
              ${destinations.map((destination) => {
                const x = destination.mapPosition.x * 10;
                const y = destination.mapPosition.y * 5;
                  const controlX = (190 + x) / 2;
                  const controlY = y < 250 ? Math.max(75, y - 100) : Math.min(425, y + 100);
                  return `<path class="preparation1__route" d="M 190 250 Q ${controlX} ${controlY} ${x} ${y}"></path>`;
              }).join("")}
            </svg>
            ${destinations.map((destination) => `
              <button
                class="preparation1__map-point${destination.id === selectedDestinationId ? " is-selected" : ""}"
                type="button"
                data-action="select-destination"
                data-destination-id="${escapeHtml(destination.id)}"
                aria-pressed="${destination.id === selectedDestinationId}"
                style="--point-x:${destination.mapPosition.x}%;--point-y:${destination.mapPosition.y}%"
                aria-label="Select ${escapeHtml(destination.name)}, ${escapeHtml(destination.classification)}"
              >
                ${renderDestinationBody(destination)}
                <span class="preparation1__point-orb" aria-hidden="true"></span>
                <span class="preparation1__point-name">${escapeHtml(destination.shortName || destination.name)}</span>
              </button>
            `).join("")}
          </div>
          <div class="preparation1__map-legend">
            <span><i class="preparation1__legend-earth"></i> Earth departure</span>
            <span><i class="preparation1__legend-target"></i> Selectable destination</span>
          </div>
        </section>

        <aside class="preparation1__panel preparation1__destination-info" aria-live="polite">
          ${selected ? `
            <p class="preparation1__eyebrow">Target selected</p>
            <h2>${escapeHtml(selected.shortName || selected.name)}</h2>
            ${selected.shortName ? `<p class="preparation1__full-name">${escapeHtml(selected.name)}</p>` : ""}
            <dl class="preparation1__facts">
              <div><dt>Classification</dt><dd>${escapeHtml(selected.classification)}</dd></div>
              <div><dt>Mission inspiration</dt><dd>${escapeHtml(selected.historicalMission)}</dd></div>
            </dl>
            <p class="preparation1__destination-copy">${escapeHtml(selected.description)}</p>
            <p class="preparation1__destination-copy"><strong>Science focus</strong><br>${escapeHtml(selected.objective)}</p>
            <button class="preparation1__button preparation1__button--primary" type="button" data-action="confirm-destination">
              Select ${escapeHtml(selected.shortName || selected.name)} <span aria-hidden="true">→</span>
            </button>
          ` : `
            <p class="preparation1__eyebrow">Earth departure</p>
            <h2>Pick a target.</h2>
            <p class="preparation1__destination-copy">
              Select any map marker to see its scientific context. The map is a navigation illustration,
              not a scale model of current orbital positions.
            </p>
            <p class="preparation1__destination-copy">Your spacecraft and science kit will be designed for the selected destination.</p>
            <button class="preparation1__button preparation1__button--primary" type="button" disabled>Select a destination first</button>
          `}
          <p class="preparation1__science-note">Inspired by real missions. Game values and mission scenarios are simplified for play.</p>
        </aside>
      </div>
      <footer class="preparation1__footer">
        <span>DESTINATION SELECTION</span>
        <span>01 <i></i> 02&nbsp; SPACECRAFT BUILDER</span>
      </footer>
    </div>
  `;
}
