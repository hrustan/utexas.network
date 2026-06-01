'use client';

import { notFound } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type ColorChoice = 'black' | 'red' | 'yellow' | 'white' | 'custom';
type ArrowChoice = 'arrow' | 'chevron' | 'angle';
type TowerTheme = 'light' | 'dark' | 'auto';

interface EmbedConfig {
  color: ColorChoice;
  customColor: string; // applied only when color === 'custom'
  arrow: ArrowChoice;
  iconSize: number; // 16–256, default 56
  arrowSize: number; // 10–96, default 24
  gap: number; // 0–80, default 12
  tower: boolean; // data-tower presence flag (inert this phase)
  towerTheme: TowerTheme; // data-tower-theme value (inert this phase)
}

const DEFAULT_CONFIG: EmbedConfig = {
  color: 'black',
  customColor: '#bf5700',
  arrow: 'arrow',
  iconSize: 56,
  arrowSize: 24,
  gap: 12,
  tower: false,
  towerTheme: 'light',
};

const DEFAULT_PAGE_BG = '#ffffff';

const STAGE_SWATCHES = [
  { label: 'white', value: '#ffffff' },
  { label: 'light', value: '#f9f9f9' },
  { label: 'dark', value: '#0a0a0a' },
  { label: 'UT orange', value: '#bf5700' },
  { label: 'black', value: '#000000' },
];

/**
 * Injects a fresh `/embed.js` <script> on every mount and tears it (plus the
 * widget it rendered) down on unmount. The parent gives this component a `key`
 * derived from the config, so each config change fully remounts it — the only
 * way to re-run embed.js, which reads its data-* attributes once at load.
 */
function EmbedInjector({ config }: { config: EmbedConfig }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const script = document.createElement('script');
    script.src = '/embed.js'; // same-origin; resolveBaseUrl keeps http on localhost
    // Injected scripts have document.currentScript === null, so embed.js falls
    // back to querySelector('script[data-webring]') to self-locate. Required.
    script.setAttribute('data-webring', '');
    script.setAttribute('data-color', config.color);
    if (config.color === 'custom' && config.customColor) {
      script.setAttribute('data-custom-color', config.customColor);
    }
    script.setAttribute('data-arrow', config.arrow);
    script.setAttribute('data-icon-size', String(config.iconSize));
    script.setAttribute('data-arrow-size', String(config.arrowSize));
    script.setAttribute('data-gap', String(config.gap));
    // Not-yet-functional: embed.js ignores both until Phase 3. Wired now so the
    // harness can exercise them. data-tower is a presence flag; theme is a value.
    if (config.tower) script.setAttribute('data-tower', '');
    script.setAttribute('data-tower-theme', config.towerTheme);

    // Append into the in-DOM container: embed.js inserts the widget as the
    // script's nextSibling, so .utexas-webring-wrapper lands inside `container`,
    // keeping teardown container-scoped.
    container.appendChild(script);

    return () => {
      // Remove the widget(s) embed.js rendered as siblings, then the script.
      // querySelectorAll(...).forEach absorbs React StrictMode's dev double-invoke
      // so no orphan wrappers or stray data-webring scripts leak across remounts.
      container.querySelectorAll('.utexas-webring-wrapper').forEach((n) => n.remove());
      script.remove();
      // Benign race: a config change during an in-flight /api/webring fetch can let
      // embed.js's deferred insertBefore run against the removed script; it throws
      // inside the IIFE's own .catch and is logged — harmless, no orphan results.
    };
  }, [config]);

  return <div ref={containerRef} />;
}

