import { useCallback, useEffect, useMemo, useState } from "react";
import { ChatList } from "./components/ChatList/ChatList";
import { ChatWindow } from "./components/ChatWindow/ChatWindow";
import { CredentialsForm } from "./components/CredentialsForm/CredentialsForm";
import { useGreenApi } from "./hooks/useGreenApi";
import "./App.css";

const STORAGE_KEY = "green-api-credentials";
const POLLING_DELAY = 1000;

function getStoredCredentials() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function App() {
  const [credentials, setCredentials] = useState(getStoredCredentials);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [historyError, setHistoryError] = useState("");
  const [historyReloadKey, setHistoryReloadKey] = useState(0);
  const [isChatsLoading, setIsChatsLoading] = useState(false);
  const [chatListError, setChatListError] = useState("");
  const { sendMessage, pollMessages, loadChats, loadHistory, loading, error } =
    useGreenApi(credentials);
  const chatId = selectedChat?.chatId ?? "";

  const refreshChats = useCallback(async () => {
    setIsChatsLoading(true);
    setChatListError("");
    try {
      setChats(await loadChats());
    } catch (cause) {
      setChatListError(cause.message);
    } finally {
      setIsChatsLoading(false);
    }
  }, [loadChats]);

  useEffect(() => {
    if (!credentials) return undefined;
    const refreshId = window.setTimeout(refreshChats, 0);
    return () => window.clearTimeout(refreshId);
  }, [credentials, refreshChats]);

  useEffect(() => {
    if (!chatId) return undefined;
    let active = true;
    const controller = new AbortController();
    loadHistory(chatId, controller.signal)
      .then((history) => {
        if (active) {
          setMessages((current) => {
            const otherChats = current.filter((message) => message.chatId !== chatId);
            const currentChat = current.filter((message) => message.chatId === chatId);
            const knownIds = new Set(history.map((message) => message.id));
            return [
              ...otherChats,
              ...history,
              ...currentChat.filter((message) => !knownIds.has(message.id)),
            ];
          });
        }
      })
      .catch((cause) => {
        if (active && cause.name !== "AbortError") {
          setHistoryError(cause.message);
          setMessages([]);
        }
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [chatId, loadHistory, historyReloadKey]);

  useEffect(() => {
    if (!credentials) return undefined;
    let active = true;
    let timeoutId;
    const read = async () => {
      const incoming = await pollMessages();
      if (!active) return;
      if (incoming.length) setMessages((current) => [...current, ...incoming]);
      timeoutId = window.setTimeout(read, POLLING_DELAY);
    };
    read();
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [credentials, pollMessages]);

  const visibleMessages = useMemo(
    () => messages.filter((message) => message.chatId === chatId),
    [messages, chatId],
  );

  const saveCredentials = (values) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    setCredentials(values);
    setSelectedChat(null);
    setMessages([]);
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCredentials(null);
    setSelectedChat(null);
    setChats([]);
    setMessages([]);
  };

  const handleSend = async (text) => {
    const sent = await sendMessage(chatId, text);
    if (sent) setMessages((current) => [...current, sent]);
  };

  if (!credentials) {
    return (
      <main className="shell">
        <CredentialsForm onSubmit={saveCredentials} />
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="workspace" aria-label="Рабочее пространство чата">
        <aside className="sidebar">
          <ChatList
            chats={chats}
            selectedId={chatId}
            onSelect={(chat) => {
              setSelectedChat(chat);
              setChats((current) =>
                current.some((item) => item.chatId === chat.chatId)
                  ? current
                  : [chat, ...current],
              );
              setMessages([]);
              setHistoryError("");
            }}
            onRefresh={refreshChats}
            loading={isChatsLoading}
            error={chatListError}
          />
          <div className="sidebar-footer">
            <div className="connection" role="status">
              <span aria-hidden="true" />
              Подключение активно
            </div>
            <button className="logout-button" type="button" onClick={logout}>
              Выйти
            </button>
          </div>
        </aside>
        <section className="chat-card" aria-label="Диалог">
          <ChatWindow
            chat={selectedChat}
            chatId={chatId}
            messages={visibleMessages}
            onSend={handleSend}
            loading={loading}
            notice={error}
            historyError={historyError}
            onRetry={() => {
              setHistoryError("");
              setHistoryReloadKey((key) => key + 1);
            }}
          />
        </section>
      </section>
    </main>
  );
}

export default App;
