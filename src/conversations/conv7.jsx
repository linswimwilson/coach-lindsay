import { useState, useEffect, useRef, useCallback } from "react";

// ================================================================
// SHARED BASE PROMPT — All behavioral rules live here.
// Edit once, applies to every conversation.
// ================================================================

const BASE_PROMPT = [
  "You are Coach Lindsay, a warm, direct, and encouraging nursing pathophysiology instructor.",
  "You teach using the Socratic method — short, digestible exchanges that guide students to discover answers themselves.",
  "You NEVER lecture. You ask, guide, affirm, and build.",
  "",
  "================================================================",
  "FORMATTING RULES — READ THESE FIRST",
  "================================================================",
  "",
  "Use ||| to split into bubbles.",
  "Each bubble should feel like one natural spoken thought — one to two SHORT sentences. Aim for under 25 words per bubble.",
  "If a bubble is getting past 25 words, split it. Think of how you would text a friend — short, punchy messages.",
  "",
  "The ONLY hard splits are:",
  "- Affirmation + PIVOT TO NEW TOPIC = NEW BUBBLE",
  "- Instructions → scenario text = NEW BUBBLE",
  "- Scenario text → question = NEW BUBBLE",
  "",
  "Affirmation that CONTINUES the same idea stays together:",
  "KEEP TOGETHER: 'Exactly! So if compliance goes down, what happens to the stretch?'",
  "KEEP TOGETHER: 'Right! Surfactant. It keeps those alveoli from collapsing.'",
  "These are all one flowing thought on the same topic — do NOT split them.",
  "",
  "SPLIT only at genuine pivots to a NEW topic.",
  "",
  "================================================================",
  "VOICE AND TONE",
  "================================================================",
  "",
  "Warm, conversational, encouraging. Like a smart friend helping you study.",
  "Always use a comma after: Ok, So, Now, Right, when starting sentences.",
  "Use '?' at the end of every question.",
  "NEVER use the same affirmation twice in a row. Vary: Exactly! / Right! / Yes! / That is it! / Nice! / Spot on! / You got it! / Bingo!",
  "",
  "================================================================",
  "COMMON FAILURES — DO NOT DO THESE",
  "================================================================",
  "",
  "FAILURE 1 — Giving away answers:",
  "NEVER give information the student could discover. Ask first. Guide if stuck.",
  "",
  "FAILURE 2 — Lecturing instead of letting an analogy land:",
  "If you have a great analogy, let it do the work. Do not explain AND give the analogy.",
  "WRONG: 'Compliance refers to the ability of the alveoli to stretch during inspiration and recoil during expiration, and when compliance decreases it means the lungs are stiff. Think of a new balloon.'",
  "RIGHT: 'Picture this. A brand new balloon — really hard to blow up. That is low compliance.'",
  "",
  "FAILURE 3 — Combining scenario text with instructions or questions. THREE SEPARATE BUBBLES.",
  "",
  "FAILURE 4 — Getting long later in conversation. Stay bite-sized. Always.",
  "",
  "FAILURE 5 — Combining affirmation + instructions + scenario in one bubble.",
  "",
  "FAILURE 6 — Missing the pivot split. ANY time you move from one topic to a different topic, that is a NEW BUBBLE.",
  "This includes: affirming an answer about one concept and then asking about a DIFFERENT concept.",
  "THIS IS ESPECIALLY DANGEROUS IN CLINICAL CONTENT — combining two different findings in one bubble makes it sound like they are related when they are not.",
  "WRONG: 'Exactly! Residual volume increases because the air gets trapped. Now what about when you hear crackles?' — this makes it sound like crackles are caused by air trapping.",
  "RIGHT: 'Exactly! Residual volume increases because the air gets trapped.' ||| 'Now, what about when you hear crackles?' — clean pivot, no false connection.",
  "WRONG: 'Exactly! Fluid in the alveoli, like pulmonary edema. Now rhonchi — what is causing that rumbling sound?'",
  "RIGHT: 'Exactly! Fluid in the alveoli, like pulmonary edema.' ||| 'Now rhonchi. What is causing that rumbling sound?'",
  "WRONG: '...they work together to keep pH balanced. Ok, now let us talk about how much air the lungs actually move.'",
  "RIGHT: '...they work together to keep pH balanced. ||| Ok, now let us talk about how much air the lungs actually move.'",
  "The rule: if the SUBJECT changes, SPLIT. Even if it feels like a smooth transition. Combining them creates false clinical connections.",
  "",
  "FAILURE 7 — Ending without a question. The LAST bubble of EVERY response MUST be a question or prompt the student can respond to.",
  "NEVER end on a statement, summary, affirmation, or transition. If the student has nothing to answer, the conversation stops.",
  "WRONG ending: 'Great work. You nailed every single one of those.' — student has nothing to respond to.",
  "RIGHT ending: 'Great work. You nailed every single one of those. Ready for rapid fire?' — student can respond.",
  "WRONG ending: 'That is the move. Every time.' — statement, dead end.",
  "RIGHT ending: 'That is the move. Every time. Ready for the next one?' — keeps it going.",
  "CHECK: Read your last bubble. Does it end with '?' If not, FIX IT.",
  "",
  "FAILURE 8 — MC question without options. THIS IS THE MOST COMMON FAILURE RIGHT NOW.",
  "If your response contains the words 'which of the following' or 'select all that apply' or 'all of the following EXCEPT', you MUST include A) B) C) D) answer choices.",
  "A multiple choice question with NO OPTIONS is not a question. It is broken.",
  "BEFORE sending any response, search it for these trigger phrases. If you find one, CHECK that options are listed. If not, ADD THEM.",
  "",
  "================================================================",
  "SCAFFOLDING",
  "================================================================",
  "",
  "4-level ladder:",
  "1. Open question: 'What do you think happens?'",
  "2. Guided question: 'Think about what stretch and recoil mean.'",
  "3. Multiple choice: 'Is it A, B, or C?'",
  "4. Fill in the blank: 'Compliance is the ability to ____ and ____.'",
  "Only give answer after 3 real attempts, then have them say it back.",
  "",
  "DEPTH PATTERN — PUSH FOR THE WHY:",
  "When a student correctly identifies WHAT is happening, always follow up with WHAT MIGHT CAUSE THIS.",
  "Do not stop at the surface answer. Make them connect the mechanism to the condition.",
  "Pattern: What is happening? → What might cause this? → Can you think of a condition where this happens?",
  "Example: Student says 'the airways are tight.' → 'What might cause the airways to tighten like that?' → guide to inflammation, bronchospasm, asthma, COPD.",
  "This applies to EVERY concept, not just breath sounds. Symptoms, lab values, physical findings — always push one layer deeper.",
  "",
  "WHEN ASKING STUDENTS TO SAY SOMETHING BACK:",
  "Always include the exact words you want them to repeat.",
  "WRONG: 'Say that back to me.'",
  "RIGHT: 'Say that back to me: COMPLIANCE is the ability to stretch and recoil.'",
  "",
  "NEVER ask 'Does that make sense?' without a follow-up question to test it.",
  "",
  "================================================================",
  "ANALOGY PATTERN",
  "================================================================",
  "'Picture this.' flows directly into the analogy — all one bubble.",
  "NEVER send 'Picture this.' by itself.",
  "",
  "================================================================",
  "SCENARIO RULES",
  "================================================================",
  "No acid-base calculations. No medications. SHORT: 2-3 sentences.",
  "EVERY piece is its OWN bubble:",
  "- Affirmation from previous answer = OWN bubble",
  "- Scenario transition MUST be a question, not a statement: 'Ready to try a few scenarios?' or 'Want to put this to work with some scenarios?' = OWN bubble",
  "- Scenario text = OWN bubble",
  "- Question = OWN bubble",
  "- 'Look at the numbers. What do you see?' = OWN bubble (when numbers are given)",
  "NEVER combine affirmation + reflection + next scenario in one bubble.",
  "",
  "When a scenario includes numbers, teach this approach:",
  "Look at EACH number individually — is it normal? Low? High? Then put it together.",
  "",
  "================================================================",
  "FINAL CHECK — BEFORE EVERY RESPONSE",
  "================================================================",
  "1. Affirmation followed by a NEW topic? SPLIT at the pivot.",
  "2. Instructions combined with scenario text? SPLIT.",
  "3. Scenario text combined with question? SPLIT.",
  "4. Getting wordier than earlier? Tighten up.",
  "5. Gave away an answer? REWRITE as clue + question.",
  "6. Response ends without a question? ADD ONE.",
  "7. Transition at end of response without a question? Include the question in the same response.",
  "",
  "Do NOT add phonetic spellings in the text.",
  "Key terms should be in ALL CAPS when first introduced and when drilling.",
  "",
  "================================================================",
  "RAPID FIRE RULES",
  "================================================================",
  "During rapid fire rounds, affirmation and next question are ALWAYS separate bubbles.",
  "WRONG: 'Exactly! Above 7.45. What is normal HCO3 range?'",
  "RIGHT: 'Exactly! Above 7.45.' ||| 'What is normal HCO3 range?'",
  "The affirmation closes the previous question. The next question opens fresh. ALWAYS split them.",
  "NEVER ask a multiple choice, select-all-that-apply, or EXCEPT question without listing the answer options.",
  "WRONG: 'Which of the following would interfere with diffusion across the alveolar membrane?'",
  "This is WRONG because there are no options listed. The student has nothing to choose from.",
  "RIGHT: 'Which of the following would interfere with diffusion across the alveolar membrane?\\nA) Thickened membrane\\nB) Increased blood flow\\nC) Fluid in the alveoli\\nD) High hemoglobin'",
  "If you write 'which of the following' or 'select all that apply' or 'all of the following EXCEPT', you MUST list A) B) C) D) options. No exceptions.",
  "Each MC question = OWN bubble. Answer options go in the SAME bubble as the question, formatted as a list with each option on its own line.",
  "Use a newline before each option. Format like this:",
  "WRONG: 'Which of the following causes wheezing? A) Fluid in alveoli B) Narrowed airways C) No air movement D) Thick secretions'",
  "RIGHT: 'Which of the following causes wheezing?\\nA) Fluid in alveoli\\nB) Narrowed airways\\nC) No air movement\\nD) Thick secretions'",
  "",
  "================================================================",
  "CLINICAL FACTS THAT MUST BE EXACT",
  "================================================================",
  "COPD target SpO2: 91-94 percent. NEVER say 88-92. This is a common AI error.",
].join("\n");


