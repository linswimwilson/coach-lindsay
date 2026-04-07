import { useState, useEffect, useRef, useCallback } from "react";
import useAnalytics from "../analytics/useAnalytics.js";
import { BASE_PROMPT } from "./basePrompt.js";
import { prepareForSpeech } from "./tts.js";

// ================================================================
// IMAGE BUBBLE — Fetches from curated catalog or OpenVerse on demand.
// ================================================================
function ImageBubble({ keyword, catalog }) {
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchImage = async () => {
      try {
        const key = keyword.toLowerCase().trim();
        const entry = catalog?.[key];

        // If curated entry has a direct URL, use it
        if (entry?.url) {
          if (!cancelled) {
            setImageData({ src: entry.url, caption: entry.caption || keyword, attribution: entry.attribution || "" });
            setLoading(false);
          }
          return;
        }

        // Search OpenVerse
        const searchQuery = entry?.search || keyword;
        const res = await fetch(
          "https://api.openverse.org/v1/images/?q=" + encodeURIComponent(searchQuery) + "&page_size=5"
        );
        if (!res.ok) throw new Error("API error");
        const data = await res.json();

        if (data.results && data.results.length > 0) {
          const img = data.results[0];
          if (!cancelled) {
            setImageData({
              src: img.thumbnail || img.url,
              caption: entry?.caption || img.title || keyword,
              attribution: img.creator
                ? img.creator + " \u00B7 " + (img.license || "CC").toUpperCase()
                : (img.license || "CC").toUpperCase(),
              sourceUrl: img.foreign_landing_url,
            });
            setLoading(false);
          }
        } else {
          if (!cancelled) { setFailed(true); setLoading(false); }
        }
      } catch (e) {
        if (!cancelled) { setFailed(true); setLoading(false); }
      }
    };
    fetchImage();
    return () => { cancelled = true; };
  }, [keyword, catalog]);

  if (failed) return null;

  if (loading) {
    return (
      <div style={{ padding: "16px", borderRadius: "12px", backgroundColor: "#F8F6F3", border: "1px solid #E8E0D6", textAlign: "center", color: "#8B7355", fontSize: "13px", fontFamily: "'Source Serif 4', Georgia, serif" }}>
        Loading image\u2026
      </div>
    );
  }

  return (
    <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #E8E0D6", backgroundColor: "#FFF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <img
        src={imageData.src}
        alt={imageData.caption}
        style={{ width: "100%", display: "block" }}
        onError={(e) => { e.target.closest("div").style.display = "none"; }}
      />
      <div style={{ padding: "8px 12px" }}>
        <div style={{ fontSize: "13px", color: "#2C2420", fontWeight: 500, fontFamily: "'Source Serif 4', Georgia, serif" }}>{imageData.caption}</div>
        {imageData.attribution && (
          <div style={{ fontSize: "11px", color: "#A09080", marginTop: "2px", fontFamily: "'Source Serif 4', Georgia, serif" }}>
            {imageData.sourceUrl
              ? <a href={imageData.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#A09080", textDecoration: "underline" }}>{imageData.attribution}</a>
              : imageData.attribution}
          </div>
        )}
      </div>
    </div>
  );
}


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

export default function ChatEngine({ conversationId, title, conversationPrompt, initialMessages, priorContext, curatedImages }) {
  const SYSTEM_PROMPT = BASE_PROMPT + "\n\n" + conversationPrompt;

  const analytics = useAnalytics(conversationId);
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
      const initBubbles = initialMessages.map((m, i) => ({ ...m, groupId, showAvatar: i === 0, isLastInGroup: i === initialMessages.length - 1, animDelay: i * 1500 }));
      setMessages(initBubbles);
      if (voiceEnabledRef.current) setTimeout(() => speakBubbles(initialMessages.map(m => m.content)), 500);
      analytics.onCoachBubblesRendered(initialMessages.length, 1500);
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
    analytics.onVoiceModeToggle(next);
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
    analytics.onStudentMessage(text, voiceModeRef.current ? "voice" : "text", exchangeCount + 1);
    try {
      const conversationHistory = [...priorContext, ...messages.filter(m => !m.isImage), { role: "user", content: text }];
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
        // Preserve [VISUAL:...] tags as standalone bubbles — do not force-split
        if (/^\[VISUAL:[^\]]+\]$/.test(chunk.trim())) {
          chunks.push(chunk.trim());
          continue;
        }
        // Strip any [VISUAL:...] embedded mid-sentence into its own chunk
        const embeddedVisual = chunk.match(/^(.*?)\s*(\[VISUAL:[^\]]+\])\s*(.*?)$/);
        if (embeddedVisual) {
          if (embeddedVisual[1].trim()) chunks.push(embeddedVisual[1].trim());
          chunks.push(embeddedVisual[2].trim());
          if (embeddedVisual[3].trim()) chunks.push(embeddedVisual[3].trim());
          continue;
        }

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

      // THIRD PASS: One question per response — truncate after the first answerable question.
      // Find the first chunk that ends with "?" (ignoring [VISUAL:...] tags).
      // Keep everything up to and including that chunk. Drop the rest.
      // This is a hard code-level enforcement — the AI cannot override it.
      const truncated = [];
      let foundQuestion = false;
      for (const chunk of finalChunks) {
        truncated.push(chunk);
        // Skip VISUAL tags — they are not questions
        if (/^\[VISUAL:[^\]]+\]$/.test(chunk)) continue;
        // Check if this chunk ends with a question mark
        if (/\?\s*$/.test(chunk) && !foundQuestion) {
          foundQuestion = true;
          break;
        }
      }
      // Use truncated if we found a question, otherwise keep all (edge case: no question at all)
      const paced = foundQuestion ? truncated : finalChunks;

      const groupId = Date.now().toString();
      const visualRe = /^\[VISUAL:([^\]]+)\]$/;
      const newBubbles = paced.map((chunk, i) => {
        const vm = chunk.match(visualRe);
        return { role: "assistant", content: vm ? "" : chunk, isImage: !!vm, imageKeyword: vm ? vm[1].trim() : null, groupId, showAvatar: i === 0, isLastInGroup: i === paced.length - 1, animDelay: i * 1500 };
      });
      setMessages(prev => [...prev, ...newBubbles]);
      analytics.onCoachBubblesRendered(newBubbles.length, 1500);
      analytics.onAIResponse(fullText, exchangeCount);
      const spokenChunks = paced.filter(c => !visualRe.test(c));
      if (voiceEnabledRef.current) setTimeout(() => speakBubbles(spokenChunks), 300);
      else if (voiceModeRef.current) {
        // Voice mode on but TTS off — auto-listen after bubbles animate
        setTimeout(() => startListening(), paced.length * 1500 + 500);
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
            <div style={{ fontSize: "13px", color: "#8B7355", marginTop: "2px" }}>{title}</div>
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
            {msg.isImage ? (
              <div style={{ maxWidth: "80%" }}>
                <ImageBubble keyword={msg.imageKeyword} catalog={curatedImages} />
              </div>
            ) : (
              <div style={{ maxWidth: "80%", padding: "10px 16px", borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px", backgroundColor: msg.role === "user" ? "#8B7355" : "#FFF", color: msg.role === "user" ? "#FFF" : "#2C2420", fontSize: "15px", lineHeight: "1.5", border: msg.role === "user" ? "none" : "1px solid #E8E0D6", boxShadow: msg.role === "user" ? "none" : "0 1px 2px rgba(0,0,0,0.04)" }}>
                {msg.role === "assistant" ? formatText(msg.content) : msg.content}
              </div>
            )}
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
