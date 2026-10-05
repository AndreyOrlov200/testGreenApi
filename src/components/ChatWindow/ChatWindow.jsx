import { useEffect, useRef, useState } from "react";
import "./ChatWindow.css";
export function ChatWindow({
  chat,
  chatId,
  messages,
  onSend,
  loading,
  notice,
  historyError,
  onRetry,
}) {
  const [text, setText] = useState("");
  const bottom = useRef(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const submit = async (event) => {
    event.preventDefault();

    if (!chatId || !text.trim() || loading) return;

    const value = text.trim();
    setText("");
    await onSend(value);
  };

  return (
    <div className="chat-layout">
      <div className="chat-heading">
        <div>
          <p className="eyebrow">MAX messenger</p>
          <h2>{chat?.name || chatId || "Выберите диалог"}</h2>
          {chat && <small className="chat-id-label">{chatId}</small>}
        </div>
      </div>

      <div className="messages">
        {!chatId && (
          <div className="empty-state">
            <span>✦</span>
            <h3>Выберите диалог</h3>
            <p>Список чатов загружается слева.</p>
          </div>
        )}
        {chatId && historyError && (
          <div className="empty-state error-state" role="alert">
            <span>!</span>
            <h3>Не удалось загрузить сообщения</h3>
            <p>{historyError}</p>
            <button className="retry-button" type="button" onClick={onRetry}>
              Повторить
            </button>
          </div>
        )}
        {chatId && !historyError && messages.length === 0 && (
          <div className="empty-state">
            <span>○</span>
            <h3>Сообщений пока нет</h3>
            <p>Напишите сообщение — оно появится здесь.</p>
          </div>
        )}
        {chatId &&
          !historyError &&
          messages.length > 0 &&
          messages.map((message) => (
            <div
              className={`bubble-row ${message.outgoing ? "outgoing" : ""}`}
              key={message.id}
            >
              <div className="bubble">{message.text}</div>
            </div>
          ))}
        <div ref={bottom} />
      </div>

      {notice && <p className="error-message">{notice}</p>}

      <form className="composer" onSubmit={submit}>
        <input
          value={text}
          aria-label="Текст сообщения"
          onChange={(event) => setText(event.target.value)}
          disabled={!chatId}
          placeholder={chatId ? "Напишите сообщение…" : "Сначала выберите чат"}
          maxLength={4000}
        />
        <button
          className="send-button"
          type="submit"
          disabled={!chatId || !text.trim() || loading}
          aria-label="Отправить"
        >
          ↑
        </button>
      </form>
    </div>
  );
}
