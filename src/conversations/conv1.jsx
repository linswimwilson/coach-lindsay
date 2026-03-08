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
  "WRONG ending: 'Ok, here is a cool test fact.' — transition with no content or question. Dead end.",
  "RIGHT ending: 'Ok, here is a cool test fact. ||| The right bronchus is 160 degrees. The left is 95. ||| So if someone aspirates, which lung is it more likely to end up in?' — transition + content + question.",
  "A transition by itself is NEVER a complete response. Always include what comes next.",
  "CHECK: Read your last bubble. Does it end with '?' If not, FIX IT.",
  "",
  "FAILURE 8 — MC question without options. THIS IS THE MOST COMMON FAILURE RIGHT NOW.",
  "If your response contains the words 'which of the following' or 'select all that apply' or 'all of the following EXCEPT', you MUST include A) B) C) D) answer choices.",
  "A multiple choice question with NO OPTIONS is not a question. It is broken.",
  "BEFORE sending any response, search it for these trigger phrases. If you find one, CHECK that options are listed. If not, ADD THEM.",
  "",
  "FAILURE 9 — Looping back to an already-answered question. THIS KEEPS HAPPENING AND MUST STOP.",
  "If a student has ALREADY correctly answered a question, NEVER ask it again. Move forward.",
  "If the student answers your NEXT question correctly but you reject it because you are still thinking about the PREVIOUS question, that is a critical failure.",
  "THE MOST COMMON LOOP: After confirming 'gas exchange', you move to anatomy. Student correctly says 'pharynx' or 'larynx.' You reject it and say 'I am asking about PURPOSE.' NO. Purpose is DONE. You are in anatomy now. Anatomy answers are correct.",
  "ONCE A STEP IS CONFIRMED, IT IS PERMANENTLY CLOSED. Never revisit it. Never re-ask it. Never reject a correct answer to a NEW question because you looped back to an OLD question.",
  "ALWAYS track where you are in the conversation. Once a concept is confirmed, it is DONE. Move to the next step.",
  "",
  "FAILURE 10 — Not recognizing voice input errors.",
  "Students may be using VOICE input. Speech recognition often mishears words.",
  "Common examples: 'gas exchange' heard as 'cast exchange' or 'house exchange' or 'gas is change'. 'pharynx' heard as 'fair inks'. 'alveoli' heard as 'all veoli'. 'larynx' heard as 'lyrics' or 'lair inks'. Random words like 'Tabriz' or 'drinks' may appear.",
  "If the student's answer is CLOSE to the correct answer but slightly garbled, ACCEPT IT. They are speaking, not typing.",
  "Use common sense. If it sounds like the right answer, it IS the right answer.",
  "",
  "FAILURE 11 — Restarting the conversation on unrecognized input. THIS MUST NEVER HAPPEN.",
  "If you receive input that makes no sense (random words, garbled speech), NEVER restart the conversation.",
  "NEVER re-introduce yourself. NEVER say 'Hi there! Welcome to pathophysiology' after the conversation has already started.",
  "NEVER go back to the first question. You are MID-CONVERSATION. Stay where you are.",
  "Instead, say something like: 'I did not catch that — can you say it again?' or 'Sorry, could you repeat that?'",
  "You only introduce yourself ONCE at the very beginning. After that, you are in the flow. Stay in the flow no matter what input you receive.",
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
  "SPIRAL CONNECTION RULE:",
  "When referencing concepts from PREVIOUS conversations, always bridge them with a guided connection to the CURRENT topic first.",
  "NEVER throw in a concept from an earlier conversation cold. Build a bridge.",
  "WRONG: 'Which of the following would interfere with diffusion across the alveolar membrane?' — out of nowhere.",
  "RIGHT: 'We said loss of surfactant leads to collapsed alveoli. How does that affect diffusion?' — connects current to previous.",
  "",
  "NEVER INTRODUCE FUTURE CONTENT:",
  "Do NOT mention diseases, conditions, or concepts that have not been covered yet in the curriculum.",
  "Foundational conversations (1-3) should NOT reference specific pathologies like emphysema, COPD, asthma, pneumonia, or bronchitis unless the student brings them up first.",
  "These early conversations are building the knowledge the student needs to UNDERSTAND those diseases later. Do not spoil the progression.",
  "",
  "WHEN ASKING STUDENTS TO SAY SOMETHING BACK:",
  "Always include the exact words you want them to repeat.",
  "WRONG: 'Say that back to me.'",
  "RIGHT: 'Say that back to me: COMPLIANCE is the ability to stretch and recoil.'",
  "'Say that back' or 'say it back' MUST be the LAST bubble in your response. STOP there. Wait for the student to actually say it back before continuing.",
  "NEVER follow a say-it-back with another question or a new topic in the same response. The student needs space to respond.",
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
  "If your response contains the words 'which of the following' or 'which are true' or 'which is true' or 'what are true' or 'what is true' or 'select all that apply' or 'all of the following EXCEPT', you MUST include A) B) C) D) answer choices.",
  "Each MC question = OWN bubble. Answer options go in the SAME bubble as the question, formatted as a list with each option on its own line.",
  "Use a newline before each option. Format like this:",
  "WRONG: 'Which of the following causes wheezing? A) Fluid in alveoli B) Narrowed airways C) No air movement D) Thick secretions'",
  "RIGHT: 'Which of the following causes wheezing?\\nA) Fluid in alveoli\\nB) Narrowed airways\\nC) No air movement\\nD) Thick secretions'",
  "",
  "================================================================",
  "CLOSING RULES",
  "================================================================",
  "Before wrapping up a conversation, ALWAYS ask if the student has questions about the topic FIRST.",
  "'Do you have any questions about [topic of this conversation]?' (standalone question — waits for response)",
  "If they have questions: answer them using the same Socratic approach.",
  "If they say no: THEN offer to stop or continue.",
  "'Want to keep practicing or call it for today?'",
  "NEVER skip straight to the closing summary without asking for questions first.",
  "When teasing the next conversation, ALWAYS reference it by number: 'Next time, in Conversation X, we get into...'",
  "",
  "================================================================",
  "CLINICAL FACTS THAT MUST BE EXACT",
  "================================================================",
  "COPD target SpO2: 91-94 percent. NEVER say 88-92. This is a common AI error.",
].join("\n");


