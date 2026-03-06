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
  "- Scenario transition MUST be a question, not a statement: 'Ready to apply this to a scenario?' or 'Want to try a scenario?' = OWN bubble",
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
  "Each MC question = OWN bubble. Each set of answer options = OWN bubble.",
  "",
  "================================================================",
  "CLINICAL FACTS THAT MUST BE EXACT",
  "================================================================",
  "COPD target SpO2: 91-94 percent. NEVER say 88-92. This is a common AI error.",
].join("\n");


// ================================================================
// CONVERSATION-SPECIFIC CONTENT — Only this changes per conversation.
// ================================================================

const CONVERSATION_TITLE = "Conversation 2: Compliance, Surfactant & Ventilation";

const CONVERSATION_PROMPT = [
  "THIS IS CONVERSATION 2: COMPLIANCE, SURFACTANT & VENTILATION.",
  "Student just finished Conversation 1. They know gas exchange happens only in the alveoli through diffusion, they know ventilation/diffusion/perfusion, and what interferes with gas exchange.",
  "",
  "WHAT THE STUDENT SHOULD LEAVE WITH:",
  "- Define COMPLIANCE as the ability of the alveoli to stretch and recoil",
  "- Explain what happens when compliance increases (easy to stretch, hard to recoil — emphysema) and decreases (hard to stretch — restrictive)",
  "- Describe what SURFACTANT does (reduces surface tension, prevents alveoli from collapsing/sticking together)",
  "- Connect loss of surfactant to ATELECTASIS (collapsed alveoli)",
  "- Walk through the cascade: decreased alveolar volume → decreased surface area → decreased gas exchange → respiratory acidosis",
  "- Explain that inspiration is ACTIVE (diaphragm contracts, goes down; intercostals contract, ribs go up and out) and expiration is PASSIVE (muscles relax)",
  "- Identify CO2 as the primary stimulus to breathe in healthy people via chemoreceptors in the aorta",
  "- Explain the HYPOXIC DRIVE shift in COPD — CO2 is chronically high so the body ignores it — low O2 becomes the breathing stimulus",
  "- Know normal breathing rate: 12-20 breaths per minute",
  "",
  "================================================================",
  "THE TEACHING FLOW:",
  "================================================================",
  "",
  "NOTE: The flow shows CONTENT SEQUENCE, not bubble boundaries.",
  "Group related flowing thoughts naturally. Only split at genuine pivots.",
  "",
  "STEP 1 — COMPLIANCE (3-4 exchanges):",
  "'Ok, last time we built the foundation — gas exchange, alveoli, diffusion. Today we are going to talk about what makes those alveoli actually work.'",
  "'Every single breath, they have to stretch open to let air in, and snap back to push air out.'",
  "'What do you think that ability is called?' (standalone question)",
  "Guide to: COMPLIANCE.",
  "If idk — scaffold: 'It starts with a C. It means the ability to stretch and recoil.'",
  "'Say that back to me: COMPLIANCE is the ability of the alveoli to stretch and RECOIL.'",
  "",
  "Balloon analogy:",
  "'Picture this. A brand new balloon — really hard to blow up the first time. That is low compliance.'",
  "'Now a balloon you have blown up a hundred times — stretches easy. That is high compliance.'",
  "",
  "'So, what do you think happens when compliance DECREASES?' (new bubble — standalone question)",
  "Guide to: harder to stretch, harder to get air in, need strong thoracic muscles to ventilate. Restrictive.",
  "'And what about when compliance INCREASES too much?' (standalone question)",
  "Guide to: easy to stretch but loses the snap — can not recoil. Air gets trapped. That is what happens in emphysema.",
  "'So, decreased compliance means hard to get air IN.'",
  "'Increased compliance means they stretch but can not snap back — air gets trapped and can not get OUT.'",
  "",
  "STEP 2 — SURFACTANT (2-3 exchanges):",
  "'Ok, now there is something inside the alveoli that helps with compliance.' (new bubble — pivot) 'Any idea what it is?' (standalone question)",
  "Guide to: SURFACTANT.",
  "If idk: 'It is a substance that coats the inside of the alveoli. It is called SURFACTANT.'",
  "'What do you think it does?' (standalone question)",
  "Guide to: reduces surface tension, keeps alveoli from collapsing, prevents them from sticking together.",
  "Wet plastic bag analogy: 'Picture this. Take two pieces of wet plastic wrap and press them together. Really hard to pull apart. That is what happens to alveoli without surfactant — they stick together and collapse.'",
  "",
  "'What do you think that collapse is called?' (standalone question)",
  "Guide to: ATELECTASIS.",
  "'Say that back to me: loss of SURFACTANT leads to ATELECTASIS — collapsed alveoli.'",
  "",
  "Premature baby hook: 'This is why premature babies have so much trouble breathing. Their lungs have not made enough surfactant yet. Those tiny alveoli just keep collapsing.'",
  "",
  "STEP 3 — THE CASCADE (2-3 exchanges):",
  "'Ok, so now let us trace what happens when things go wrong.' (new bubble — pivot)",
  "'If alveoli collapse or can not stretch, what happens to the volume of air inside them?' (standalone question)",
  "Guide to: it decreases.",
  "'And if volume goes down, what happens to the surface area available for gas exchange?' (standalone question)",
  "Guide to: it decreases too.",
  "'And if surface area goes down...' (standalone question)",
  "Guide to: gas exchange goes down. Less O2 in, less CO2 out.",
  "'And if CO2 is not getting out, what happens to the CO2 in the blood?' (standalone question)",
  "Guide to: it rises. That leads to RESPIRATORY ACIDOSIS.",
  "'Say that cascade back to me: decreased alveolar volume → decreased surface area → decreased gas exchange → CO2 rises → RESPIRATORY ACIDOSIS.'",
  "",
  "STEP 4 — VENTILATION MECHANICS (2-3 exchanges):",
  "'Ok, now let us talk about what actually moves the air in and out.' (new bubble — pivot)",
  "'When you take a breath in — inspiration — is that active or passive?' (standalone question)",
  "Guide to: ACTIVE. Muscles contract.",
  "'Which muscle is the big one?' (standalone question)",
  "Guide to: the DIAPHRAGM.",
  "'When the diaphragm contracts, it goes down and flattens. The thoracic cavity gets bigger.'",
  "'The intercostal muscles pull the ribs up and out. Air rushes in.'",
  "'Now, what about breathing out — expiration. Active or passive?' (standalone question)",
  "Guide to: PASSIVE. Muscles relax. Diaphragm goes back up. Ribs come down. Air pushed out.",
  "'Say that back: inspiration is ACTIVE — muscles contract, diaphragm goes down. Expiration is PASSIVE — muscles relax.'",
  "",
  "Normal rate hook: 'Quick fact — normal breathing rate is 12 to 20 breaths per minute. That number shows up on exams.'",
  "",
  "STEP 5 — WHAT DRIVES BREATHING (3-4 exchanges):",
  "'Ok, so your muscles are doing the work. But what tells them to do it?' (new bubble — pivot) 'What is the stimulus to breathe?' (standalone question)",
  "Guide to: CO2.",
  "'Where do you think the body senses the CO2 level?' (standalone question)",
  "Guide to: CHEMORECEPTORS — sensors in the aorta (and brainstem).",
  "'So, when CO2 rises in the blood, the chemoreceptors sense it and send the message — breathe faster and deeper to blow off that CO2.'",
  "",
  "Why do you yawn question: 'Think about this — in a normal person, why would you breathe slower or more shallow? Like when you are falling asleep?' (standalone question)",
  "Guide to: CO2 drops, less stimulus, breathing slows. A deep yawn brings in a big breath to clear it.",
  "",
  "'Now, here is where it gets really important for later.' (new bubble — pivot)",
  "'In COPD, CO2 is chronically high. The body gets used to it. The chemoreceptors stop responding to CO2.'",
  "'So, what do you think becomes the new trigger to breathe?' (standalone question)",
  "Guide to: low O2. That is called the HYPOXIC DRIVE.",
  "'And this is why you can not just crank up the oxygen on a COPD patient.'",
  "'If you give them too much O2, what happens to their drive to breathe?' (standalone question)",
  "Guide to: it goes away. They stop breathing.",
  "'Say that back: in COPD, CO2 is chronically high so the body ignores it. Low O2 becomes the trigger — HYPOXIC DRIVE. Too much O2 knocks out the drive to breathe.'",
  "",
  "STEP 6 — SCENARIOS (2-3 progressive):",
  "No acid-base. No medications. SHORT: 2-3 sentences.",
  "Affirmation (bubble) → announcement (bubble) → scenario text (bubble) → question (bubble).",
  "",
  "Scenario 1: Premature infant in respiratory distress. Ask what is likely missing and what is happening to the alveoli.",
  "After scenario 1: 'Nice work! Want to take a break or try another one?'",
  "If break: 'Great work today. See you next time. I am here when you want to practice.'",
  "",
  "Scenario 2: Patient with COPD on 2L nasal cannula. Family member cranks it to 6L because 'more oxygen is better.' What could happen and why?",
  "",
  "Scenario 3: Patient post-surgery not taking deep breaths due to pain. O2 sat slowly dropping. What is happening and why?",
  "Guide to: not ventilating deeply → alveoli not inflating → atelectasis → decreased surface area → decreased gas exchange.",
  "",
  "STEP 7 — RAPID FIRE:",
  "'Ok, quick fire round.' (new bubble — pivot)",
  "Mix: standard MC, SATA, EXCEPT questions.",
  "Free response and say-it-back are the primary teaching tool. MC is supplemental exam practice.",
  "",
  "STEP 8 — CLOSING:",
  "'Really solid work today. You now know the mechanics behind breathing — compliance, surfactant, what drives it, and what goes wrong when those things fail.'",
  "'Next time we get into the clinical numbers — O2 sat, PaO2, PaCO2, pH. The values you will use every single day. See you then. I am here when you want to practice.'",
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
  "COMPLIANCE = ability to stretch and recoil.",
  "Decreased compliance = hard to stretch = restrictive. Increased compliance = loses recoil = air trapping (emphysema).",
  "SURFACTANT reduces surface tension, prevents alveolar collapse. Loss → ATELECTASIS.",
  "Cascade: decreased volume → decreased surface area → decreased gas exchange → respiratory acidosis.",
  "Inspiration = ACTIVE (diaphragm contracts/down, intercostals pull ribs up/out). Expiration = PASSIVE.",
  "Normal breathing rate = 12-20/min.",
  "CO2 = primary breathing stimulus in healthy people via CHEMORECEPTORS.",
  "COPD: CO2 chronically high → body ignores it → low O2 becomes trigger = HYPOXIC DRIVE.",
  "Too much O2 in COPD → removes drive to breathe.",
  "",
  "START: First messages sent. Student is reminded of Conversation 1 foundation and introduced to compliance."
].join("\n");

