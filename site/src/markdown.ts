import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Catalog text comes from repository files, so it is never trusted: always sanitize.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer');
    if ((node.getAttribute('href') ?? '').startsWith('http')) node.setAttribute('target', '_blank');
  }
});

export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false, gfm: true }) as string;
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}
