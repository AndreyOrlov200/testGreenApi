import { useState } from "react";
import "./ChatList.css";

const HIDDEN_CHATS_KEY = "green-api-hidden-chats";

const COUNTRIES = {
  ru: { code: "+7", digits: 10, format: (digits) => `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}` },
  kz: { code: "+7", digits: 10, format: (digits) => `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}` },
  by: { code: "+375", digits: 9, format: (digits) => `+375 (${digits.slice(0, 2)}) ${digits.slice(2, 5)}-${digits.slice(5, 7)}-${digits.slice(7, 9)}` },
};

function formatPhone(value, country) {
  const settings = COUNTRIES[country];
  let digits = value.replace(/\D/g, "");
  if (country === "by" && digits.startsWith("375")) digits = digits.slice(3);
  if (country !== "by" && digits.startsWith("7")) digits = digits.slice(1);
  if (country !== "by" && digits.startsWith("8")) digits = digits.slice(1);
  digits = digits.slice(0, settings.digits);

  if (!digits) return settings.code;
  return settings.format(digits.slice(0, settings.digits));
}

function getHiddenChats() {
  try {
    return JSON.parse(localStorage.getItem(HIDDEN_CHATS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function ChatList({
  chats,
  selectedId,
  onSelect,
  onRefresh,
  loading,
  error,
}) {
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("ru");
  const [hiddenChats, setHiddenChats] = useState(getHiddenChats);
  const [showHidden, setShowHidden] = useState(false);

  const hideChat = (chatId) => {
    setHiddenChats((current) => {
      const next = showHidden
        ? current.filter((id) => id !== chatId)
        : [...new Set([...current, chatId])];
      localStorage.setItem(HIDDEN_CHATS_KEY, JSON.stringify(next));
      return next;
    });
  };

  const createChat = (event) => {
    event.preventDefault();
    const digits = phone.replace(/\D/g, "").replace(/^8/, "7");
    if (!digits) return;

    const prefix = country === "by" ? "375" : "7";
    const localDigits = digits.replace(new RegExp(`^${prefix}`), "");
    const chatId = `${prefix}${localDigits}@c.us`;
    onSelect({ chatId, name: phone.trim(), type: "user" });
    setPhone("");
  };

  return (
    <div className="chat-list">
      <div className="list-heading">
        <p className="eyebrow">Ваши чаты</p>
        <div className="list-actions">
          {hiddenChats.length > 0 && (
            <button className="hidden-toggle" type="button" onClick={() => setShowHidden((value) => !value)}>
              {showHidden ? "Все" : `Скрытые ${hiddenChats.length}`}
            </button>
          )}
          <button className="refresh-button" type="button" onClick={onRefresh} disabled={loading} aria-label="Обновить список">
            ↻
          </button>
        </div>
      </div>

      <form className="new-chat-form" onSubmit={createChat}>
        <select value={country} onChange={(event) => { setCountry(event.target.value); setPhone(""); }} aria-label="Страна номера">
          <option value="ru">🇷🇺 +7</option>
          <option value="kz">🇰🇿 +7</option>
          <option value="by">🇧🇾 +375</option>
        </select>
        <input
          value={phone}
          onChange={(event) => setPhone(formatPhone(event.target.value))}
          inputMode="tel"
          placeholder={country === "by" ? "+375 (29) 123-45-67" : "+7 (999) 123-45-67"}
          aria-label="Номер телефона нового чата"
        />
        <button type="submit" disabled={!phone.trim()}>
          Новый чат
        </button>
      </form>

      {loading && <p className="list-empty">Загружаю чаты…</p>}
      {!loading && error && (
        <p className="list-error" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && chats.length === 0 && (
        <p className="list-empty">Чаты не найдены</p>
      )}
      {!loading &&
        !error &&
        chats.filter((chat) => showHidden === hiddenChats.includes(chat.chatId)).map((chat) => {
          const isSelected = chat.chatId === selectedId;

          return (
            <div className={`chat-item ${isSelected ? "selected" : ""}`} key={chat.chatId}>
              <button type="button" className="chat-select" aria-pressed={isSelected} onClick={() => onSelect(chat)}>
                <span className="avatar" aria-hidden="true">
                  {(chat.name || "?").slice(0, 1).toUpperCase()}
                </span>
                <span className="chat-meta">
                  <strong>{chat.name || chat.chatId}</strong>
                  <small>{chat.type === "group" ? "Группа" : chat.chatId}</small>
                </span>
                {chat.unreadCount > 0 && <em>{chat.unreadCount}</em>}
              </button>
              <button className="hide-chat" type="button" onClick={() => hideChat(chat.chatId)} aria-label={showHidden ? `Показать ${chat.name || chat.chatId}` : `Скрыть ${chat.name || chat.chatId}`}>
                {showHidden ? "↶" : "×"}
              </button>
            </div>
          );
        })}
    </div>
  );
}