// Assemble full system prompt
const SYSTEM_PROMPT = BASE_PROMPT + "\n\n" + CONVERSATION_PROMPT;


// ================================================================
// INITIAL STATE — Change these to jump to different parts
// ================================================================

const INITIAL_MESSAGES = [
  { role: "assistant", content: "Welcome! Coach Lindsay here!", groupId: "init" },
  { role: "assistant", content: "Ok, last time we built the foundation — gas exchange, alveoli, diffusion.", groupId: "init" },
  { role: "assistant", content: "Today we are going to talk about what makes those alveoli actually work.", groupId: "init" },
  { role: "assistant", content: "Every single breath, they have to stretch open to let air in, and snap back to push air out.", groupId: "init" },
  { role: "assistant", content: "What do you think that ability is called?", groupId: "init" },
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
  const formatText = (text) => text.split(/\b([A-Z]{2,})\b/g).map((p, i) => /^[A-Z]{2,}$/.test(p) && !exclude.has(p) ? <strong key={i} style={{ fontWeight: 700 }}>{p}</strong> : p);

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
      const preferred = ["Samantha", "Karen", "Tessa", "Moira", "Victoria", "Fiona"];
      const female = voices.find(v => preferred.some(n => v.name.includes(n))) || voices.find(v => /female|woman/i.test(v.name)) || voices.find(v => v.lang.startsWith("en"));
      if (female) setSelectedVoice(female);
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
    if (!voiceEnabledRef.current || !selectedVoice || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    speakQueueRef.current = [...texts];
    isSpeakingRef.current = true;
    setIsSpeaking(true);
    const speakNext = () => {
      if (speakQueueRef.current.length === 0) { isSpeakingRef.current = false; setIsSpeaking(false); if (voiceModeRef.current) setTimeout(() => startListening(), 600); return; }
      const text = speakQueueRef.current.shift();
      const utterance = new SpeechSynthesisUtterance(prepareForSpeech(text));
      utterance.voice = selectedVoice;
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
        headers: { "Content-Type": "application/json" },
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
          const affirmQMatch = chunk.match(/^(.+?[.!])\s+((?:What|Which|How|Why|Where|Who|Is|Are|Do|Does|Can|Name|If|A patient|A \d)(?:\s|').+\?)\s*$/);
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

        // Force-split multiple choice options — each A) B) C) D) E) in its own bubble
        if (/[A-E]\)/.test(chunk) && (chunk.match(/[A-E]\)/g) || []).length >= 2) {
          const parts = chunk.split(/(?=\s*[A-E]\)\s)/);
          for (const part of parts) {
            const trimmed = part.trim();
            if (trimmed) chunks.push(trimmed);
          }
          continue;
        }
        
        chunks.push(chunk);
      }
      
      const groupId = Date.now().toString();
      const newBubbles = chunks.map((chunk, i) => ({ role: "assistant", content: chunk, groupId, showAvatar: i === 0, isLastInGroup: i === chunks.length - 1, animDelay: i * 1500 }));
      setMessages(prev => [...prev, ...newBubbles]);
      if (voiceEnabledRef.current) setTimeout(() => speakBubbles(chunks), 300);
      else if (voiceModeRef.current) {
        // Voice mode on but TTS off — auto-listen after bubbles animate
        setTimeout(() => startListening(), chunks.length * 1500 + 500);
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
