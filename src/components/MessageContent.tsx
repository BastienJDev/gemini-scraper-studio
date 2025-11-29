import React from "react";

interface MessageContentProps {
  content: string;
}

// Parse markdown-style links [text](url) and render as clickable links
export const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  const renderContent = (text: string) => {
    // Regex to match markdown links [text](url)
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = linkRegex.exec(text)) !== null) {
      // Add text before the link
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        parts.push(<span key={`text-${keyIndex++}`}>{beforeText}</span>);
      }

      // Add the clickable link
      const linkText = match[1];
      const linkUrl = match[2];
      parts.push(
        <a
          key={`link-${keyIndex++}`}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
        >
          {linkText}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(<span key={`text-${keyIndex++}`}>{text.slice(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : text;
  };

  // Also handle plain URLs that aren't in markdown format
  const renderWithPlainUrls = (text: string) => {
    // First render markdown links
    const withMarkdownLinks = renderContent(text);
    
    // If no parsing happened (returned string), try plain URLs
    if (typeof withMarkdownLinks === "string") {
      const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;
      let keyIndex = 0;

      while ((match = urlRegex.exec(text)) !== null) {
        // Add text before the URL
        if (match.index > lastIndex) {
          parts.push(<span key={`text-${keyIndex++}`}>{text.slice(lastIndex, match.index)}</span>);
        }

        // Add the clickable URL
        const url = match[1];
        parts.push(
          <a
            key={`url-${keyIndex++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors break-all"
          >
            {url}
          </a>
        );

        lastIndex = match.index + match[0].length;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        parts.push(<span key={`text-${keyIndex++}`}>{text.slice(lastIndex)}</span>);
      }

      return parts.length > 0 ? parts : text;
    }

    return withMarkdownLinks;
  };

  return (
    <span className="whitespace-pre-wrap leading-relaxed">
      {renderWithPlainUrls(content)}
    </span>
  );
};
