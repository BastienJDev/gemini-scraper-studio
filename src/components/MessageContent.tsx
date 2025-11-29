import React from "react";
import ReactMarkdown from "react-markdown";

interface MessageContentProps {
  content: string;
}

export const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  return (
    <div className="prose prose-sm prose-invert max-w-none">
      <ReactMarkdown
        components={{
          // Headers
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-foreground mt-4 mb-2 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-foreground mt-4 mb-2 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold text-foreground mt-3 mb-2 first:mt-0">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-bold text-foreground mt-2 mb-1">{children}</h4>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p className="text-sm text-foreground mb-3 last:mb-0 leading-relaxed">{children}</p>
          ),
          // Links - clickable
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors break-all"
            >
              {children}
            </a>
          ),
          // Bold
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">{children}</strong>
          ),
          // Italic
          em: ({ children }) => (
            <em className="italic text-foreground">{children}</em>
          ),
          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 space-y-1 text-sm">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1 text-sm">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="text-foreground leading-relaxed">{children}</li>
          ),
          // Horizontal rule
          hr: () => (
            <hr className="my-4 border-border/50" />
          ),
          // Code blocks
          code: ({ className, children }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="bg-secondary/70 text-primary px-1.5 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              );
            }
            return (
              <code className="block bg-secondary/50 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-secondary/50 p-3 rounded-lg overflow-x-auto my-2">
              {children}
            </pre>
          ),
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 my-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
