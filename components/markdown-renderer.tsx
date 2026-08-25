'use client';

import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  // Split by code blocks first
  const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)```/g;
  const sections: React.ReactNode[] = [];
  let lastIndex = 0;
  let blockMatch: RegExpExecArray | null;
  let sectionKey = 0;

  while ((blockMatch = codeBlockRegex.exec(content)) !== null) {
    // Text before code block
    if (blockMatch.index > lastIndex) {
      const textSection = content.substring(lastIndex, blockMatch.index);
      sections.push(
        <TextSection key={`text-${sectionKey++}`} text={textSection} />
      );
    }

    const language = blockMatch[1] || 'code';
    const codeContent = blockMatch[2];

    sections.push(
      <div
        key={`code-block-${sectionKey++}`}
        className="my-2.5 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 text-neutral-100 font-mono text-[11px] shadow-sm"
      >
        <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900 border-b border-neutral-800 text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
          <span>{language}</span>
          <span className="text-[9px] lowercase opacity-70">snippet</span>
        </div>
        <pre className="p-3 overflow-x-auto leading-relaxed">
          <code>{codeContent.trim()}</code>
        </pre>
      </div>
    );

    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    sections.push(
      <TextSection key={`text-${sectionKey++}`} text={content.substring(lastIndex)} />
    );
  }

  return <div className={`space-y-1.5 text-xs sm:text-sm text-neutral-800 ${className}`}>{sections}</div>;
}

function TextSection({ text }: { text: string }) {
  const lines = text.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Bullet point detection
        const isBullet = trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
        // Numbered list detection
        const numberMatch = trimmed.match(/^(\d+)\.\s+/);

        if (isBullet) {
          const cleanText = trimmed.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="text-neutral-900 font-bold select-none text-xs mt-0.5">•</span>
              <div className="flex-1 leading-relaxed text-neutral-800">
                {parseInlineFormatting(cleanText)}
              </div>
            </div>
          );
        }

        if (numberMatch) {
          const num = numberMatch[1];
          const cleanText = trimmed.replace(/^\d+\.\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 pl-1 py-0.5">
              <span className="font-bold text-neutral-900 text-xs mt-0.5 select-none font-mono">
                {num}.
              </span>
              <div className="flex-1 leading-relaxed text-neutral-800">
                {parseInlineFormatting(cleanText)}
              </div>
            </div>
          );
        }

        // Heading 3 detection
        if (trimmed.startsWith('### ')) {
          return (
            <h4 key={idx} className="font-bold text-neutral-900 text-sm mt-2 mb-1">
              {parseInlineFormatting(trimmed.replace(/^###\s+/, ''))}
            </h4>
          );
        }

        return (
          <p key={idx} className="leading-relaxed text-neutral-800">
            {parseInlineFormatting(line)}
          </p>
        );
      })}
    </div>
  );
}

function parseInlineFormatting(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Token regex for:
  // 1. **bold**
  // 2. `inline code`
  // 3. *italic*
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    if (match[2] !== undefined) {
      // **bold**
      parts.push(
        <strong key={`b-${key++}`} className="font-bold text-neutral-900">
          {match[2]}
        </strong>
      );
    } else if (match[3] !== undefined) {
      // `code`
      parts.push(
        <code
          key={`c-${key++}`}
          className="px-1.5 py-0.5 rounded bg-neutral-200/80 text-neutral-900 font-mono text-[11px] font-medium"
        >
          {match[3]}
        </code>
      );
    } else if (match[4] !== undefined) {
      // *italic*
      parts.push(
        <em key={`i-${key++}`} className="italic text-neutral-700">
          {match[4]}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