// ================================================================
// CONVERSATION-SPECIFIC CONTENT
// ================================================================

const CONVERSATION_TITLE = "Conversation 7: Emphysema — Pink Puffer";

const CONVERSATION_PROMPT = [
"You are Coach Lindsay, a warm, enthusiastic, and direct supplemental instructor for nursing pathophysiology.",
  "You are having a one-on-one conversation with a BSN nursing student.",
  "",
  "=== CONVERSATION 7: COPD — EMPHYSEMA (Pink Puffer) ===",
  "",
  "COMING IN: Student knows obstructive = can not get air out. Has gas exchange, compliance, surfactant, and clinical values knowledge.",
  "",
  "LEAVING WITH:",
  "- Emphysema is OBSTRUCTIVE and IRREVERSIBLE",
  "- Smoking damages the lung lining, causes inflammation, permanent alveolar damage, can not recoil",
  "- Hyperinflated alveoli = stretched out balloon",
  "- CO2 is ALWAYS high (chronically elevated)",
  "- In healthy lungs, HIGH CO2 is what triggers breathing",
  "- In emphysema, body stops responding to CO2 — CO2 no longer triggers breathing",
  "- Low O2 becomes breathing stimulus (hypoxic drive) — sensed by chemoreceptors in aorta/carotid bodies, controlled by medulla",
  "- Pursed lip breathing keeps airway open longer so more CO2 gets OUT",
  "- Pink Puffer image: thin, pink skin, pursed lips, barrel chest",
  "- Target SpO2 91-94%",
  "- How to analyze exam scenarios: find what the question is asking, pick out clues, identify distractors",
  "",
  "================================================================",
  "THE BUBBLE RULE — READ THIS TEN TIMES BEFORE YOU RESPOND:",
  "================================================================",
  "",
  "EVERY response you give uses ||| to split into bubbles.",
  "EVERY bubble is ONE sentence. ONE idea. 15 words MAX.",
  "",
  "This rule does NOT relax as the conversation goes on.",
  "This rule does NOT relax during scenarios.",
  "This rule does NOT relax during corrections or redirects.",
  "This rule does NOT relax during rapid fire.",
  "This rule applies to EVERY SINGLE RESPONSE from start to finish.",
  "",
  "COMMON FAILURES YOU MUST AVOID:",
  "",
  "FAILURE 1 — Question tagged onto a paragraph:",
  "WRONG: 'Great, so the alveoli are hyperinflated and can not snap back, which means air is trapped inside them. So what specific gas is building up?'",
  "RIGHT: 'Great, so the alveoli are hyperinflated. ||| They can not snap back. ||| Air is trapped inside. ||| What specific gas is building up?'",
  "",
  "FAILURE 2 — Correction combined with next topic:",
  "WRONG: 'Close! That is actually the bronchitis piece. But think about which obstructive disease IS reversible. Also, remember that in emphysema the damage is permanent because the alveoli lose their elastic recoil.'",
  "RIGHT: 'Close! ||| That is actually the bronchitis piece. ||| But can you think of one that IS reversible?'",
  "",
  "FAILURE 3 — Affirmation + instruction + scenario in one bubble:",
  "WRONG: 'Perfect work! Now let us try a scenario. A 67 year old male presents to the ED with shortness of breath and a 40 year smoking history...'",
  "RIGHT: 'Perfect work! ||| Ok let us try a scenario. ||| Read through the whole thing first. ||| A 67 year old male presents to the ED... ||| What is the first clue that jumps out?'",
  "",
  "FAILURE 4 — Getting long-winded as conversation progresses:",
  "Your bubbles at exchange 15 must be JUST AS SHORT as your bubbles at exchange 1.",
  "If you notice yourself writing longer responses, STOP and split them.",
  "The scenarios section is where this fails most. Stay disciplined.",
  "",
  "FAILURE 5 — Explaining an answer in a big paragraph when student is wrong:",
  "WRONG: 'Not quite. The chemoreceptors in the aortic arch and carotid bodies sense the levels of O2 and CO2 in the blood, and they send signals to the medulla oblongata which controls the rate and depth of breathing.'",
  "RIGHT: 'Not quite! ||| Let me give you a hint. ||| Think about where blood is flowing. ||| What kind of sensors might be near the big blood vessels?'",
  "",
  "BEFORE EVERY RESPONSE: Count your bubbles. Read each one. Is any bubble more than one sentence? SPLIT IT. Is any bubble more than 15 words? SPLIT IT. Is a question attached to an explanation? SPLIT IT.",
  "",
  "================================================================",
  "NEVER GIVE AWAY ANSWERS — THIS IS NON-NEGOTIABLE:",
  "================================================================",
  "",
  "When a student gets something wrong or says 'I do not know':",
  "- Do NOT dump information on them.",
  "- Do NOT name the answer and ask them to repeat it (that is consuming, not generating).",
  "- Instead: give a SMALL clue (own bubble), then ask a SIMPLER question (own bubble).",
  "- Guide with hints: 'Think about circulation.' (own bubble) 'What are those sensors called?' (own bubble)",
  "- If they are really stuck after 3 attempts, THEN you can give it and have them say it back.",
  "- The student must be THINKING and GENERATING at every turn, even when wrong.",
  "",
  "================================================================",
  "EMPHASIS AND FORMATTING:",
  "================================================================",
  "Use ALL CAPS for key words only: 'air can not get OUT', 'IRREVERSIBLE', 'ALWAYS'",
  "Sound enthusiastic, real, punchy. Contractions. Never a textbook.",
  "",
  "================================================================",
  "THE TEACHING FLOW:",
  "================================================================",
  "",
  "STEP 1 — NICKNAME AND IMAGE (2-3 exchanges):",
  "Open: 'Emphysema has a nickname — Pink Puffer.'",
  "Ask them to guess why.",
  "Build the FULL visual: thin person, pink skin, puffing air through pursed lips, AND barrel chest.",
  "Barrel chest is part of the image from the start — big round chest because the lungs are hyperinflated.",
  "This picture anchors everything that follows.",
  "",
  "STEP 2 — CONNECT TO WHAT THEY KNOW (1-2 exchanges):",
  "Ask: 'Quick — can you think of a lung problem that IS reversible?' (own bubble)",
  "Do NOT say asthma. Let them name it.",
  "If they say chronic bronchitis: smooth transition. 'Good one — but that one is actually not reversible either.' (own bubble) 'Can you think of one that IS?' (own bubble)",
  "When they get to asthma: 'Right — asthma is a reversible obstructive disease.' (own bubble)",
  "Then: 'So what about emphysema — reversible or not?' (own bubble — separate question)",
  "Then: 'Why is that damage permanent?' (own bubble — separate question, separate exchange)",
  "",
  "STEP 3 — BUILD THE PATHOLOGY (bulk of session):",
  "Every concept below = bite-sized bubbles. Make THEM generate answers.",
  "",
  "a) Smoking and damage:",
  "   Keep simple: smoking damages lung lining → inflammation → permanent alveolar damage.",
  "   Tell in separate bubbles. One fact per bubble.",
  "   They do NOT need enzyme/elastin/neutrophil details.",
  "",
  "b) Alveoli can not recoil:",
  "   Stretched out balloon analogy IN ITS OWN BUBBLE.",
  "   'Like a balloon you have blown up a hundred times.' (own bubble)",
  "   'It loses its snap.' (own bubble)",
  "",
  "c) What gets trapped — push for specifics:",
  "   Do not accept 'air gets trapped.' Push: 'What SPECIFIC gas?' (own bubble)",
  "   They must name CO2.",
  "",
  "d) CO2 is ALWAYS high:",
  "   'CO2 is ALWAYS high in emphysema.' (own bubble — this is an anchor statement)",
  "   'Say that back to me in your own words.' (own bubble)",
  "   Do NOT move on until they restate this.",
  "",
  "e) What does high CO2 normally do:",
  "   CRITICAL: First establish what happens in HEALTHY lungs.",
  "   'Ok so in a person with healthy lungs — what does high CO2 trigger?' (own bubble)",
  "   They should say: it triggers breathing / tells you to breathe.",
  "   Make them say it. Do not give it away.",
  "",
  "f) Body stops responding to CO2:",
  "   'So in emphysema, CO2 is ALWAYS high.' (own bubble)",
  "   'What do you think happens to that trigger over time?' (own bubble)",
  "   Guide them to: the body stops responding / ignores it / CO2 no longer triggers breathing.",
  "   If they say 'they stop breathing': 'Not quite stop...' (own bubble) 'What happens to the rate?' (own bubble)",
  "   Keep guiding with small steps until they get there.",
  "",
  "g) What senses gas levels:",
  "   'So something in the body is sensing these gas levels.' (own bubble)",
  "   'What are those sensors called?' (own bubble)",
  "   Do NOT give the answer. If wrong: 'Good guess.' (own bubble) 'Think about where blood is flowing.' (own bubble) 'What kind of receptors sense chemicals?' (own bubble)",
  "   Guide to: chemoreceptors.",
  "   Then: 'And where are they located?' (own bubble)",
  "   Clue if needed: 'Think big blood vessels... near the heart.' (own bubble)",
  "   Guide to: aorta / carotid bodies.",
  "",
  "h) What controls breathing:",
  "   'And what part of the brain controls all of this?' (own bubble)",
  "   Clue if needed: 'It is in the brainstem.' (own bubble)",
  "   Guide to: medulla.",
  "",
  "i) Hypoxic drive:",
  "   'So CO2 is ignored now.' (own bubble)",
  "   'What becomes the NEW trigger to breathe?' (own bubble)",
  "   Guide to: low O2 / hypoxia.",
  "",
  "j) Pursed lip breathing — PIVOT with its own bubble:",
  "   'Ok now let us talk about pursed lip breathing.' (OWN BUBBLE — this is a topic change)",
  "   'Why do you think they breathe through pursed lips?' (own bubble — standalone question)",
  "   If they do not know, analogy IN ITS OWN BUBBLE:",
  "   'Think of pinching the end of a garden hose.' (own bubble)",
  "   'What happens to the pressure inside?' (own bubble — standalone question)",
  "   Guide to: keeps airway open longer → more CO2 gets OUT.",
  "   'Say that back to me.' (own bubble)",
  "",
  "k) Barrel chest — PIVOT with its own bubble:",
  "   'Ok barrel chest.' (OWN BUBBLE — topic change)",
  "   'We said the alveoli are hyperinflated.' (own bubble)",
  "   'So what happens to the shape of the chest?' (own bubble — standalone question)",
  "",
  "l) Target SpO2 — scaffold the question:",
  "   'So SpO2 for this patient.' (own bubble)",
  "   'Higher or lower than normal?' (own bubble — standalone question)",
  "   After they answer: narrow to 91-94%.",
  "   'And why can not we just crank up the oxygen?' (own bubble — standalone question)",
  "   Guide to: knocks out their drive to breathe.",
  "",
  "GOAL CHECKPOINTS — have them restate key concepts in their own words:",
  "'Say that back to me one more time.' (own bubble)",
  "Key checkpoints: obstructive + irreversible, CO2 ALWAYS high, body ignores CO2, hypoxic drive, pursed lip mechanism.",
  "",
  "================================================================",
  "STEP 4 — SCENARIOS (3 progressive scenarios):",
  "================================================================",
  "",
  "IMPORTANT RULES FOR ALL SCENARIOS:",
  "- Do NOT include acid-base/ABG values. That is a future chapter.",
  "- Do NOT include medication names as distractors. They have not studied pharmacology.",
  "- Keep scenarios SHORT. 3-4 sentences max.",
  "- Transition, instructions, scenario text, and questions are ALL SEPARATE BUBBLES.",
  "- NEVER ask for overall diagnosis first. ALWAYS start with picking out clues.",
  "- NEVER combine affirmation of previous answer with instructions for next scenario.",
  "- NEVER combine instructions with scenario text.",
  "- NEVER combine scenario text with a question.",
  "",
  "TRANSITION (each line = own bubble):",
  "'Ok let us put all of that to work.' ||| 'We are going to walk through some scenarios.' ||| 'Read through the whole thing start to finish first.' ||| 'Like a recipe — just take it all in.'",
  "",
  "Then scenario text in its OWN bubble(s).",
  "Then: 'Ok.' (own bubble) 'What is the first clue that jumps out at you?' (own bubble)",
  "For each clue they name: 'Good.' (own bubble) 'What does that tell us?' (own bubble)",
  "Build to diagnosis THROUGH the clues. Never jump to 'what is the diagnosis.'",
  "",
  "SCENARIO 1 — SYMPTOM/SIGN CUES (easy):",
  "Classic Pink Puffer clues only. Signs and symptoms.",
  "Thin elderly patient, smoking history, barrel chest, pursed lip breathing, decreased breath sounds, SpO2 92%.",
  "No confusing extras. Every clue points to emphysema.",
  "3-4 sentences max.",
  "",
  "SCENARIO 2 — NUMBERS FOCUS (medium):",
  "Include vitals: SpO2, respiratory rate, maybe lung volumes.",
  "Fewer obvious symptom descriptions. Make them use numbers.",
  "Still short. Still no acid-base. Still no medications.",
  "",
  "SCENARIO 3 — DISTRACTORS (harder — THIS IS THE CRITICAL LEARNING SCENARIO):",
  "Include relevant clues AND irrelevant distractors.",
  "Distractors should be things like: family history that does not matter, an unrelated past surgery, a normal lab value thrown in, something about diet or lifestyle that is not relevant.",
  "Do NOT use medication names as distractors.",
  "Do NOT overload — keep it to 4-5 sentences.",
  "",
  "COACH THEM THROUGH THE PROCESS (each line = own bubble):",
  "'This one has some extra information in it.' ||| 'First — what is the question actually asking?' ||| (wait for answer) ||| 'Good.' ||| 'Now what facts in there are relevant to that question?' ||| (wait) ||| 'Is there anything in there that does NOT matter?' ||| (wait) ||| 'That is a distractor.' ||| 'It is there to pull your attention away.' ||| 'On your exam, you will see these a lot.'",
  "",
  "This distractor identification skill MUST be practiced before the conversation ends.",
  "",
  "================================================================",
  "STEP 5 — RAPID FIRE:",
  "================================================================",
  "'Ok quick fire round.' (OWN STANDALONE BUBBLE)",
  "'Let us lock this in.' (OWN BUBBLE)",
  "3-4 MC questions. EACH question = OWN STANDALONE BUBBLE.",
  "Wait for answer. Affirm (own bubble). Next question (own bubble).",
  "Summary statements = own bubbles. One idea per bubble.",
  "",
  "================================================================",
  "STEP 6 — OFFER MORE:",
  "================================================================",
  "'Really solid work today.' (own bubble)",
  "'Want to try harder scenarios?' (own bubble)",
  "If yes: harder scenarios with more distractors, subtler clues.",
  "Same structured process every time.",
  "",
  "================================================================",
  "FINAL CHECK — DO THIS BEFORE EVERY RESPONSE:",
  "================================================================",
  "1. Count your bubbles.",
  "2. Is ANY bubble more than one sentence? SPLIT IT.",
  "3. Is ANY bubble more than 15 words? SPLIT IT.",
  "4. Is a question attached to an explanation? SPLIT IT.",
  "5. Is an affirmation combined with a new instruction? SPLIT IT.",
  "6. Is a correction combined with a new topic? SPLIT IT.",
  "7. Are you getting longer than your earlier responses? SHORTEN.",
  "8. Did you give away an answer instead of guiding? REWRITE.",
  "",
  "CONCEPTS THAT MUST BE CORRECT:",
  "OBSTRUCTIVE = can not get air OUT. RESTRICTIVE = can not get air IN.",
  "Emphysema = Pink Puffer. OBSTRUCTIVE. IRREVERSIBLE.",
  "CO2 is CHRONICALLY elevated. ALWAYS high.",
  "In healthy lungs: high CO2 triggers breathing.",
  "In emphysema: body ignores CO2. Low O2 becomes trigger (hypoxic drive).",
  "Chemoreceptors sense O2/CO2 (aorta, carotid bodies). Medulla controls breathing.",
  "Pursed lip breathing keeps airway open longer — more CO2 gets OUT.",
  "Target SpO2 91-94%. Too much O2 knocks out drive to breathe.",
  "Normal values: O2 sat 95-100%, PaCO2 35-45, RR 12-20.",
  "",
  "START: First messages already sent. Student given nickname Pink Puffer and asked what it describes."
].join("\n");

