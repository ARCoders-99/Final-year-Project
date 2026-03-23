import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const messageSlice = createSlice({
  name: "messages",
  initialState: {
    messages: [],
    conversations: [], // For admin view
    loading: false,
    error: null,
    unreadCount: 0,
    currentUserId: null,
    activeChatId: null,
    activeChatAssignedAdmin: null,
  },
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      const message = action.payload;
      const exists = state.messages.some((m) => m._id === message._id);
      if (!exists) {
        state.messages.push(message);
      }

      // Update conversations summary (for Admin view)
      const convIndex = state.conversations.findIndex(
        (c) => String(c._id) === String(message.sender) || String(c._id) === String(message.receiver)
      );

      if (convIndex !== -1) {
        const conv = state.conversations[convIndex];
        conv.lastMessage = message.content;
        conv.lastMessageTime = message.createdAt;

        // If it's an incoming message and not from the current active chat handled in components
        if (String(message.receiver) === String(state.currentUserId) && String(message.sender) !== String(state.activeChatId)) {
          conv.unreadCount = (conv.unreadCount || 0) + 1;
        }

        // Move to top
        state.conversations.splice(convIndex, 1);
        state.conversations.unshift(conv);
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    updateMessage: (state, action) => {
      const updatedMsg = action.payload;
      const index = state.messages.findIndex((m) => String(m._id) === String(updatedMsg._id));
      if (index !== -1) {
        state.messages[index] = updatedMsg;
      }
    },
    setConversations: (state, action) => {
      state.conversations = action.payload.map(conv => {
        if (String(conv._id) === String(state.activeChatId)) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      });
      // Only recalculate total unreadCount if the widget is NOT open
      if (!state.activeChatId) {
        state.unreadCount = state.conversations.reduce((total, conv) => total + (conv.unreadCount || 0), 0);
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    updateUserStatus: (state, action) => {
      const { userId, isOnline, lastSeen } = action.payload;
      const conversation = state.conversations.find((c) => String(c._id) === String(userId));
      if (conversation) {
        conversation.userInfo.isOnline = isOnline;
        if (lastSeen) conversation.userInfo.lastSeen = lastSeen;
      }
    },
    incrementUnread: (state) => {
      state.unreadCount += 1;
    },
    resetUnread: (state) => {
      state.unreadCount = 0;
    },
    handleReadMessage: (state, action) => {
      const userId = action.payload;
      const convIndex = state.conversations.findIndex((c) => String(c._id) === String(userId));

      if (convIndex !== -1) {
        const conv = state.conversations[convIndex];
        state.unreadCount = Math.max(0, state.unreadCount - (conv.unreadCount || 0));
        conv.unreadCount = 0;
      } else {
        // Clear global if user or not in list
        state.unreadCount = 0;
      }
    },
    resetAllUnread: (state) => {
      state.unreadCount = 0;
      state.conversations.forEach(c => c.unreadCount = 0);
    },
    setCurrentUserId: (state, action) => {
      state.currentUserId = action.payload;
    },
    setActiveChatId: (state, action) => {
      state.activeChatId = action.payload;
    },
    setMessagesRead: (state, action) => {
      const readerId = action.payload;
      state.messages.forEach((m) => {
        if (String(m.receiver) === String(readerId)) {
          m.isRead = true;
        }
      });
    },
    deleteMessageLocally: (state, action) => {
      const { messageId, mode, userId } = action.payload;
      const index = state.messages.findIndex((m) => String(m._id) === String(messageId));

      if (index !== -1) {
        if (mode === "everyone") {
          // Permanently remove or mark as deleted for everyone
          state.messages[index].deletedForEveryone = true;
          state.messages[index].content = "This message was deleted";
        } else if (mode === "me" && String(userId) === String(state.currentUserId)) {
          // Remove from local list if it's for ME
          state.messages.splice(index, 1);
        }
      }

      // Also Update conversation summary if needed
      const convIndex = state.conversations.findIndex(c =>
        state.messages.some(m => String(m._id) === String(messageId) && (String(m.sender) === String(c._id) || String(m.receiver) === String(c._id)))
      );
      if (convIndex !== -1 && mode === "everyone") {
        state.conversations[convIndex].lastMessage = "This message was deleted";
      }
    },
    updateAssignment: (state, action) => {
      const { userId, admin } = action.payload;
      if (String(state.activeChatId) === String(userId)) {
        state.activeChatAssignedAdmin = admin;
      }
      const conv = state.conversations.find(c => String(c._id) === String(userId));
      if (conv) {
        conv.userInfo.assignedAdmin = admin;
      }
    },
  },
});

export const {
  setMessages,
  addMessage,
  setConversations,
  setLoading,
  setError,
  updateUserStatus,
  incrementUnread,
  resetUnread,
  clearMessages,
  handleReadMessage,
  updateMessage,
  setCurrentUserId,
  setMessagesRead,
  resetAllUnread,
  setActiveChatId,
  deleteMessageLocally,
  updateAssignment,
} = messageSlice.actions;

export const fetchMessages = (userId) => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/messages/${userId}`, {
      withCredentials: true,
    });
    dispatch(setMessages(data.messages));
    dispatch(updateAssignment({ userId, admin: data.assignedAdmin }));
  } catch (error) {
    dispatch(setError(error.response?.data?.message || "Failed to fetch messages"));
  } finally {
    dispatch(setLoading(false));
  }
};

export const fetchConversations = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/v1/messages/admin/conversations`, {
      withCredentials: true,
    });
    dispatch(setConversations(data.conversations));
  } catch (error) {
    dispatch(setError(error.response?.data?.message || "Failed to fetch conversations"));
  } finally {
    dispatch(setLoading(false));
  }
};

export const markMessagesAsRead = (senderId) => async (dispatch, getState) => {
  try {
    const { user } = getState().auth;
    const socket = getSocket();
    if (socket && user?._id) {
      socket.emit("markAsRead", { senderId, receiverId: user._id });
    }

    await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/v1/messages/read/${senderId}`, {}, {
      withCredentials: true,
    });
  } catch (error) {
    console.error("Failed to mark messages as read:", error);
  }
};

export default messageSlice.reducer;
