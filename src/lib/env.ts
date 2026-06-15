/**
 * Runtime environment configuration.
 *
 * Reads critical env vars at module load time so they survive post-build
 * obfuscation. The names TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are never
 * used outside this module, so the obfuscation script cannot corrupt them.
 */
export function requireTelegramToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[env] TELEGRAM_BOT_TOKEN is not set");
    return "";
  }
  return token;
}

export function requireTelegramChatId(): string {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) {
    console.warn("[env] TELEGRAM_CHAT_ID is not set");
    return "";
  }
  return chatId;
}