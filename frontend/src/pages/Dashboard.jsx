import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";

const URGENCY_STYLES = {
  critical: { bg: "bg-bdred", text: "text-white", label: "জরুরি" },
  high: { bg: "bg-gold/15 border border-gold/30", text: "text-gold", label: "উচ্চ" },
  medium: { bg: "bg-slate/10", text: "text-slate", label: "মধ্যম" },
  low: { bg: "bg-navy/5", text: "text-navy/50", label: "নিম্ন" },
};

const URGENCY_BAR = { critical: "bg-bdred", high: "bg-gold", medium: "bg-slate/40", low: "bg-navy/20" };
const CASE_TYPE_LABELS = { criminal: "ফৌজদারি", civil: "দেওয়ানি", family: "পারিবারিক", commercial: "বাণিজ্যিক" };

export default function Dashboard() {
  const navigate = useNavigate();
  const name = localStorage.getItem("odhikar_name");
  const role = localStorage.getItem("odhikar_role");

  useEffect(() => {
    if (role === "citizen") navigate("/bot", { replace: true });
  }, [role, navigate]);

  const [courts, setCourts] = useState([]);
  const [courtId, setCourtId] = useState("");
  const [stats, setStats] = useState(null);
  const [cases, setCases] = useState([]);
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function logout() { localStorage.clear(); navigate("/login"); }

  useEffect(() => {
    api.get("/courts").then(({ data }) => {
      setCourts(data);
      if (data.length) setCourtId(data[0].id);
    }).catch(() => setError("Court list load করা যায়নি"));
  }, []);

  const loadData = useCallback(async () => {
    if (!courtId) return;
    setLoading(true); setError("");
    try {
      const [statsRes, casesRes] = await Promise.all([
        api.get(`/cases/stats?court_id=${courtId}`),
        api.get(`/cases/prioritized?court_id=${courtId}&limit=100`),
      ]);
      setStats(statsRes.data); setCases(casesRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || "ডেটা লোড করা যায়নি");
    } finally { setLoading(false); }
  }, [courtId]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredCases = urgencyFilter === "all" ? cases : cases.filter((c) => c.urgency === urgencyFilter);
  const ageInYears = (d) => ((Date.now() - new Date(d).getTime()) / 86400000 / 365).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-bdgreen-dark/[0.04] via-parchment to-gold/[0.06]">
      {/* Decorative blobs */}
      <div className="fixed top-20 right-10 w-80 h-80 bg-bdgreen/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 left-10 w-72 h-72 bg-gold/[0.06] rounded-full blur-3xl pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-20 bg-gradient-to-r from-ink via-bdgreen-dark to-bdgreen px-4 md:px-6 py-3 flex justify-between items-center shadow-xl shadow-bdgreen/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
            <img src="/logo.jpg" alt="অধিকার" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-display text-lg text-white font-bold">অধিকার</span>
            <span className="ml-2 text-[10px] text-white/40 tracking-[2px] font-mono">ODHIKAR</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/bot")} className="text-sm text-white/70 hover:text-white transition-colors">
            💬 নাগরিকবট
          </button>
          <button onClick={() => navigate("/thana-accountability")} className="text-sm text-white/70 hover:text-white transition-colors">
            🚨 থানা জবাবদিহিতা
          </button>
          <div className="h-4 w-px bg-white/20" />
          <span className="text-sm text-gold font-medium">
            ⚖ {name}
          </span>
          <button onClick={logout} className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">
            লগ আউট
          </button>
        </div>
      </nav>

      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Welcome + Court selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-navy">
              স্বাগতম, <span className="text-bdgreen">{name}</span>
            </h1>
            <p className="text-base text-slate mt-1">আপনার আদালতের মামলা অগ্রাধিকার অনুযায়ী সাজানো আছে</p>
          </div>
          <select
            value={courtId}
            onChange={(e) => setCourtId(e.target.value)}
            className="bg-white/80 backdrop-blur-sm border border-bdgreen/20 rounded-xl px-4 py-3 text-base text-navy font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-bdgreen/30 max-w-sm"
          >
            {courts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}, {c.district}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-bdred/10 border border-bdred/20 text-bdred text-base rounded-xl px-5 py-4 mb-5 font-medium">{error}</div>
        )}

        {/* Stats cards - gradient styled */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="মোট বিচারাধীন" value={stats.total}
              gradient="from-bdgreen to-bdgreen-dark" icon="📋"
            />
            <StatCard
              label="জরুরি মামলা" value={stats.critical}
              gradient="from-bdred to-bdred/80" icon="🚨"
            />
            <StatCard
              label="গড় বয়স (বছর)" value={stats.avg_age_years}
              gradient="from-gold to-gold/80" icon="⏳"
            />
            <StatCard
              label="সবচেয়ে পুরনো (বছর)" value={stats.oldest_case_years}
              gradient="from-navy to-ink" icon="📅"
            />
          </div>
        )}

        {/* Urgency filter chips */}
        <div className="flex gap-2 mb-5 flex-wrap">
          <FilterChip active={urgencyFilter === "all"} onClick={() => setUrgencyFilter("all")} color="bdgreen">
            সব ({cases.length})
          </FilterChip>
          {["critical", "high", "medium", "low"].map((u) => {
            const s = URGENCY_STYLES[u];
            const count = cases.filter((c) => c.urgency === u).length;
            const colors = { critical: "bdred", high: "gold", medium: "slate", low: "navy" };
            return (
              <FilterChip key={u} active={urgencyFilter === u} onClick={() => setUrgencyFilter(u)} color={colors[u]}>
                {s.label} ({count})
              </FilterChip>
            );
          })}
        </div>

        {/* Case table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 overflow-hidden shadow-xl shadow-black/[0.04]">
          {loading ? (
            <div className="p-16 text-center">
              <div className="w-10 h-10 border-[3px] border-bdgreen/20 border-t-bdgreen rounded-full animate-spin mx-auto mb-4" />
              <p className="text-base text-slate">লোড হচ্ছে...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-16 text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-base text-slate font-medium">কোনো কেস পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-base">
                <thead>
                  <tr className="bg-gradient-to-r from-bdgreen/[0.08] to-gold/[0.04] text-left">
                    <th className="px-5 py-4 font-bold text-navy w-14">#</th>
                    <th className="px-5 py-4 font-bold text-navy">কেস নম্বর</th>
                    <th className="px-5 py-4 font-bold text-navy">শিরোনাম</th>
                    <th className="px-5 py-4 font-bold text-navy">ধরন</th>
                    <th className="px-5 py-4 font-bold text-navy">বয়স</th>
                    <th className="px-5 py-4 font-bold text-navy">অগ্রাধিকার</th>
                    <th className="px-5 py-4 font-bold text-navy">স্কোর</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.map((c, idx) => {
                    const style = URGENCY_STYLES[c.urgency] || URGENCY_STYLES.low;
                    const barColor = URGENCY_BAR[c.urgency] || URGENCY_BAR.low;
                    return (
                      <tr
                        key={c.id}
                        onClick={() => navigate(`/case/${c.id}`)}
                        className={`border-t border-black/[0.04] hover:bg-gradient-to-r hover:from-bdgreen/[0.03] hover:to-transparent transition-colors cursor-pointer ${
                          idx % 2 === 0 ? "" : "bg-black/[0.01]"
                        }`}
                      >
                        <td className="px-5 py-4 text-slate font-medium">{c.rank}</td>
                        <td className="px-5 py-4 font-mono text-sm text-bdgreen">{c.case_number}</td>
                        <td className="px-5 py-4 max-w-xs truncate text-navy font-medium">
                          {c.title}
                          {(c.involves_domestic_violence || c.involves_minor) && (
                            <span className="ml-2 text-sm text-bdred font-semibold">🔒</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate">{CASE_TYPE_LABELS[c.case_type]}</td>
                        <td className="px-5 py-4">
                          <span className={`font-semibold ${parseFloat(ageInYears(c.filed_date)) > 10 ? "text-bdred" : "text-navy"}`}>
                            {ageInYears(c.filed_date)} বছর
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-bold ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-20 h-2.5 bg-black/[0.06] rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${c.priority_score}%` }} />
                            </div>
                            <span className={`text-sm font-bold w-10 ${
                              c.priority_score >= 80 ? "text-bdred" : c.priority_score >= 60 ? "text-gold" : "text-navy"
                            }`}>{c.priority_score}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-sm text-slate/50">
          AI দ্বারা অগ্রাধিকার নির্ণয় করা হয়েছে | XGBoost ML Model | R² = 0.952
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, gradient, icon }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}>
      <div className="absolute -right-3 -top-3 text-5xl opacity-10">{icon}</div>
      <div className="relative z-10">
        <div className="text-4xl font-bold">{value}</div>
        <div className="text-sm mt-1.5 text-white/80 font-medium">{label}</div>
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children, color }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        active
          ? `bg-${color} text-white shadow-md`
          : "bg-white/70 backdrop-blur-sm text-slate border border-black/[0.06] hover:border-bdgreen/30 hover:shadow-sm"
      }`}
    >
      {children}
    </button>
  );
}
