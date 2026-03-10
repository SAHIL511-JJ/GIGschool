import { useState, useRef, useEffect } from 'react'
import { X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react'
import { aiApi, ChatMessage } from '@/api/ai'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

export function AiHelperWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Hi! 👋 I'm GigBot, your AI assistant. Ask me anything about GigSchool — how to post gigs, apply, chat, leave reviews, or anything else!" }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 200)
        }
    }, [isOpen])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: Message = { role: 'user', content: input.trim() }
        const updatedMessages = [...messages, userMessage]
        setMessages(updatedMessages)
        setInput('')
        setIsLoading(true)

        try {
            // Send only the conversation (excluding the initial greeting for API)
            const apiMessages: ChatMessage[] = updatedMessages
                .slice(1) // skip greeting
                .map(m => ({ role: m.role, content: m.content }))

            if (apiMessages.length === 0) return

            const response = await aiApi.helperChat(apiMessages)
            setMessages(prev => [...prev, { role: 'assistant', content: response.reply }])
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Sorry, I'm having trouble connecting right now. Please try again in a moment! 🔄"
            }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center group"
                    title="AI Helper"
                >
                    <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 animate-pulse" />
                </button>
            )}

            {/* Chat Panel */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[480px] max-h-[650px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-modal-in">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-sm">GigBot</h3>
                                <p className="text-purple-200 text-xs">AI Assistant</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[400px] max-h-[500px] modal-scrollbar">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}
                            >
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant'
                                    ? 'bg-purple-100 dark:bg-purple-900/40'
                                    : 'bg-orange-100 dark:bg-orange-900/40'
                                    }`}
                                >
                                    {msg.role === 'assistant'
                                        ? <Bot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                        : <User className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                                    }
                                </div>
                                <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'assistant'
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-md'
                                    : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-tr-md'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isLoading && (
                            <div className="flex gap-2.5 animate-fade-in">
                                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                                    <Bot className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-2xl rounded-tl-md">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 border-t border-gray-100 dark:border-gray-700 shrink-0">
                        <div className="flex gap-2">
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                                placeholder="Ask me anything..."
                                className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 border-0 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
