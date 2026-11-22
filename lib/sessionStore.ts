export interface AgentMessage {
  id: string;
  sender: 'agent';
  text: string;
  timestamp: number;
}

export interface ChatSession {
  sessionId: string;
  roomId?: string;
  extId?: string;
  accountUniqId?: string;
  mode: 'ai' | 'agent';
  historySummary: string;
  agentMessages: AgentMessage[];
  resolved: boolean;
  updatedAt: number;
}

const globalStore = globalThis as unknown as {
  __qontakSessions?: Map<string, ChatSession>;
  __roomToSession?: Map<string, string>;
};

export const sessions =
  globalStore.__qontakSessions ?? new Map<string, ChatSession>();
export const roomToSession =
  globalStore.__roomToSession ?? new Map<string, string>();

globalStore.__qontakSessions = sessions;
globalStore.__roomToSession = roomToSession;

export function getOrCreateSession(sessionId: string): ChatSession {
  let session = sessions.get(sessionId);
  if (!session) {
    session = {
      sessionId,
      mode: 'ai',
      historySummary: '',
      agentMessages: [],
      resolved: false,
      updatedAt: Date.now(),
    };
    sessions.set(sessionId, session);
  }
  return session;
}

export function getSession(sessionId: string): ChatSession | undefined {
  return sessions.get(sessionId);
}

export function bindRoomToSession(
  roomId: string,
  sessionId: string,
  extId?: string,
  accountUniqId?: string
) {
  const session = getOrCreateSession(sessionId);
  session.roomId = roomId;
  if (extId) session.extId = extId;
  if (accountUniqId) session.accountUniqId = accountUniqId;
  session.updatedAt = Date.now();
  roomToSession.set(roomId, sessionId);
}

export function getSessionByRoomId(roomId: string): ChatSession | undefined {
  const sessionId = roomToSession.get(roomId);
  if (!sessionId) return undefined;
  return sessions.get(sessionId);
}

export function getLatestPendingHandoverSession(): ChatSession | undefined {
  let latest: ChatSession | undefined;
  for (const session of sessions.values()) {
    if (session.mode === 'agent' && !session.roomId && !session.resolved) {
      if (!latest || session.updatedAt > latest.updatedAt) {
        latest = session;
      }
    }
  }
  return latest;
}