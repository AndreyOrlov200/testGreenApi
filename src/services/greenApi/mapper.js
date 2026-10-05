function getMessageText(item) {
  return item?.textMessage ?? "";
}

function getMessageId(item) {
  return item?.idMessage ?? crypto.randomUUID();
}

export function mapHistoryResponse(response, chatId) {
  return [...response].reverse().flatMap((item) => {
    const text = getMessageText(item);

    if (!text) return [];

    return [
      {
        id: getMessageId(item),
        chatId,
        text,
        outgoing: item.type === "outgoing",
      },
    ];
  });
}

export function mapNotification(notification) {
  if (!notification) return null;

  const body = notification.body ?? {};
  const text = body.messageData?.textMessageData?.textMessage;

  if (!text) return null;

  return {
    id: body.idMessage ?? crypto.randomUUID(),
    chatId: body.senderData?.chatId ?? "",
    text,
    outgoing: false,
  };
}
