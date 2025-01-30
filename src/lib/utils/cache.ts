import { ChatSession, Message } from "@/hooks/use-chat";

const CACHE_VERSION = 1;
const SESSION_CACHE_KEY = 'chat_sessions_v' + CACHE_VERSION;
const MESSAGE_CACHE_KEY = 'chat_messages_v' + CACHE_VERSION;
const CACHE_EXPIRY = 1000 * 60 * 5; // 5 minutes

interface CacheData<T> {
  timestamp: number;
  data: T;
}

export function getCachedSessions(): ChatSession[] | null {
  try {
    const cached = localStorage.getItem(SESSION_CACHE_KEY);
    if (!cached) return null;

    const parsedCache: CacheData<ChatSession[]> = JSON.parse(cached);
    if (Date.now() - parsedCache.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(SESSION_CACHE_KEY);
      return null;
    }

    return parsedCache.data;
  } catch (error) {
    console.error('Error reading from session cache:', error);
    return null;
  }
}

export function setCachedSessions(sessions: ChatSession[]): void {
  try {
    const cacheData: CacheData<ChatSession[]> = {
      timestamp: Date.now(),
      data: sessions
    };
    localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing to session cache:', error);
  }
}

export function getCachedMessages(sessionId: string): Message[] | null {
  try {
    const cached = localStorage.getItem(`${MESSAGE_CACHE_KEY}_${sessionId}`);
    if (!cached) return null;

    const parsedCache: CacheData<Message[]> = JSON.parse(cached);
    if (Date.now() - parsedCache.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(`${MESSAGE_CACHE_KEY}_${sessionId}`);
      return null;
    }

    return parsedCache.data;
  } catch (error) {
    console.error('Error reading from message cache:', error);
    return null;
  }
}

export function setCachedMessages(sessionId: string, messages: Message[]): void {
  try {
    const cacheData: CacheData<Message[]> = {
      timestamp: Date.now(),
      data: messages
    };
    localStorage.setItem(`${MESSAGE_CACHE_KEY}_${sessionId}`, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error writing to message cache:', error);
  }
}

export function clearCache(): void {
  try {
    localStorage.removeItem(SESSION_CACHE_KEY);
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(MESSAGE_CACHE_KEY)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

export function invalidateSessionCache(): void {
  try {
    localStorage.removeItem(SESSION_CACHE_KEY);
  } catch (error) {
    console.error('Error invalidating session cache:', error);
  }
}

export function invalidateMessageCache(sessionId: string): void {
  try {
    localStorage.removeItem(`${MESSAGE_CACHE_KEY}_${sessionId}`);
  } catch (error) {
    console.error('Error invalidating message cache:', error);
  }
}