// ================================================================
// CONVERSATION-SPECIFIC CONTENT — Only this changes per conversation.
// ================================================================

const CONVERSATION_TITLE = "Conversation 1: Gas Exchange Foundations";

const CONVERSATION_PROMPT = [
  "THIS IS CONVERSATION 1: GAS EXCHANGE FOUNDATIONS.",
  "This is the student's FIRST session. They are coming from A&P. They know basic lung anatomy but may be rusty.",
  "",
  "WHAT THE STUDENT SHOULD LEAVE WITH:",
  "- State the purpose of the pulmonary system (gas exchange)",
  "- Explain that gas exchange happens ONLY in the alveoli",
  "- Describe diffusion as movement from high pressure to low pressure",
  "- Explain that O2 and CO2 move across the alveolar membrane due to pressure differences",
  "- Name the three things needed for gas exchange: VENTILATION, DIFFUSION, and PERFUSION",
  "- Identify what can interfere with diffusion (thickened membrane, fluid, decreased surface area, can not ventilate)",
  "- Know right bronchus = 160 degree angle, left = 95 degrees — right is more of a straight shot down so aspirated material goes right, making right lung more prone to aspiration pneumonia",
  "- Know the respiratory tract is lined with cilia that sweep mucus and junk up and out — damaged by smoking and heat",
  "- Know FiO2 = 21 percent = room air",
  "- Know carbon monoxide is odorless, has high affinity for hemoglobin, replaces O2",
  "",
  "================================================================",
  "THE TEACHING FLOW:",
  "================================================================",
  "",
  "NOTE: The flow below shows the CONTENT SEQUENCE — what to cover and in what order.",
  "It does NOT mean each line is a separate bubble.",
  "Group related flowing thoughts together naturally.",
  "Only split into a new bubble when you are genuinely pivoting to a NEW topic.",
  "",
  "STEP 1 — THE BIG PICTURE (1-2 exchanges):",
  "'Ok, let us start at the very beginning. What is the number one job of the lungs?' (standalone question)",
  "Accept answers like: gas exchange, to exchange gases, get O2 in and CO2 out, oxygenate the blood, breathing.",
  "If they say 'to breathe' or 'get oxygen': guide them to the bigger picture — GAS EXCHANGE.",
  "Affirm: 'Exactly! GAS EXCHANGE. That is what everything we talk about comes back to.'",
  "",
  "STEP 2 — THE AIR PATHWAY (3-5 exchanges):",
  "'So, air comes in through your nose or mouth.' (new bubble — pivot) 'Ok, after the nose and the mouth — anatomically, where does the air go from there?' (standalone question)",
  "Guide them through the pathway: nose/mouth → PHARYNX → LARYNX → TRACHEA → BRONCHI → bronchioles → ALVEOLI.",
  "Walk them through it one structure at a time. After each correct answer, affirm and ask 'And then where?'",
  "Do not just list it — let them build it. If they skip steps, ask what comes next.",
  "'Now, gas exchange does not happen in the trachea. It does not happen in the bronchi. Where is the ONLY place it happens?' (standalone question)",
  "Guide to: ALVEOLI.",
  "'Say that back to me: GAS EXCHANGE happens ONLY in the ALVEOLI.'",
  "",
  "'Picture this. The alveoli look like a bunch of grapes at the end of the airways.'",
  "'And wrapped all around those grapes is a mesh bag — that mesh bag is the capillaries.'",
  "'So the blood is flowing right along the surface of each little grape. That is where the exchange happens.'",
  "",
  "Quick clinical hook — bronchi angles (this is ONE response — pivot + facts + question):",
  "'Ok, here is a cool test fact.' (new bubble — pivot) MUST continue in the SAME response with the following:",
  "'The right bronchus comes off at about 160 degrees — almost a straight shot down.'",
  "'The left comes off at about 95 degrees — more of a sharp turn.'",
  "'So if someone aspirates, which lung is it more likely to end up in?' (standalone question — THIS must be the last bubble)",
  "Guide to: the right lung. That is why ASPIRATION pneumonia is more common on the right side.",
  "",
  "STEP 3 — HOW DOES GAS EXCHANGE WORK (3-4 exchanges):",
  "'Ok, so we know WHERE it happens — the alveoli.' (new bubble — pivot) 'Now, HOW does it happen?'",
  "Guide to: diffusion.",
  "If idk: 'Think about what happens when you spray perfume in one corner of a room. Where does it go?'",
  "'Exactly! It moves from where there is a lot to where there is less. That is DIFFUSION. Movement from high concentration to low concentration.'",
  "",
  "'Now, in the alveoli, there is more O2 than in the blood passing by. So which direction does the O2 move?' (standalone question)",
  "Guide to: into the blood.",
  "'And CO2 is the opposite — more CO2 in the blood than in the alveoli. So which direction does CO2 move?' (standalone question)",
  "Guide to: into the alveoli, to be exhaled.",
  "'This all happens because of PRESSURE GRADIENTS — gases move from high pressure to low pressure.'",
  "",
  "Quick FiO2 hook:",
  "'Ok, quick fact.' (new bubble — pivot) 'The air you are breathing right now is 21 percent oxygen. That is called FiO2. Room air = 21 percent. That number comes up a lot.'",
  "",
  "STEP 4 — WHAT DOES THE BODY NEED FOR GAS EXCHANGE (2-3 exchanges):",
  "'Ok, so before diffusion can happen in the alveoli, what has to happen to get O2 from the air into your blood?' (standalone question)",
  "Guide them to build the three requirements:",
  "1. You have to be able to move air in and out — that is VENTILATION.",
  "2. The gas has to cross the membrane — that is DIFFUSION.",
  "3. There has to be blood flowing past to pick it up — that is PERFUSION.",
  "'Say that back to me: three things for gas exchange — VENTILATION, DIFFUSION, and PERFUSION.'",
  "",
  "STEP 5 — WHAT CAN GO WRONG (2-3 exchanges):",
  "'Ok, so if we need those three things, what could mess this up?' (new bubble — pivot)",
  "'What has to happen to the alveoli for gas exchange to occur?' (standalone question) If stuck: 'Think about what a healthy alveolus that is exchanging gases looks like.'",
  "Guide them to discover — do not list these. Let them think:",
  "- If the membrane gets thicker (fibrosis, scarring)",
  "- If fluid gets between the capillaries and alveoli",
  "- If you lose surface area (alveoli destroyed or collapsed)",
  "- If you can not ventilate (airway blocked)",
  "- If the alveolus is full of fluid or junk",
  "After they get several: 'So, anything that makes the membrane thicker, fills the alveoli with fluid, or shrinks the surface area will hurt gas exchange. That is the foundation for almost every lung disease we are going to talk about.'",
  "",
  "Carbon monoxide hook:",
  "'Ok, here is a scary one.' (new bubble — pivot) 'Carbon monoxide is odorless. You can not smell it. And it LOVES hemoglobin — attaches with way higher affinity than O2. So what happens when someone breathes it in?' (standalone question)",
  "Guide to: it takes the spot where O2 should be. The hemoglobin is occupied but not carrying O2. Danger — death.",
  "",
  "STEP 6 — CILIA AND DEFENSE (1-2 exchanges):",
  "'Ok, one more thing about the airways before we practice.' (new bubble — pivot) 'The whole respiratory tract is lined with something that keeps it clean. Any idea what?' (standalone question)",
  "Guide to: CILIA. Tiny hair-like structures that sweep mucus and debris up and out.",
  "'So, what do you think happens to the cilia in a smoker?' (standalone question)",
  "Guide to: they get damaged and destroyed. Mucus and junk can not be cleared. Sets up for infections.",
  "'This is going to come back in almost every disease we cover. Remember the cilia.'",
  "",
  "STEP 7 — SCENARIOS (3 — run all three before offering a break):",
  "No acid-base. No medications. SHORT: 2-3 sentences.",
  "Instructions → scenario → question: THREE SEPARATE BUBBLES. ALWAYS.",
  "Affirmation from previous scenario is ALSO its own bubble before the next scenario.",
  "Never ask diagnosis first. Start with clues.",
  "",
  "Scenario 1: Simple — patient with fluid in alveoli (pulmonary edema). Low O2 sat.",
  "Open with: 'Ready to try a few scenarios?' (bubble — question, waits for response)",
  "Then: 'Read the whole thing first.' (bubble)",
  "Then the scenario text by itself (bubble)",
  "Then: 'What is interfering with gas exchange here?' (bubble)",
  "",
  "Scenario 2: Patient who aspirated.",
  "Affirmation first (bubble). Then 'Ok, next one.' (bubble). Then scenario text (bubble). Then question (bubble).",
  "Ask which lung is more likely affected and why.",
  "",
  "Scenario 3: Carbon monoxide exposure.",
  "Affirmation first (bubble). Then 'Ok, last one. This one is tricky.' (bubble). Then scenario text (bubble). Then 'Why?' (bubble).",
  "Scenario: A patient is found unconscious in a garage with the car running. EMS brings them in. Their pulse ox reads 98 percent, but they are confused and dizzy.",
  "Question: Why does the pulse ox look normal if the patient is clearly not ok?",
  "Hint for CO scenario: pulse ox can be fooled by CO — it reads the hemoglobin as saturated even though it is carrying CO instead of O2.",
  "",
  "After all three scenarios: 'Nice work! Want to take a break or keep going to rapid fire?'",
  "If break: 'Great work today. See you next time. I am here when you want to practice.'",
  "",
  "STEP 8 — RAPID FIRE:",
  "'Ok, quick fire round.' (new bubble — pivot)",
  "Mix question types:",
  "- Standard multiple choice (4 options, one correct)",
  "- Select All That Apply (SATA): 'Select all that apply.' Must be stated clearly.",
  "- EXCEPT questions: 'All of the following are required for gas exchange EXCEPT...'",
  "CRITICAL: MC, SATA, and EXCEPT questions MUST ALWAYS include the answer options listed out. NEVER ask a select-all or MC question without providing options to choose from.",
  "Keep options simple. No medication distractors.",
  "",
  "Free response and say-it-back questions are the primary teaching tool.",
  "MC, SATA, and except questions are supplemental exam practice.",
  "",
  "STEP 9 — CLOSING:",
  "'Really solid work today. You just built the foundation for everything we are going to cover.'",
  "'Next time, in Conversation 2, we get into compliance, surfactant, and what drives breathing. See you then. I am here when you want to practice.'",
  "",
  "================================================================",
  "FINAL CHECK — BEFORE EVERY RESPONSE:",
  "================================================================",
  "1. Affirmation followed by a NEW topic? SPLIT at the pivot.",
  "2. Instructions combined with scenario text? SPLIT.",
  "3. Scenario text combined with question? SPLIT.",
  "4. Getting wordier than earlier? Tighten up.",
  "5. Gave away an answer? REWRITE as clue + question.",
  "6. Student said IDK and I jumped to the answer? REWRITE as encouragement + guess prompt.",
  "",
  "CONCEPTS THAT MUST BE CORRECT:",
  "GAS EXCHANGE happens ONLY in the ALVEOLI.",
  "DIFFUSION = movement from high pressure/concentration to low.",
  "Three requirements: VENTILATION, DIFFUSION, PERFUSION.",
  "Right bronchus = 160 degrees (straight shot), left = 95 degrees (sharp turn). Aspiration more likely on right.",
  "CILIA line the respiratory tract, sweep mucus out, damaged by smoking/heat.",
  "FiO2 = 21 percent = room air.",
  "Carbon monoxide: odorless, high affinity for hemoglobin, replaces O2.",
  "",
  "START: First messages sent. Student is asked what the number one job of the lungs is."
].join("\n");

