import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const KNOWN_TABS = ["home", "discovery", "messages", "couple", "profile", "settings"];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const range = (s, e) => Array.from({ length: e - s + 1 }, (_, i) => s + i);

const CANDIDATES = [
  { id: 1, name: "Ari", age: 24, interests: ["Cooking", "Hiking", "Art"], lifestyle: { smoke: false, drink: "social" }, goals: "Long-term" },
  { id: 2, name: "Noah", age: 27, interests: ["Gym", "Travel", "Music"], lifestyle: { smoke: false, drink: "rarely" }, goals: "Long-term" },
  { id: 3, name: "Maya", age: 26, interests: ["Books", "Cooking", "Yoga"], lifestyle: { smoke: false, drink: "social" }, goals: "Long-distance" },
  { id: 4, name: "Liam", age: 25, interests: ["Gaming", "Tech", "Movies"], lifestyle: { smoke: false, drink: "never" }, goals: "Casual → Long-term" },
];

function scoreMatch(user, cand) {
  if (!user || !cand) return 0;
  let score = 0;
  if (user.age && cand.age) {
    const diff = Math.abs(user.age - cand.age);
    score += Math.max(0, 20 - diff);
  }
  const common = (user.interests || []).filter((i) => cand.interests.includes(i)).length;
  score += common * 10;
  if (user.goals && cand.goals && user.goals[0] === cand.goals[0]) score += 10;
  if (user.lifestyle) {
    if (user.lifestyle.smoke === cand.lifestyle.smoke) score += 5;
    if (user.lifestyle.drink === cand.lifestyle.drink) score += 3;
  }
  return Math.min(100, Math.round(score));
}

