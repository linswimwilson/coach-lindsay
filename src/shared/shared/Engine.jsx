// ================================================================
// ENGINE — Shared component for ALL Coach Lindsay conversations.
// Edit here to update UI/voice/bubble behavior across the platform.
// ================================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { BASE_PROMPT } from "../shared/BasePrompt.js";

export function buildSystemPrompt(conversationPrompt) {
  return BASE_PROMPT + "\n\n" + conversationPrompt;
}

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

export default function CoachLindsay({ CONVERSATION_TITLE, SYSTEM_PROMPT, INITIAL_MESSAGES, PRIOR_CONTEXT = [] }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [voiceSpeed, setVoiceSpeed] = useState(1.5);
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

  const silenceTimerRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const r = new SpeechRecognition();
      r.continuous = true; r.interimResults = true; r.lang = "en-US";
      r.onresult = (e) => {
        const transcript = Array.from(e.results).map(r => r[0].transcript).join("");
        setInput(transcript);
        // Reset silence timer every time we hear something — give student time to think
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          // 4 seconds of silence after last speech — stop listening
          if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} }
          setIsListening(false);
        }, 4000);
      };
      r.onend = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setIsListening(false);
      };
      r.onerror = (e) => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        if (e.error === "no-speech" && voiceModeRef.current) {
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
    result = result.replace(/→/g, " leads to ");
    result = result.replace(/←/g, " comes from ");
    result = result.replace(/↑/g, " increases ");
    result = result.replace(/↓/g, " decreases ");
    result = result.replace(/—/g, ", ");  // em dash
    result = result.replace(/–/g, ", ");  // en dash
    result = result.replace(/--/g, ", ");
    result = result.replace(/=/g, " equals ");
    result = result.replace(/\+/g, " plus ");
    result = result.replace(/%/g, " percent ");
    result = result.replace(/>/g, " greater than ");
    result = result.replace(/</g, " less than ");
    result = result.replace(/≥/g, " greater than or equal to ");
    result = result.replace(/≤/g, " less than or equal to ");
    result = result.replace(/~/g, " approximately ");
    result = result.replace(/&/g, " and ");
    result = result.replace(/\bmL\b/g, " milliliters ");
    // Check if using ElevenLabs (has API key) — use natural spellings
    // ElevenLabs is good at real words but needs help with medical terms
    // Use hyphenated natural pronunciation guides, NOT spaced-out phonetics
    // Anatomy & general
    result = result.replace(/alveoli/gi, "al-VEE-oh-lye");
    result = result.replace(/alveolar/gi, "al-VEE-oh-ler");
    result = result.replace(/alveolus/gi, "al-VEE-oh-luss");
    result = result.replace(/capillaries/gi, "CAP-ih-lair-eez");
    result = result.replace(/capillary/gi, "CAP-ih-lair-ee");
    result = result.replace(/pharynx/gi, "FAIR-inks");
    result = result.replace(/larynx/gi, "LAIR-inks");
    result = result.replace(/trachea/gi, "TRAY-kee-uh");
    result = result.replace(/bronchi\b/gi, "BRON-kye");
    result = result.replace(/bronchioles/gi, "BRON-kee-olz");
    result = result.replace(/diaphragm/gi, "DYE-uh-fram");
    result = result.replace(/atelectasis/gi, "at-uh-LEK-tuh-sis");
    result = result.replace(/surfactant/gi, "sur-FAK-tant");
    result = result.replace(/chemoreceptors/gi, "KEE-mo-ree-SEP-tors");
    result = result.replace(/orthopnea/gi, "or-THOP-nee-uh");
    result = result.replace(/dyspnea/gi, "DISP-nee-uh");
    result = result.replace(/rhonchi/gi, "RON-kye");
    result = result.replace(/rales/gi, "RAWLZ");
    result = result.replace(/hypercapnia/gi, "HY-per-CAP-nee-uh");
    result = result.replace(/hypocapnia/gi, "HY-po-CAP-nee-uh");
    result = result.replace(/rhinitis/gi, "rye-NYE-tis");
    result = result.replace(/hemoptysis/gi, "heh-MOP-tih-sis");
    result = result.replace(/polycythemia/gi, "poly-sigh-THEE-mee-uh");
    result = result.replace(/cyanosis/gi, "sigh-uh-NO-sis");
    result = result.replace(/emphysema/gi, "em-fih-SEE-muh");
    result = result.replace(/bronchiectasis/gi, "bron-kee-EK-tuh-sis");
    result = result.replace(/pneumothorax/gi, "NEW-mo-THOR-ax");
    result = result.replace(/thoracentesis/gi, "THOR-uh-sen-TEE-sis");
    result = result.replace(/bronchoscopy/gi, "bron-KOS-kuh-pee");
    result = result.replace(/spirometer/gi, "spy-ROM-uh-ter");
    result = result.replace(/pleurae/gi, "PLUR-ee");
    result = result.replace(/pleural/gi, "PLUR-ul");
    result = result.replace(/perfusion/gi, "per-FEW-zhun");
    result = result.replace(/ventilation/gi, "ven-tih-LAY-shun");
    result = result.replace(/acidosis/gi, "ass-ih-DOE-sis");
    result = result.replace(/alkalosis/gi, "al-kuh-LOE-sis");
    // Lab values & abbreviations
    result = result.replace(/PaO2/g, "P-A-O-2");
    result = result.replace(/PaCO2/g, "P-A-C-O-2");
    result = result.replace(/HCO3/g, "H-C-O-3");
    result = result.replace(/FiO2/g, "F-I-O-2");
    result = result.replace(/\bEMS\b/g, "E.M.S.");
    result = result.replace(/\bER\b/g, "E.R.");
    result = result.replace(/\bICU\b/g, "I.C.U.");
    result = result.replace(/\bEKG\b/g, "E.K.G.");
    result = result.replace(/\bECG\b/g, "E.C.G.");
    result = result.replace(/\bCPR\b/g, "C.P.R.");
    result = result.replace(/\bDNR\b/g, "D.N.R.");
    result = result.replace(/SpO2/g, "S-P-O-2");
    result = result.replace(/CO2/g, "C-O-2");
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
  const lastApiCallRef = useRef(0);
  const sessionStartRef = useRef(Date.now());

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
        body: JSON.stringify({ text: prepareForSpeech(text), model_id: "eleven_multilingual_v2", voice_settings: { stability: 0.65, similarity_boost: 0.8, style: 0.3, use_speaker_boost: true } }),
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
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (isListening && recognitionRef.current) { try { recognitionRef.current.stop(); } catch(e) {} setIsListening(false); }
    setInput(""); setError(null);
    const userMsg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setExchangeCount(c => c + 1);
    try {
      // Invisible pacing — ensure minimum 10 seconds between API calls to avoid rate limits
      const now = Date.now();
      const elapsed = now - lastApiCallRef.current;
      const minGap = 10000; // 10 seconds
      if (elapsed < minGap && lastApiCallRef.current > 0) {
        await new Promise(r => setTimeout(r, minGap - elapsed));
      }
      lastApiCallRef.current = Date.now();
      
      const conversationHistory = [...PRIOR_CONTEXT, ...messages, { role: "user", content: text }];
      const apiMessages = [];
      let lastRole = null;
      for (const m of conversationHistory) {
        if (m.role === lastRole && m.role === "assistant") { apiMessages[apiMessages.length - 1].content += " " + m.content; }
        else { apiMessages.push({ role: m.role, content: m.content }); lastRole = m.role; }
      }
      const anthropicKey = (() => { try { return import.meta.env.VITE_ANTHROPIC_API_KEY || ""; } catch(e) { return ""; } })();
      const headers = { "Content-Type": "application/json" };
      if (anthropicKey) { headers["x-api-key"] = anthropicKey; headers["anthropic-version"] = "2023-06-01"; headers["anthropic-dangerous-direct-browser-access"] = "true"; }
      
      // Retry loop for rate limits (429)
      let response;
      for (let attempt = 0; attempt < 3; attempt++) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
      // Check session time — nudge toward scenarios if approaching 8 minutes
      const sessionMinutes = (Date.now() - sessionStartRef.current) / 60000;
      let systemPrompt = SYSTEM_PROMPT;
      if (sessionMinutes >= 8) {
        systemPrompt += "\n\nTIME CHECK: The student has been in this session for " + Math.round(sessionMinutes) + " minutes. If you have not reached scenarios yet, wrap up the current topic quickly and transition to a scenario NOW. Say something like 'Ok, let us put what we have covered so far to work. Ready to try a scenario?' Keep engagement high — students lose focus after 10 minutes of content without application.";
      }

        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers,
          body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 3000, system: systemPrompt, messages: apiMessages }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (response.status === 429 && attempt < 2) {
          // Rate limited — wait and retry
          await new Promise(r => setTimeout(r, (attempt + 1) * 5000));
          continue;
        }
        break;
      }
      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        if (response.status === 429) throw new Error("Give me a moment — too many messages too fast. Try again in a few seconds.");
        throw new Error(`API error: ${response.status} ${errBody.slice(0, 200)}`);
      }
      const data = await response.json();
      const fullText = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
      if (!fullText.trim()) throw new Error("Empty response — try again.");
      
      // ================================================================
      // POST-PROCESSOR — Force-splits that catch what the AI misses.
      // ================================================================
      const rawChunks = fullText.split("|||").map(c => c.trim()).filter(c => c.length > 0);
      // RECURSIVE SPLITTER — keeps splitting until no more splits are needed
      const splitChunk = (chunk) => {
        // UNIVERSAL SPLIT: Any statement/exclamation followed by a question
        // This catches ALL rapid fire patterns: "Exactly! Normal PaCO2?" / "Right! Target SpO2?"
        if (chunk.length > 15) {
          const stmtQMatch = chunk.match(/^(.+?[.!])\s+(.+\?)\s*$/);
          if (stmtQMatch && stmtQMatch[1].trim().length > 3 && stmtQMatch[2].trim().length > 5) {
            return [...splitChunk(stmtQMatch[1].trim()), ...splitChunk(stmtQMatch[2].trim())];
          }
        }

        // Statement followed by statement+question (multi-sentence then question)
        // "Exactly! 95 to 100. Normal PaO2?" → split after each sentence
        if (chunk.length > 20 && /\?/.test(chunk)) {
          const parts = chunk.match(/[^.!?]+[.!?]+/g);
          if (parts && parts.length >= 2) {
            const lastPart = parts[parts.length - 1].trim();
            if (lastPart.endsWith("?")) {
              const beforeQ = parts.slice(0, -1).join("").trim();
              if (beforeQ.length > 3 && lastPart.length > 5) {
                return [...splitChunk(beforeQ), ...splitChunk(lastPart)];
              }
            }
          }
        }

        // Force-split topic pivots
        if (chunk.length > 60) {
          const pivotMatch = chunk.match(/^(.+?[.!?])\s+((?:Ok,|Ok |Now,|Now |So,|So |Alright,|Next |What about |How about |And (?:what|when|if|absent)|Ready to|Want to|Do you have any|Let us try|Here is|Here's|Picture this)[\s].+)/);
          if (pivotMatch && pivotMatch[1].trim().length > 10 && pivotMatch[2].trim().length > 10) {
            return [...splitChunk(pivotMatch[1].trim()), ...splitChunk(pivotMatch[2].trim())];
          }
        }

        // Force-split "Nice work" etc
        if (chunk.length > 60) {
          const niceWorkMatch = chunk.match(/^(.+?(?:Nice work|Great work|Great job|Solid work|Really solid|Well done|Nailed it)[.!]+)\s+(.+)/i);
          if (niceWorkMatch && niceWorkMatch[2].trim().length > 10) {
            return [...splitChunk(niceWorkMatch[1].trim()), ...splitChunk(niceWorkMatch[2].trim())];
          }
        }

        // Force-split scenario announcements
        if (chunk.length > 60) {
          const scenarioAnnounce = chunk.match(/^(.+?[.!?])\s+((?:Let us try|Let's try|Next scenario|One more|Ok, last one|Ok, next one)[.!]?\s*.+)/i);
          if (scenarioAnnounce && scenarioAnnounce[1].trim().length > 5) {
            return [...splitChunk(scenarioAnnounce[1].trim()), ...splitChunk(scenarioAnnounce[2].trim())];
          }
        }

        // Force-split scenario patient descriptions
        const scenarioMatch = chunk.match(/(.*?[.!]\s*)(A \d{1,3}[\s-]year[\s-]old.+)/i);
        if (scenarioMatch && scenarioMatch[1].trim().length > 0) {
          const parts = [...splitChunk(scenarioMatch[1].trim())];
          const scenarioText = scenarioMatch[2].trim();
          const qMatch = scenarioText.match(/(.*?[.]\s*)((?:What|Which|How|Why|Where|Who|Is|Are|Do|Does|Can|Name|Identify|Pick|Find|Look)\s.+)/i);
          if (qMatch && qMatch[1].trim().length > 10) {
            parts.push(qMatch[1].trim());
            parts.push(qMatch[2].trim());
          } else { parts.push(scenarioText); }
          return parts;
        }

        // Force-split any bubble over 100 chars at sentence boundaries
        if (chunk.length > 100) {
          const sentences = chunk.match(/[^.!?]+[.!?]+/g);
          if (sentences && sentences.length >= 2) {
            const mid = Math.ceil(sentences.length / 2);
            return [...splitChunk(sentences.slice(0, mid).join("").trim()), ...splitChunk(sentences.slice(mid).join("").trim())];
          }
        }

        return [chunk];
      };

      const chunks = [];
      for (const chunk of rawChunks) {
        // MC with options — split preamble off and format options
        if (/[A-E]\)/.test(chunk) && (chunk.match(/[A-E]\)/g) || []).length >= 2) {
          const firstOption = chunk.search(/[A-E]\)/);
          const beforeOptions = chunk.slice(0, firstOption);
          // Find the MC question keyword before the options
          const whichIdx = beforeOptions.search(/(?:Which|What|Select|All of|Name|Identify)/i);
          const mcStart = whichIdx >= 0 ? whichIdx : Math.max(beforeOptions.lastIndexOf(". ") + 2, 0);
          
          if (mcStart > 10) {
            // Split off preamble
            const preamble = chunk.slice(0, mcStart).trim();
            const mcPart = chunk.slice(mcStart).trim();
            chunks.push(...splitChunk(preamble));
            chunks.push(mcPart.replace(/([A-E]\))/g, "\n$1").trim());
          } else {
            // Just format options
            chunks.push(chunk.replace(/([A-E]\))/g, "\n$1").trim());
          }
          continue;
        }
        // MC trigger without options — convert to free response
        const mcTriggers = /which of the following|which are true|which is true|which of these|what are true|what is true|select all that apply|all of the following except|all of the following/i;
        if (mcTriggers.test(chunk) && !/[A-E]\)/.test(chunk)) {
          let fixed = chunk.replace(/which of the following/gi, "what").replace(/select all that apply[.:]?\s*/gi, "").replace(/all of the following .* except/gi, "what does NOT");
          chunks.push(...splitChunk(fixed));
          continue;
        }
        
        // Everything else — run through recursive splitter
        chunks.push(...splitChunk(chunk));
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
      
      // FOURTH PASS: Ensure response ends with something the student can respond to
      if (finalChunks.length > 0) {
        const lastChunk = finalChunks[finalChunks.length - 1].trim();
        const hasSayBack = /say (?:that|it|this) back/i.test(lastChunk);
        const endsWithQuestion = lastChunk.endsWith("?");
        const endsWithPunctuation = /[.!?]$/.test(lastChunk);
        
        // Truncated response (doesn't end with punctuation) — remove broken chunk and add prompt
        if (!endsWithPunctuation && lastChunk.length > 3) {
          finalChunks.pop();
          if (finalChunks.length === 0) {
            finalChunks.push("Sorry, I lost my train of thought. Where were we?");
          } else {
            finalChunks.push("Ready to keep going?");
          }
        }
        // Ends with statement, not question or say-back
        else if (!endsWithQuestion && !hasSayBack) {
          if (/next scenario|one more|last one|let us try|let's try/i.test(lastChunk)) {
            finalChunks.push("Ready?");
          } else {
            finalChunks.push("What do you think?");
          }
        }
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
              <option value={1.0}>Slow</option><option value={1.2}>Medium</option><option value={1.5}>Normal</option><option value={1.7}>Fast</option><option value={1.9}>Faster</option>
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
