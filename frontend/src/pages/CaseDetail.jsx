import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api.js";

const L = {
  bn: {
    backBtn: "← ড্যাশবোর্ডে ফিরুন",
    caseNo: "কেস নম্বর",
    type: { criminal: "ফৌজদারি", civil: "দেওয়ানি", family: "পারিবারিক", commercial: "বাণিজ্যিক" },
    urgency: { critical: "জরুরি", high: "উচ্চ", medium: "মধ্যম", low: "নিম্ন" },
    sensitive: "সংবেদনশীল",
    sensitiveNote: "সংবেদনশীল মামলা",
    dvNote: "পারিবারিক সহিংসতা সম্পর্কিত। ",
    minorNote: "নাবালক জড়িত। ",
    privacyNote: "সকল পক্ষের তথ্য গোপনীয় রাখা হবে।",
    scoreLabel: "অগ্রাধিকার স্কোর",
    tabInfo: "তথ্য",
    tabAI: "AI বিশ্লেষণ",
    tabTimeline: "টাইমলাইন",
    filedDate: "দাখিলের তারিখ",
    caseAge: "মামলার বয়স",
    years: "বছর",
    hearings: "শুনানি",
    times: "বার",
    adjournments: "মুলতবি",
    minorInvolved: "নাবালক জড়িত",
    dvCase: "পারিবারিক সহিংসতা",
    murderAppeal: "হত্যা আপিল",
    runAI: "AI বিশ্লেষণ চালান",
    runAIDesc: "প্রযোজ্য আইন, তথ্য বিশ্লেষণ আর সুপারিশ দেখুন",
    startAnalysis: "বিশ্লেষণ শুরু করুন",
    aiRunning: "AI বিশ্লেষণ চলছে...",
    aiGathering: "প্রযোজ্য আইন ও তথ্য সংগ্রহ করা হচ্ছে",
    aiReady: "AI বিশ্লেষণ প্রস্তুত",
    aiReadyDesc: "প্রযোজ্য আইন খুঁজে বের করবে আর মামলার সারাংশ তৈরি করবে",
    facts: "তথ্য",
    legalIssues: "আইনি বিষয়",
    applicableLaws: "প্রযোজ্য আইন",
    section: "ধারা",
    precedents: "সংশ্লিষ্ট নজির",
    confidence: "আত্মবিশ্বাস",
    confHigh: "উচ্চ", confMed: "মধ্যম", confLow: "নিম্ন",
    bnSummary: "বাংলা সারাংশ",
    disclaimer: "এটি AI দ্বারা তৈরি সারাংশ। বিচারিক পর্যালোচনা আবশ্যক।",
    timeline: "মামলার টাইমলাইন",
    caseFiled: "মামলা দাখিল",
    caseFiledDesc: "মামলা হিসেবে দাখিল করা হয়েছে",
    hearingsDone: "শুনানি সম্পন্ন",
    hearingsDoneDesc: "টি শুনানি অনুষ্ঠিত হয়েছে",
    adjLabel: "মুলতবি",
    adjDesc: "বার মুলতবি হয়েছে",
    current: "বর্তমান",
    pending: "বিচারাধীন",
    scoreNotCalc: "গণনা হয়নি",
    loadErr: "কেস লোড করা যায়নি",
    summaryErr: "সারাংশ লোড করা যায়নি",
    goBack: "← ফিরে যান",
    loading: "কেস লোড হচ্ছে...",
    start: "শুরু করুন",
  },
  en: {
    backBtn: "← Back to Dashboard",
    caseNo: "Case No",
    type: { criminal: "Criminal", civil: "Civil", family: "Family", commercial: "Commercial" },
    urgency: { critical: "Critical", high: "High", medium: "Medium", low: "Low" },
    sensitive: "Sensitive",
    sensitiveNote: "Sensitive Case",
    dvNote: "Involves domestic violence. ",
    minorNote: "Minor involved. ",
    privacyNote: "All party information will be kept confidential.",
    scoreLabel: "Priority Score",
    tabInfo: "Details",
    tabAI: "AI Analysis",
    tabTimeline: "Timeline",
    filedDate: "Filed Date",
    caseAge: "Case Age",
    years: "years",
    hearings: "Hearings",
    times: "times",
    adjournments: "Adjournments",
    minorInvolved: "Minor Involved",
    dvCase: "Domestic Violence",
    murderAppeal: "Murder Appeal",
    runAI: "Run AI Analysis",
    runAIDesc: "View applicable laws, analysis and recommendations",
    startAnalysis: "Start Analysis",
    aiRunning: "AI Analysis Running...",
    aiGathering: "Gathering applicable laws and case data",
    aiReady: "AI Analysis Ready",
    aiReadyDesc: "Will find applicable laws and generate case summary",
    facts: "Facts",
    legalIssues: "Legal Issues",
    applicableLaws: "Applicable Laws",
    section: "Section",
    precedents: "Related Precedents",
    confidence: "Confidence",
    confHigh: "High", confMed: "Medium", confLow: "Low",
    bnSummary: "Bangla Summary",
    disclaimer: "This is an AI-generated summary. Judicial review required.",
    timeline: "Case Timeline",
    caseFiled: "Case Filed",
    caseFiledDesc: "Filed as a case",
    hearingsDone: "Hearings Completed",
    hearingsDoneDesc: "hearings held",
    adjLabel: "Adjournments",
    adjDesc: "times adjourned",
    current: "Current",
    pending: "Under Trial",
    scoreNotCalc: "Not calculated",
    loadErr: "Failed to load case",
    summaryErr: "Failed to load summary",
    goBack: "← Go Back",
    loading: "Loading case...",
    start: "Get Started",
  },
};

