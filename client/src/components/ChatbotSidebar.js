import React, { useState } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

const ChatbotSidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputMessage, setInputMessage] = useState('');
    // Dummy initial messages
    const [messages, setMessages] = useState([
        { id: 1, sender: 'bot', text: 'Hello! I can help you analyze your transaction data. What would you like to know?' }
    ]);

    const toggleSidebar = () => setIsOpen(!isOpen);

    const handleSend = (e) => {
        e.preventDefault();
        if (!inputMessage.trim()) return;

        // Add user message
        const newUserMsg = { id: Date.now(), sender: 'user', text: inputMessage };
        setMessages(prev => [...prev, newUserMsg]);
        setInputMessage('');

        // Simulate bot response after a short delay
        setTimeout(() => {
            const botResponse = { id: Date.now() + 1, sender: 'bot', text: "I'm just a UI demo for now, but I look great doing it!" };
            setMessages(prev => [...prev, botResponse]);
        }, 1000);
    };

    return (
        <>
            {/* Floating Toggle Button (visible when closed) */}
            {!isOpen && (
                <button
                    onClick={toggleSidebar}
                    className="fixed bottom-8 right-8 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all z-40 flex items-center justify-center group"
                    aria-label="Open Chat"
                    title="Open AI Assistant"
                >
                    <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />
                </button>
            )}

            {/* Sidebar Panel - Squish Mode (Right Side) */}
            <div
                className={`bg-white shadow-xl border-l border-gray-200 flex flex-col transition-all duration-300 ease-in-out h-full overflow-hidden ${isOpen ? 'w-96 opacity-100 ml-6' : 'w-0 opacity-0 ml-0'
                    }`}
                style={{ flexShrink: 0 }} // Prevent sidebar from being squished itself
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 min-w-[24rem]">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Bot size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800">FinSight AI</h3>
                            <p className="text-xs text-green-600 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                Online
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 min-w-[24rem]">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.sender === 'user'
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                                    }`}
                            >
                                {msg.text}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 bg-white min-w-[24rem]">
                    <form onSubmit={handleSend} className="relative">
                        <input
                            type="text"
                            placeholder="Ask about your finances..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm transition-all"
                        />
                        <button
                            type="submit"
                            disabled={!inputMessage.trim()}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default ChatbotSidebar;