const TabButton = ({ icon, label, active, onClick }) => {
  console.assert(typeof label === "string" && label.length > 0, "TabButton label must be a non-empty string");
  console.assert(typeof onClick === "function", "TabButton requires an onClick handler");
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 ${active ? "text-pink-600" : "text-slate-400"}`} aria-pressed={active}>
      <span className="text-xl" aria-hidden>{icon}</span>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
};

const SectionCard = ({ title, children, accent = "from-pink-50 to-violet-50 dark:from-slate-800 dark:to-slate-800/60" }) => (
  <motion.section layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className={`rounded-2xl p-4 bg-gradient-to-b ${accent} shadow-[0_6px_30px_-12px_rgba(0,0,0,0.25)] border border-white/40 dark:border-white/5`}>
    <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-2 flex items-center gap-2">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)]"></span>
      {title}
    </h3>
    <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{children}</div>
  </motion.section>
);

const Greeting = ({ name, coupleMode }) => {
  const hour = new Date().getHours();
  const salutation = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
          {salutation}, {name} {coupleMode ? "& Partner" : ""} <span aria-hidden>💫</span>
        </h1>
        <p className="text-[13px] text-slate-500 dark:text-slate-400">“Every mile between you is just space filled with love.” <span aria-hidden>🌙</span></p>
      </div>
    </div>
  );
};

export default function Dashboard({ user: incomingUser, onUserUpdate }) {
  const defaultUser = {
    name: "You",
    email: "",
    password: "",
    verified: false,
    age: null,
    gender: "",
    seeking: "",
    interests: [],
    lifestyle: { smoke: false, drink: "social" },
    goals: "Long-term",
    location: "",
    coupleMode: false,
  };
  const [user, setUser] = useState({ ...defaultUser, ...(incomingUser || {}) });
  const [tab, setTab] = useState("home");
  const [partnerName, setPartnerName] = useState("");

  const ACCENTS = { pink: "#ec4899", lavender: "#CDB5F6", sky: "#0ea5e9", emerald: "#10b981", amber: "#f59e0b" };
  const FONTS = {
    Poppins: "'Poppins', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    Nunito: "'Nunito', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    Inter: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    Playfair: "'Playfair Display', Georgia, 'Times New Roman', serif",
  };
  const [themeMode, setThemeMode] = useState("light");
  const [accent, setAccent] = useState("pink");
  const [font, setFont] = useState("Poppins");
  const [fontColor, setFontColor] = useState("#0f172a");

  const [onboardingStep, setOnboardingStep] = useState(1);
  const [sentCode] = useState("123456");
  const [codeInput, setCodeInput] = useState("");

  console.assert(["light", "dark"].includes(themeMode), "Unknown theme mode");
  console.assert(Object.keys(ACCENTS).includes(accent), "Unknown accent");
  console.assert(Object.keys(FONTS).includes(font), "Unknown font");

  const safeSetTab = (next) => {
    if (!KNOWN_TABS.includes(next)) { console.warn("Unknown tab", next); return; }
    if (next === "couple" && !user.coupleMode) { console.warn("Couple tab locked until matched"); return; }
    setTab(next);
  };

  useEffect(() => { onUserUpdate && onUserUpdate(user); }, [user]);

  const needsOnboarding = !user.verified || !user.age || !user.email || !user.password;
  const vibe = useMemo(() => ({ label: "Supportive", emoji: "💕" }), []);

  const handleModeChange = (newMode) => {
    if (newMode === "couple" && !user.coupleMode) {
      const updated = { ...user, coupleMode: true };
      setUser(updated);
      onUserUpdate && onUserUpdate(updated);
    }
  };

  const Onboarding = () => (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-3">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-white/60 dark:border-white/10 p-4">
        <h2 className="text-lg font-semibold mb-1">Create your profile</h2>
        <p className="text-sm text-slate-500 mb-3">Step {onboardingStep} of 5</p>

        {onboardingStep === 1 && (
          <div className="grid gap-2">
            <label className="text-sm">Email</label>
            <input className="rounded-xl border p-2" type="email" placeholder="you@example.com" value={user.email} onChange={(e) => setUser({ ...user, email: e.target.value })} />
            <button disabled={!emailRegex.test(user.email)} onClick={() => setOnboardingStep(2)} className={`mt-2 rounded-xl px-3 py-2 text-white ${emailRegex.test(user.email) ? "bg-pink-500" : "bg-pink-300"}`}>Continue</button>
          </div>
        )}

        {onboardingStep === 2 && (
          <div className="grid gap-2">
            <label className="text-sm">Create password (min 8 chars)</label>
            <input className="rounded-xl border p-2" type="password" placeholder="••••••••" value={user.password} onChange={(e) => setUser({ ...user, password: e.target.value })} />
            <button disabled={!user.password || user.password.length < 8} onClick={() => setOnboardingStep(3)} className={`mt-2 rounded-xl px-3 py-2 text-white ${user.password && user.password.length >= 8 ? "bg-pink-500" : "bg-pink-300"}`}>Continue</button>
          </div>
        )}

        {onboardingStep === 3 && (
          <div className="grid gap-2">
            <div className="text-sm">We sent a 6‑digit code to <b>{user.email || "your email"}</b></div>
            <input className="rounded-xl border p-2 tracking-widest text-center" maxLength={6} placeholder="123456" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} />
            <button disabled={codeInput !== sentCode} onClick={() => { setUser({ ...user, verified: true }); setOnboardingStep(4); }} className={`mt-2 rounded-xl px-3 py-2 text-white ${codeInput === sentCode ? "bg-pink-500" : "bg-pink-300"}`}>Verify</button>
          </div>
        )}

        {onboardingStep === 4 && (
          <div className="grid gap-2">
            <label className="text-sm">Age (must be 20+)</label>
            <select className="rounded-xl border p-2" value={user.age || ""} onChange={(e) => setUser({ ...user, age: Number(e.target.value) })}>
              <option value="" disabled>Select age</option>
              {range(20, 80).map((a) => (<option key={a} value={a}>{a}</option>))}
            </select>
            <button disabled={!user.age || user.age < 20} onClick={() => setOnboardingStep(5)} className={`mt-2 rounded-xl px-3 py-2 text-white ${user.age && user.age >= 20 ? "bg-pink-500" : "bg-pink-300"}`}>Continue</button>
          </div>
        )}

        {onboardingStep === 5 && (
          <div className="grid gap-3">
            <div className="grid gap-1">
              <label className="text-sm">Gender</label>
              <select className="rounded-xl border p-2" value={user.gender} onChange={(e) => setUser({ ...user, gender: e.target.value })}>
                <option value="">Select</option>
                <option>Woman</option>
                <option>Man</option>
                <option>Non-binary</option>
                <option>Prefer not to say</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm">Seeking</label>
              <select className="rounded-xl border p-2" value={user.seeking} onChange={(e) => setUser({ ...user, seeking: e.target.value })}>
                <option value="">Select</option>
                <option>Women</option>
                <option>Men</option>
                <option>Everyone</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm">Interests (choose a few)</label>
              <div className="flex flex-wrap gap-2">
                {["Cooking","Hiking","Art","Travel","Music","Books","Yoga","Tech","Movies","Gym"].map((i) => {
                  const active = user.interests.includes(i);
                  return (
                    <button key={i} onClick={() => setUser({ ...user, interests: active ? user.interests.filter(x=>x!==i) : [...user.interests, i] })} className={`px-3 py-1 rounded-full border ${active ? "ring-2 ring-pink-400" : ""}`}>{i}</button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm flex items-center gap-2 col-span-1"><input type="checkbox" checked={user.lifestyle.smoke} onChange={(e)=> setUser({ ...user, lifestyle: { ...user.lifestyle, smoke: e.target.checked }})}/> Smokes</label>
              <div className="grid gap-1">
                <label className="text-sm">Drinks</label>
                <select className="rounded-xl border p-2" value={user.lifestyle.drink} onChange={(e) => setUser({ ...user, lifestyle: { ...user.lifestyle, drink: e.target.value }})}>
                  <option value="never">never</option>
                  <option value="rarely">rarely</option>
                  <option value="social">social</option>
                </select>
              </div>
            </div>
            <div className="grid gap-1">
              <label className="text-sm">Relationship goal</label>
              <select className="rounded-xl border p-2" value={user.goals} onChange={(e) => setUser({ ...user, goals: e.target.value })}>
                <option>Long-term</option>
                <option>Long-distance</option>
                <option>Casual → Long-term</option>
              </select>
            </div>
            <div className="grid gap-1">
              <label className="text-sm">City / Location (optional)</label>
              <input className="rounded-xl border p-2" placeholder="City" value={user.location} onChange={(e)=> setUser({ ...user, location: e.target.value })} />
            </div>
            <button onClick={() => setOnboardingStep(0)} className="mt-2 rounded-xl px-3 py-2 text-white bg-pink-500">Finish</button>
          </div>
        )}
      </motion.div>
    </div>
  );

  const Shell = ({ children }) => (
    <div className={`${themeMode === "dark" ? "dark" : ""}`} style={{ "--accent": ACCENTS[accent], "--ink": themeMode === "dark" ? "#E5E7EB" : fontColor, fontFamily: FONTS[font] }}>
      <div className="min-h-screen w-full bg-gradient-to-b from-rose-50 via-rose-50/40 to-indigo-50 dark:from-[#0E1220] dark:via-slate-900 dark:to-slate-900" style={{ color: "var(--ink)" }}>
        <div className="mx-auto max-w-md px-4 pb-28 pt-6">
          <Greeting name={user.name || "You"} coupleMode={user.coupleMode} />

          <div className="mt-4">
            <div className="flex gap-2">
              <button onClick={() => { /* single mode visual */ }} className={`flex-1 rounded-xl py-2 text-sm font-medium border ${!user.coupleMode ? "bg-white/80 dark:bg-white/10 border-white/60 dark:border-white/10" : "bg-white/50 dark:bg-white/5 border-white/40 dark:border-white/5 text-slate-600 dark:text-slate-400"}`}>Single</button>
              <button onClick={() => handleModeChange("couple")} className={`flex-1 rounded-xl py-2 text-sm font-medium border ${user.coupleMode ? "bg-white/80 dark:bg-white/10 border-white/60 dark:border-white/10" : "bg-white/50 dark:bg-white/5 border-white/40 dark:border-white/5 text-slate-600 dark:text-slate-400"}`}>Couple</button>
            </div>
          </div>

          <div className="mt-3">
            <span className="px-3 py-1 text-xs rounded-full border bg-white/70 dark:bg-white/10" style={{ borderColor: "rgba(255,255,255,0.5)" }}>
              {user.coupleMode ? "Couple Mode unlocked" : "Single Mode — find your match"}
            </span>
          </div>

          <AnimatePresence mode="wait">{children}</AnimatePresence>
        </div>

        <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-md rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur shadow-[0_10px_40px_-10px_rgba(0,0,0,0.35)] border border-white/60 dark:border-white/10">
          <div className="flex">
            <TabButton icon="❤️" label="Home" active={tab === "home"} onClick={() => safeSetTab("home")} />
            <TabButton icon="🔥" label="Discover" active={tab === "discovery"} onClick={() => safeSetTab("discovery")} />
            <TabButton icon="💬" label="Messages" active={tab === "messages"} onClick={() => safeSetTab("messages")} />
            {user.coupleMode && <TabButton icon="💑" label="Couple" active={tab === "couple"} onClick={() => safeSetTab("couple")} />}
            <TabButton icon="👤" label="Profile" active={tab === "profile"} onClick={() => safeSetTab("profile")} />
            <TabButton icon="⚙️" label="Settings" active={tab === "settings"} onClick={() => safeSetTab("settings")} />
          </div>
        </nav>
      </div>
    </div>
  );

  const Home = () => (
    <motion.div key="home" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 grid gap-4">
      <SectionCard title="💌 Connection Hub">
        {!user.coupleMode ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between text-sm">
              <span>Discover compatible matches</span>
              <button onClick={() => safeSetTab("discovery")} className="px-3 py-1 rounded-lg border" style={{ background: "color-mix(in oklab, var(--accent) 15%, white)", color: "var(--accent)", borderColor: "color-mix(in oklab, var(--accent) 30%, white)" }}>Discover</button>
            </div>
            <div className="flex gap-2 text-xs">
              {["Questionnaire","Interests","Dealbreakers"].map(tag => (
                <span key={tag} className="px-2 py-1 rounded-full border" style={{ background: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.4)" }}>{tag}</span>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="flex items-center justify-between text-sm"><span>Connection streak</span><span className="inline-flex items-center gap-1" style={{ color: "var(--accent)" }}>🔥 <strong>3 days</strong></span></div>
            <div className="flex items-center justify-between text-sm"><span>Bucket list progress</span><span>4/12</span></div>
            <div className="flex items-center justify-between text-sm"><span>Emotional tone</span><span>{vibe.label} {vibe.emoji}</span></div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {["🎮 Virtual Date Games","🖼️ Shared Gallery","🕊️ Conflict Softener","💌 Apology Builder"].map((txt) => (
                <button key={txt} className="rounded-xl border bg-white/70 dark:bg-white/5 px-3 py-3 text-left text-sm hover:shadow" style={{ borderColor: "rgba(255,255,255,0.5)" }}>
                  <div className="text-lg" aria-hidden>{txt.split(" ")[0]}</div>
                  <div className="mt-1 font-medium text-slate-800 dark:text-slate-200">{txt.split(" ").slice(1).join(" ")}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="🧠 AI Insights & Growth" accent="from-rose-50 to-amber-50/60 dark:from-slate-800 dark:to-slate-800/60">
        {!user.coupleMode ? (
          <p className="text-sm">Tip: “Send a warm compliment to someone you match with today.”</p>
        ) : (
          <div className="grid gap-1 text-sm">
            <div>Your connection this week: <strong>83% engagement</strong> 💫</div>
            <div>You expressed appreciation <strong>12</strong> times this week!</div>
            <div className="pt-1">Try tonight: <em>“What do you miss most when we’re apart?”</em></div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="🗝️ Vault 🔐">
        <p>Face ID / Passcode protected space for love letters, voice notes, private photos, and anniversary capsules.</p>
      </SectionCard>

      <SectionCard title="🌅 Motivation Corner">
        <div className="flex items-center justify-between text-sm"><span>Today’s Love Challenge</span><span className="font-medium">Write 1 thing you admire</span></div>
        <div className="mt-2 h-2 w-full rounded-full bg-white/60 dark:bg-white/10 overflow-hidden"><motion.div className="h-full" style={{ background: "var(--accent)" }} initial={{ width: 0 }} animate={{ width: "66%" }} transition={{ duration: 1.2, ease: "easeOut" }} /></div>
        <div className="mt-2 text-xs" style={{ color: "var(--accent)" }}>Connection streak is glowing ✨</div>
      </SectionCard>
    </motion.div>
  );

  const Discovery = () => {
    const scored = CANDIDATES.map((c) => ({ ...c, score: scoreMatch(user, c) })).sort((a, b) => b.score - a.score);
    return (
      <motion.div key="discovery" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 grid gap-4">
        <SectionCard title="🔥 Discover">
          {!user.verified || !user.age ? (
            <p className="text-sm">Complete onboarding to get personalized matches.</p>
          ) : (
            <>
              <p className="text-sm mb-2">Top suggestions based on age proximity, shared interests, lifestyle & goals.</p>
              <div className="grid grid-cols-2 gap-3">
                {scored.slice(0, 4).map((m) => (
                  <div key={m.id} className="rounded-xl p-3 bg-white/70 dark:bg-white/5 border border-white/40 dark:border-white/10 text-left">
                    <div className="text-lg" aria-hidden>💟</div>
                    <div className="font-medium">{m.name} • {m.score}%</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{m.interests.slice(0,2).join(", ")}</div>
                    {!user.coupleMode && (
                      <button onClick={() => { setUser({ ...user, coupleMode: true }); setPartnerName(m.name); setTab("home"); }} className="mt-2 w-full rounded-lg border px-2 py-1" style={{ color: "var(--accent)", borderColor: "color-mix(in oklab, var(--accent) 35%, white)" }}>Connect</button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </motion.div>
    );
  };

  const Messages = () => (
    <motion.div key="messages" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 grid gap-4">
      <SectionCard title="💬 Messages">
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between"><span>{partnerName || "Sam"}</span><span className="text-xs text-slate-500">Typing…</span></div>
          <div className="rounded-xl p-3 bg-white/80 dark:bg-white/5 border border-white/50 dark:border-white/10">“On my way home — call in 10?”</div>
          <div className="rounded-xl p-3 border self-end ml-auto w-10/12" style={{ background: "color-mix(in oklab, var(--accent) 15%, white)", borderColor: "color-mix(in oklab, var(--accent) 35%, white)" }}>“Yes! Let’s try the new gratitude game tonight.”</div>
        </div>
      </SectionCard>
    </motion.div>
  );

  const Couple = () => (
    <motion.div key="couple" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 grid gap-4">
      <SectionCard title="💑 Couple Mode — Shared Space">
        <ul className="list-disc ml-5 text-sm">
          <li>Realtime shared board for mood, plans, and photos</li>
          <li>Mini-games and prompts for deep talk</li>
          <li>Bucket list with progress and due dates</li>
        </ul>
      </SectionCard>
      <SectionCard title="Connection Glow" accent="from-indigo-50 to-pink-50 dark:from-slate-800 dark:to-slate-800/60">
        <p className="text-sm">Subtle shimmer appears when you’re both online together ✨</p>
      </SectionCard>
    </motion.div>
  );

  const Profile = () => (
    <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 grid gap-4">
      <SectionCard title="👤 Profile">
        <div className="grid gap-2 text-sm">
          <label className="grid gap-1">Name<input className="rounded-xl border p-2" value={user.name} onChange={(e)=> setUser({ ...user, name: e.target.value })} /></label>
          <label className="grid gap-1">Email<input className="rounded-xl border p-2" value={user.email} onChange={(e)=> setUser({ ...user, email: e.target.value })} /></label>
          <label className="grid gap-1">Age<input className="rounded-xl border p-2" type="number" min={20} value={user.age || ""} onChange={(e)=> setUser({ ...user, age: Number(e.target.value) })} /></label>
          <label className="grid gap-1">Goals<select className="rounded-xl border p-2" value={user.goals} onChange={(e)=> setUser({ ...user, goals: e.target.value })}><option>Long-term</option><option>Long-distance</option><option>Casual → Long-term</option></select></label>
          <div className="grid gap-1">
            <span>Interests</span>
            <div className="flex flex-wrap gap-2">
              {["Cooking","Hiking","Art","Travel","Music","Books","Yoga","Tech","Movies","Gym"].map((i) => {
                const active = user.interests.includes(i);
                return (
                  <button key={i} onClick={() => setUser({ ...user, interests: active ? user.interests.filter(x=>x!==i) : [...user.interests, i] })} className={`px-3 py-1 rounded-full border ${active ? "ring-2 ring-pink-400" : ""}`}>{i}</button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-sm flex items-center gap-2 col-span-1"><input type="checkbox" checked={user.lifestyle.smoke} onChange={(e)=> setUser({ ...user, lifestyle: { ...user.lifestyle, smoke: e.target.checked }})}/> Smokes</label>
            <label className="grid gap-1">Drinks<select className="rounded-xl border p-2" value={user.lifestyle.drink} onChange={(e)=> setUser({ ...user, lifestyle: { ...user.lifestyle, drink: e.target.value }})}><option value="never">never</option><option value="rarely">rarely</option><option value="social">social</option></select></label>
          </div>
          <div className="grid gap-1"><span>Location</span><input className="rounded-xl border p-2" value={user.location} onChange={(e)=> setUser({ ...user, location: e.target.value })} /></div>
        </div>
      </SectionCard>
    </motion.div>
  );

  const Settings = () => (
    <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 grid gap-4">
      <SectionCard title="⚙️ Settings" accent="from-amber-50 to-rose-50 dark:from-slate-800 dark:to-slate-800/60">
        <div className="grid gap-4 text-sm">
          <div>
            <div className="flex items-center justify-between mb-2"><span className="font-medium">Appearance</span><span className="text-xs opacity-70">Theme</span></div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setThemeMode("light")} className={`rounded-xl border px-3 py-2 ${themeMode === "light" ? "ring-2 ring-[var(--accent)]" : ""}`}>Light</button>
              <button onClick={() => setThemeMode("dark")} className={`rounded-xl border px-3 py-2 ${themeMode === "dark" ? "ring-2 ring-[var(--accent)]" : ""}`}>Dark</button>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><span className="font-medium">Accent color</span><span className="text-xs opacity-70">Buttons • Progress • Highlights</span></div>
            <div className="flex gap-2">{Object.entries(ACCENTS).map(([key, hex]) => (<button key={key} onClick={() => setAccent(key)} title={key} className={`w-8 h-8 rounded-full border ${accent === key ? "ring-2 ring-offset-2" : ""}`} style={{ background: hex, borderColor: "rgba(0,0,0,0.08)" }} />))}</div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><span className="font-medium">Font family</span><span className="text-xs opacity-70">Overall app typography</span></div>
            <div className="grid grid-cols-2 gap-2">{Object.entries({ Poppins: FONTS.Poppins, Nunito: FONTS.Nunito, Inter: FONTS.Inter, Playfair: FONTS.Playfair }).map(([k, v]) => (<button key={k} onClick={() => setFont(k)} className={`rounded-xl border px-3 py-2 text-sm ${font === k ? "ring-2 ring-[var(--accent)]" : ""}`} style={{ fontFamily: v }}>{k}</button>))}</div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2"><span className="font-medium">Base text color</span><span className="text-xs opacity-70">Light mode only</span></div>
            <div className="flex items-center gap-3"><input type="color" value={fontColor} onChange={(e) => setFontColor(e.target.value)} className="w-10 h-10 rounded border" /><span className="text-xs opacity-70">Current: {fontColor}</span></div>
          </div>
        </div>
      </SectionCard>
    </motion.div>
  );

  return (
    <Shell>
      {tab === "home" && <Home />}
      {tab === "discovery" && <Discovery />}
      {tab === "messages" && <Messages />}
      {tab === "couple" && user.coupleMode && <Couple />}
      {tab === "profile" && <Profile />}
      {tab === "settings" && <Settings />}
      <AnimatePresence>{needsOnboarding && <Onboarding key="onboard" />}</AnimatePresence>
    </Shell>
  );
}
