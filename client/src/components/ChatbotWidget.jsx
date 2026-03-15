import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';
import './ChatbotWidget.css';

const ChatbotWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([
        { role: 'bot', content: 'Hello! I am your Librarian AI. How can I help you today?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e, customMessage = null) => {
        if (e) e.preventDefault();
        const messageToSend = customMessage || message;
        if (!messageToSend.trim() || isLoading) return;

        const userMessage = { role: 'user', content: messageToSend };
        setMessages(prev => [...prev, userMessage]);
        if (!customMessage) setMessage('');
        setIsLoading(true);

        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/ai/chat`, {
                message: messageToSend,
                history: messages.slice(-10) // Send the last 10 messages for context
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                setMessages(prev => [...prev, { role: 'bot', content: response.data.reply }]);
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            setMessages(prev => [...prev, { role: 'bot', content: 'Sorry, I am having trouble connecting right now. Please try again later.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const clearChat = () => {
        setMessages([{ role: 'bot', content: 'Hello! I am your Librarian AI. How can I help you today?' }]);
    };

    const quickActions = [
        { label: "📚 Recommend a book", query: "Can you recommend a good book?" },
        { label: "🔍 Search Authors", query: "Who are your most popular authors?" },
        { label: "💡 How to borrow?", query: "How do I borrow a book from this library?" },
    ];

    return (
        <div className="chatbot-widget">
            {!isOpen && (
                <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>
                    <MessageCircle size={30} />
                </button>
            )}

            {isOpen && (
                <div className="chat-panel">
                    <div className="chat-header">
                        <div className="flex items-center gap-2">
                            <Bot size={20} className="text-purple-400" />
                            <h3>Librarian AI</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                className="clear-btn text-xs text-gray-400 hover:text-white transition-colors"
                                onClick={clearChat}
                                title="Clear Chat"
                            >
                                Clear
                            </button>
                            <button className="close-btn" onClick={() => setIsOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.role}`}>
                                {msg.content}
                            </div>
                        ))}

                        {messages.length === 1 && (
                            <div className="quick-actions grid grid-cols-1 gap-2 mt-2">
                                {quickActions.map((action, idx) => (
                                    <button
                                        key={idx}
                                        className="action-chip text-left text-sm p-3 rounded-xl border border-gray-200 bg-white hover:bg-purple-50 hover:border-purple-200 transition-all text-gray-700"
                                        onClick={() => handleSendMessage(null, action.query)}
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {isLoading && (
                            <div className="message bot">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chat-input-area" onSubmit={handleSendMessage}>
                        <input
                            type="text"
                            placeholder="Ask me anything..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={isLoading}
                        />
                        <button type="submit" className="send-btn" disabled={isLoading || !message.trim()}>
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ChatbotWidget;
