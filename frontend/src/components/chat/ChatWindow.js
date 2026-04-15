/**
 * ChatWindow Component
 * Real-time one-to-one chat using Socket.io
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, Loader2, MessageSquare, Package } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ChatWindow = ({ conversation: initialConv, onClose, product, seller }) => {
  const { user } = useAuth();
  const { socket, joinConversation, leaveConversation, sendMessage: socketSend, sendTyping, markRead } = useSocket();
  const [conversation, setConversation] = useState(initialConv);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typingTimer, setTypingTimer] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

  // Initialize conversation
  useEffect(() => {
    const init = async () => {
      try {
        let conv = conversation;
        if (!conv && product && seller) {
          const res = await api.post('/chat/conversation', {
            productId: product._id,
            sellerId: seller._id,
          });
          conv = res.data.conversation;
          setConversation(conv);
        }
        if (!conv) return;

        // Load messages
        const msgRes = await api.get(`/chat/messages/${conv._id}`);
        setMessages(msgRes.data.messages);
        setLoading(false);

        // Join socket room
        joinConversation(conv._id);
        markRead(conv._id);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error('Chat init error:', err);
        toast.error('Failed to load chat');
        setLoading(false);
      }
    };
    init();
    return () => {
      if (conversation?._id) leaveConversation(conversation._id);
    };
  }, []);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setTimeout(scrollToBottom, 50);
      if (msg.sender._id !== user._id && conversation?._id) {
        markRead(conversation._id);
      }
    };
    const handleTyping = ({ userId, isTyping: t }) => {
      if (userId !== user._id) setTyping(t);
    };
    socket.on('newMessage', handleNewMessage);
    socket.on('userTyping', handleTyping);
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userTyping', handleTyping);
    };
  }, [socket, user._id, conversation?._id]);

  useEffect(scrollToBottom, [messages]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || !conversation?._id || sending) return;
    setSending(true);
    setInput('');
    sendTyping(conversation._id, false);

    try {
      socketSend(conversation._id, content);
      // REST fallback if socket isn't connected
      if (!socket?.connected) {
        const res = await api.post('/chat/messages', { conversationId: conversation._id, content });
        setMessages(prev => [...prev, res.data.message]);
        setTimeout(scrollToBottom, 50);
      }
    } catch {
      toast.error('Failed to send message');
      setInput(content);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [input, conversation, sending, socket, socketSend, sendTyping]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!conversation?._id) return;
    sendTyping(conversation._id, true);
    if (typingTimer) clearTimeout(typingTimer);
    setTypingTimer(setTimeout(() => sendTyping(conversation._id, false), 1500));
  };

  const formatTime = (date) => {
    const d = new Date(date);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`;
    return format(d, 'dd MMM HH:mm');
  };

  const otherParticipant = conversation?.participants?.find?.(p =>
    (p._id || p).toString() !== user._id.toString()
  );

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 card shadow-soft flex flex-col animate-slide-up overflow-hidden"
      style={{ height: '500px' }}>

      {/* Header */}
      <div className="flex items-center gap-3 p-3.5 border-b border-slate-100 bg-gradient-to-r from-primary-50 to-white">
        <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
          <MessageSquare size={16} className="text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-slate-800 truncate">
            {otherParticipant?.name || seller?.name || 'Chat'}
          </p>
          {product && (
            <p className="text-[11px] text-slate-400 flex items-center gap-1 truncate">
              <Package size={10} /> {product.title}
            </p>
          )}
        </div>
        <button onClick={onClose}
          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700">
          <X size={16} />
        </button>
      </div>

      {/* Product preview */}
      {product && (
        <div className="flex items-center gap-2.5 px-3.5 py-2 bg-slate-50 border-b border-slate-100">
          <img
            src={product.images?.[0]?.url || ''}
            alt={product.title}
            className="w-10 h-10 rounded-lg object-cover bg-slate-200"
            onError={(e) => e.target.style.display='none'}
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">{product.title}</p>
            <p className="text-xs font-bold text-primary-600">₹{product.price?.toLocaleString('en-IN')}</p>
          </div>
          {product.isSold && (
            <span className="ml-auto badge bg-slate-200 text-slate-500 text-[10px]">SOLD</span>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={20} className="animate-spin text-primary-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-2">
              <MessageSquare size={20} className="text-primary-400" />
            </div>
            <p className="text-xs text-slate-400">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = (msg.sender?._id || msg.sender)?.toString() === user._id.toString();
            return (
              <div key={msg._id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                {!isOwn && (
                  <img
                    src={msg.sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.name || 'U')}&background=6366f1&color=fff&size=32`}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover shrink-0 mb-0.5"
                  />
                )}
                <div className={`max-w-[75%] ${isOwn ? 'chat-bubble-sent' : 'chat-bubble-received'} px-3 py-2`}>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className={`text-[10px] mt-0.5 ${isOwn ? 'text-primary-200' : 'text-slate-400'} text-right`}>
                    {formatTime(msg.createdAt)}
                    {isOwn && msg.isRead && ' ✓✓'}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {typing && (
          <div className="flex items-center gap-2">
            <div className="bg-white rounded-2xl rounded-tl-sm border border-slate-100 px-3 py-2 shadow-sm">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-100 flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 text-sm px-3.5 py-2.5 bg-slate-100 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-300 focus:bg-white transition-all max-h-24 placeholder-slate-400"
          style={{ minHeight: '42px' }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center
            hover:bg-primary-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