export default function EmbedPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  const [config, setConfig] = useState<EmbedConfig>(DEFAULT_CONFIG);
  const [pageBg, setPageBg] = useState(DEFAULT_PAGE_BG);

  const update = <K extends keyof EmbedConfig>(key: K, value: EmbedConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const reset = () => {
    setConfig(DEFAULT_CONFIG);
    setPageBg(DEFAULT_PAGE_BG);
  };

  return (
    <main className="wrap">
      <header>
        <div className="title-row">
          <h1>embed preview</h1>
          <button type="button" className="reset" onClick={reset}>
            reset
          </button>
        </div>
        <p className="note">
          Dev-only harness for <code>/embed.js</code>. Each control change remounts the live widget.
        </p>
      </header>

      <div className="layout">
        <section className="panel" aria-label="controls">
          <label className="field">
            <span>color</span>
            <select
              value={config.color}
              onChange={(e) => update('color', e.target.value as ColorChoice)}
            >
              <option value="black">black</option>
              <option value="red">red</option>
              <option value="yellow">yellow</option>
              <option value="white">white</option>
              <option value="custom">custom</option>
            </select>
          </label>

          {config.color === 'custom' && (
            <label className="field">
              <span>custom color</span>
              <input
                type="color"
                value={config.customColor}
                onChange={(e) => update('customColor', e.target.value)}
              />
            </label>
          )}

          <label className="field">
            <span>arrow</span>
            <select
              value={config.arrow}
              onChange={(e) => update('arrow', e.target.value as ArrowChoice)}
            >
              <option value="arrow">arrow</option>
              <option value="chevron">chevron</option>
              <option value="angle">angle</option>
            </select>
          </label>

          <label className="field">
            <span>icon size · {config.iconSize}px</span>
            <input
              type="range"
              min={16}
              max={256}
              value={config.iconSize}
              onChange={(e) => update('iconSize', Number(e.target.value))}
            />
          </label>

          <label className="field">
            <span>arrow size · {config.arrowSize}px</span>
            <input
              type="range"
              min={10}
              max={96}
              value={config.arrowSize}
              onChange={(e) => update('arrowSize', Number(e.target.value))}
            />
          </label>

          <label className="field">
            <span>gap · {config.gap}px</span>
            <input
              type="range"
              min={0}
              max={80}
              value={config.gap}
              onChange={(e) => update('gap', Number(e.target.value))}
            />
          </label>

          <div className="field">
            <span>stage background</span>
            <div className="swatches">
              {STAGE_SWATCHES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={`swatch${pageBg === s.value ? ' active' : ''}`}
                  style={{ background: s.value }}
                  title={s.label}
                  aria-label={s.label}
                  onClick={() => setPageBg(s.value)}
                />
              ))}
              <input
                type="color"
                value={pageBg}
                onChange={(e) => setPageBg(e.target.value)}
                aria-label="custom stage background"
              />
            </div>
          </div>

          <fieldset className="tower">
            <legend>tower (wired, inert until Phase 3)</legend>
            <label className="field row">
              <input
                type="checkbox"
                checked={config.tower}
                onChange={(e) => update('tower', e.target.checked)}
              />
              <span>data-tower</span>
            </label>
            <label className="field">
              <span>data-tower-theme</span>
              <select
                value={config.towerTheme}
                onChange={(e) => update('towerTheme', e.target.value as TowerTheme)}
              >
                <option value="light">light</option>
                <option value="dark">dark</option>
                <option value="auto">auto</option>
              </select>
            </label>
          </fieldset>
        </section>

        <section className="stage" style={{ background: pageBg }} aria-label="preview">
          <EmbedInjector key={JSON.stringify(config)} config={config} />
        </section>
      </div>

      <style jsx>{`
        .wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2rem var(--space-page, 1.5rem);
          color: var(--foreground);
        }
        .title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }
        h1 {
          margin: 0;
          font-size: 1.5rem;
        }
        .reset {
          font-size: 0.8rem;
          padding: 0.4rem 0.8rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--card-bg);
          color: var(--foreground);
          cursor: pointer;
        }
        .reset:hover {
          border-color: var(--hover-color, #bf5700);
          color: var(--hover-color, #bf5700);
        }
        .note {
          margin: 0.25rem 0 1.5rem;
          color: var(--secondary);
          font-size: 0.9rem;
        }
        code {
          font-family: var(--font-geist-mono), monospace;
        }
        .layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 1.5rem;
          align-items: start;
        }
        .panel {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--card-bg);
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          font-size: 0.85rem;
          color: var(--secondary);
        }
        .field.row {
          flex-direction: row;
          align-items: center;
          gap: 0.5rem;
        }
        select,
        input[type='range'] {
          width: 100%;
        }
        .swatches {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          align-items: center;
        }
        .swatch {
          width: 24px;
          height: 24px;
          border-radius: 6px;
          border: 1px solid var(--border);
          cursor: pointer;
          padding: 0;
        }
        .swatch.active {
          outline: 2px solid var(--hover-color, #bf5700);
          outline-offset: 1px;
        }
        .tower {
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin: 0;
        }
        .tower legend {
          font-size: 0.75rem;
          color: var(--tertiary);
          padding: 0 0.35rem;
        }
        .stage {
          min-height: 320px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 2rem;
        }
        @media (max-width: 720px) {
          .layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
