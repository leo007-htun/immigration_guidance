import { useState, useRef, useEffect } from 'react';
import { Send, Scale, FileText, MessageSquare, LogOut } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { chatApi, SourceDocument } from '../services/chatApi';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  sources?: SourceDocument[];
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Welcome 🤗! Share your case and I’ll deliver precise, rule-matched guidance instantly, \nTrust me! I'm smarter than you think 😉",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (inputValue.trim() === '') return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    const userQuestion = inputValue;
    setInputValue('');
    setIsTyping(true);
    setError('');

    try {
      // Call LEANN + OpenAI backend
      const response = await chatApi.sendMessage(userQuestion);

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response.response,
        sender: 'bot',
        timestamp: new Date(),
        sources: response.sources,
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
      console.error('Chat error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLogout = () => {
    window.location.reload();
  };

  return (
    <div className="w-full max-w-4xl h-[600px] backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="backdrop-blur-md bg-white/5 border-b border-white/10 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-[#0D9488]/20 to-[#0F9D58]/20 border border-white/20">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white">Immigration AI Assistant</h1>
              <p className="text-white/60 text-sm">Get general immigration information and guidance</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-3 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 p-4 border-b border-white/10">
        <button className="px-4 py-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white/80 text-sm hover:bg-white/20 transition-all flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Contract Review
        </button>
        <button className="px-4 py-2 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white/80 text-sm hover:bg-white/20 transition-all flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Legal Information
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0D9488]/30 to-[#0F9D58]/30 border border-white/20 flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5 text-white/80" />
            </div>
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl rounded-tl-sm p-4 max-w-[80%]">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce animation-delay-200"></div>
                <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce animation-delay-400"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="backdrop-blur-md bg-white/5 border-t border-white/10 p-4">
        {/* Error Message */}
        {error && (
          <div className="mb-3 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl p-3 text-red-200 text-sm">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your legal question..."
            className="flex-1 px-4 py-3 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />
          <button
            onClick={handleSend}
            disabled={inputValue.trim() === ''}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0F9D58] text-white hover:from-[#0F766E] hover:to-[#0C8E4F] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-white/40 text-xs mt-3 text-center">
          This chatbot provides general legal information only and does not constitute legal advice.
        </p>
      </div>
    </div>
  );
}
