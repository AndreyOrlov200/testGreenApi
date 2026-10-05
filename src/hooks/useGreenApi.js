import { useCallback, useRef, useState } from "react";
import {
  deleteNotification,
  getChatHistory,
  getChats,
  mapNotification,
  receiveNotification,
  sendTextMessage,
} from "../services/greenApi";

function isAbortError(cause) {
  return (
    cause?.name === "AbortError" ||
    cause?.message?.toLowerCase().includes("signal is aborted")
  );
}

export function useGreenApi(credentials) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const polling = useRef(false);

  const sendMessage = useCallback(
    async (chatId, text) => {
      setLoading(true);
      setError("");
      try {
        return await sendTextMessage(credentials, chatId, text);
      } catch (cause) {
        setError(cause.message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [credentials],
  );

  const pollMessages = useCallback(async () => {
    if (polling.current) return [];
    polling.current = true;
    try {
      const notification = await receiveNotification(credentials);
      if (!notification) return [];
      await deleteNotification(credentials, notification.receiptId);
      const message = mapNotification(notification);
      return message ? [message] : [];
    } catch (cause) {
      if (!isAbortError(cause)) setError(cause.message);
      return [];
    } finally {
      polling.current = false;
    }
  }, [credentials]);

  const loadChats = useCallback(
    async () => {
      try {
        const chats = await getChats(credentials);
        setError("");
        return chats;
      } catch (cause) {
        setError(cause.message);
        throw cause;
      }
    },
    [credentials],
  );

  const loadHistory = useCallback(
    async (chatId, signal) => {
      try {
        return await getChatHistory(credentials, chatId, signal);
      } catch (cause) {
        if (cause.name === "AbortError") return [];
        throw cause;
      }
    },
    [credentials],
  );

  return { sendMessage, pollMessages, loadChats, loadHistory, loading, error };
}
