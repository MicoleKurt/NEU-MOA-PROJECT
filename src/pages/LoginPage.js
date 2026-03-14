import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/config";

// Correct NEU seal logo (uploaded by user)
const NEU_LOGO = "https://upload.wikimedia.org/wikipedia/en/c/c6/New_Era_University.svg";

export default function LoginPage() {
  const { login, currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [time, setTime] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    if (currentUser && userProfile) {
      if (userProfile.isBlocked) { setError("Your account is blocked. Contact an administrator."); return; }
      if (userProfile.role === "admin") navigate("/admin");
      else if (userProfile.role === "faculty") navigate("/faculty");
      else navigate("/student");
    }
  }, [currentUser, userProfile, navigate]);

  const handleLogin = async () => {
    setLoading(true); setError("");
    try {
      const result = await login();
      const user = result.user;
      if (!user.email.endsWith("@neu.edu.ph")) {
        setError("Only @neu.edu.ph institutional emails are allowed."); setLoading(false); return;
      }
      const ref = doc(db, "moa_users", user.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, { uid: user.uid, email: user.email, fullName: user.displayName || "", photoURL: user.photoURL || "", role: "student", isBlocked: false, createdAt: serverTimestamp() });
        navigate("/student");
      } else {
        const data = snap.data();
        if (data.isBlocked) { setError("Your account has been blocked. Please contact the administrator."); setLoading(false); return; }
        if (data.role === "admin") navigate("/admin");
        else if (data.role === "faculty") navigate("/faculty");
        else navigate("/student");
      }
    } catch { setError("Sign-in failed. Please try again."); }
    setLoading(false);
  };

  const h = time.getHours();
  const greeting = h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  const timeStr = time.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const dateStr = time.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={s.root}>

      {/* ── LEFT HERO — pure dark navy, no background image ── */}
      <div style={s.hero}>
        {/* subtle decorative circles only */}
        <div style={s.c1}/><div style={s.c2}/><div style={s.c3}/>

        <div style={s.heroContent}>
          {/* Correct NEU seal */}
          <div style={s.logoRing}>
            <img
              src={NEU_LOGO}
              alt="New Era University"
              style={s.logoImg}
              onError={e => {
                // fallback: render initials if image fails
                e.target.style.display = "none";
                e.target.parentNode.innerHTML = '<span style="font-size:32px;font-weight:900;color:#fff;font-family:serif">NEU</span>';
              }}
            />
          </div>

          <div style={s.greeting}>{greeting}</div>
          <h1 style={s.heroTitle}>New Era University</h1>
          <div style={{ fontSize:12, letterSpacing:3, color:"rgba(255,255,255,0.55)", textTransform:"uppercase", margin:"6px 0 0", fontFamily:"'Outfit',sans-serif" }}>MOA Monitoring System</div>
          <div style={{ fontSize:11, letterSpacing:2, color:"rgba(255,255,255,0.32)", margin:"3px 0 0", fontFamily:"'Outfit',sans-serif" }}>Academic Year 2025–2026</div>
          <div style={s.ruler} />

          <div style={s.clockBlock}>
            <div style={s.clockTime}>{timeStr}</div>
            <div style={s.clockDate}>{dateStr}</div>
          </div>

          <div style={s.pillsRow}>
            {["Student Portal","Faculty Portal","Admin Portal"].map(p => (
              <div key={p} style={s.pill}>{p}</div>
            ))}
          </div>
        </div>

        <div style={s.heroFooter}>Academic Year 2025–2026 · Quezon City, Philippines</div>
      </div>

      {/* ── RIGHT FORM ── */}
      <div style={s.formPanel}>
        <div style={s.formBox}>
          <h2 style={s.formTitle}>Sign In</h2>
          <p style={s.formSub}>Use your NEU institutional Google account to continue.</p>

          <div style={s.infoCards}>
            {[
              { icon: "🎓", title: "Students",  desc: "View approved MOA partners" },
              { icon: "👨‍🏫", title: "Faculty",   desc: "Manage & maintain MOA records" },
              { icon: "🔑", title: "Admins",    desc: "Full control, audit trail & user management" },
            ].map(c => (
              <div key={c.title} style={s.infoCard}>
                <span style={s.infoIcon}>{c.icon}</span>
                <div>
                  <div style={s.infoTitle}>{c.title}</div>
                  <div style={s.infoDesc}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {error && <div style={s.errorBox}>⚠️ {error}</div>}

          <button
            style={{ ...s.googleBtn, opacity: loading ? 0.72 : 1 }}
            onClick={handleLogin}
            disabled={loading}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.background="#0f2d4a"; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow="0 14px 40px rgba(10,35,66,.3)"; }}}
            onMouseLeave={e => { e.currentTarget.style.background="#0a2342"; e.currentTarget.style.transform="translateY(0)"; e.currentTarget.style.boxShadow="0 4px 18px rgba(10,35,66,.18)"; }}>
            {!loading && (
              <svg width="20" height="20" viewBox="0 0 18 18" style={{ flexShrink:0 }}>
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            <span>{loading ? "Signing in…" : "Continue with Google (@neu.edu.ph)"}</span>
          </button>

          <p style={s.footNote}>Only @neu.edu.ph emails are accepted · Secured by Firebase Auth</p>
          <p style={s.copyright}>© 2026 New Era University · All rights reserved</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse  { 0%,100%{opacity:.65} 50%{opacity:1} }
      `}</style>
    </div>
  );
}

const s = {
  root: { display:"flex", minHeight:"100vh", fontFamily:"'Outfit',sans-serif" },

  /* ── hero: solid dark navy — NO background image ── */
  hero: { flex:1.1, position:"relative", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", overflow:"hidden", background:"linear-gradient(155deg,#071c33 0%,#0a2342 55%,#0d3060 100%)" },

  /* decorative geometric rings only */
  c1: { position:"absolute", width:520, height:520, borderRadius:"50%", border:"1px solid rgba(255,255,255,.05)", top:-130, right:-130, pointerEvents:"none" },
  c2: { position:"absolute", width:340, height:340, borderRadius:"50%", border:"1px solid rgba(255,255,255,.04)", bottom:-70, left:-90, pointerEvents:"none" },
  c3: { position:"absolute", width:200, height:200, borderRadius:"50%", background:"radial-gradient(circle,rgba(37,99,235,.15) 0%,transparent 70%)", top:"28%", right:"8%", pointerEvents:"none" },

  heroContent: { position:"relative", zIndex:2, textAlign:"center", padding:"0 48px", animation:"fadeUp .8s ease forwards" },

  /* NEU seal ring */
  logoRing: { width:108, height:108, borderRadius:"50%", overflow:"hidden", margin:"0 auto 22px", border:"3px solid rgba(255,255,255,.22)", boxShadow:"0 0 0 8px rgba(255,255,255,.05), 0 16px 40px rgba(0,0,0,.45)", background:"#fff", display:"flex", alignItems:"center", justifyContent:"center" },
  logoImg:  { width:"100%", height:"100%", objectFit:"contain", padding:4 },

  greeting:  { fontSize:12, letterSpacing:3, textTransform:"uppercase", color:"rgba(255,255,255,.45)", marginBottom:8 },
  heroTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:700, color:"#fff", margin:"0 0 0", letterSpacing:-.5 },
  ruler:     { width:56, height:2, background:"linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent)", margin:"22px auto" },

  clockBlock: { marginBottom:28 },
  clockTime:  { fontFamily:"'Cormorant Garamond',serif", fontSize:48, fontWeight:600, color:"#fff", letterSpacing:3, animation:"pulse 2s ease infinite" },
  clockDate:  { fontSize:12, color:"rgba(255,255,255,.45)", marginTop:4, letterSpacing:1 },

  pillsRow: { display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap" },
  pill:     { background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:99, padding:"5px 14px", fontSize:11, color:"rgba(255,255,255,.6)", letterSpacing:.5 },

  heroFooter: { position:"absolute", bottom:20, left:0, right:0, textAlign:"center", fontSize:11, color:"rgba(255,255,255,.28)", zIndex:2 },

  /* ── right form panel ── */
  formPanel: { width:500, background:"#faf9f6", display:"flex", alignItems:"center", justifyContent:"center", padding:"48px 0", borderLeft:"1px solid #ece8e0" },
  formBox:   { width:"100%", maxWidth:400, padding:"0 40px", animation:"fadeUp .9s .15s ease both" },

  formTitle: { fontFamily:"'Cormorant Garamond',serif", fontSize:38, fontWeight:700, color:"#0a2342", margin:"0 0 8px" },
  formSub:   { fontSize:13, color:"#718096", margin:"0 0 26px", lineHeight:1.65 },

  infoCards: { display:"flex", flexDirection:"column", gap:10, marginBottom:26 },
  infoCard:  { display:"flex", alignItems:"center", gap:14, padding:"13px 16px", background:"#fff", borderRadius:14, border:"1px solid #e8e4dc", boxShadow:"0 1px 4px rgba(0,0,0,.04)" },
  infoIcon:  { fontSize:22, flexShrink:0 },
  infoTitle: { fontSize:13, fontWeight:600, color:"#0a2342", marginBottom:2 },
  infoDesc:  { fontSize:11, color:"#94a3b8" },

  errorBox: { display:"flex", alignItems:"center", gap:8, background:"#fff5f5", border:"1px solid #fed7d7", borderRadius:10, padding:"11px 14px", fontSize:13, color:"#c53030", marginBottom:16, lineHeight:1.4 },

  googleBtn: { width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:12, background:"#0a2342", color:"#fff", border:"none", borderRadius:14, padding:"15px 20px", fontSize:14, fontWeight:600, cursor:"pointer", transition:"all .25s", boxShadow:"0 4px 18px rgba(10,35,66,.18)", marginBottom:18, letterSpacing:.2 },

  footNote:  { textAlign:"center", fontSize:11, color:"#a0aec0", margin:"0 0 6px" },
  copyright: { textAlign:"center", fontSize:11, color:"#cbd5e0", margin:0 },
};
