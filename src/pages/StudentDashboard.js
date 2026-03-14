import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { INDUSTRIES, COLLEGES } from "./AdminDashboard";

const NEU_LOGO = "https://upload.wikimedia.org/wikipedia/en/c/c6/New_Era_University.svg";

export default function StudentDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [moas, setMoas] = useState([]);
  const [busy, setBusy] = useState(true);
  const [search, setSearch] = useState("");
  const [fCollege, setFCollege] = useState("All");
  const [fIndustry, setFIndustry] = useState("All");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(query(collection(db,"moas"), orderBy("createdAt","desc")));
      const all = snap.docs.map(d=>({id:d.id,...d.data()}));
      // Students see ONLY APPROVED (all kinds) and not deleted
      setMoas(all.filter(m=>!m.isDeleted && m.status?.startsWith("APPROVED")));
      setBusy(false);
    };
    fetch();
  }, []);

  const filtered = moas.filter(m => {
    const q = search.toLowerCase();
    if (q && ![m.companyName, m.contactPerson, m.address, m.endorsedByCollege, m.industry, m.contactEmail].some(v=>v?.toLowerCase().includes(q))) return false;
    if (fCollege!=="All" && m.endorsedByCollege!==fCollege) return false;
    if (fIndustry!=="All" && m.industry!==fIndustry) return false;
    return true;
  });

  const COLORS = ["#0a2342","#1a3a5c","#1d4ed8","#047857","#b45309","#7c3aed","#be185d","#0369a1"];

  return (
    <div style={s.root}>
      {/* Top nav */}
      <header style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logoRing}><img src={NEU_LOGO} alt="NEU" style={s.logo} onError={e=>e.target.style.display="none"}/></div>
          <div>
            <div style={s.appName}>NEU MOA Monitoring System</div>
            <div style={s.appSub}>Student View — Approved Partners Only</div>
          </div>
        </div>
        <div style={s.headerRight}>
          <div style={s.userChip}>
            {currentUser?.photoURL
              ? <img src={currentUser.photoURL} alt="profile" style={{...s.userDot, objectFit:"cover"}} referrerPolicy="no-referrer" />
              : <div style={s.userDot}>{currentUser?.displayName?.charAt(0)||"S"}</div>
            }
            <span style={s.userChipName}>{currentUser?.displayName?.split(" ")[0]}</span>
          </div>
          <button style={s.logoutBtn} onClick={async()=>{await logout();navigate("/");}}>Sign Out</button>
        </div>
      </header>

      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.heroBadge}>STUDENT PORTAL</div>
          <h1 style={s.heroTitle}>Approved MOA Partners</h1>
          <p style={s.heroDesc}>Browse all active Memoranda of Agreement between New Era University and its industry partners. All displayed entries are approved and currently active.</p>
          <div style={s.heroStats}>
            <div style={s.heroStat}><span style={s.heroStatNum}>{busy?"—":moas.length}</span><span style={s.heroStatLabel}>Approved Partners</span></div>
            <div style={s.heroStatDivider}/>
            <div style={s.heroStat}><span style={s.heroStatNum}>{busy?"—":[...new Set(moas.map(m=>m.industry))].length}</span><span style={s.heroStatLabel}>Industries</span></div>
            <div style={s.heroStatDivider}/>
            <div style={s.heroStat}><span style={s.heroStatNum}>{busy?"—":[...new Set(moas.map(m=>m.endorsedByCollege))].length}</span><span style={s.heroStatLabel}>Colleges</span></div>
          </div>
        </div>
        <div style={s.heroDecor}>
          {["📋","🤝","🎓","🏢"].map((e,i)=><div key={i} style={{...s.decorEmoji,animationDelay:`${i*.4}s`}}>{e}</div>)}
        </div>
      </div>

      {/* Search & Filters */}
      <div style={s.filterSection}>
        <input style={s.search} placeholder="🔍  Search by company name, contact person, address, college, industry, email…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <div style={s.filterRow}>
          <select style={s.sel} value={fCollege} onChange={e=>setFCollege(e.target.value)}>
            <option value="All">All Colleges</option>
            {COLLEGES.map(c=><option key={c}>{c}</option>)}
          </select>
          <select style={s.sel} value={fIndustry} onChange={e=>setFIndustry(e.target.value)}>
            <option value="All">All Industries</option>
            {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
          </select>
          <span style={s.countChip}>{filtered.length} partner{filtered.length!==1?"s":""}</span>
        </div>
      </div>

      {/* Cards grid — students see: Company Name, Address, Contact Person, Email only */}
      <div style={s.grid}>
        {busy
          ? <div style={s.emptyMsg}>Loading approved partners…</div>
          : filtered.length===0
          ? <div style={s.emptyMsg}>No approved MOAs match your search.</div>
          : filtered.map((moa,i) => (
            <div key={moa.id} style={{ ...s.card, borderTop:`3px solid ${COLORS[i%COLORS.length]}` }}
              onClick={()=>setSelected(moa)}
              onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-5px)";e.currentTarget.style.boxShadow="0 18px 48px rgba(10,35,66,.14)";}}
              onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 12px rgba(0,0,0,.06)";}}>
              <div style={s.cardHead}>
                <div style={{...s.cardInitial,background:COLORS[i%COLORS.length]}}>{moa.companyName?.charAt(0)}</div>
                <span style={s.approvedBadge}>✅ Approved</span>
              </div>
              {/* Students only see: Company Name, Address, Contact Person, Email */}
              <h3 style={s.cardName}>{moa.companyName}</h3>
              <div style={s.cardDetail}><span style={s.detailIcon}>📍</span><span style={s.detailText}>{moa.address||"Address not provided"}</span></div>
              <div style={s.cardDetail}><span style={s.detailIcon}>👤</span><span style={s.detailText}>{moa.contactPerson||"—"}</span></div>
              <div style={s.cardDetail}><span style={s.detailIcon}>📧</span><a href={`mailto:${moa.contactEmail}`} style={{...s.detailText,color:"#2563eb",textDecoration:"none"}} onClick={e=>e.stopPropagation()}>{moa.contactEmail||"—"}</a></div>
              <div style={s.cardFooter}>
                <span style={s.industryTag}>{moa.industry}</span>
                <span style={s.viewBtn}>View →</span>
              </div>
            </div>
          ))
        }
      </div>

      {/* Detail modal — shows only the 4 fields students are allowed to see */}
      {selected && (
        <div style={s.modalBg} onClick={()=>setSelected(null)}>
          <div style={s.modal} onClick={e=>e.stopPropagation()}>
            <div style={s.modalTop}>
              <div style={s.modalInitial}>{selected.companyName?.charAt(0)}</div>
              <div style={{flex:1}}>
                <h2 style={s.modalName}>{selected.companyName}</h2>
                <span style={s.approvedBadge}>✅ {selected.status?.split(":")[1]?.trim()}</span>
              </div>
              <button style={s.closeBtn} onClick={()=>setSelected(null)}>✕</button>
            </div>
            <div style={s.modalGrid}>
              {[
                {label:"Company Name",val:selected.companyName},
                {label:"Address",val:selected.address},
                {label:"Contact Person",val:selected.contactPerson},
                {label:"Email Address",val:selected.contactEmail},
              ].map(f=>(
                <div key={f.label} style={s.modalField}>
                  <div style={s.modalFieldLabel}>{f.label}</div>
                  <div style={s.modalFieldVal}>{f.val||"—"}</div>
                </div>
              ))}
            </div>
            <p style={s.modalNote}>ℹ️ Students can only view Company Name, Address, Contact Person, and Email.</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
      `}</style>
    </div>
  );
}

const s = {
  root:{minHeight:"100vh",background:"#f5f3ee",fontFamily:"'Outfit',sans-serif"},
  header:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 36px",background:"#fff",borderBottom:"1px solid #e8e4dc",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 8px rgba(0,0,0,.05)"},
  headerLeft:{display:"flex",alignItems:"center",gap:14},
  logoRing:{width:40,height:40,borderRadius:"50%",overflow:"hidden",border:"2px solid #e8e4dc"},
  logo:{width:"100%",height:"100%",objectFit:"cover"},
  appName:{fontSize:15,fontWeight:700,color:"#0a2342"},
  appSub:{fontSize:11,color:"#94a3b8"},
  headerRight:{display:"flex",alignItems:"center",gap:12},
  userChip:{display:"flex",alignItems:"center",gap:8,background:"#f0f3f8",borderRadius:99,padding:"6px 14px"},
  userDot:{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#0a2342,#2563eb)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#fff"},
  userChipName:{fontSize:13,fontWeight:600,color:"#0a2342"},
  logoutBtn:{background:"none",border:"1.5px solid #e2e8f0",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",color:"#64748b"},
  hero:{background:"linear-gradient(135deg,#0a2342 0%,#1a3a5c 50%,#1d4ed8 100%)",padding:"52px 40px",display:"flex",justifyContent:"space-between",alignItems:"center",overflow:"hidden",position:"relative"},
  heroInner:{zIndex:1},
  heroBadge:{display:"inline-block",background:"rgba(255,255,255,.12)",border:"1px solid rgba(255,255,255,.18)",borderRadius:99,padding:"4px 14px",fontSize:10,letterSpacing:2,color:"rgba(255,255,255,.7)",marginBottom:16,textTransform:"uppercase"},
  heroTitle:{fontFamily:"'Cormorant Garamond',serif",fontSize:40,fontWeight:700,color:"#fff",margin:"0 0 14px",letterSpacing:-.5},
  heroDesc:{fontSize:14,color:"rgba(255,255,255,.65)",maxWidth:500,lineHeight:1.7,margin:"0 0 28px"},
  heroStats:{display:"flex",alignItems:"center",gap:24},
  heroStat:{display:"flex",flexDirection:"column",gap:4},
  heroStatNum:{fontFamily:"'Cormorant Garamond',serif",fontSize:34,fontWeight:700,color:"#fff",lineHeight:1},
  heroStatLabel:{fontSize:11,color:"rgba(255,255,255,.5)",letterSpacing:1,textTransform:"uppercase"},
  heroStatDivider:{width:1,height:40,background:"rgba(255,255,255,.15)"},
  heroDecor:{display:"flex",gap:12,zIndex:1},
  decorEmoji:{fontSize:32,animation:"float 3s ease infinite",opacity:.5},
  filterSection:{padding:"22px 36px",background:"#fff",borderBottom:"1px solid #e8e4dc"},
  search:{width:"100%",padding:"12px 18px",borderRadius:12,border:"1.5px solid #e2e8f0",fontSize:13,marginBottom:12,background:"#f9fbff",outline:"none",boxSizing:"border-box"},
  filterRow:{display:"flex",alignItems:"center",gap:10},
  sel:{padding:"8px 12px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:12,background:"#f9fbff",outline:"none",cursor:"pointer"},
  countChip:{marginLeft:"auto",background:"#0a2342",color:"#fff",borderRadius:99,padding:"5px 14px",fontSize:12,fontWeight:700},
  grid:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:22,padding:"28px 36px 48px"},
  emptyMsg:{gridColumn:"1/-1",textAlign:"center",padding:"60px",color:"#94a3b8",fontSize:15},
  card:{background:"#fff",borderRadius:18,padding:"24px",boxShadow:"0 2px 12px rgba(0,0,0,.06)",cursor:"pointer",transition:"all .25s",animation:"fadeUp .4s ease forwards"},
  cardHead:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18},
  cardInitial:{width:50,height:50,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:"#fff"},
  approvedBadge:{background:"#d1fae5",color:"#047857",borderRadius:99,padding:"4px 12px",fontSize:11,fontWeight:700},
  cardName:{fontFamily:"'Cormorant Garamond',serif",fontSize:19,fontWeight:700,color:"#0a2342",margin:"0 0 14px",lineHeight:1.25},
  cardDetail:{display:"flex",alignItems:"flex-start",gap:8,marginBottom:8},
  detailIcon:{fontSize:14,flexShrink:0,marginTop:1},
  detailText:{fontSize:12,color:"#64748b",lineHeight:1.45},
  cardFooter:{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:16,paddingTop:14,borderTop:"1px solid #f1f5f9"},
  industryTag:{background:"#f0fdf4",color:"#166534",borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:600},
  viewBtn:{fontSize:12,fontWeight:700,color:"#2563eb"},
  modalBg:{position:"fixed",inset:0,background:"rgba(10,35,66,.55)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:999,backdropFilter:"blur(6px)"},
  modal:{background:"#fff",borderRadius:24,padding:"36px",width:"100%",maxWidth:520,boxShadow:"0 24px 64px rgba(0,0,0,.25)",animation:"fadeUp .3s ease"},
  modalTop:{display:"flex",alignItems:"center",gap:16,marginBottom:28},
  modalInitial:{width:62,height:62,borderRadius:16,background:"linear-gradient(135deg,#0a2342,#1d4ed8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,fontWeight:700,color:"#fff",flexShrink:0},
  modalName:{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,color:"#0a2342",margin:"0 0 8px"},
  closeBtn:{marginLeft:"auto",background:"#f1f5f9",border:"none",borderRadius:10,width:36,height:36,fontSize:16,cursor:"pointer",color:"#64748b",flexShrink:0},
  modalGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18},
  modalField:{padding:"14px 16px",background:"#f8faff",borderRadius:12,border:"1px solid #e8eef8"},
  modalFieldLabel:{fontSize:10,color:"#94a3b8",fontWeight:600,textTransform:"uppercase",letterSpacing:.5,marginBottom:4},
  modalFieldVal:{fontSize:14,color:"#0a2342",fontWeight:500},
  modalNote:{fontSize:11,color:"#94a3b8",textAlign:"center",margin:0,fontStyle:"italic"},
};