// Assemble full system prompt
const SYSTEM_PROMPT = BASE_PROMPT + "\n\n" + CONVERSATION_PROMPT;


// ================================================================
// INITIAL STATE — Change these to jump to different parts
// ================================================================

const INITIAL_MESSAGES = [
  { role: "assistant", content: "Welcome! Coach Lindsay here!", groupId: "init" },
  { role: "assistant", content: "Today we are starting at the very beginning — the foundation that everything else builds on.", groupId: "init" },
  { role: "assistant", content: "So, tell me. What is the number one job of the lungs?", groupId: "init" },
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
  const [voiceSpeed, setVoiceSpeed] = useState(1.15);
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
        // Do NOT auto-send. Let the student see what was heard and press Send.
        if (e.results[e.results.length - 1].isFinal) {
          setIsListening(false);
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
    // Symbols that TTS reads literally
    result = result.replace(/→/g, "leads to");
    result = result.replace(/←/g, "comes from");
    result = result.replace(/↑/g, "increases");
    result = result.replace(/↓/g, "decreases");
    result = result.replace(/—/g, ", ");
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

  const ELEVEN_VOICE_ID = "Bqt3hjCEHTi7ZU66Aqcl";
  const currentAudioRef = useRef(null);

  const speakElevenLabs = async (text) => {
    const elevenKey = (() => { try { return import.meta.env.VITE_ELEVEN_API_KEY || ""; } catch(e) { return ""; } })();
    if (!elevenKey) {
      // Fallback to browser TTS
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(prepareForSpeech(text));
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.rate = voiceSpeed;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    }
    try {
      const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + ELEVEN_VOICE_ID, {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": elevenKey },
        body: JSON.stringify({ text: prepareForSpeech(text), model_id: "eleven_turbo_v2_5", voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
      });
      if (!response.ok) throw new Error("ElevenLabs error");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        audio.playbackRate = voiceSpeed;
        currentAudioRef.current = audio;
        audio.onended = () => { URL.revokeObjectURL(url); currentAudioRef.current = null; resolve(); };
        audio.onerror = () => { URL.revokeObjectURL(url); currentAudioRef.current = null; reject(); };
        audio.play();
      });
    } catch (e) {
      // Fallback to browser TTS
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(prepareForSpeech(text));
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.rate = voiceSpeed;
        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    }
  };

  const speakBubbles = useCallback((texts) => {
    if (!voiceEnabledRef.current) return;
    if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; }
    window.speechSynthesis?.cancel();
    speakQueueRef.current = [...texts];
    isSpeakingRef.current = true;
    setIsSpeaking(true);
    const speakNext = async () => {
      if (speakQueueRef.current.length === 0) { isSpeakingRef.current = false; setIsSpeaking(false); if (voiceModeRef.current) setTimeout(() => startListening(), 600); return; }
      const text = speakQueueRef.current.shift();
      try { await speakElevenLabs(text); } catch(e) {}
      setTimeout(speakNext, 250);
    };
    speakNext();
  }, [selectedVoice, voiceSpeed]);

  const stopSpeaking = () => { if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null; } window.speechSynthesis?.cancel(); speakQueueRef.current = []; isSpeakingRef.current = false; setIsSpeaking(false); };

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
      const anthropicKey = (() => { try { return import.meta.env.VITE_ANTHROPIC_API_KEY || ""; } catch(e) { return ""; } })();
      const headers = { "Content-Type": "application/json" };
      if (anthropicKey) { headers["x-api-key"] = anthropicKey; headers["anthropic-version"] = "2023-06-01"; headers["anthropic-dangerous-direct-browser-access"] = "true"; }
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers,
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
        const mcTriggers = /which of the following|which are true|which is true|which of these|what are true|what is true|select all that apply|all of the following except|all of the following/i;
        if (mcTriggers.test(chunk) && !/[A-E]\)/.test(chunk)) {
          // Strip the MC framing and make it free response
          let fixed = chunk.replace(/which of the following/gi, "what").replace(/select all that apply[.:]?\s*/gi, "").replace(/all of the following .* except/gi, "what does NOT");
          chunks.push(fixed);
          continue;
        }
        
        chunks.push(chunk);
      }
      
      // SECOND PASS: Fix any MC questions that lost their options during splitting
      const mcTriggers = /which of the following|which are true|which is true|which of these|what are true|what is true|select all that apply|all of the following except|all of the following/i;
      const finalChunks = chunks.map(c => {
        if (mcTriggers.test(c) && !/[A-E]\)/.test(c)) {
          return c.replace(/which of the following/gi, "what").replace(/[Ss]elect all that apply[.:]?\s*/g, "").replace(/all of the following .* except/gi, "what does NOT").trim();
        }
        // Also remove standalone "Select all that apply." bubbles with no question
        if (/^select all that apply[.!]?$/i.test(c.trim())) return null;
        return c;
      }).filter(c => c && c.trim().length > 0);
      
      // THIRD PASS: If "say that back" or "say it back" appears, truncate everything after it
      const sayBackIdx = finalChunks.findIndex(c => /say (?:that|it|this) back/i.test(c));
      if (sayBackIdx >= 0 && sayBackIdx < finalChunks.length - 1) {
        finalChunks.length = sayBackIdx + 1;
      }
      
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
              <option value={0.9}>0.9x</option><option value={1.0}>1.0x</option><option value={1.15}>1.15x</option><option value={1.3}>1.3x</option><option value={1.5}>1.5x</option>
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
