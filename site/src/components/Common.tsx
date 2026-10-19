import { useEffect, useRef, useState, type ReactNode } from 'react';
import { renderMarkdown } from '../markdown';
import { KIND_NAME, type Entry, type Kind } from '../types';
import { entryHref } from '../route';

export function KindBadge({ kind }: { kind: Kind }) {
  return <span className={`badge badge-${kind}`}>{KIND_NAME[kind]}</span>;
}

export function Markdown({ text }: { text: string }) {
  return <div className="markdown" dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />;
}

function fallbackCopy(text: string): boolean {
  const area = document.createElement('textarea');
  area.value = text;
  area.style.cssText = 'position:fixed;opacity:0';
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
}

/** The command is always shown next to it, so the page stays usable without the clipboard. */
export function CopyButton({ text, label = 'Copy install' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch {
      ok = fallbackCopy(text);
    }
    if (!ok) return;
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" className="btn" onClick={copy} aria-live="polite">
      {copied ? 'Copied ✓' : label}
    </button>
  );
}

export function CommandBox({ command }: { command: string }) {
  return (
    <div className="command">
      <code>{command}</code>
      <CopyButton text={command} label="Copy" />
    </div>
  );
}

export function ResultCard({ entry }: { entry: Entry }) {
  return (
    <article className="card">
      <div className="card-top">
        <KindBadge kind={entry.kind} />
        {entry.version && <span className="faint mono">v{entry.version}</span>}
      </div>
      <h3>
        <a href={entryHref(entry)}>{entry.name}</a>
      </h3>
      <p className="clamp">{entry.description}</p>
      <div className="card-tags mono faint">
        {entry.keywords.slice(0, 3).map((k) => (
          <span key={k}>#{k}</span>
        ))}
      </div>
      <div className="card-bottom">
        <span className="faint">{entry.kind === 'plugin' ? entry.author : `in ${entry.plugin}`}</span>
        <CopyButton text={entry.install} />
      </div>
    </article>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="empty">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
