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
  // Split by numbered sections (e.g., "1. Title", "2. Title")
  const sections = text.split(/(?=\d+\.\s+[A-Z])/);

  return (
    <>
      {sections.map((section, idx) => {
        // Check if this section starts with a number
        const match = section.match(/^(\d+)\.\s+([^\n]+)([\s\S]*)/);

        if (match) {
          const [, number, title, content] = match;

          // Split content into bullet points (lines starting with -)
          const lines = content.trim().split('\n').filter(line => line.trim());
          const bulletPoints: string[] = [];
          const regularText: string[] = [];

          lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('-')) {
              bulletPoints.push(trimmed.substring(1).trim());
            } else if (trimmed) {
              regularText.push(trimmed);
            }
          });

          return (
            <div key={idx} className="mb-4">
              <h3 className="text-white font-bold mb-2">
                {number}. {title.trim()}
              </h3>
              <div className="pl-4 space-y-2">
                {regularText.map((text, i) => (
                  <p key={`text-${i}`} className="text-white/90">{text}</p>
                ))}
                {bulletPoints.length > 0 && (
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    {bulletPoints.map((point, i) => (
                      <li key={`bullet-${i}`} className="text-white/90">{point}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        }

        // Regular text (intro paragraph)
        return section.trim() ? (
          <p key={idx} className="text-white/90 mb-4 whitespace-pre-wrap">
            {section.trim()}
          </p>
        ) : null;
      })}
    </>
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
