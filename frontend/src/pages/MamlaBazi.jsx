import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";

const REPORT_TYPES = [
  { value: "refusal", label: "পুলিশ অভিযোগ নেয়নি", label_en: "FIR/GD Refused", icon: "🚫", desc: "থানায় গিয়েছিলাম কিন্তু FIR/GD নিতে অস্বীকার করেছে" },
  { value: "false_case", label: "মিথ্যা মামলা হয়েছে", label_en: "False Case Filed", icon: "⚠", desc: "আমার বিরুদ্ধে ভিত্তিহীন/মিথ্যা মামলা দায়ের করা হয়েছে" },
];

export default function MamlaBazi() {
  const navigate = useNavigate();
  const [thanaData, setThanaData] = useState({});
  const [categories, setCategories] = useState([]);
  const [publicStats, setPublicStats] = useState(null);

  // Form state
  const [reportType, setReportType] = useState("");
  const [division, setDivision] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [category, setCategory] = useState("");
  const [month, setMonth] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/mamla-bazi/thanas").then(({ data }) => setThanaData(data)).catch(() => {});
    api.get("/mamla-bazi/categories").then(({ data }) => setCategories(data.categories)).catch(() => {});
    api.get("/mamla-bazi/public-stats").then(({ data }) => setPublicStats(data)).catch(() => {});
  }, []);

  const divisions = Object.keys(thanaData);
  const districts = division ? Object.keys(thanaData[division] || {}) : [];
  const thanas = district && division ? (thanaData[division]?.[district] || []) : [];

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reportType || !division || !district || !thana || !category || !month) {
      setError("সব প্রয়োজনীয় তথ্য দিন");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/mamla-bazi/report", {
        report_type: reportType,
        division, district, thana,
        case_category: category,
        incident_month: month,
        description: description || null,
      });
      setSubmitted(true);
      api.get("/mamla-bazi/public-stats").then(({ data }) => setPublicStats(data)).catch(() => {});
    } catch (err) {
      setError(err.response?.data?.detail || "রিপোর্ট জমা দিতে সমস্যা হয়েছে");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-bdred/[0.04] via-parchment to-gold/[0.06]">
      {/* Decorative */}
      <div className="fixed top-20 right-10 w-72 h-72 bg-bdred/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-10 left-10 w-64 h-64 bg-gold/[0.05] rounded-full blur-3xl pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-20 bg-gradient-to-r from-ink via-bdred/90 to-bdred px-4 md:px-6 py-3 flex justify-between items-center shadow-xl shadow-bdred/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 shadow-lg">
            <img src="/logo.jpg" alt="অধিকার" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-display text-lg text-white font-bold">মামলাবাজি</span>
            <span className="ml-2 text-[10px] text-white/40 tracking-[2px] font-mono">MAMLABAZI</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-sm text-white/70 hover:text-white transition-colors">হোম</button>
          <button onClick={() => navigate("/login")} className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">লগইন</button>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-navy mb-2">মামলাবাজি</h1>
          <p className="text-lg text-slate">পুলিশের জবাবদিহিতা নিশ্চিত করুন, সম্পূর্ণ anonymous</p>
          <p className="text-sm text-slate/60 mt-2">ঘুষ.সাইট যেমন ঘুষের চিত্র তুলে ধরেছে, মামলাবাজি তুলে ধরবে মামলা-প্রক্রিয়ার অনিয়ম</p>
        </div>

        {/* Live stats banner */}
        {publicStats && publicStats.total > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg p-5 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-navy">{publicStats.total}</div>
                <div className="text-sm text-slate">মোট রিপোর্ট</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-bdred">{publicStats.refusals}</div>
                <div className="text-sm text-slate">অভিযোগ নেয়নি</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-gold">{publicStats.false_cases}</div>
                <div className="text-sm text-slate">মিথ্যা মামলা</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-bdgreen">{publicStats.top_division || "—"}</div>
                <div className="text-sm text-slate">সবচেয়ে বেশি রিপোর্ট</div>
              </div>
            </div>
          </div>
        )}

        {submitted ? (
          /* Success state */
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-bdgreen/20 shadow-xl p-8 md:p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-bdgreen/10 flex items-center justify-center mx-auto mb-5 text-4xl">✓</div>
            <h2 className="text-2xl font-bold text-navy mb-2">রিপোর্ট নথিভুক্ত হয়েছে</h2>
            <p className="text-base text-slate mb-2">এটি সম্পূর্ণ anonymous এবং pattern পর্যবেক্ষণে ব্যবহৃত হবে।</p>
            <p className="text-sm text-slate/60 mb-6">এটি কোনো আনুষ্ঠানিক অভিযোগ নয়। জরুরি সাহায্যের জন্য দুদক (acc.org.bd) বা নিকটতম আইনি সহায়তা কেন্দ্রে যোগাযোগ করুন।</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setSubmitted(false); setReportType(""); setDivision(""); setDistrict(""); setThana(""); setCategory(""); setMonth(""); setDescription(""); }} className="bg-bdgreen hover:bg-bdgreen-dark text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                আরেকটি রিপোর্ট দিন
              </button>
              <button onClick={() => navigate("/")} className="bg-navy hover:bg-ink text-white font-semibold px-6 py-3 rounded-xl transition-colors">
                হোম
              </button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Step 1: Report type */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6 md:p-7">
              <h3 className="text-lg font-bold text-navy mb-4">কী ধরনের সমস্যা?</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {REPORT_TYPES.map((rt) => (
                  <button
                    key={rt.value} type="button"
                    onClick={() => setReportType(rt.value)}
                    className={`text-left p-5 rounded-xl border-2 transition-all ${
                      reportType === rt.value
                        ? "border-bdred bg-bdred/5 shadow-md"
                        : "border-transparent bg-parchment/50 hover:border-bdred/20"
                    }`}
                  >
                    <div className="text-2xl mb-2">{rt.icon}</div>
                    <div className="text-base font-bold text-navy">{rt.label}</div>
                    <div className="text-sm text-slate mt-1">{rt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Location */}
            {reportType && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6 md:p-7">
                <h3 className="text-lg font-bold text-navy mb-4">কোথায় ঘটেছে?</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-navy mb-1.5 block">বিভাগ *</label>
                    <select value={division} onChange={(e) => { setDivision(e.target.value); setDistrict(""); setThana(""); }} className="input text-base py-3">
                      <option value="">নির্বাচন করুন</option>
                      {divisions.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-navy mb-1.5 block">জেলা *</label>
                    <select value={district} onChange={(e) => { setDistrict(e.target.value); setThana(""); }} className="input text-base py-3" disabled={!division}>
                      <option value="">নির্বাচন করুন</option>
                      {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-navy mb-1.5 block">থানা *</label>
                    <select value={thana} onChange={(e) => setThana(e.target.value)} className="input text-base py-3" disabled={!district}>
                      <option value="">নির্বাচন করুন</option>
                      {thanas.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {thana && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-6 md:p-7">
                <h3 className="text-lg font-bold text-navy mb-4">বিস্তারিত</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-navy mb-1.5 block">অভিযোগের ধরন *</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="input text-base py-3">
                      <option value="">নির্বাচন করুন</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-navy mb-1.5 block">আনুমানিক মাস *</label>
                    <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="input text-base py-3" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-semibold text-navy mb-1.5 block">সংক্ষিপ্ত বিবরণ (ঐচ্ছিক, সর্বোচ্চ ২০০ অক্ষর)</label>
                  <textarea
                    value={description} onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                    className="input text-base py-3 h-24 resize-none" placeholder="কী ঘটেছে সংক্ষেপে..."
                  />
                  <div className="text-xs text-slate/50 mt-1">{description.length}/200</div>
                </div>
                {/* Warning */}
                <div className="mt-4 bg-bdred/5 border border-bdred/15 rounded-xl px-4 py-3 text-sm text-bdred">
                  ⚠ এখানে নিজের নাম, ফোন নম্বর বা কোনো identifying তথ্য লিখবেন না। এই রিপোর্ট anonymous এবং Unverified।
                </div>
              </div>
            )}

            {/* Submit */}
            {category && month && (
              <div className="text-center">
                {error && <p className="text-bdred text-sm mb-3">{error}</p>}
                <button
                  type="submit" disabled={submitting}
                  className="bg-gradient-to-r from-bdred to-bdred/80 hover:from-bdred/90 hover:to-bdred/70 text-white font-bold px-10 py-4 rounded-xl text-base transition-all shadow-lg shadow-bdred/20 disabled:opacity-50"
                >
                  {submitting ? "জমা হচ্ছে..." : "রিপোর্ট জমা দিন"}
                </button>
                <p className="text-xs text-slate/50 mt-3">এটি কোনো আনুষ্ঠানিক অভিযোগ নয়। এটি একটি নাগরিক পর্যবেক্ষণ টুল।</p>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