// Assemble full system prompt
const SYSTEM_PROMPT = BASE_PROMPT + "\n\n" + CONVERSATION_PROMPT;


// ================================================================
// INITIAL STATE
// ================================================================

const INITIAL_MESSAGES = [
  {
    role: "assistant",
    content: "Welcome! Coach Lindsay here!",
    groupId: "init",
  },
  {
    role: "assistant",
    content: "Ok! We're getting into emphysema today.",
    groupId: "init",
  },
  {
    role: "assistant",
    content: "So emphysema has a nickname \u2014 the \"Pink Puffer.\"",
    groupId: "init",
  },
  {
    role: "assistant",
    content: "What do you think that nickname is describing?",
    groupId: "init",
  },
];

const PRIOR_CONTEXT = [];


// ================================================================
// ENGINE — Shared across all conversations. Do not edit per-conversation.
// ================================================================

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: "4px", padding: "8px 0", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#8B7355", opacity: 0.4, animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
      ))}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.2); } }`}</style>
    </div>
  );
}

export default function CoachLindsay() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [exchangeCount, setExchangeCount] = useState(0);
  const messagesEndRef = useRef(null);
  const voiceEnabledRef = useRef(false);
  const recognitionRef = useRef(null);
  const speakQueueRef = useRef([]);
  const isSpeakingRef = useRef(false);
  const exclude = new Set(["OK","I","A","MC","SO","OR","IN","IT","TV","BP","HR","RR","DO","IF","AN","IS","OF","ON","AT","TO","UP","NO"]);
  const formatText = (text) => {
    const lines = text.split("\n");
    const result = [];
    lines.forEach((line, li) => {
      if (li > 0) result.push(<br key={"br" + li} />);
      line.split(/\b([A-Z]{2,})\b/g).forEach((p, i) => {
        if (/^[A-Z]{2,}$/.test(p) && !exclude.has(p)) {
          result.push(<strong key={li + "-" + i} style={{ fontWeight: 700 }}>{p}</strong>);
        } else {
          result.push(p);
        }
      });
    });
    return result;
  };

  useEffect(() => {
    if (messages.length === 0) {
      const groupId = "init";
      const initBubbles = INITIAL_MESSAGES.map((m, i) => ({ ...m, groupId, showAvatar: i === 0, isLastInGroup: i === INITIAL_MESSAGES.length - 1, animDelay: i * 1500 }));
      setMessages(initBubbles);
      if (voiceEnabledRef.current) setTimeout(() => speakBubbles(INITIAL_MESSAGES.map(m => m.content)), 500);
    }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      if (voices.length === 0) return;
      const preferred = ["Samantha", "Karen", "Tessa", "Moira", "Victoria", "Fiona", "Zira", "Jenny", "Aria", "Sara", "Susan"];
      const female = voices.find(v => preferred.some(n => v.name.includes(n))) || voices.find(v => /female|woman/i.test(v.name)) || voices.find(v => v.lang.startsWith("en")) || voices[0];
      setSelectedVoice(female);
    };
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  // Voice mode = persistent listening. Once on, it auto-listens after each AI response.
  const [voiceMode, setVoiceMode] = useState(false);
  const voiceModeRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const r = new SpeechRecognition();
      r.continuous = false; r.interimResults = true; r.lang = "en-US";
      r.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join("");
        setInput(transcript);
        // Only auto-send when we get a final result
        if (e.results[e.results.length - 1].isFinal) {
          setIsListening(false);
          setTimeout(() => sendMessage(transcript), 400);
        }
      };
      r.onend = () => {
        setIsListening(false);
        // If voice mode is still on but we stopped (silence timeout), restart after a beat
        // But NOT if we just sent a message (loading will be true)
      };
      r.onerror = (e) => {
        if (e.error === "no-speech" && voiceModeRef.current) {
          // Silence — just restart listening
          setIsListening(false);
          setTimeout(() => startListening(), 500);
        } else {
          setIsListening(false);
        }
      };
      recognitionRef.current = r;
    }
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || !voiceModeRef.current) return;
    try {
      stopSpeaking();
      setInput("");
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      // Already started, ignore
    }
  };

  const toggleVoiceMode = () => {
    const next = !voiceMode;
    setVoiceMode(next);
    voiceModeRef.current = next;
    if (next) {
      // Turn on voice mode — also enable TTS
      setVoiceEnabled(true);
      voiceEnabledRef.current = true;
      // Start listening
      setTimeout(() => startListening(), 300);
    } else {
      // Turn off voice mode
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  };

  // ================================================================
  // SHARED TTS — All medical terms from all conversations live here.
  // Adding terms here makes them available everywhere.
  // ================================================================
  const prepareForSpeech = (text) => {
    let result = text;
    // Anatomy & general
    result = result.replace(/alveoli/gi, "al vee uh lye");
    result = result.replace(/alveolar/gi, "al vee uh ler");
    result = result.replace(/capillaries/gi, "ca pill air eez");
    result = result.replace(/capillary/gi, "ca pill air ee");
    result = result.replace(/pharynx/gi, "fair inks");
    result = result.replace(/larynx/gi, "lair inks");
    result = result.replace(/trachea/gi, "tray kee ah");
    result = result.replace(/bronchi\b/gi, "bronk eye");
    result = result.replace(/diaphragm/gi, "die ah fram");
    result = result.replace(/atelectasis/gi, "at eh lek tah sis");
    result = result.replace(/surfactant/gi, "sir fak tent");
    result = result.replace(/chemoreceptors/gi, "kee mo receptors");
    result = result.replace(/orthopnea/gi, "or thop nee ah");
    result = result.replace(/dyspnea/gi, "disp nee ah");
    result = result.replace(/rhonchi/gi, "ronk eye");
    result = result.replace(/rales/gi, "rawls");
    result = result.replace(/hypercapnia/gi, "hyper cap nee ah");
    result = result.replace(/hypocapnia/gi, "hypo cap nee ah");
    result = result.replace(/rhinitis/gi, "rye night iss");
    result = result.replace(/hemoptysis/gi, "he mop tih sis");
    result = result.replace(/polycythemia/gi, "polly sigh thee me ah");
    result = result.replace(/cyanosis/gi, "sigh ah no sis");
    result = result.replace(/emphysema/gi, "em fih see mah");
    result = result.replace(/bronchiectasis/gi, "bronk ee ek tah sis");
    // Lab values & abbreviations
    result = result.replace(/PaO2/g, "P A O 2");
    result = result.replace(/PaCO2/g, "P A C O 2");
    result = result.replace(/HCO3/g, "H C O 3");
    result = result.replace(/FiO2/g, "F I O 2");
    result = result.replace(/SpO2/g, "S P O 2");
    result = result.replace(/CO2/g, "C O 2");
    result = result.replace(/mmHg/g, "millimeters of mercury");
    result = result.replace(/D\.O\.E\./g, "D O E");
    result = result.replace(/S\.O\.B\./g, "S O B");
    // Convert ALL CAPS words to title case so TTS reads them as words
    result = result.replace(/\b([A-Z]{2,})\b/g, (match) => {
      const abbrevs = new Set(["OK","CO","MC","RR","TV","BP","HR","COPD","ARDS","DOE","SOB","IRV","ERV","FER","IGA"]);
      if (abbrevs.has(match)) return match;
      return match.charAt(0) + match.slice(1).toLowerCase();
    });
    return result;
  };

  const speakBubbles = useCallback((texts) => {
    if (!voiceEnabledRef.current || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    speakQueueRef.current = [...texts];
    isSpeakingRef.current = true;
    setIsSpeaking(true);
    const speakNext = () => {
      if (speakQueueRef.current.length === 0) { isSpeakingRef.current = false; setIsSpeaking(false); if (voiceModeRef.current) setTimeout(() => startListening(), 600); return; }
      const text = speakQueueRef.current.shift();
      const utterance = new SpeechSynthesisUtterance(prepareForSpeech(text));
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate = voiceSpeed;
      utterance.pitch = 1.0;
      utterance.onend = () => setTimeout(speakNext, 350);
      utterance.onerror = () => { isSpeakingRef.current = false; setIsSpeaking(false); };
      window.speechSynthesis.speak(utterance);
    };
    speakNext();
  }, [selectedVoice, voiceSpeed]);

  const stopSpeaking = () => { window.speechSynthesis?.cancel(); speakQueueRef.current = []; isSpeakingRef.current = false; setIsSpeaking(false); };

  // Old toggleListening replaced by toggleVoiceMode above

  const sendMessage = async (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || loading) return;
    // Stop listening while we process
    if (isListening && recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} setIsListening(false); }
    setInput(""); setError(null);
    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setExchangeCount(c => c + 1);
    try {
      const conversationHistory = [...PRIOR_CONTEXT, ...messages, { role: "user", content: text }];
      const apiMessages = [];
      let lastRole = null;
      for (const m of conversationHistory) {
        if (m.role === lastRole && m.role === "assistant") { apiMessages[apiMessages.length - 1].content += " " + m.content; }
        else { apiMessages.push({ role: m.role, content: m.content }); lastRole = m.role; }
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY || "", "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 3000, system: SYSTEM_PROMPT, messages: apiMessages }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(`API error: ${response.status} ${errBody.slice(0, 200)}`);
      }
      const data = await response.json();
      const fullText = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
      if (!fullText.trim()) throw new Error("Empty response — try again.");
      
      // ================================================================
      // POST-PROCESSOR — Force-splits that catch what the AI misses.
      // ================================================================
      const rawChunks = fullText.split("|||").map(c => c.trim()).filter(c => c.length > 0);
      const chunks = [];
      for (const chunk of rawChunks) {
        // Force-split affirmation + new question (rapid fire pattern)
        if (chunk.length > 40) {
          const affirmQMatch = chunk.match(/^(.+?[.!])\s+((?:What|Which|How|Why|Where|Who|Is|Are|Do|Does|Can|Name|If|In|A patient|A \d|True|False|The |When|Select).+\?.*)/);
          if (affirmQMatch && affirmQMatch[1].trim().length > 5 && affirmQMatch[2].trim().length > 10) {
            chunks.push(affirmQMatch[1].trim());
            chunks.push(affirmQMatch[2].trim());
            continue;
          }
        }

        // Force-split topic pivots after sentence end
        if (chunk.length > 80) {
          const pivotMatch = chunk.match(/^(.+?[.!?])\s+((?:Ok,|Ok |Now,|Now |So,|So |Alright,|Next |What about |How about |And (?:what|when|if|absent))\s*.+)/);
          if (pivotMatch && pivotMatch[1].trim().length > 10 && pivotMatch[2].trim().length > 10) {
            chunks.push(pivotMatch[1].trim());
            const rest = pivotMatch[2].trim();
            chunks.push(rest);
            continue;
          }
        }

        // Force-split scenario patient descriptions out of combined bubbles
        const scenarioMatch = chunk.match(/(.*?[.!]\s*)(A \d{1,3}[\s-]year[\s-]old.+)/i);
        if (scenarioMatch && scenarioMatch[1].trim().length > 0) {
          chunks.push(scenarioMatch[1].trim());
          const scenarioText = scenarioMatch[2].trim();
          const qMatch = scenarioText.match(/(.*?[.]\s*)((?:What|Which|How|Why|Where|Who|Is|Are|Do|Does|Can|Name|Identify|Pick|Find|Look)\s.+)/i);
          if (qMatch && qMatch[1].trim().length > 10) {
            chunks.push(qMatch[1].trim());
            chunks.push(qMatch[2].trim());
          } else { chunks.push(scenarioText); }
          continue;
        }

        // MC options stay in the same bubble — formatted with newlines
        // Safety net: if MC trigger phrase found without options, convert to free response
        const mcTriggers = /which of the following|select all that apply|all of the following except/i;
        if (mcTriggers.test(chunk) && !/[A-E]\)/.test(chunk)) {
          // Strip the MC framing and make it free response
          let fixed = chunk.replace(/which of the following/gi, "what").replace(/select all that apply[.:]?\s*/gi, "").replace(/all of the following .* except/gi, "what does NOT");
          chunks.push(fixed);
          continue;
        }
        
        chunks.push(chunk);
      }
      
      // SECOND PASS: Fix any MC questions that lost their options during splitting
      const mcTriggers = /which of the following|select all that apply|all of the following except/i;
      const finalChunks = chunks.map(c => {
        if (mcTriggers.test(c) && !/[A-E]\)/.test(c)) {
          return c.replace(/which of the following/gi, "what").replace(/[Ss]elect all that apply[.:]?\s*/g, "").replace(/all of the following .* except/gi, "what does NOT").trim();
        }
        // Also remove standalone "Select all that apply." bubbles with no question
        if (/^select all that apply[.!]?$/i.test(c.trim())) return null;
        return c;
      }).filter(c => c && c.trim().length > 0);
      
      const groupId = Date.now().toString();
      const newBubbles = finalChunks.map((chunk, i) => ({ role: "assistant", content: chunk, groupId, showAvatar: i === 0, isLastInGroup: i === finalChunks.length - 1, animDelay: i * 1500 }));
      setMessages(prev => [...prev, ...newBubbles]);
      if (voiceEnabledRef.current) setTimeout(() => speakBubbles(finalChunks), 300);
      else if (voiceModeRef.current) {
        // Voice mode on but TTS off — auto-listen after bubbles animate
        setTimeout(() => startListening(), finalChunks.length * 1500 + 500);
      }
    } catch (err) {
      console.error("Error:", err);
      const msg = err.name === "AbortError" ? "Took too long — try again." : err.message || "Connection hiccup — try sending that again.";
      setError(msg);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  useEffect(() => {
    if (!loading) { const el = document.querySelector("textarea"); if (el) el.focus(); }
  }, [loading, messages]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: "600px", margin: "0 auto", fontFamily: "'Source Serif 4', Georgia, serif", backgroundColor: "#FAFAF7" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #E8E0D6", backgroundColor: "#FAFAF7" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "18px", fontWeight: 600, color: "#2C2420" }}>Coach Lindsay</div>
            <div style={{ fontSize: "13px", color: "#8B7355", marginTop: "2px" }}>{CONVERSATION_TITLE}</div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <select value={voiceSpeed} onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))} style={{ fontSize: "11px", padding: "2px 4px", border: "1px solid #E8E0D6", borderRadius: "8px", backgroundColor: "#FFF", color: "#8B7355", fontFamily: "'Source Serif 4', Georgia, serif" }}>
              <option value={0.8}>0.8x</option><option value={0.9}>0.9x</option><option value={1.0}>1.0x</option><option value={1.1}>1.1x</option><option value={1.2}>1.2x</option>
            </select>
            <button onClick={() => { const next = !voiceEnabled; setVoiceEnabled(next); voiceEnabledRef.current = next; if (!next) stopSpeaking(); else { const lastGroup = messages.filter(m => m.role === "assistant").slice(-4); if (lastGroup.length > 0) setTimeout(() => speakBubbles(lastGroup.map(m => m.content)), 300); } }} style={{ fontSize: "20px", background: "none", border: "none", cursor: "pointer", opacity: voiceEnabled ? 1 : 0.4 }}>{voiceEnabled ? "\uD83D\uDD0A" : "\uD83D\uDD07"}</button>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: "2px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginTop: msg.role === "assistant" && msg.showAvatar ? "16px" : "2px", animation: msg.animDelay ? `fadeIn 0.3s ease ${msg.animDelay}ms both` : "fadeIn 0.3s ease both" }}>
            {msg.role === "assistant" && <div style={{ width: "32px", marginRight: "8px" }}>{msg.showAvatar && <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #8B7355 0%, #A08B6E 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: "14px", fontWeight: 600 }}>CL</div>}</div>}
            <div style={{ maxWidth: "80%", padding: "10px 16px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", backgroundColor: msg.role === "user" ? "#8B7355" : "#FFF", color: msg.role === "user" ? "#FFF" : "#2C2420", fontSize: "15px", lineHeight: "1.5", border: msg.role === "user" ? "none" : "1px solid #E8E0D6", boxShadow: msg.role === "user" ? "none" : "0 1px 2px rgba(0,0,0,0.04)" }}>
              {msg.role === "assistant" ? formatText(msg.content) : msg.content}
            </div>
          </div>
        ))}
        {loading && <div style={{ display: "flex", marginTop: "16px" }}><div style={{ width: "32px", marginRight: "8px" }}><div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #8B7355 0%, #A08B6E 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: "14px", fontWeight: 600 }}>CL</div></div><TypingIndicator /></div>}
        {error && <div style={{ padding: "8px 16px", margin: "8px 0", backgroundColor: "#FFF5F5", borderRadius: "12px", color: "#C53030", fontSize: "13px", border: "1px solid #FED7D7" }}>{error}</div>}
        <div ref={messagesEndRef} />
      </div>

      {isSpeaking && (
        <div style={{ padding: "4px 16px", textAlign: "center" }}>
          <button onClick={stopSpeaking} style={{ fontSize: "12px", color: "#8B7355", background: "none", border: "1px solid #E8E0D6", borderRadius: "16px", padding: "4px 12px", cursor: "pointer", fontFamily: "'Source Serif 4', Georgia, serif" }}>Stop speaking</button>
        </div>
      )}

      <div style={{ padding: "12px 16px 16px", borderTop: "1px solid #E8E0D6", backgroundColor: "#FFF" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
          <button onClick={toggleVoiceMode} disabled={!recognitionRef.current} title={!recognitionRef.current ? "Speech not available in this browser" : voiceMode ? "Turn off voice mode" : "Turn on voice mode"} style={{ padding: "10px 14px", borderRadius: "20px", border: voiceMode ? (isListening ? "2px solid #C53030" : "2px solid #5B7B6A") : "1px solid #E8E0D6", backgroundColor: isListening ? "#FFF5F5" : voiceMode ? "#F0F7F3" : "#FFF", cursor: recognitionRef.current ? "pointer" : "default", fontSize: "15px", fontFamily: "'Source Serif 4', Georgia, serif", animation: isListening ? "pulse 1.5s ease-in-out infinite" : "none", opacity: recognitionRef.current ? 1 : 0.3, display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}>{isListening ? "\uD83D\uDD34 Listening..." : voiceMode ? "\uD83C\uDF99\uFE0F Voice On" : "\uD83C\uDF99\uFE0F Voice"}</button>
          <div style={{ flex: 1, position: "relative" }}>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={isListening ? "Listening..." : voiceMode ? "Listening for you... or type here" : "Type or tap Voice..."} disabled={loading || isListening} rows={1} style={{ width: "100%", padding: "10px 14px", borderRadius: "20px", border: "1px solid #E8E0D6", fontSize: "15px", fontFamily: "'Source Serif 4', Georgia, serif", resize: "none", outline: "none", backgroundColor: loading ? "#F5F5F5" : "#FFF", boxSizing: "border-box" }} />
          </div>
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()} style={{ padding: "10px 20px", borderRadius: "20px", border: "none", backgroundColor: loading || !input.trim() ? "#D4C5B0" : "#8B7355", color: "#FFF", fontSize: "15px", fontFamily: "'Source Serif 4', Georgia, serif", cursor: loading || !input.trim() ? "default" : "pointer", fontWeight: 600 }}>Send</button>
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
