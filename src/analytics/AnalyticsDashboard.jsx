import { useState, useEffect } from "react";
import { getAllSessions, clearAllData, exportData } from "./analytics.js";

const CONV_NAMES = {
  conv1: "Gas Exchange Foundations",
  conv2: "Compliance, Surfactant & Ventilation",
  conv3: "The Numbers",
  conv7: "Emphysema — Pink Puffer",
  conv8: "Chronic Bronchitis — Blue Bloater",
  conv9: "Restrictive Diseases",
};

function formatMs(ms) {
  if (!ms) return "—";
  if (ms < 1000) return ms + "ms";
  if (ms < 60000) return (ms / 1000).toFixed(1) + "s";
  return (ms / 60000).toFixed(1) + "m";
}

function formatDuration(ms) {
  if (!ms) return "—";
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function Bar({ value, max, color = "#8B7355" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ flex: 1, height: "12px", backgroundColor: "#F0ECE6", borderRadius: "6px", overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", backgroundColor: color, borderRadius: "6px", transition: "width 0.3s" }} />
      </div>
      <span style={{ fontSize: "12px", color: "#8B7355", minWidth: "40px" }}>{value}</span>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [sessions, setSessions] = useState([]);
  const [expandedSession, setExpandedSession] = useState(null);

  const refresh = () => setSessions(getAllSessions());
  useEffect(refresh, []);

  const completedSessions = sessions.filter(s => s.summary);
  const totalSessions = sessions.length;
  const completionRate = totalSessions > 0 ? Math.round((sessions.filter(s => s.completed).length / totalSessions) * 100) : 0;
  const avgDuration = completedSessions.length > 0 ? Math.round(completedSessions.reduce((a, s) => a + (s.summary?.durationMs || 0), 0) / completedSessions.length) : 0;
  const voiceCount = completedSessions.filter(s => s.summary?.voiceUsed).length;
  const textCount = completedSessions.filter(s => s.summary?.textUsed).length;

  // Per-conversation stats
  const convIds = [...new Set(sessions.map(s => s.conversationId))].sort();
  const convStats = convIds.map(id => {
    const convSessions = sessions.filter(s => s.conversationId === id);
    const withSummary = convSessions.filter(s => s.summary);
    return {
      id,
      name: CONV_NAMES[id] || id,
      count: convSessions.length,
      completed: convSessions.filter(s => s.completed).length,
      avgDuration: withSummary.length > 0 ? Math.round(withSummary.reduce((a, s) => a + (s.summary.durationMs || 0), 0) / withSummary.length) : 0,
      avgExchanges: withSummary.length > 0 ? Math.round(withSummary.reduce((a, s) => a + (s.summary.exchangeCount || 0), 0) / withSummary.length) : 0,
      avgLatency: withSummary.filter(s => s.summary.avgResponseLatencyMs).length > 0 ? Math.round(withSummary.filter(s => s.summary.avgResponseLatencyMs).reduce((a, s) => a + s.summary.avgResponseLatencyMs, 0) / withSummary.filter(s => s.summary.avgResponseLatencyMs).length) : 0,
      avgTabAways: withSummary.length > 0 ? (withSummary.reduce((a, s) => a + (s.summary.tabAwayCount || 0), 0) / withSummary.length).toFixed(1) : 0,
      correctRate: withSummary.length > 0 ? (() => { const c = withSummary.reduce((a, s) => a + (s.summary.correctAnswers || 0), 0); const w = withSummary.reduce((a, s) => a + (s.summary.wrongAnswers || 0), 0); return c + w > 0 ? Math.round((c / (c + w)) * 100) : 0; })() : 0,
    };
  });

  // Time of day distribution
  const todCounts = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  sessions.forEach(s => { if (s.timeOfDay) todCounts[s.timeOfDay]++; });
  const todMax = Math.max(1, ...Object.values(todCounts));

  // Latency buckets
  const latencyBuckets = { "< 5s": 0, "5-15s": 0, "15-30s": 0, "30-60s": 0, "> 60s": 0 };
  sessions.forEach(s => {
    (s.events || []).filter(e => e.type === "response_latency").forEach(e => {
      const ms = e.data.latencyMs;
      if (ms < 5000) latencyBuckets["< 5s"]++;
      else if (ms < 15000) latencyBuckets["5-15s"]++;
      else if (ms < 30000) latencyBuckets["15-30s"]++;
      else if (ms < 60000) latencyBuckets["30-60s"]++;
      else latencyBuckets["> 60s"]++;
    });
  });
  const latMax = Math.max(1, ...Object.values(latencyBuckets));

  const cardStyle = { backgroundColor: "#FFF", border: "1px solid #E8E0D6", borderRadius: "12px", padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" };
  const headingStyle = { fontSize: "14px", fontWeight: 600, color: "#2C2420", marginBottom: "12px" };
  const statNum = { fontSize: "28px", fontWeight: 700, color: "#2C2420" };
  const statLabel = { fontSize: "12px", color: "#8B7355", marginTop: "2px" };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 16px", fontFamily: "'Source Serif 4', Georgia, serif", backgroundColor: "#FAFAF7", minHeight: "100vh" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#2C2420", margin: 0 }}>Coach Lindsay Analytics</h1>
          <p style={{ fontSize: "13px", color: "#8B7355", margin: "4px 0 0" }}>Silent telemetry — not visible to students</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={refresh} style={btnStyle}>Refresh</button>
          <button onClick={() => { const blob = new Blob([exportData()], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "coach-lindsay-analytics.json"; a.click(); }} style={btnStyle}>Export JSON</button>
          <button onClick={() => { if (confirm("Clear all analytics data?")) { clearAllData(); refresh(); } }} style={{ ...btnStyle, color: "#C53030", borderColor: "#FED7D7" }}>Clear</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
        <div style={cardStyle}><div style={statNum}>{totalSessions}</div><div style={statLabel}>Total sessions</div></div>
        <div style={cardStyle}><div style={statNum}>{formatDuration(avgDuration)}</div><div style={statLabel}>Avg duration</div></div>
        <div style={cardStyle}><div style={statNum}>{completionRate}%</div><div style={statLabel}>Completion rate</div></div>
        <div style={cardStyle}><div style={statNum}>{voiceCount > textCount ? "Voice" : textCount > 0 ? "Text" : "—"}</div><div style={statLabel}>Preferred input</div></div>
      </div>

      {/* Per-conversation table */}
      <div style={{ ...cardStyle, marginBottom: "24px", overflowX: "auto" }}>
        <div style={headingStyle}>Per Conversation</div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #E8E0D6", color: "#8B7355", textAlign: "left" }}>
              <th style={{ padding: "8px" }}>Conversation</th>
              <th style={{ padding: "8px" }}>Sessions</th>
              <th style={{ padding: "8px" }}>Completed</th>
              <th style={{ padding: "8px" }}>Avg Duration</th>
              <th style={{ padding: "8px" }}>Avg Exchanges</th>
              <th style={{ padding: "8px" }}>Avg Latency</th>
              <th style={{ padding: "8px" }}>Tab Aways</th>
              <th style={{ padding: "8px" }}>Correct %</th>
            </tr>
          </thead>
          <tbody>
            {convStats.map(c => (
              <tr key={c.id} style={{ borderBottom: "1px solid #F0ECE6" }}>
                <td style={{ padding: "8px", fontWeight: 500, color: "#2C2420" }}>{c.name}</td>
                <td style={{ padding: "8px" }}>{c.count}</td>
                <td style={{ padding: "8px" }}>{c.completed}</td>
                <td style={{ padding: "8px" }}>{formatDuration(c.avgDuration)}</td>
                <td style={{ padding: "8px" }}>{c.avgExchanges}</td>
                <td style={{ padding: "8px" }}>{formatMs(c.avgLatency)}</td>
                <td style={{ padding: "8px" }}>{c.avgTabAways}</td>
                <td style={{ padding: "8px" }}>{c.correctRate}%</td>
              </tr>
            ))}
            {convStats.length === 0 && <tr><td colSpan={8} style={{ padding: "16px", textAlign: "center", color: "#A09080" }}>No data yet</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "24px" }}>
        <div style={cardStyle}>
          <div style={headingStyle}>Response Latency Distribution</div>
          {Object.entries(latencyBuckets).map(([label, count]) => (
            <div key={label} style={{ marginBottom: "6px" }}>
              <div style={{ fontSize: "12px", color: "#8B7355", marginBottom: "2px" }}>{label}</div>
              <Bar value={count} max={latMax} color={label === "> 60s" ? "#C53030" : label === "30-60s" ? "#DD6B20" : "#8B7355"} />
            </div>
          ))}
        </div>
        <div style={cardStyle}>
          <div style={headingStyle}>Study Time of Day</div>
          {Object.entries(todCounts).map(([label, count]) => (
            <div key={label} style={{ marginBottom: "6px" }}>
              <div style={{ fontSize: "12px", color: "#8B7355", marginBottom: "2px", textTransform: "capitalize" }}>{label}</div>
              <Bar value={count} max={todMax} />
            </div>
          ))}
        </div>
      </div>

      {/* Session list */}
      <div style={cardStyle}>
        <div style={headingStyle}>Session History ({sessions.length})</div>
        {sessions.slice().reverse().map(s => (
          <div key={s.sessionId} style={{ borderBottom: "1px solid #F0ECE6", padding: "10px 0" }}>
            <div onClick={() => setExpandedSession(expandedSession === s.sessionId ? null : s.sessionId)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontWeight: 500, color: "#2C2420" }}>{CONV_NAMES[s.conversationId] || s.conversationId}</span>
                <span style={{ fontSize: "12px", color: "#A09080", marginLeft: "8px" }}>{new Date(s.startedAt).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {s.completed && <span style={{ fontSize: "11px", backgroundColor: "#F0F7F3", color: "#2D6A4F", padding: "2px 8px", borderRadius: "8px" }}>Completed</span>}
                {s.summary && <span style={{ fontSize: "12px", color: "#8B7355" }}>{formatDuration(s.summary.durationMs)} · {s.summary.exchangeCount} exchanges</span>}
                <span style={{ fontSize: "16px", color: "#8B7355" }}>{expandedSession === s.sessionId ? "\u25B2" : "\u25BC"}</span>
              </div>
            </div>
            {expandedSession === s.sessionId && (
              <div style={{ marginTop: "8px", padding: "8px", backgroundColor: "#FAFAF7", borderRadius: "8px", fontSize: "12px" }}>
                {s.summary && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "8px" }}>
                    <div>Avg latency: <strong>{formatMs(s.summary.avgResponseLatencyMs)}</strong></div>
                    <div>Correct: <strong>{s.summary.correctAnswers}</strong> Wrong: <strong>{s.summary.wrongAnswers}</strong></div>
                    <div>Tab aways: <strong>{s.summary.tabAwayCount}</strong> ({formatDuration(s.summary.totalTabAwayMs)} away)</div>
                    <div>Max scaffold: <strong>Level {s.summary.maxScaffoldingLevel}</strong></div>
                  </div>
                )}
                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ borderBottom: "1px solid #E8E0D6", color: "#8B7355" }}><th style={{ textAlign: "left", padding: "4px" }}>Time</th><th style={{ textAlign: "left", padding: "4px" }}>Event</th><th style={{ textAlign: "left", padding: "4px" }}>Data</th></tr></thead>
                    <tbody>
                      {(s.events || []).map((e, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #F0ECE6" }}>
                          <td style={{ padding: "4px", color: "#A09080", whiteSpace: "nowrap" }}>{new Date(e.timestamp).toLocaleTimeString()}</td>
                          <td style={{ padding: "4px", fontWeight: 500 }}>{e.type}</td>
                          <td style={{ padding: "4px", color: "#8B7355", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis" }}>{JSON.stringify(e.data)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
        {sessions.length === 0 && <div style={{ textAlign: "center", color: "#A09080", padding: "16px" }}>No sessions recorded yet. Data appears after students use the app.</div>}
      </div>
    </div>
  );
}

const btnStyle = { padding: "6px 14px", borderRadius: "8px", border: "1px solid #E8E0D6", backgroundColor: "#FFF", color: "#8B7355", fontSize: "13px", cursor: "pointer", fontFamily: "'Source Serif 4', Georgia, serif" };
