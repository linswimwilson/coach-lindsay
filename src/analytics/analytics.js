// ================================================================
// ANALYTICS ENGINE — Silent telemetry for Coach Lindsay
// Stores all data in localStorage. No external dependencies.
// ================================================================

const STORAGE_KEY = "coach-lindsay-analytics";

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

function loadAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAll(sessions) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch { /* storage full — silently fail */ }
}

function findSession(sessionId) {
  const sessions = loadAll();
  return sessions.find(s => s.sessionId === sessionId);
}

function updateSession(sessionId, updater) {
  const sessions = loadAll();
  const idx = sessions.findIndex(s => s.sessionId === sessionId);
  if (idx === -1) return;
  updater(sessions[idx]);
  saveAll(sessions);
}

// ================================================================
// PUBLIC API
// ================================================================

export function createSession(conversationId) {
  const sessions = loadAll();
  const sessionId = generateId();

  // Detect restart — any previous unfinished session for this conversation
  const previousUnfinished = sessions.find(
    s => s.conversationId === conversationId && !s.completed
  );

  const session = {
    sessionId,
    conversationId,
    startedAt: new Date().toISOString(),
    endedAt: null,
    timeOfDay: getTimeOfDay(),
    completed: false,
    synced: false,
    events: [],
    summary: null,
  };

  if (previousUnfinished) {
    session.events.push({
      type: "restart_detected",
      timestamp: new Date().toISOString(),
      data: { previousSessionId: previousUnfinished.sessionId, previousExchangeCount: previousUnfinished.events.filter(e => e.type === "message_sent").length },
    });
  }

  sessions.push(session);
  saveAll(sessions);
  return sessionId;
}

export function track(sessionId, eventType, data = {}) {
  updateSession(sessionId, (session) => {
    session.events.push({
      type: eventType,
      timestamp: new Date().toISOString(),
      data,
    });
  });
}

export function endSession(sessionId) {
  updateSession(sessionId, (session) => {
    session.endedAt = new Date().toISOString();

    // Compute summary
    const events = session.events;
    const messageSent = events.filter(e => e.type === "message_sent");
    const latencies = events.filter(e => e.type === "response_latency").map(e => e.data.latencyMs);
    const outcomes = events.filter(e => e.type === "answer_outcome");
    const tabAways = events.filter(e => e.type === "tab_visible");
    const scaffolding = events.filter(e => e.type === "scaffolding_reached");

    session.summary = {
      durationMs: new Date(session.endedAt) - new Date(session.startedAt),
      exchangeCount: messageSent.length,
      avgResponseLatencyMs: latencies.length > 0 ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null,
      avgMessageLength: messageSent.length > 0 ? Math.round(messageSent.reduce((a, e) => a + e.data.length, 0) / messageSent.length) : null,
      correctAnswers: outcomes.filter(e => e.data.correct).length,
      wrongAnswers: outcomes.filter(e => !e.data.correct).length,
      tabAwayCount: tabAways.length,
      totalTabAwayMs: tabAways.reduce((a, e) => a + (e.data.hiddenDurationMs || 0), 0),
      maxScaffoldingLevel: scaffolding.length > 0 ? Math.max(...scaffolding.map(e => e.data.level)) : 1,
      voiceUsed: messageSent.some(e => e.data.inputMethod === "voice"),
      textUsed: messageSent.some(e => e.data.inputMethod === "text"),
      completed: session.completed,
    };
  });
}

export function markCompleted(sessionId) {
  updateSession(sessionId, (session) => {
    session.completed = true;
  });
}

export function getAllSessions() {
  return loadAll();
}

export function getSessionsByConversation(convId) {
  return loadAll().filter(s => s.conversationId === convId);
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportData() {
  return JSON.stringify(loadAll(), null, 2);
}

// ================================================================
// RESPONSE PARSING — Detect scaffolding level and answer outcome
// ================================================================

const CORRECT_WORDS = /^(exactly|right|yes|that is it|nice|spot on|you got it|bingo|perfect|great|good|excellent|correct|nailed)/i;
const WRONG_WORDS = /^(not quite|close|hmm|not exactly|let me give you|think about|good guess|getting warmer|almost|not quite)/i;

export function parseAnswerOutcome(aiResponseText) {
  const first = aiResponseText.split("|||")[0].trim();
  if (CORRECT_WORDS.test(first)) return true;
  if (WRONG_WORDS.test(first)) return false;
  return null; // uncertain
}

export function parseScaffoldingLevel(aiResponseText) {
  if (/\[VISUAL:[^\]]+\]/.test(aiResponseText)) return 3;
  if (/[A-E]\)\s/.test(aiResponseText) && /[A-D]\)/.test(aiResponseText)) return 4;
  if (/____/.test(aiResponseText) || /fill in/i.test(aiResponseText)) return 5;
  if (/say that back to me/i.test(aiResponseText)) return 5;
  if (/think about|remember|hint|clue/i.test(aiResponseText)) return 2;
  return 1;
}

export function parseCompletion(aiResponseText) {
  return /solid work|great job today|want to try harder|really solid|you nailed every/i.test(aiResponseText);
}
