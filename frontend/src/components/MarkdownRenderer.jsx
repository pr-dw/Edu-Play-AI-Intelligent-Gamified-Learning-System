import React, { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked with GFM (GitHub Flavored Markdown) and line break preservation
marked.setOptions({
  gfm: true,
  breaks: true,
});

/**
 * Pre-processes text to clean up LLM artifacts:
 * - Literal escaped newlines (\n) -> actual newlines
 * - Erroneously escaped characters (\* -> *, \_ -> _, \[ -> [, etc.)
 * - Stray carriage returns
 */
function cleanMarkdownText(text) {
  if (typeof text !== 'string') return '';
  let cleaned = text;

  // If the model output double-escaped newlines as literal strings
  cleaned = cleaned.replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n');

  // Strip backslashes escaping markdown syntax (asterisks, underscores, brackets, hashes, etc.)
  cleaned = cleaned.replace(/\\([*_\[\]()#`\-+~>])/g, '$1');

  // Replace literal \t with spaces
  cleaned = cleaned.replace(/\\t/g, '  ');

  return cleaned.trim();
}

/**
 * Reusable, secure Markdown renderer for AI tutor responses and lesson content.
 */
export default function MarkdownRenderer({ content, className = '', isUser = false, style = {} }) {
  const htmlContent = useMemo(() => {
    if (!content) return '';
    try {
      const cleaned = cleanMarkdownText(content);
      const rawHtml = marked.parse(cleaned);
      return DOMPurify.sanitize(rawHtml, {
        ADD_ATTR: ['target', 'rel'],
      });
    } catch (err) {
      console.error('Markdown parse error:', err);
      return String(content || '');
    }
  }, [content]);

  if (!content) return null;

  return (
    <div
      className={`markdown-body ${isUser ? 'user-bubble-markdown' : 'ai-bubble-markdown'} ${className}`}
      style={{
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