const URG_STYLES = {
  critical: "bg-bdred text-white",
  high: "bg-gold text-ink",
  medium: "bg-slate/20 text-slate",
  low: "bg-navy/10 text-navy/50",
};

export default function CaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [lang, setLang] = useState("bn");
  const t = L[lang];

  useEffect(() => {
    api.get(`/cases/${id}`)
      .then(({ data }) => setCaseData(data))
      .catch((err) => setError(err.response?.data?.detail || t.loadErr));
  }, [id]);

  async function loadSummary() {
    setLoadingSummary(true);
    setActiveTab("ai");
    try {
      const { data } = await api.get(`/summarize/${id}`);
      setSummary(data);
    } catch (err) {
      setError(err.response?.data?.detail || t.summaryErr);
    } finally {
      setLoadingSummary(false);
    }
  }

  if (error && !caseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bdgreen-dark/5 via-parchment to-gold/5 p-8">
        <div className="max-w-lg mx-auto mt-20 text-center">
          <div className="w-16 h-16 rounded-full bg-bdred/10 flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠</span>
          </div>
          <p className="text-bdred font-medium mb-2">{error}</p>
          <button onClick={() => navigate(-1)} className="text-sm text-bdgreen hover:underline">{t.goBack}</button>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bdgreen-dark/5 via-parchment to-gold/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-[3px] border-bdgreen/20 border-t-bdgreen rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate text-sm">{t.loading}</p>
        </div>
      </div>
    );
  }

  const caseAge = ((Date.now() - new Date(caseData.filed_date).getTime()) / 86400000 / 365).toFixed(1);
  const isSensitive = caseData.involves_domestic_violence || caseData.involves_minor;

  return (
    <div className="min-h-screen bg-gradient-to-br from-bdgreen-dark/[0.06] via-parchment to-gold/[0.08]">
      {/* Decorative blobs */}
      <div className="fixed top-0 right-0 w-96 h-96 bg-bdgreen/[0.04] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-80 h-80 bg-gold/[0.06] rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 w-64 h-64 bg-bdred/[0.03] rounded-full blur-3xl pointer-events-none" />

      {/* Navbar */}
      <nav className="relative z-10 bg-gradient-to-r from-bdgreen-dark to-bdgreen px-4 md:px-6 py-2.5 flex justify-between items-center shadow-lg shadow-bdgreen/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden border-[1.5px] border-white/30 shadow-md">
            <img src="/logo.jpg" alt="অধিকার" className="w-full h-full object-cover" />
          </div>
          <span className="font-display text-[15px] text-white">অধিকার <span className="text-[9px] text-white/50 tracking-[2px]">ODHIKAR</span></span>
        </div>
        <div className="flex items-center gap-4">
          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "bn" ? "en" : "bn")}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 transition-colors"
          >
            <span className={`text-[11px] font-medium ${lang === "bn" ? "text-white" : "text-white/40"}`}>বাং</span>
            <div className={`w-7 h-4 rounded-full relative transition-colors ${lang === "en" ? "bg-gold" : "bg-white/30"}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${lang === "en" ? "left-3.5" : "left-0.5"}`} />
            </div>
            <span className={`text-[11px] font-medium ${lang === "en" ? "text-white" : "text-white/40"}`}>EN</span>
          </button>
          <button onClick={() => navigate("/dashboard")} className="text-xs text-gold hover:text-gold/80 transition-colors">{t.backBtn}</button>
        </div>
      </nav>

      <div className="relative z-10 p-4 md:p-6 max-w-5xl mx-auto">
        {/* Hero card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl shadow-black/[0.04] overflow-hidden mb-5">
          <div className="flex flex-col md:flex-row">
            {/* Left info */}
            <div className="flex-1 p-5 md:p-7">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${URG_STYLES[caseData.urgency] || URG_STYLES.low}`}>
                  {t.urgency[caseData.urgency] || caseData.urgency}
                </span>
                <span className="text-[11px] text-slate bg-slate/8 px-2 py-1 rounded-full">
                  {t.type[caseData.case_type] || caseData.case_type}
                </span>
                {isSensitive && (
                  <span className="text-[11px] text-bdred bg-bdred/8 px-2 py-1 rounded-full flex items-center gap-1">
                    🔒 {t.sensitive}
                  </span>
                )}
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-navy mb-1">{caseData.title}</h1>
              <p className="text-sm text-slate font-mono">{t.caseNo}: {caseData.case_number}</p>

              {isSensitive && (
                <div className="mt-4 bg-gradient-to-r from-bdred/[0.06] to-bdred/[0.02] border border-bdred/15 rounded-xl px-4 py-3 text-xs text-bdred leading-relaxed">
                  {t.sensitiveNote}: {caseData.involves_domestic_violence && t.dvNote}{caseData.involves_minor && t.minorNote}{t.privacyNote}
                </div>
              )}
            </div>

            {/* Right: score ring */}
            {caseData.priority_score != null && (
              <div className="md:w-52 bg-gradient-to-b from-bdgreen/[0.03] to-gold/[0.04] border-t md:border-t-0 md:border-l border-black/[0.05] flex flex-col items-center justify-center p-5 md:p-6">
                <div className="relative w-28 h-28">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e5e5" strokeWidth="7" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={caseData.priority_score >= 80 ? "#C1272D" : caseData.priority_score >= 60 ? "#C89B3C" : "#006A4E"}
                      strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${caseData.priority_score * 2.64} 264`}
                      style={{ filter: "drop-shadow(0 0 6px rgba(0,0,0,0.1))" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold text-navy">{caseData.priority_score}</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate mt-2 text-center">{t.scoreLabel} (0-100)</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-5 bg-white/70 backdrop-blur-sm rounded-xl p-1.5 border border-white/60 shadow-sm w-fit">
          <TabBtn active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>📋 {t.tabInfo}</TabBtn>
          <TabBtn active={activeTab === "ai"} onClick={() => { setActiveTab("ai"); if (!summary && !loadingSummary) loadSummary(); }}>🤖 {t.tabAI}</TabBtn>
          <TabBtn active={activeTab === "timeline"} onClick={() => setActiveTab("timeline")}>📅 {t.tabTimeline}</TabBtn>
        </div>

        {/* Tab content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl shadow-black/[0.04] overflow-hidden">
          {activeTab === "overview" && (
            <div className="p-5 md:p-7">
              <h3 className="text-sm font-semibold text-navy mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-bdgreen to-bdgreen-dark rounded-full" />
                {lang === "bn" ? "মামলার বিবরণ" : "Case Details"}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <InfoCard label={t.filedDate} value={new Date(caseData.filed_date).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US")} color="from-bdgreen/5 to-bdgreen/[0.01]" />
                <InfoCard label={t.caseAge} value={`${caseAge} ${t.years}`} accent={parseFloat(caseAge) > 5} color="from-gold/8 to-gold/[0.01]" />
                <InfoCard label={t.hearings} value={`${caseData.hearing_count} ${t.times}`} color="from-navy/5 to-navy/[0.01]" />
                <InfoCard label={t.adjournments} value={`${caseData.adjournment_count} ${t.times}`} accent={caseData.adjournment_count > 5} color="from-bdred/5 to-bdred/[0.01]" />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <FlagCard label={t.minorInvolved} active={caseData.involves_minor} />
                <FlagCard label={t.dvCase} active={caseData.involves_domestic_violence} />
                <FlagCard label={t.murderAppeal} active={caseData.is_murder_appeal} />
              </div>

              <div className="mt-6 pt-5 border-t border-black/[0.04]">
                <button
                  onClick={() => { setActiveTab("ai"); if (!summary && !loadingSummary) loadSummary(); }}
                  className="group flex items-center gap-3 bg-gradient-to-r from-bdgreen/[0.06] to-gold/[0.04] hover:from-bdgreen/10 hover:to-gold/[0.06] border border-bdgreen/15 rounded-xl px-5 py-4 transition-all w-full text-left hover:shadow-md"
                >
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-bdgreen to-bdgreen-dark flex items-center justify-center text-lg shrink-0 text-white shadow-md shadow-bdgreen/20">🤖</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-navy">{t.runAI}</div>
                    <div className="text-xs text-slate mt-0.5">{t.runAIDesc}</div>
                  </div>
                  <span className="text-bdgreen group-hover:translate-x-1 transition-transform text-lg">→</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "ai" && (
            <div className="p-5 md:p-7">
              {loadingSummary && (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 border-[3px] border-bdgreen/20 border-t-bdgreen rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm text-navy font-medium">{t.aiRunning}</p>
                  <p className="text-xs text-slate mt-1">{t.aiGathering}</p>
                </div>
              )}

              {summary && summary.summaries && summary.summaries.map((s, i) => (
                <div key={i} className="space-y-5">
                  {s.summary.facts && (
                    <SummarySection icon="📝" title={t.facts}>
                      <p className="text-sm text-navy leading-relaxed">{s.summary.facts}</p>
                    </SummarySection>
                  )}

                  {s.summary.legal_issues && s.summary.legal_issues.length > 0 && (
                    <SummarySection icon="⚖" title={t.legalIssues}>
                      <div className="space-y-2">
                        {s.summary.legal_issues.map((issue, j) => (
                          <div key={j} className="flex items-start gap-2.5 text-sm text-navy">
                            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-bdgreen to-bdgreen-dark text-white text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">{j + 1}</span>
                            {issue}
                          </div>
                        ))}
                      </div>
                    </SummarySection>
                  )}

                  {(s.summary.applicable_laws || s.summary.cited_laws) && (
                    <SummarySection icon="📜" title={t.applicableLaws}>
                      <div className="grid gap-2">
                        {(s.summary.applicable_laws || s.summary.cited_laws || []).map((law, j) => (
                          <div key={j} className="bg-gradient-to-r from-bdgreen/[0.05] via-bdgreen/[0.02] to-transparent border border-bdgreen/10 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-bdgreen" />
                              <span className="text-xs font-semibold text-navy">{law.law || law.law_title}</span>
                              <span className="text-[10px] text-bdgreen bg-bdgreen/8 px-2 py-0.5 rounded-full">{t.section} {law.section}</span>
                            </div>
                            <p className="text-xs text-slate leading-relaxed pl-3.5">{law.relevance || law.summary}</p>
                          </div>
                        ))}
                      </div>
                    </SummarySection>
                  )}

                  {s.summary.similar_precedents && s.summary.similar_precedents.length > 0 && (
                    <SummarySection icon="📚" title={t.precedents}>
                      <div className="space-y-1.5">
                        {s.summary.similar_precedents.map((p, j) => (
                          <div key={j} className="text-sm text-navy pl-3 border-l-2 border-gold/40">{p}</div>
                        ))}
                      </div>
                    </SummarySection>
                  )}

                  <div className="flex flex-wrap gap-3 pt-2">
                    {s.summary.confidence && (
                      <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium ${
                        s.summary.confidence === "High" ? "bg-gradient-to-r from-bdgreen/10 to-bdgreen/5 text-bdgreen" :
                        s.summary.confidence === "Medium" ? "bg-gradient-to-r from-gold/10 to-gold/5 text-gold" :
                        "bg-gradient-to-r from-bdred/10 to-bdred/5 text-bdred"
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-current" />
                        {t.confidence}: {s.summary.confidence === "High" ? t.confHigh : s.summary.confidence === "Medium" ? t.confMed : t.confLow}
                      </div>
                    )}
                    {s.summary.is_sensitive && (
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-bdred/10 to-bdred/5 text-bdred">
                        🔒 {t.sensitiveNote}
                      </div>
                    )}
                  </div>

                  {s.summary.summary_bn && (
                    <SummarySection icon="🇧🇩" title={t.bnSummary}>
                      <p className="text-sm text-navy leading-relaxed">{s.summary.summary_bn}</p>
                    </SummarySection>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-slate/50 border-t border-black/[0.04] pt-4 mt-6">
                    <span>ℹ</span> {t.disclaimer}
                  </div>
                </div>
              ))}

              {!summary && !loadingSummary && (
                <div className="py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-bdgreen/10 to-gold/10 flex items-center justify-center mx-auto mb-4 text-3xl">🤖</div>
                  <p className="text-sm font-medium text-navy mb-1">{t.aiReady}</p>
                  <p className="text-xs text-slate mb-5">{t.aiReadyDesc}</p>
                  <button onClick={loadSummary} className="btn-primary px-8 py-2.5 rounded-xl shadow-md shadow-bdgreen/20">{t.startAnalysis}</button>
                </div>
              )}
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="p-5 md:p-7">
              <h3 className="text-sm font-semibold text-navy mb-5 flex items-center gap-2">
                <span className="w-1 h-4 bg-gradient-to-b from-gold to-gold/50 rounded-full" />
                {t.timeline}
              </h3>
              <div className="relative pl-7 border-l-2 border-bdgreen/15 space-y-6">
                <TimelineItem
                  date={new Date(caseData.filed_date).toLocaleDateString(lang === "bn" ? "bn-BD" : "en-US")}
                  title={t.caseFiled}
                  desc={`${t.type[caseData.case_type] || caseData.case_type} ${t.caseFiledDesc}`}
                  color="bg-bdgreen"
                />
                {caseData.hearing_count > 0 && (
                  <TimelineItem
                    date={`${caseData.hearing_count} ${t.times}`}
                    title={t.hearingsDone}
                    desc={`${lang === "bn" ? "মোট " : "Total "}${caseData.hearing_count}${lang === "bn" ? "টি " : " "}${t.hearingsDoneDesc}`}
                    color="bg-gold"
                  />
                )}
                {caseData.adjournment_count > 0 && (
                  <TimelineItem
                    date={`${caseData.adjournment_count} ${t.times}`}
                    title={t.adjLabel}
                    desc={`${lang === "bn" ? "মামলা " : "Case "}${caseData.adjournment_count} ${t.adjDesc}`}
                    color="bg-bdred"
                  />
                )}
                <TimelineItem
                  date={t.current}
                  title={t.pending}
                  desc={`${t.scoreLabel}: ${caseData.priority_score || t.scoreNotCalc}`}
                  color="bg-navy"
                  active
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
        active ? "bg-gradient-to-r from-bdgreen to-bdgreen-dark text-white shadow-md shadow-bdgreen/20" : "text-slate hover:text-navy hover:bg-white/50"
      }`}
    >{children}</button>
  );
}

function InfoCard({ label, value, accent = false, color = "from-slate/5 to-transparent" }) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-4 border border-white/40`}>
      <div className="text-[10px] text-slate mb-1.5">{label}</div>
      <div className={`text-lg font-bold ${accent ? "text-bdred" : "text-navy"}`}>{value}</div>
    </div>
  );
}

function FlagCard({ label, active }) {
  return (
    <div className={`rounded-xl p-3.5 text-center text-xs font-medium transition-colors border ${
      active ? "bg-gradient-to-br from-bdred/8 to-bdred/[0.02] text-bdred border-bdred/15" : "bg-white/30 text-slate/35 border-transparent"
    }`}>
      <div className="text-lg mb-1">{active ? "✓" : "—"}</div>
      {label}
    </div>
  );
}

function SummarySection({ icon, title, children }) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-navy mb-2.5 flex items-center gap-2">
        <span>{icon}</span> {title}
      </h4>
      {children}
    </div>
  );
}

function TimelineItem({ date, title, desc, color, active = false }) {
  return (
    <div className="relative">
      <div className={`absolute -left-[calc(0.875rem+5px)] top-1 w-3 h-3 rounded-full ${color} ${active ? "ring-4 ring-bdgreen/10" : ""} shadow-sm`} />
      <div className="text-[10px] text-slate mb-0.5">{date}</div>
      <div className="text-sm font-medium text-navy">{title}</div>
      <div className="text-xs text-slate mt-0.5">{desc}</div>
    </div>
  );
}
