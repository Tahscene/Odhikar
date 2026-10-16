import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api.js";

function saveSessionAndGo(data, navigate) {
  localStorage.setItem("odhikar_token", data.access_token);
  localStorage.setItem("odhikar_role", data.role);
  localStorage.setItem("odhikar_name", data.name);
  navigate(data.role === "citizen" ? "/bot" : "/dashboard");
}

export default function Login() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("judge");

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: illustration in its own clean zone, never has text on top of it */}
      <div className="bg-ink md:w-[45%] flex flex-col items-center justify-center px-8 py-10 md:py-0">
        <img
          src="/ai-judiciary.jpg"
          alt="AI ও বিচার"
          className="w-full max-w-sm rounded-lg object-cover aspect-[7/5] md:aspect-auto md:max-h-[46vh]"
        />
        <p className="text-white/35 text-xs mt-6 text-center max-w-xs">
          গণপ্রজাতন্ত্রী বাংলাদেশ সরকার, বিচার বিভাগ
        </p>
      </div>

      {/* Right: clean background, login card, fully legible */}
      <div className="md:w-[55%] flex items-center justify-center px-4 py-10 bg-paper">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2.5 mb-2">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-bdgreen/20 shadow-lg">
                <img src="/logo.jpg" alt="অধিকার" className="w-full h-full object-cover" />
              </div>
              <h1 className="font-display text-3xl text-ink">অধিকার</h1>
            </div>
            <p className="text-slate text-sm">সবার জন্য আইন, সবার জন্য ন্যায়</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-ink/5 overflow-hidden">
            <div className="flex border-b border-bdgreen/10">
              <TabButton active={tab === "judge"} onClick={() => setTab("judge")}>
                বিচারক
              </TabButton>
              <TabButton active={tab === "citizen"} onClick={() => setTab("citizen")}>
                নাগরিক
              </TabButton>
            </div>
            <div className="p-6">
              {tab === "judge" ? (
                <JudgeLogin onSuccess={(data) => saveSessionAndGo(data, navigate)} />
              ) : (
                <CitizenLogin onSuccess={(data) => saveSessionAndGo(data, navigate)} />
              )}
            </div>
          </div>

          <button
            onClick={() => navigate("/")}
            className="w-full text-center text-xs text-slate mt-5 hover:text-ink transition-colors"
          >
            ← প্রথম পাতায় ফিরুন
          </button>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-semibold transition-colors ${
        active
          ? "text-bdgreen border-b-[2.5px] border-bdgreen bg-bdgreen/[0.04]"
          : "text-slate hover:text-navy"
      }`}
    >
      {children}
    </button>
  );
}

function JudgeLogin({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/judge/login", { email, password });
      onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.detail || "লগইন ব্যর্থ হয়েছে");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="ইমেইল">
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          className="input" placeholder="judge@court.gov.bd"
        />
      </Field>
      <Field label="পাসওয়ার্ড">
        <input
          type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
          className="input" placeholder="........"
        />
      </Field>
      {error && <p className="text-bdred text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "..." : "লগইন করুন"}
      </button>
    </form>
  );
}

function CitizenLogin({ onSuccess }) {
  const [step, setStep] = useState("nid");
  const [nid, setNid] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/citizen/request-otp", { nid, phone });
      setDemoCode(data.demo_code);
      setStep("otp");
    } catch (err) {
      setError(err.response?.data?.detail || "কিছু ভুল হয়েছে");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/citizen/verify-otp", { nid, code, name });
      onSuccess(data);
    } catch (err) {
      setError(err.response?.data?.detail || "কোড সঠিক নয়");
    } finally {
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={verifyOtp} className="space-y-4">
        <p className="text-xs bg-gold/10 text-gold border border-gold/30 rounded px-3 py-2">
          Demo mode: আপনার কোড হলো <strong>{demoCode}</strong>
        </p>
        <Field label="আপনার নাম">
          <input value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="আপনার নাম লিখুন" />
        </Field>
        <Field label="OTP কোড">
          <input
            required value={code} onChange={(e) => setCode(e.target.value)}
            className="input tracking-widest text-center" placeholder="______" maxLength={6}
          />
        </Field>
        {error && <p className="text-bdred text-sm">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "..." : "যাচাই করুন"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={requestOtp} className="space-y-4">
      <Field label="জাতীয় পরিচয়পত্র নম্বর (NID)">
        <input required value={nid} onChange={(e) => setNid(e.target.value)} className="input" placeholder="১০ বা ১৭ সংখ্যার নম্বর" />
      </Field>
      <Field label="মোবাইল নম্বর">
        <input required value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="01XXXXXXXXX" />
      </Field>
      {error && <p className="text-bdred text-sm">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "..." : "OTP পাঠান"}
      </button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-slate mb-1 block">{label}</span>
      {children}
    </label>
  );
}
