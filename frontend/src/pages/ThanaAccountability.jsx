import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";

export default function ThanaAccountability() {
  const navigate = useNavigate();
  const name = localStorage.getItem("odhikar_name");

  const [summary, setSummary] = useState(null);
  const [publicStats, setPublicStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [reportType, setReportType] = useState("");
  const [thanaData, setThanaData] = useState({});

  useEffect(() => {
    api.get("/mamla-bazi/thanas").then(({ data }) => setThanaData(data)).catch(() => {});
    api.get("/mamla-bazi/public-stats").then(({ data }) => setPublicStats(data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (division) params.append("division", division);
    if (district) params.append("district", district);
    if (reportType) params.append("report_type", reportType);
    api.get(`/mamla-bazi/summary?${params.toString()}`)
      .then(({ data }) => setSummary(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [division, district, reportType]);

  const divisions = Object.keys(thanaData);
  const districts = division ? Object.keys(thanaData[division] || {}) : [];

  function logout() { localStorage.clear(); navigate("/login"); }

  const maxThanaCount = summary?.by_thana?.[0]?.count || 1;
  const maxCatCount = summary?.by_category?.[0]?.count || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-bdred/[0.04] via-parchment to-gold/[0.06]">
      <div className="fixed top-20 right-10 w-72 h-72 bg-bdred/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 left-10 w-64 h-64 bg-gold/[0.05] rounded-full blur-3xl pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-20 bg-gradient-to-r from-ink via-bdred/90 to-bdred px-4 md:px-6 py-3 flex justify-between items-center shadow-xl shadow-bdred/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
            <img src="/logo.jpg" alt="অধিকার" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-display text-lg text-white font-bold">থানা জবাবদিহিতা</span>
            <span className="ml-2 text-[10px] text-white/40 tracking-[2px] font-mono">ACCOUNTABILITY</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/dashboard")} className="text-sm text-white/70 hover:text-white transition-colors">📋 ড্যাশবোর্ড</button>
          <button onClick={() => navigate("/bot")} className="text-sm text-white/70 hover:text-white transition-colors">💬 নাগরিকবট</button>
          <div className="h-4 w-px bg-white/20" />
          <span className="text-sm text-gold font-medium">⚖ {name}</span>
          <button onClick={logout} className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">লগ আউট</button>
        </div>
      </nav>

      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy">থানা জবাবদিহিতা ড্যাশবোর্ড</h1>
          <p className="text-base text-slate mt-1">মামলাবাজি প্ল্যাটফর্ম থেকে anonymous রিপোর্টের সামগ্রিক বিশ্লেষণ</p>
        </div>

        {/* Top stat cards */}
        {publicStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <GradientCard icon="📊" value={publicStats.total} label="মোট রিপোর্ট" gradient="from-navy to-ink" />
            <GradientCard icon="🚫" value={publicStats.refusals} label="অভিযোগ প্রত্যাখ্যান" gradient="from-bdred to-bdred/80" />
            <GradientCard icon="⚠" value={publicStats.false_cases} label="মিথ্যা মামলা" gradient="from-gold to-gold/80" />
            <GradientCard icon="📍" value={publicStats.top_division || "—"} label="সর্বোচ্চ রিপোর্ট" gradient="from-bdgreen to-bdgreen-dark" />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1 h-4 bg-bdred rounded-full" />
            <span className="text-sm font-bold text-navy">ফিল্টার</span>
          </div>
          <div className="grid md:grid-cols-4 gap-3">
            <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="input text-sm py-2.5">
              <option value="">সব ধরন</option>
              <option value="refusal">অভিযোগ প্রত্যাখ্যান</option>
              <option value="false_case">মিথ্যা মামলা</option>
            </select>
            <select value={division} onChange={(e) => { setDivision(e.target.value); setDistrict(""); }} className="input text-sm py-2.5">
              <option value="">সব বিভাগ</option>
              {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select value={district} onChange={(e) => setDistrict(e.target.value)} className="input text-sm py-2.5" disabled={!division}>
              <option value="">সব জেলা</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={() => { setDivision(""); setDistrict(""); setReportType(""); }} className="text-sm text-bdred hover:text-bdred/70 font-medium transition-colors">
              ✕ ফিল্টার মুছুন
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-[3px] border-bdred/20 border-t-bdred rounded-full animate-spin mx-auto mb-4" />
            <p className="text-base text-slate">লোড হচ্ছে...</p>
          </div>
        ) : summary && (
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Top thanas by report count */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-1 h-4 bg-bdred rounded-full" />
                <span className="text-base font-bold text-navy">সর্বোচ্চ রিপোর্টকৃত থানা</span>
              </div>
              {summary.by_thana.length === 0 ? (
                <p className="text-sm text-slate py-8 text-center">কোনো রিপোর্ট পাওয়া যায়নি</p>
              ) : (
                <div className="space-y-3">
                  {summary.by_thana.slice(0, 10).map((t, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="text-sm font-semibold text-navy">{t.thana}</span>
                          <span className="text-xs text-slate ml-2">{t.district}, {t.division}</span>
                        </div>
                        <span className="text-sm font-bold text-bdred">{t.count}</span>
                      </div>
                      <div className="w-full h-3 bg-black/[0.04] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-bdred to-bdred/60 rounded-full transition-all duration-500"
                          style={{ width: `${(t.count / maxThanaCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* By category */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-1 h-4 bg-gold rounded-full" />
                <span className="text-base font-bold text-navy">অভিযোগের ধরন</span>
              </div>
              {summary.by_category.length === 0 ? (
                <p className="text-sm text-slate py-8 text-center">কোনো রিপোর্ট পাওয়া যায়নি</p>
              ) : (
                <div className="space-y-3">
                  {summary.by_category.map((c, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-navy">{c.category}</span>
                        <span className="text-sm font-bold text-gold">{c.count}</span>
                      </div>
                      <div className="w-full h-3 bg-black/[0.04] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gold to-gold/50 rounded-full transition-all duration-500"
                          style={{ width: `${(c.count / maxCatCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Monthly trend */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-1 h-4 bg-bdgreen rounded-full" />
                <span className="text-base font-bold text-navy">মাসিক প্রবণতা</span>
              </div>
              {summary.by_month.length === 0 ? (
                <p className="text-sm text-slate py-8 text-center">কোনো রিপোর্ট পাওয়া যায়নি</p>
              ) : (
                <div className="flex items-end gap-2 h-48">
                  {summary.by_month.map((m, i) => {
                    const maxM = Math.max(...summary.by_month.map(x => x.count));
                    const h = maxM > 0 ? (m.count / maxM) * 100 : 0;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                        <span className="text-xs font-bold text-navy mb-1">{m.count}</span>
                        <div
                          className="w-full bg-gradient-to-t from-bdgreen to-bdgreen/40 rounded-t-lg transition-all duration-500"
                          style={{ height: `${Math.max(h, 8)}%` }}
                        />
                        <span className="text-[10px] text-slate mt-1.5 rotate-[-45deg] origin-top-left whitespace-nowrap">{m.month}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* By report type */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-1 h-4 bg-navy rounded-full" />
                <span className="text-base font-bold text-navy">রিপোর্টের ধরন</span>
              </div>
              {summary.by_type.length === 0 ? (
                <p className="text-sm text-slate py-8 text-center">কোনো রিপোর্ট পাওয়া যায়নি</p>
              ) : (
                <div className="space-y-4">
                  {summary.by_type.map((t, i) => {
                    const total = summary.by_type.reduce((a, b) => a + b.count, 0);
                    const pct = total > 0 ? ((t.count / total) * 100).toFixed(1) : 0;
                    const isRefusal = t.type === "refusal";
                    return (
                      <div key={i} className={`rounded-xl p-5 border ${isRefusal ? "bg-bdred/[0.04] border-bdred/15" : "bg-gold/[0.06] border-gold/20"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{isRefusal ? "🚫" : "⚠"}</span>
                            <span className="text-base font-bold text-navy">{isRefusal ? "অভিযোগ প্রত্যাখ্যান" : "মিথ্যা মামলা"}</span>
                          </div>
                          <span className={`text-2xl font-bold ${isRefusal ? "text-bdred" : "text-gold"}`}>{t.count}</span>
                        </div>
                        <div className="w-full h-3 bg-black/[0.04] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isRefusal ? "bg-bdred" : "bg-gold"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate mt-1.5">{pct}% মোট রিপোর্টের</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 text-center text-sm text-slate/50 max-w-2xl mx-auto leading-relaxed">
          সকল রিপোর্ট anonymous এবং unverified। এটি pattern পর্যবেক্ষণ টুল, আনুষ্ঠানিক অভিযোগ নয়। ব্যক্তিগত তথ্য কোথাও সংরক্ষণ করা হয় না।
        </div>
      </div>
    </div>
  );
}

function GradientCard({ icon, value, label, gradient }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white shadow-lg relative overflow-hidden`}>
      <div className="absolute -right-3 -top-3 text-5xl opacity-10">{icon}</div>
      <div className="relative z-10">
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm mt-1.5 text-white/80 font-medium">{label}</div>
      </div>
    </div>
  );
}
