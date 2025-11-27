import { useState, useEffect, useRef } from 'react';
import { chatApi, ChatResponse, SourceDocument } from '../services/chatApi';
import { Button } from './ui/button';
import { MessageCircle, Send, Loader2, FileText, LogOut, User } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceDocument[];
  timestamp: Date;
}

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response: ChatResponse = await chatApi.sendMessage(input);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        sources: response.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      console.error('Chat error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1F3A] via-[#1E3A8A] to-[#1F4E79] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#0D9488] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#1E3A8A] rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#0A3D62] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#0D9488] to-[#0A3D62] rounded-xl shadow-lg">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Legal Assistant</h1>
              <p className="text-xs text-white/60">Powered by LEANN + AI</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xl transition-all"
            size="sm"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* Chat Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-6 h-[calc(100vh-120px)] flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageCircle className="h-20 w-20 text-white/20 mb-6" />
              <h2 className="text-2xl font-bold text-white mb-2">Welcome to Legal Assistant</h2>
              <p className="text-white/60 max-w-md">
                Ask any legal questions and I'll search through indexed documents to provide accurate answers.
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-[#0D9488] to-[#0A3D62] text-white shadow-lg'
                      : 'bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-lg'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-white/20'
                          : 'bg-gradient-to-br from-purple-500 to-indigo-600'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <MessageCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

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
                              className="bg-black/20 backdrop-blur-sm rounded-lg p-3 text-xs"
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

                      <p className="text-[10px] text-white/40 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-[#0D9488] animate-spin" />
                  <p className="text-white/70 text-sm">Searching documents and generating response...</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-xl p-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="relative">
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl overflow-hidden">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Ask a legal question..."
              disabled={loading}
              rows={3}
              className="w-full bg-transparent text-white placeholder-white/40 px-6 py-4 resize-none focus:outline-none disabled:opacity-50"
            />
            <div className="px-4 pb-4 flex items-center justify-between">
              <p className="text-xs text-white/40">Press Enter to send, Shift+Enter for new line</p>
              <Button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-gradient-to-r from-[#0D9488] to-[#0A3D62] hover:from-[#0B7A70] hover:to-[#083451] text-white border-0 shadow-lg transition-all disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
