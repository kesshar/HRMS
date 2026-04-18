import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import API from '../services/api';
import { format } from 'date-fns';

const Chat = () => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [employees, setEmployees] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showGroupChatModal, setShowGroupChatModal] = useState(false);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const SERVER_ORIGIN = (() => {
    const baseURL = API?.defaults?.baseURL;
    if (!baseURL) return window.location.origin.replace('5173', '5000');
    try {
      return new URL(baseURL).origin;
    } catch {
      return baseURL.replace(/\/api\/?$/, '');
    }
  })();

  const baseURL = (API?.defaults?.baseURL || '').replace(/\/api\/?$/, '') || SERVER_ORIGIN;

  useEffect(() => {
    const newSocket = io(SERVER_ORIGIN);
    setSocket(newSocket);

    newSocket.on('receive-message', (data) => {
      if (selectedChat && data.chatId === selectedChat._id && data.message) {
        setMessages(prev => {
          // Prevent duplicates from same event
          if (prev.find(m => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
      }
      updateChatsList();
    });

    newSocket.on('user-typing', (data) => {
      if (selectedChat && data.chatId === selectedChat._id) {
        setTypingUsers(prev => [...prev.filter(u => u !== data.userName), data.userName]);
      }
    });

    newSocket.on('user-stop-typing', (data) => {
      if (selectedChat && data.chatId === selectedChat._id) {
        setTypingUsers(prev => prev.filter(u => u !== data.userName));
      }
    });

    return () => newSocket.close();
  }, [selectedChat, SERVER_ORIGIN]);

  useEffect(() => {
    fetchChats();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
      if (socket) {
        socket.emit('join-chat', selectedChat._id);
      }
    }
  }, [selectedChat, socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChats = async () => {
    try {
      const response = await API.get('/chat/');
      const filteredChats = response.data.filter(chat => !chat.linkedReport);
      setChats(filteredChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await API.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchMessages = async (chatId) => {
    try {
      const response = await API.get(`/chat/${chatId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const updateChatsList = () => {
    fetchChats();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createOneOnOneChat = async (participantId) => {
    try {
      const userRole = localStorage.getItem('userRole')?.toUpperCase();
      const isAdmin = userRole === 'ADMIN' || userRole === 'HR';

      const response = await API.post('/chat/one-on-one', {
        participantId,
        isAdminChat: isAdmin
      });
      setSelectedChat(response.data);
      setShowNewChatModal(false);
      fetchChats();
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const createAdminChat = async () => {
    try {
      const myId = localStorage.getItem('userId');
      const response = await API.post('/chat/one-on-one', {
        participantId: myId,
        isAdminChat: true
      });
      setSelectedChat(response.data);
      fetchChats();
    } catch (error) {
      console.error('Error creating admin chat:', error);
    }
  };

  const createGroupChat = async () => {
    try {
      const response = await API.post('/chat/group', { name: groupName, participants: selectedParticipants });
      setSelectedChat(response.data);
      setShowGroupChatModal(false);
      setGroupName('');
      setSelectedParticipants([]);
      fetchChats();
    } catch (error) {
      console.error('Error creating group chat:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const response = await API.post('/chat/message', { chatId: selectedChat._id, content: newMessage });
      if (response.data?.message) {
        if (socket) {
          socket.emit('send-message', {
            chatId: selectedChat._id,
            message: response.data.message
          });
        }
        setMessages(prev => [...prev, response.data.message]);
      }
      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTyping = () => {
    if (!isTyping && socket && selectedChat) {
      setIsTyping(true);
      socket.emit('typing', {
        chatId: selectedChat._id,
        userName: 'You'
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socket && selectedChat) {
        socket.emit('stop-typing', {
          chatId: selectedChat._id,
          userName: 'You'
        });
      }
      setIsTyping(false);
    }, 1000);
  };

  const getChatName = (chat) => {
    if (!chat) return 'Unknown';
    if (chat.linkedReport) {
      return `Report: ${chat.linkedReport.reason || 'Issue'}`;
    }
    if (chat.isAdminChat) {
      const userRole = localStorage.getItem('userRole')?.toUpperCase();
      if (userRole === 'ADMIN' || userRole === 'HR') {
        return chat.participants?.[0]?.name || 'Unknown Employee';
      }
      return 'HR / Admin Support';
    }
    if (chat.isGroupChat) {
      return chat.groupName || 'Unnamed Group';
    }
    const currentUserId = localStorage.getItem('userId');
    const otherParticipant = chat.participants?.find(p => p._id !== currentUserId);
    return otherParticipant?.name || 'Unknown User';
  };

  const getProfileImageValue = (person) => {
    return person?.profilePic || person?.profileImage || person?.avatar || person?.photo || null;
  };

  const getChatImage = (chat) => {
    if (!chat) return null;
    if (chat.isGroupChat) {
      return GROUP_AVATAR_URL;
    }
    if (chat.isAdminChat) {
      const userRole = localStorage.getItem('userRole')?.toUpperCase();
      if (userRole === 'ADMIN' || userRole === 'HR') {
        return resolveProfileImageUrl(getProfileImageValue(chat.participants?.[0]));
      }
      return HR_AVATAR_URL;
    }
    const currentUserId = localStorage.getItem('userId');
    const otherParticipant = chat.participants?.find(p => p._id !== currentUserId);
    const dp =
      resolveProfileImageUrl(getProfileImageValue(otherParticipant)) ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.name || 'User')}`;
    return dp;
  };

  const resolveProfileImageUrl = (profileImage) => {
    if (!profileImage) return null;
    const value = String(profileImage).trim().replace(/\\/g, '/');
    if (!value) return null;
    if (/^(https?:|data:|blob:)/i.test(value)) return value;
    const path = value.startsWith('/') ? value : `/${value}`;
    return `${baseURL}${path}`;
  };

  const svgToDataUrl = (svg) => {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const makeTextAvatarUrl = ({ text, bg, fg }) => {
    return svgToDataUrl(
      `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
        <rect width="40" height="40" rx="20" fill="${bg}"/>
        <text x="20" y="22" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial" font-size="${text.length > 1 ? 14 : 18}" font-weight="700" fill="${fg}">${text}</text>
      </svg>`
    );
  };

  const GROUP_AVATAR_URL = makeTextAvatarUrl({ text: 'G', bg: '#4F46E5', fg: '#FFFFFF' });
  const HR_AVATAR_URL = makeTextAvatarUrl({ text: 'HR', bg: '#EF4444', fg: '#FFFFFF' });

  const getInitials = (name) => {
    const safe = String(name || '').trim();
    if (!safe) return '?';
    const parts = safe.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || '?';
    const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : '';
    return `${first}${second}`.toUpperCase();
  };

  const Avatar = ({ src, name, alt, className, fallbackClassName }) => {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
      setFailed(false);
    }, [src]);

    if (!src || failed) {
      return (
        <div
          className={fallbackClassName || className}
          aria-label={alt || name || 'avatar'}
          title={name || alt}
        >
          {getInitials(name || alt)}
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={alt || name || 'avatar'}
        title={name || alt}
        className={`${className} bg-white`}
        onError={() => setFailed(true)}
      />
    );
  };

  const getMessageSender = (message) => {
    const senderId = message?.sender?._id || message?.sender;
    if (!senderId) return null;
    if (message?.sender && typeof message.sender === 'object') return message.sender;
    return selectedChat?.participants?.find(p => p._id === senderId) || null;
  };

  const getMessageSenderName = (message) => {
    if (selectedChat?.isAdminChat) {
      const role = localStorage.getItem('userRole')?.toUpperCase();
      const senderId = message?.sender?._id || message?.sender;
      if (role !== 'ADMIN' && role !== 'HR' && senderId !== localStorage.getItem('userId')) {
         return 'HR / Admin Support';
      }
    }
    return getMessageSender(message)?.name || getChatName(selectedChat);
  };

  const getMessageSenderImage = (message) => {
    if (selectedChat?.isAdminChat) {
      const role = localStorage.getItem('userRole')?.toUpperCase();
      const senderId = message?.sender?._id || message?.sender;
      if (role !== 'ADMIN' && role !== 'HR' && senderId !== localStorage.getItem('userId')) {
         return HR_AVATAR_URL;
      }
    }
    const sender = getMessageSender(message);
    return resolveProfileImageUrl(getProfileImageValue(sender));
  };

  const isMyMessage = (message) => {
    const senderId = message?.sender?._id || message?.sender;
    const currentUserId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole')?.toUpperCase();

    if (senderId && senderId === currentUserId) return true;

    // For admins in an admin chat, treat any message NOT from the employee as "mine" (sent by HR/Admin)
    if (selectedChat?.isAdminChat && (userRole === 'ADMIN' || userRole === 'HR')) {
       const employeeId = selectedChat.participants?.[0]?._id;
       // We assume missing senderId belongs to Admin due to population restrictions with Organization schemas
       if (!senderId || senderId !== employeeId) {
          return true;
       }
    }
    return false;
  };

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Chat List Sidebar */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col shadow-sm">
        {/* Sidebar Header */}
        <div className="px-5 py-4 border-b border-slate-100 bg-white">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Messages</h2>
            <div className="flex items-center gap-1.5">
              {/* New Chat */}
              <button
                onClick={() => setShowNewChatModal(true)}
                className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-150 shadow-sm"
                title="New Chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              {/* Group Chat */}
              <button
                onClick={() => setShowGroupChatModal(true)}
                className="w-8 h-8 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors duration-150 shadow-sm"
                title="Create Group Chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </button>
              {/* HR Support */}
              {(localStorage.getItem('userRole')?.toUpperCase() !== 'ADMIN' && localStorage.getItem('userRole')?.toUpperCase() !== 'HR') && (
                <button
                  onClick={createAdminChat}
                  className="w-8 h-8 flex items-center justify-center bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors duration-150 shadow-sm"
                  title="Contact HR / Admin"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{chats.length} conversation{chats.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {chats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => setSelectedChat(chat)}
              className={`flex items-center px-4 py-3 cursor-pointer transition-colors duration-150 group
                ${selectedChat?._id === chat._id
                  ? 'bg-blue-50 border-l-2 border-blue-600'
                  : 'hover:bg-slate-50 border-l-2 border-transparent'
                }`}
            >
              <div className="relative flex-shrink-0 self-start">
                <Avatar
                  src={getChatImage(chat)}
                  name={getChatName(chat)}
                  alt={getChatName(chat)}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                  fallbackClassName="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-semibold ring-2 ring-white shadow-sm select-none"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
              </div>
              <div className="flex-1 ml-3 min-w-0 pt-0.5">
                <div className="flex justify-between items-baseline">
                  <h3 className={`text-sm font-semibold truncate ${selectedChat?._id === chat._id ? 'text-blue-700' : 'text-slate-800'}`}>
                    {getChatName(chat)}
                  </h3>
                  {chat.lastMessage?.timestamp && !isNaN(new Date(chat.lastMessage.timestamp)) && (
                    <span className="text-xs text-slate-400 ml-2 flex-shrink-0">
                      {format(new Date(chat.lastMessage.timestamp), 'HH:mm')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {chat.lastMessage ? chat.lastMessage.content : 'No messages yet'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-3.5 shadow-sm flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <Avatar
                    src={getChatImage(selectedChat)}
                    name={getChatName(selectedChat)}
                    alt={getChatName(selectedChat)}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 shadow-sm"
                    fallbackClassName="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-sm font-semibold ring-2 ring-slate-100 shadow-sm select-none"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 leading-tight">{getChatName(selectedChat)}</h3>
                  {typingUsers.length > 0 ? (
                    <p className="text-xs text-blue-500 mt-0.5 italic">
                      {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-500 mt-0.5">Online</p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3"
              style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px', backgroundColor: '#f8fafc' }}>
              {messages.map((message, index) => {
                const isMine = isMyMessage(message);
                return (
                  <div
                    key={index}
                    className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isMine && (
                      <Avatar
                        src={getMessageSenderImage(message)}
                        name={getMessageSenderName(message)}
                        alt="sender"
                        className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-1 shadow-sm"
                        fallbackClassName="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-semibold flex-shrink-0 mb-1 shadow-sm select-none"
                      />
                    )}
                    <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-xs lg:max-w-md`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl shadow-sm
                          ${isMine
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm'
                          }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                      {message.timestamp && !isNaN(new Date(message.timestamp)) && (
                        <p className="text-xs text-slate-400 mt-1 px-1">
                          {format(new Date(message.timestamp), 'HH:mm')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-slate-200 px-5 py-3.5 flex-shrink-0">
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-400 transition-all duration-150">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message…"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg transition-colors duration-150 shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50"
            style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
            <div className="text-center bg-white rounded-2xl shadow-sm border border-slate-100 px-12 py-10 max-w-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-1">No conversation selected</h3>
              <p className="text-sm text-slate-400">Pick a chat from the sidebar or start a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-96 max-h-[28rem] flex flex-col overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Start New Chat</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-3 py-2">
              {employees.map((employee) => (
                <div
                  key={employee._id}
                  onClick={() => createOneOnOneChat(employee._id)}
                  className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors duration-100"
                >
                  <Avatar
                    src={resolveProfileImageUrl(getProfileImageValue(employee))}
                    name={employee.name}
                    alt={employee.name}
                    className="w-9 h-9 rounded-full object-cover shadow-sm ring-2 ring-white"
                    fallbackClassName="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-semibold shadow-sm ring-2 ring-white select-none"
                  />
                  <span className="text-sm font-medium text-slate-700">{employee.name}</span>
                </div>
              ))}
            </div>
            <div className="px-6 py-3 border-t border-slate-100">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="w-full px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-150"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Chat Modal */}
      {showGroupChatModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-96 overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-800">Create Group Chat</h3>
              <button
                onClick={() => { setShowGroupChatModal(false); setGroupName(''); setSelectedParticipants([]); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 pt-4 pb-2">
              <input
                type="text"
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 text-slate-800 placeholder-slate-400 transition-all duration-150"
              />
            </div>
            <div className="max-h-48 overflow-y-auto px-3 py-2">
              {employees.map((employee) => (
                <label key={employee._id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors duration-100">
                  <input
                    type="checkbox"
                    checked={selectedParticipants.includes(employee._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedParticipants([...selectedParticipants, employee._id]);
                      } else {
                        setSelectedParticipants(selectedParticipants.filter(id => id !== employee._id));
                      }
                    }}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <Avatar
                    src={resolveProfileImageUrl(getProfileImageValue(employee))}
                    name={employee.name}
                    alt={employee.name}
                    className="w-8 h-8 rounded-full object-cover shadow-sm"
                    fallbackClassName="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[11px] font-semibold shadow-sm select-none"
                  />
                  <span className="text-sm font-medium text-slate-700">{employee.name}</span>
                </label>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-2">
              <button
                onClick={createGroupChat}
                disabled={!groupName || selectedParticipants.length < 2}
                className="flex-1 px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg transition-colors duration-150 shadow-sm"
              >
                Create Group
              </button>
              <button
                onClick={() => {
                  setShowGroupChatModal(false);
                  setGroupName('');
                  setSelectedParticipants([]);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors duration-150"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
