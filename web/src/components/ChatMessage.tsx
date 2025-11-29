import { Scale, User, FileText } from 'lucide-react';

interface SourceDocument {
  document_id: number;
  text_preview: string;
  metadata: string;
  relevance_score: number;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: SourceDocument[];
}

interface ChatMessageProps {
  message: Message;
}

function formatBotMessage(text: string) {
  // Split by numbered sections (e.g., "1. **Title**" or "1. Title")
  const sections = text.split(/(?=\d+\.\s+\*?\*?[A-Z])/);

  return (
    <div className="space-y-4">
      {sections.map((section, idx) => {
        const trimmedSection = section.trim();
        if (!trimmedSection) return null;

        // Check if this section starts with a numbered header
        const headerMatch = trimmedSection.match(/^(\d+)\.\s+\*?\*?([^*\n]+)\*?\*?([\s\S]*)/);

        if (headerMatch) {
          const [, number, title, content] = headerMatch;

          // Process the content to find bullet points and paragraphs
          const lines = content.split('\n').map(l => l.trim()).filter(l => l);
          const bulletPoints: string[] = [];
          const paragraphs: string[] = [];
          let currentParagraph = '';

          lines.forEach(line => {
            if (line.startsWith('-')) {
              // Save any accumulated paragraph
              if (currentParagraph) {
                paragraphs.push(currentParagraph);
                currentParagraph = '';
              }
              bulletPoints.push(line.substring(1).trim());
            } else if (line) {
              // Accumulate paragraph text
              currentParagraph += (currentParagraph ? ' ' : '') + line;
            }
          });

          // Don't forget the last paragraph
          if (currentParagraph) {
            paragraphs.push(currentParagraph);
          }

          return (
            <div key={idx} className="mb-6">
              <h3 className="text-white font-bold text-lg mb-3">
                {number}. {title.trim()}
              </h3>
              <div className="pl-4 space-y-2">
                {paragraphs.map((para, i) => (
                  <p key={`para-${i}`} className="text-white/90 leading-relaxed">
                    {para}
                  </p>
                ))}
                {bulletPoints.length > 0 && (
                  <ul className="list-disc list-outside space-y-2 ml-6 mt-3">
                    {bulletPoints.map((point, i) => (
                      <li key={`bullet-${i}`} className="text-white/90 leading-relaxed">
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        }

        // Regular text (intro/outro paragraph)
        return (
          <p key={idx} className="text-white/90 leading-relaxed">
            {trimmedSection}
          </p>
        );
      })}
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.sender === 'bot';

  return (
    <div className={`flex items-start gap-3 ${isBot ? '' : 'flex-row-reverse'}`}>
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isBot
            ? 'bg-gradient-to-br from-[#0D9488]/30 to-[#0F9D58]/30 border border-white/20'
            : 'bg-gradient-to-br from-[#334155]/50 to-[#475569]/50 border border-white/20'
        }`}
      >
        {isBot ? (
          <Scale className="w-5 h-5 text-white/80" />
        ) : (
          <User className="w-5 h-5 text-white/80" />
        )}
      </div>
      <div
        className={`backdrop-blur-md border rounded-2xl p-4 max-w-[80%] ${
          isBot
            ? 'bg-white/10 border-white/20 rounded-tl-sm'
            : 'bg-[#334155]/30 border-white/30 rounded-tr-sm'
        }`}
      >
        {isBot ? formatBotMessage(message.text) : (
          <p className="text-white/90 whitespace-pre-wrap">{message.text}</p>
        )}

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-white/80 flex items-center gap-2">
              <FileText className="h-3 w-3" />
              Sources ({message.sources.length})
            </p>
            {message.sources.map((source, idx) => (
              <div
                key={idx}
                className="bg-black/20 backdrop-blur-sm rounded-lg p-3 text-xs border border-white/10"
              >
                <p className="text-white/70 mb-1">
                  <span className="font-semibold text-white">Document {source.document_id}:</span>{' '}
                  {source.text_preview}
                </p>
                {source.metadata && (
                  <p className="text-white/50 text-[10px] mt-1">
                    {source.metadata}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="text-white/40 text-xs mt-2">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}
