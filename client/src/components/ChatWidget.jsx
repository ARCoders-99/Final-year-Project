import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { MessageCircle, X, Send, User as UserIcon, Circle, Image as ImageIcon, Pencil, ArrowLeft, FileText, Trash2, MoreVertical } from "lucide-react";
import axios from "axios";
import { initiateSocket, disconnectSocket, getSocket } from "../utils/socket";
import { addMessage, fetchMessages, fetchConversations, markMessagesAsRead, updateUserStatus, clearMessages, incrementUnread, resetUnread, resetAllUnread, handleReadMessage, updateMessage, setCurrentUserId, setMessagesRead, setActiveChatId, deleteMessageLocally, updateAssignment } from "../store/slices/messageSlice";
import { toggleMessagingPopup } from "../store/slices/popUpSlice";
import { format } from "date-fns";

const ChatWidget = () => {
  const [activeChat, setActiveChat] = useState(null); // User object for admin, admin info for user
  const [message, setMessage] = useState("");
  const [editingMessage, setEditingMessage] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const scrollRef = useRef();
  const imageInputRef = useRef();
  const pdfInputRef = useRef();

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { messages, conversations, loading, activeChatAssignedAdmin } = useSelector((state) => state.messages);
  const { messagingOpen: isOpen } = useSelector((state) => state.popup);

  const isAdmin = user?.role === "Admin";

  useEffect(() => {
    if (user?._id) {
      dispatch(setCurrentUserId(user._id));
      const socket = initiateSocket(user._id);

      socket.off("newMessage");
      socket.on("newMessage", (newMessage) => {
        console.log("RECEIVED NEW MESSAGE:", newMessage);
        dispatch(addMessage(newMessage));

        // If admin and message is from a new person, refresh conversations
        if (isAdmin && !conversations.some(c => c._id === newMessage.sender)) {
          console.log("New conversation detected, fetching list...");
          dispatch(fetchConversations());
        }

        // Increment global unread if not the current active chat
        if (String(newMessage.sender) !== String(activeChat?._id)) {
          dispatch(incrementUnread());
          playNotificationSound();
        } else {
          // If it IS the active chat, mark as read immediately on server and local
          dispatch(markMessagesAsRead(activeChat._id));
          dispatch(handleReadMessage(activeChat._id));
        }
      });

      socket.off("messageSent");
      socket.on("messageSent", (newMessage) => {
        console.log("MESSAGE SENT SUCCESSFULLY via Socket:", newMessage);
        dispatch(addMessage(newMessage));
      });

      socket.off("userStatusUpdate");
      socket.on("userStatusUpdate", (data) => {
        console.log("USER STATUS UPDATE:", data);
        dispatch(updateUserStatus(data));
      });

      socket.off("messageUpdated");
      socket.on("messageUpdated", (updatedMessage) => {
        console.log("MESSAGE UPDATED via Socket:", updatedMessage);
        dispatch(updateMessage(updatedMessage));
      });

      socket.off("messagesRead");
      socket.on("messagesRead", (data) => {
        console.log("MESSAGES READ via Socket:", data);
        // If I am the sender, mark messages to this reader as read
        dispatch(setMessagesRead(data.readerId));
      });

      socket.off("messageDeleted");
      socket.on("messageDeleted", (data) => {
        console.log("MESSAGE DELETED via Socket:", data);
        dispatch(deleteMessageLocally({ ...data, userId: user._id }));
      });

      socket.off("adminAssigned");
      socket.on("adminAssigned", (data) => {
        console.log("ADMIN ASSIGNED via Socket:", data);
        dispatch(updateAssignment(data));
      });

      return () => {
        socket.off("newMessage");
        socket.off("messageSent");
        socket.off("userStatusUpdate");
        socket.off("messageUpdated");
        socket.off("messagesRead");
        socket.off("messageDeleted");
        socket.off("adminAssigned");
      };
    }
  }, [user?._id, activeChat?._id, isAdmin, conversations.length, dispatch]);

  const [activeMenu, setActiveMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [deletingId, setDeletingId] = useState(null);
  const [activeMenuData, setActiveMenuData] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { msgId, mode }

  useEffect(() => {
    if (isOpen) {
      dispatch(resetAllUnread());
    } else {
      dispatch(setActiveChatId(null));
    }

    if (isAdmin && isOpen) {
      dispatch(fetchConversations());
    } else if (!isAdmin && isOpen && !activeChat) {
      // Fetch admin info for the user
      const getAdminInfo = async () => {
        try {
          const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/user/admin`, {
            withCredentials: true,
          });
          if (data.success && data.admin) {
            console.log("Fetched Admin Info for User:", data.admin);
            setActiveChat({ _id: data.admin._id, userInfo: data.admin });
          } else if (data.success && !data.admin) {
            console.error("No admin found in the system!");
          }
        } catch (error) {
          console.error("Failed to fetch admin info:", error);
        }
      };
      getAdminInfo();
    }
  }, [isAdmin, isOpen, dispatch, activeChat]);

  const activeChatId = activeChat?._id;
  useEffect(() => {
    if (activeChatId && isOpen) {
      dispatch(setActiveChatId(activeChatId));
      // Only clear and fetch if it's a DIFFERENT chat
      dispatch(fetchMessages(activeChatId));
      dispatch(markMessagesAsRead(activeChatId));
      dispatch(handleReadMessage(activeChatId));
    }
  }, [activeChatId, isOpen, dispatch]);

  const handleTakeOver = async () => {
    if (!activeChat || !isAdmin) return;

    // Optimistic update
    const previousAdmin = activeChatAssignedAdmin;
    dispatch(updateAssignment({ userId: activeChat._id, admin: { _id: user._id, name: user.name, avatar: user.avatar } }));

    try {
      const { data } = await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/v1/messages/assign/${activeChat._id}`, {}, {
        withCredentials: true,
      });
      if (data.success) {
        // Confirm with server data
        dispatch(updateAssignment({ userId: activeChat._id, admin: data.assignedAdmin }));
        // Broadcast via socket is handled by the backend controller now

        // Instant focus for the admin
        setTimeout(() => {
          const input = document.querySelector('textarea[placeholder="Type a message..."]');
          if (input) input.focus();
        }, 100);
      } else {
        // Rollback on failure
        dispatch(updateAssignment({ userId: activeChat._id, admin: previousAdmin }));
      }
    } catch (error) {
      console.error("Failed to take over chat:", error);
      // Rollback on error
      dispatch(updateAssignment({ userId: activeChat._id, admin: previousAdmin }));
    }
  };

  // Click outside to close menu
  useEffect(() => {
    const handleGlobalClick = () => {
      if (activeMenu) {
        setActiveMenu(null);
        setActiveMenuData(null);
      }
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, [activeMenu]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const playNotificationSound = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio play blocked by browser:", e));
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  };

  const handleSendMessage = (e, customContent = null, customType = "text", fileName = null) => {
    if (e) e.preventDefault();
    const contentToSend = customContent || message;
    if (!contentToSend.trim()) return;

    const socket = getSocket();
    const targetId = activeChat?._id;

    if (!targetId) {
      console.error("No target ID for message. activeChat:", activeChat);
      return;
    }

    if (socket) {
      console.log(`EMITTING sendMessage to ${targetId} (Type: ${customType}):`, contentToSend);

      // Optimistic Assignment for the first message from an Admin
      if (isAdmin && !activeChatAssignedAdmin) {
        dispatch(updateAssignment({ userId: targetId, admin: { _id: user._id, name: user.name, avatar: user.avatar } }));
      }

      socket.emit("sendMessage", {
        senderId: user._id,
        receiverId: targetId,
        content: contentToSend,
        messageType: customType,
        fileName: fileName,
      });
      if (!customContent) setMessage("");
    } else {
      console.error("Socket NOT available in getSocket()");
    }
  };

  const handleFileAction = (type) => {
    if (type === "image") {
      imageInputRef.current?.click();
    } else {
      pdfInputRef.current?.click();
    }
  };

  const handleFileChange = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = type === "image";
    const isPDF = type === "pdf";

    if (isImage && !file.type.startsWith('image/')) {
      alert("Please select an image file.");
      return;
    }
    if (isPDF && file.type !== 'application/pdf') {
      alert("Please select a PDF file.");
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("file", file); // Using "file" as the key

    try {
      const { data } = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/v1/messages/upload-image`, formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.success) {
        handleSendMessage(null, data.url, isImage ? "image" : "file", data.originalName || file.name);
      }
    } catch (error) {
      console.error("File upload failed:", error);
      alert("Failed to upload file.");
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  };

  const handleDeleteMessage = (messageId, mode) => {
    const socket = getSocket();
    if (socket && user?._id) {
      setDeletingId(messageId);
      socket.emit("deleteMessage", { messageId, userId: user._id, mode });
      setActiveMenu(null);
      setTimeout(() => setDeletingId(null), 1000);
    }
  };

  const handleStartEdit = (msg) => {
    setEditingMessage(msg._id);
    setEditContent(msg.content);
  };

  const handleCancelEdit = () => {
    setEditingMessage(null);
    setEditContent("");
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;

    const socket = getSocket();
    if (socket && editingMessage) {
      console.log("EMITTING editMessage:", { messageId: editingMessage, newContent: editContent });
      socket.emit("editMessage", {
        messageId: editingMessage,
        senderId: user._id,
        receiverId: activeChat._id,
        newContent: editContent,
      });
      setEditingMessage(null);
      setEditContent("");
    } else {
      console.warn("Cannot emit edit: socket or message missing", { socket: !!socket, editingMessage });
    }
  };

  const canEdit = (msg) => {
    if (msg.isRead) return false;
    const now = new Date();
    const msgTime = new Date(msg.createdAt);
    const diffInMinutes = (now - msgTime) / (1000 * 60);
    return diffInMinutes < 15;
  };

  const toggleChat = () => dispatch(toggleMessagingPopup());

  if (!user) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        {/* Chat Window */}
        {isOpen && (
          <div className="w-[380px] sm:w-[420px] h-[580px] bg-white rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">

            {/* Header */}
            <div className="p-4 bg-black text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                {activeChat && (
                  <button
                    onClick={() => setActiveChat(null)}
                    className="p-1.5 hover:bg-gray-800 rounded-xl transition-colors shrink-0"
                    title="Back to conversations"
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center overflow-hidden border border-gray-700 shrink-0">
                  {activeChat?.userInfo?.avatar?.url ? (
                    <img src={activeChat.userInfo.avatar.url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={20} className="text-gray-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold truncate">
                    {activeChat ? activeChat.userInfo.name : "Direct Messaging"}
                  </h3>
                  {isAdmin && activeChat && (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] bg-white/20 text-white/90 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        {activeChatAssignedAdmin
                          ? `Handled by ${activeChatAssignedAdmin.name}`
                          : "Not Assigned"}
                      </span>
                      {activeChatAssignedAdmin?._id && String(activeChatAssignedAdmin._id) !== String(user?._id) && (
                        <button
                          onClick={handleTakeOver}
                          className="text-[9px] text-yellow-400 font-black uppercase tracking-widest hover:text-yellow-300 transition-colors bg-yellow-400/10 px-1.5 py-0.5 rounded border border-yellow-400/20"
                        >
                          Take Over
                        </button>
                      )}
                      {!activeChatAssignedAdmin && (
                        <button
                          onClick={handleTakeOver}
                          className="text-[9px] text-green-400 font-black uppercase tracking-widest hover:text-green-300 transition-colors bg-green-400/10 px-1.5 py-0.5 rounded border border-green-400/20"
                        >
                          Assign Me
                        </button>
                      )}
                    </div>
                  )}
                  {!isAdmin && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Circle size={8} className={activeChat?.userInfo?.isOnline ? "fill-green-500 text-green-500" : "fill-gray-500 text-gray-500"} />
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        {activeChat?.userInfo?.isOnline ? "Online" : "Offline"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={toggleChat}
                className="p-2 hover:bg-gray-800 rounded-xl transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {isAdmin && !activeChat ? (
                /* Conversation List for Admin */
                <div className="space-y-2">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 px-2">Active Conversations</p>
                  {conversations.length === 0 ? (
                    <div className="text-center py-10">
                      <MessageCircle size={40} className="mx-auto text-gray-200 mb-2" />
                      <p className="text-sm text-gray-500 font-bold">No messages yet</p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <button
                        key={conv._id}
                        onClick={() => setActiveChat(conv)}
                        className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white border border-gray-100 hover:border-black transition-all text-left shadow-sm group"
                      >
                        <div className="relative">
                          <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                            {conv.userInfo.avatar?.url ? (
                              <img src={conv.userInfo.avatar.url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon size={22} className="text-gray-400" />
                            )}
                          </div>
                          {conv.userInfo.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <h4 className="font-bold text-gray-900 text-sm truncate">{conv.userInfo?.name || "Unknown User"}</h4>
                            <span className="text-[10px] font-bold text-gray-400">
                              {conv.lastMessageTime ? format(new Date(conv.lastMessageTime), "p") : ""}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate font-semibold">{conv.lastMessage || "No messages yet"}</p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <div className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                            {conv.unreadCount}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              ) : (
                /* Message History */
                <>
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-6">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 border border-gray-200">
                        <MessageCircle size={32} className="text-gray-400" />
                      </div>
                      <h4 className="font-bold text-gray-900 mb-1">Start a conversation</h4>
                      <p className="text-xs text-gray-500 font-semibold leading-relaxed">Ask any questions about books, borrowing, or account issues.</p>
                    </div>
                  ) : (
                    messages
                      .filter(m => {
                        const mSenderId = m.sender?._id || m.sender;
                        const mReceiverId = m.receiver?._id || m.receiver;
                        const activeId = activeChat?._id;
                        return String(mSenderId) === String(activeId) || String(mReceiverId) === String(activeId);
                      })
                      .map((msg, i) => {
                        const senderId = msg.sender?._id || msg.sender;
                        const isOwn = String(senderId) === String(user._id);
                        const isSenderAdmin = msg.sender?.role === "Admin";

                        // "isSameSide" means it should be on the RIGHT side of the chat window
                        // Admin view: All admins on the right.
                        // User view: User on the right.
                        const isSameSide = isAdmin ? isSenderAdmin : !isSenderAdmin;

                        const isEditing = editingMessage === msg._id;
                        const canUserEdit = isOwn && canEdit(msg);

                        return (
                          <div
                            key={msg._id || i}
                            className={`flex flex-col ${isSameSide ? "items-end" : "items-start"} animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}
                            style={{ animationDelay: `${Math.min(i * 20, 300)}ms`, animationFillMode: "both" }}
                          >
                            {/* Admin Name Tag (only for admins) */}
                            {isSenderAdmin && (
                              <span className={`text-[10px] font-extrabold text-gray-400 mb-0.5 px-0.5 uppercase tracking-wide`}>
                                {msg.sender?.name || "Support Admin"}
                              </span>
                            )}
                            {/* Row: bubble + action buttons side by side */}
                            <div className={`flex items-start gap-2.5 group ${isSameSide ? "flex-row-reverse" : "flex-row"} max-w-full`}>
                              {!isSameSide && (
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 shrink-0 mt-0.5">
                                  {msg.sender?.avatar?.url ? (
                                    <img src={msg.sender.avatar.url} alt="Avatar" className="w-full h-full object-cover" />
                                  ) : (
                                    <UserIcon size={14} className="text-gray-400" />
                                  )}
                                </div>
                              )}

                              {/* Message Bubble */}
                              <div className={`max-w-[75%] sm:max-w-[80%] px-4 py-2.5 rounded-2xl text-sm font-semibold shadow-sm transition-all duration-200 ${msg.deletedForEveryone
                                ? "bg-gray-100 text-gray-400 italic border border-dashed border-gray-300 opacity-70"
                                : isSameSide
                                  ? "bg-black text-white rounded-br-none hover:shadow-md"
                                  : "bg-white border border-gray-100 text-gray-800 rounded-bl-none hover:shadow-md"
                                }`}>
                                {msg.deletedForEveryone ? (
                                  <div className="flex items-center gap-2 py-0.5 select-none">
                                    <Trash2 size={11} className="opacity-60 shrink-0" />
                                    <span className="text-xs">This message was deleted</span>
                                  </div>
                                ) : isEditing ? (
                                  <form onSubmit={handleSaveEdit} className="w-full flex flex-col gap-2 py-1 min-w-[200px] animate-in fade-in-0 duration-150">
                                    <input
                                      autoFocus
                                      value={editContent}
                                      onChange={(e) => setEditContent(e.target.value)}
                                      className="bg-gray-800 text-white rounded px-2 py-1 outline-none text-xs w-full ring-1 ring-gray-600 focus:ring-blue-500 transition-all"
                                    />
                                    <div className="flex justify-end gap-2 text-[10px] font-bold">
                                      <button type="button" onClick={handleCancelEdit} className="text-gray-400 hover:text-white transition-colors px-2 py-0.5 rounded hover:bg-gray-700">Cancel</button>
                                      <button type="submit" className="text-blue-400 hover:text-blue-300 transition-colors px-2 py-0.5 rounded hover:bg-blue-900/30">Save</button>
                                    </div>
                                  </form>
                                ) : (
                                  <>
                                    {msg.messageType === "image" ? (
                                      <div className="space-y-1">
                                        <img
                                          src={msg.content}
                                          alt="Sent"
                                          className="max-w-full max-h-[200px] object-cover rounded-lg cursor-pointer hover:opacity-90 hover:scale-[1.01] transition-all duration-200"
                                          onClick={() => window.open(msg.content, '_blank')}
                                        />
                                      </div>
                                    ) : msg.messageType === "file" ? (
                                      <div className="flex items-center gap-3 py-1">
                                        <div className={`p-2 rounded-xl ${isOwn ? "bg-gray-800" : "bg-gray-100"} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}>
                                          <FileText size={18} className={isOwn ? "text-gray-300" : "text-gray-500"} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                          <span className="text-xs font-bold truncate max-w-[130px]" title={msg.fileName}>
                                            {msg.fileName || "PDF Document"}
                                          </span>
                                          <a
                                            href={msg.content}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download={msg.fileName || "document.pdf"}
                                            className={`text-[10px] font-black uppercase tracking-wider mt-0.5 hover:underline transition-opacity hover:opacity-80 ${isOwn ? "text-blue-400" : "text-blue-600"}`}
                                            onClick={(e) => e.stopPropagation()}
                                          >
                                            View & Download
                                          </a>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                                    )}
                                  </>
                                )}
                              </div>

                              {/* Action buttons — shown beside bubble on hover, only for non-deleted messages */}
                              {!msg.deletedForEveryone && !isEditing && (
                                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all duration-200 shrink-0">
                                  {canUserEdit && msg.messageType !== "image" && msg.messageType !== "file" && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleStartEdit(msg); }}
                                      className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 hover:scale-110 active:scale-95 transition-all duration-150 shadow-sm"
                                      title="Edit message"
                                    >
                                      <Pencil size={12} />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (activeMenu === msg._id) {
                                        setActiveMenu(null);
                                        setActiveMenuData(null);
                                        setConfirmDelete(null);
                                      } else {
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const menuWidth = 200;
                                        const menuHeight = 130;
                                        const left = rect.left + menuWidth > window.innerWidth
                                          ? rect.right - menuWidth
                                          : rect.left;
                                        const top = rect.bottom + menuHeight > window.innerHeight
                                          ? rect.top - menuHeight - 6
                                          : rect.bottom + 6;
                                        setMenuPosition({ top, left });
                                        setActiveMenu(msg._id);
                                        setActiveMenuData({ msgId: msg._id, isOwn, createdAt: msg.createdAt });
                                      }
                                    }}
                                    className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900 hover:scale-110 active:scale-95 transition-all duration-150 shadow-sm"
                                    title="More options"
                                  >
                                    <MoreVertical size={12} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Timestamp */}
                            <div className={`flex items-center gap-1.5 mt-1 px-1 ${isOwn ? "flex-row-reverse" : ""}`}>
                              <span className="text-[9px] font-bold text-gray-400">
                                {msg.createdAt ? format(new Date(msg.createdAt), "p") : "now"}
                              </span>
                              {msg.isEdited && (
                                <span className="text-[9px] font-bold text-gray-500 italic">(edited)</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                  )}
                  <div ref={scrollRef} />
                </>
              )}
            </div>

            {/* Footer Input */}
            {(!isAdmin || activeChat) && (
              <form onSubmit={handleSendMessage} className={`p-4 bg-white border-t border-gray-100 ${isAdmin && activeChatAssignedAdmin && activeChatAssignedAdmin._id !== user._id ? "opacity-50 grayscale pointer-events-none" : ""}`}>
                <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-3 py-2 border border-transparent focus-within:border-black transition-all">
                  <input
                    type="text"
                    disabled={isAdmin && activeChatAssignedAdmin && activeChatAssignedAdmin._id !== user._id}
                    placeholder={isAdmin && activeChatAssignedAdmin && activeChatAssignedAdmin._id !== user._id ? "Chat assigned to another admin" : "Type a message..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm font-semibold"
                  />
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={(e) => handleFileChange(e, "image")}
                    className="hidden"
                    accept="image/*"
                  />
                  <input
                    type="file"
                    ref={pdfInputRef}
                    onChange={(e) => handleFileChange(e, "pdf")}
                    className="hidden"
                    accept="application/pdf"
                  />

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className={`p-1.5 text-gray-400 hover:text-black transition-colors ${uploadingImage ? 'animate-pulse' : ''}`}
                      title="Send Image"
                    >
                      <ImageIcon size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={uploadingImage}
                      className={`p-1.5 text-gray-400 hover:text-black transition-colors ${uploadingImage ? 'animate-pulse' : ''}`}
                      title="Send PDF"
                    >
                      <FileText size={20} />
                    </button>
                  </div>

                  <button type="submit" disabled={!message.trim()} className="text-black hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 transition-transform">
                    <Send size={20} />
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Fixed-position context menu / confirmation — rendered outside overflow-clipped containers */}
      {activeMenu && activeMenuData && (
        <div
          style={{ top: menuPosition.top, left: menuPosition.left }}
          className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl min-w-[190px] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {confirmDelete ? (
            /* Confirmation step — slides in */
            <div className="px-4 py-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 size={11} className="text-red-500" />
                </div>
                <p className="text-[12px] font-bold text-gray-800">
                  {confirmDelete.mode === "everyone" ? "Delete for Everyone?" : "Delete for Me?"}
                </p>
              </div>
              <p className="text-[11px] text-gray-500 mb-3 leading-snug pl-8">
                {confirmDelete.mode === "everyone"
                  ? "This will be removed for all participants."
                  : "This will only be removed for you."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleDeleteMessage(confirmDelete.msgId, confirmDelete.mode);
                    setActiveMenu(null);
                    setActiveMenuData(null);
                    setConfirmDelete(null);
                  }}
                  className="flex-1 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 active:scale-95 text-white text-[11px] font-bold transition-all duration-150"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95 text-[11px] font-bold transition-all duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Options step */
            <>
              <button
                onClick={() => setConfirmDelete({ msgId: activeMenuData.msgId, mode: "me" })}
                className="w-full px-4 py-2.5 text-left text-[12px] font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 flex items-center gap-2.5 transition-colors duration-100"
              >
                <Trash2 size={13} className="text-gray-400" />
                Delete for Me
              </button>
              {activeMenuData.isOwn && (new Date() - new Date(activeMenuData.createdAt)) / (1000 * 60) < 15 && (
                <button
                  onClick={() => setConfirmDelete({ msgId: activeMenuData.msgId, mode: "everyone" })}
                  className="w-full px-4 py-2.5 text-left text-[12px] font-semibold text-red-500 hover:bg-red-50 active:bg-red-100 flex items-center gap-2.5 border-t border-gray-100 transition-colors duration-100"
                >
                  <Trash2 size={13} />
                  Delete for Everyone
                </button>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatWidget;
