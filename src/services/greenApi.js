import { mapHistoryResponse, mapNotification } from "./greenApi/mapper";

const API_URL = (
  import.meta.env.VITE_GREEN_API_URL ?? "https://api.green-api.com"
).replace(/\/$/, "");
const API_CONFIG = {
  requestTimeout: 15000,
  historyLimit: 100,
  receiveTimeout: 5,
};

const endpoint = (credentials, method) =>
  `${API_URL}/waInstance${credentials.idInstance}/${method}/${credentials.apiTokenInstance}`;

async function request(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(
    () => controller.abort(),
    API_CONFIG.requestTimeout,
  );

  const signal = options.signal
    ? AbortSignal.any([options.signal, controller.signal])
    : controller.signal;

  try {
    const response = await fetch(url, {
      ...options,
      signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    const raw = await response.text();
    if (!response.ok) {
      let details = "";
      try {
        details = raw ? JSON.parse(raw).message : "";
      } catch {
        // The API may return a plain-text error.
      }
      if (response.status === 429)
        throw new Error(
          "Green API временно ограничил частоту запросов. Повторите через несколько секунд.",
        );
      throw new Error(details || `Green API: ошибка ${response.status}`);
    }
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error("Green API вернул некорректный ответ.");
    }
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function sendTextMessage(credentials, chatId, text) {
  const result = await request(endpoint(credentials, "sendMessage"), {
    method: "POST",
    body: JSON.stringify({ chatId, message: text }),
  });

  return {
    id: result?.idMessage ?? crypto.randomUUID(),
    chatId,
    text,
    outgoing: true,
  };
}

export async function getChats(credentials) {
  const response = await request(endpoint(credentials, "getChats"));
  return Array.isArray(response) ? response : [];
}

export function getChatHistory(credentials, chatId, signal) {
  return request(endpoint(credentials, "getChatHistory"), {
    method: "POST",
    signal,
    body: JSON.stringify({ chatId, count: API_CONFIG.historyLimit }),
  }).then((response) => mapHistoryResponse(response, chatId));
}

export const receiveNotification = (credentials) =>
  request(
    `${endpoint(credentials, "receiveNotification")}?receiveTimeout=${API_CONFIG.receiveTimeout}`,
  );

export const deleteNotification = (credentials, receiptId) =>
  request(`${endpoint(credentials, "deleteNotification")}/${receiptId}`, {
    method: "DELETE",
  });

export { mapNotification };
