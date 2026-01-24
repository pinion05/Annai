import React, { useState, useEffect, useRef } from 'react';
import { GeminiAgent } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import Settings from './components/Settings';
import { Message, Sender, NotionConfig } from './types';

const INITIAL_CONFIG: NotionConfig = {
  apiKey: '',
  proxyUrl: 'https://corsproxy.io/?',
};

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: Sender.AI,
      text: "Hello! I'm your Notion AI Agent. \n\nPlease set your Notion API Key in the settings to get started. I can search pages, create content, and organize your workspace.",
      timestamp: Date.now(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [config, setConfig] = useState<NotionConfig>(() => {
    const saved = localStorage.getItem('notionConfig');
    return saved ? JSON.parse(saved) : INITIAL_CONFIG;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const agentRef = useRef<GeminiAgent | null>(null);

  useEffect(() => {
    localStorage.setItem('notionConfig', JSON.stringify(config));
    if (config.apiKey) {
      agentRef.current = new GeminiAgent(config);
    }
  }, [config]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!config.apiKey) {
      setIsSettingsOpen(true);
      return;
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: Sender.USER,
      text: inputText,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    // Placeholder for AI response
    const aiMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: aiMsgId,
      sender: Sender.AI,
      text: '',
      timestamp: Date.now(),
      isThinking: true,
      toolCalls: []
    }]);

    try {
      if (!agentRef.current) agentRef.current = new GeminiAgent(config);
      
      const { text, toolCalls } = await agentRef.current.sendMessage(
        inputText,
        (name, args) => {
            // Real-time tool call updates (optional visualization)
            setMessages(prev => prev.map(m => {
                if (m.id === aiMsgId) {
                    return {
                        ...m,
                        toolCalls: [...(m.toolCalls || []), { name, args }]
                    };
                }
                return m;
            }));
        }
      );

      setMessages(prev => prev.map(m => {
        if (m.id === aiMsgId) {
          return {
            ...m,
            text: text,
            isThinking: false,
            toolCalls: toolCalls // Update with final results
          };
        }
        return m;
      }));
    } catch (error: any) {
      console.error(error);
      setMessages(prev => prev.map(m => {
        if (m.id === aiMsgId) {
          return {
            ...m,
            text: `Error: ${error.message || 'Something went wrong.'}`,
            isThinking: false
          };
        }
        return m;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-gray-900 p-2 rounded-lg">
             <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
             </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Notion Agent</h1>
            <p className="text-xs text-gray-500">Powered by Gemini 3 Pro</p>
          </div>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors"
          title="Settings"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2">
        <div className="max-w-3xl mx-auto w-full">
           {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
           ))}
           <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={config.apiKey ? "Ask me to find, create, or update pages in Notion..." : "Please configure your Notion API Key in settings."}
            className="w-full pl-5 pr-14 py-4 bg-gray-50 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none outline-none transition-all shadow-sm text-gray-800 disabled:opacity-60 disabled:cursor-not-allowed h-16 max-h-48 overflow-y-auto"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputText.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {isLoading ? (
               <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
            ) : (
              <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          AI can make mistakes. Check important info.
        </p>
      </div>

      {/* Settings Modal */}
      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={setConfig}
      />
    </div>
  );
}

export default App;