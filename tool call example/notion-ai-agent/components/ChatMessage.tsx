import React from 'react';
import { Message, Sender } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAI = message.sender === Sender.AI;
  
  return (
    <div className={`flex w-full mb-6 ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[85%] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center shadow-sm ${
          isAI ? 'bg-gradient-to-br from-indigo-500 to-purple-600 mr-3' : 'bg-gray-700 ml-3'
        }`}>
          {isAI ? (
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          ) : (
             <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
             </svg>
          )}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}>
          <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed overflow-hidden ${
            isAI 
              ? 'bg-white text-gray-800 border border-gray-100' 
              : 'bg-blue-600 text-white'
          }`}>
             {message.isThinking ? (
                <div className="flex items-center space-x-2 text-gray-500 italic text-sm">
                   <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   <span>Thinking...</span>
                </div>
             ) : (
                <div className="markdown-body">
                   <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        // Links
                        a: ({node, ...props}) => (
                           <a {...props} target="_blank" rel="noopener noreferrer" className={`underline font-medium break-all ${isAI ? 'text-blue-600 hover:text-blue-800' : 'text-white hover:text-gray-200'}`} />
                        ),
                        // Headings
                        h1: ({node, ...props}) => <h1 {...props} className="text-xl font-bold mb-2 mt-4 first:mt-0" />,
                        h2: ({node, ...props}) => <h2 {...props} className="text-lg font-bold mb-2 mt-3 first:mt-0" />,
                        h3: ({node, ...props}) => <h3 {...props} className="text-base font-bold mb-1 mt-2 first:mt-0" />,
                        // Lists
                        ul: ({node, ...props}) => <ul {...props} className="list-disc ml-4 mb-2 space-y-1" />,
                        ol: ({node, ...props}) => <ol {...props} className="list-decimal ml-4 mb-2 space-y-1" />,
                        li: ({node, ...props}) => <li {...props} className="pl-1" />,
                        // Paragraphs
                        p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0" />,
                        // Text styles
                        strong: ({node, ...props}) => <strong {...props} className="font-bold" />,
                        em: ({node, ...props}) => <em {...props} className="italic" />,
                        // Blockquotes
                        blockquote: ({node, ...props}) => (
                           <blockquote {...props} className={`border-l-4 pl-3 my-2 italic ${isAI ? 'border-gray-300 text-gray-600' : 'border-blue-400 text-blue-100'}`} />
                        ),
                        // Code blocks
                        code: ({node, inline, className, children, ...props}: any) => {
                           const match = /language-(\w+)/.exec(className || '');
                           return inline ? (
                              <code {...props} className={`px-1.5 py-0.5 rounded text-xs font-mono font-medium ${isAI ? 'bg-gray-100 text-pink-600 border border-gray-200' : 'bg-blue-700 text-white border border-blue-500'}`}>{children}</code>
                           ) : (
                              <pre {...props} className={`p-3 rounded-lg overflow-x-auto my-3 text-xs font-mono leading-relaxed ${isAI ? 'bg-gray-900 text-gray-100' : 'bg-blue-800 text-gray-100 shadow-inner'}`}>
                                 <code className={className}>{children}</code>
                              </pre>
                           );
                        },
                        // Tables
                        table: ({node, ...props}) => <div className="overflow-x-auto my-3"><table {...props} className={`min-w-full text-left text-sm border-collapse ${isAI ? 'border-gray-300' : 'border-blue-400'}`} /></div>,
                        th: ({node, ...props}) => <th {...props} className={`p-2 border-b-2 font-semibold ${isAI ? 'border-gray-200 bg-gray-50' : 'border-blue-400 bg-blue-700'}`} />,
                        td: ({node, ...props}) => <td {...props} className={`p-2 border-b ${isAI ? 'border-gray-100' : 'border-blue-500'}`} />,
                        hr: ({node, ...props}) => <hr {...props} className={`my-4 border-t ${isAI ? 'border-gray-200' : 'border-blue-400'}`} />
                      }}
                   >
                      {message.text}
                   </ReactMarkdown>
                </div>
             )}
          </div>

          {/* Tool Calls Visualization */}
          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="mt-2 space-y-2 w-full max-w-lg">
              {message.toolCalls.map((tool, idx) => (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-blue-600 font-mono">{tool.name}</span>
                    <span className="text-gray-400">{tool.result ? 'Completed' : 'Running'}</span>
                  </div>
                  <div className="font-mono text-gray-500 bg-gray-100 p-2 rounded truncate">
                    args: {JSON.stringify(tool.args)}
                  </div>
                  {tool.result && (
                     <details className="mt-1 group">
                        <summary className="cursor-pointer text-gray-400 hover:text-gray-600 select-none">Show Result</summary>
                        <pre className="mt-1 p-2 bg-gray-800 text-green-400 rounded overflow-x-auto max-h-32">
                           {JSON.stringify(tool.result, null, 2)}
                        </pre>
                     </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};