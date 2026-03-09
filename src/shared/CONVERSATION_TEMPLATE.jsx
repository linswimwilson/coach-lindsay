// ================================================================
// CONVERSATION TEMPLATE
// Copy this file, rename it (e.g. conv11.jsx), and fill in the
// three sections below. Everything else is handled automatically.
// ================================================================

import CoachLindsay, { buildSystemPrompt } from "../shared/Engine.jsx";

// ================================================================
// 1. CONVERSATION TITLE — shown in the header
// ================================================================
const CONVERSATION_TITLE = "Conversation X: Your Topic Here";

// ================================================================
// 2. CONVERSATION PROMPT — your teaching flow goes here.
//    This is the only thing that changes per conversation.
//    Write it exactly like the existing conversations.
// ================================================================
const CONVERSATION_PROMPT = [
  "THIS IS CONVERSATION X: YOUR TOPIC HERE.",
  "Student has completed Conversations 1 through X-1.",
  "",
  "WHAT THE STUDENT SHOULD LEAVE WITH:",
  "- Learning goal 1",
  "- Learning goal 2",
  "",
  "Key terms in ALL CAPS:",
  "TERM1, TERM2, TERM3.",
  "",
  "================================================================",
  "THE TEACHING FLOW:",
  "================================================================",
  "",
  "STEP 0 — HOOK: Start with disease/concept, not definitions.",
  "'Opening bubble.' (bubble)",
  "'Second bubble.' (bubble)",
  "'Opening question?' (standalone question)",
  "",
  "// Add your steps here...",
  "",
  "================================================================",
  "ABSOLUTE CONTENT BOUNDARIES FOR THIS CONVERSATION:",
  "================================================================",
  "DO NOT mention: [list concepts that belong in later conversations]",
  "If the student asks about something not yet covered: 'Great question, we will get there.'",
].join("\n");

// ================================================================
// 3. INITIAL MESSAGES — the 3 hardcoded opening bubbles.
//    These display immediately when the student opens the conversation.
//    Match the opening of your teaching flow above.
// ================================================================
const INITIAL_MESSAGES = [
  { role: "assistant", content: "Welcome back! Coach Lindsay here.", groupId: "init" },
  { role: "assistant", content: "Your second opening bubble here.", groupId: "init" },
  { role: "assistant", content: "Your opening question here?", groupId: "init" },
];

// ================================================================
// DO NOT EDIT BELOW THIS LINE
// ================================================================
const SYSTEM_PROMPT = buildSystemPrompt(CONVERSATION_PROMPT);
const PRIOR_CONTEXT = [];

export default function Conversation() {
  return (
    <CoachLindsay
      CONVERSATION_TITLE={CONVERSATION_TITLE}
      SYSTEM_PROMPT={SYSTEM_PROMPT}
      INITIAL_MESSAGES={INITIAL_MESSAGES}
      PRIOR_CONTEXT={PRIOR_CONTEXT}
    />
  );
}
