import React, { useState, useRef, useEffect } from 'react';
import { User, ChatMessage } from '../types';
import Icon from './Icon';

interface AIChatProps {
  currentUser: User;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

const simpleMarkdownToHtml = (text: string) => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // bold
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // italic
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 text-white p-2 rounded-md text-sm"><code>$1</code></pre>') // code block
        .replace(/`(.*?)`/g, '<code class="bg-gray-200 text-red-600 px-1 rounded-sm">$1</code>') // inline code
        .replace(/\n/g, '<br />'); // newlines
};


const AIChat: React.FC<AIChatProps> = ({ currentUser, messages, onSendMessage, onClose, isLoading }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:right-8 w-full max-w-sm h-3/4 max-h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-30 border border-gray-200 animate-fade-in-up">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-brand-secondary to-brand-primary text-white rounded-t-2xl flex-shrink-0">
        <div className="flex items-center">
            <Icon name="ai" className="w-6 h-6 mr-3" />
            <h3 className="font-bold text-lg">Assistente IA</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20">
          <Icon name="close" className="w-6 h-6" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isUser = msg.authorId === currentUser.id;
            const isAI = msg.authorId === 'ai';
            return (
              <div key={msg.id} className={`flex items-end gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {isAI && (
                    <div className="w-8 h-8 rounded-full flex-shrink-0 bg-brand-dark flex items-center justify-center">
                        <Icon name="ai" className="w-5 h-5 text-white" />
                    </div>
                )}
                <div className={`max-w-xs p-3 rounded-2xl ${isUser ? 'bg-brand-secondary text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                  <p className="text-sm" dangerouslySetInnerHTML={{ __html: simpleMarkdownToHtml(msg.content) }}></p>
                  <p className={`text-xs mt-1 ${isUser ? 'text-gray-300' : 'text-gray-500'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          {isLoading && (
             <div className="flex items-end gap-3 justify-start">
                <div className="w-8 h-8 rounded-full flex-shrink-0 bg-brand-dark flex items-center justify-center">
                    <Icon name="ai" className="w-5 h-5 text-white" />
                </div>
                <div className="max-w-xs p-3 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none">
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white rounded-b-2xl flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Pergunte algo à IA..."
            className="flex-1 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-primary"
            autoComplete="off"
            disabled={isLoading}
          />
          <button type="submit" className="bg-brand-secondary text-white rounded-full p-3 hover:bg-brand-primary transition-colors disabled:bg-gray-400" disabled={isLoading}>
            <Icon name="send" className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChat;