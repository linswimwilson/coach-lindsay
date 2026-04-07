import { useRef, useEffect, useCallback } from "react";
import {
  createSession, track, endSession, markCompleted,
  parseAnswerOutcome, parseScaffoldingLevel, parseCompletion,
} from "./analytics.js";

// ================================================================
// useAnalytics — Drop-in hook for each conversation component.
// Call once at the top of CoachLindsay(). Returns event trackers.
// ================================================================

export default function useAnalytics(conversationId) {
  const sessionRef = useRef(null);
  const lastCoachTimestampRef = useRef(null);
  const tabHiddenAtRef = useRef(null);

  // Create session on mount, end on unmount
  useEffect(() => {
    sessionRef.current = createSession(conversationId);

    // Tab visibility tracking
    const onVisibilityChange = () => {
      if (!sessionRef.current) return;
      if (document.hidden) {
        tabHiddenAtRef.current = Date.now();
        track(sessionRef.current, "tab_hidden");
      } else {
        const hiddenDurationMs = tabHiddenAtRef.current ? Date.now() - tabHiddenAtRef.current : 0;
        track(sessionRef.current, "tab_visible", { hiddenDurationMs });
        tabHiddenAtRef.current = null;
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (sessionRef.current) endSession(sessionRef.current);
    };
  }, [conversationId]);

  // Called after coach bubbles are rendered/animated
  const onCoachBubblesRendered = useCallback((bubbleCount, animDelayMs) => {
    // Set timestamp to when the LAST bubble finishes animating
    lastCoachTimestampRef.current = Date.now() + (bubbleCount * animDelayMs);
  }, []);

  // Called when student sends a message
  const onStudentMessage = useCallback((text, inputMethod, exchangeNumber) => {
    if (!sessionRef.current) return;

    // Response latency (from last coach bubble to now)
    if (lastCoachTimestampRef.current) {
      const latencyMs = Math.max(0, Date.now() - lastCoachTimestampRef.current);
      track(sessionRef.current, "response_latency", { latencyMs, exchangeNumber });
    }

    track(sessionRef.current, "message_sent", {
      length: text.length,
      wordCount: text.trim().split(/\s+/).length,
      exchangeNumber,
      inputMethod,
    });
  }, []);

  // Called when AI response is received
  const onAIResponse = useCallback((fullText, exchangeNumber) => {
    if (!sessionRef.current) return;

    // Answer outcome
    const correct = parseAnswerOutcome(fullText);
    if (correct !== null) {
      track(sessionRef.current, "answer_outcome", { correct, exchangeNumber });
    }

    // Scaffolding level
    const level = parseScaffoldingLevel(fullText);
    if (level > 1) {
      track(sessionRef.current, "scaffolding_reached", { level, exchangeNumber });
    }

    // Completion detection
    if (parseCompletion(fullText)) {
      markCompleted(sessionRef.current);
      track(sessionRef.current, "conversation_completed", { exchangeNumber });
    }
  }, []);

  // Called when voice mode is toggled
  const onVoiceModeToggle = useCallback((enabled) => {
    if (!sessionRef.current) return;
    track(sessionRef.current, "voice_mode_toggled", { enabled });
  }, []);

  return {
    onCoachBubblesRendered,
    onStudentMessage,
    onAIResponse,
    onVoiceModeToggle,
  };
}
