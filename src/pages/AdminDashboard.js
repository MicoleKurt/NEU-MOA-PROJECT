import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";

const NEU_LOGO = "https://upload.wikimedia.org/wikipedia/en/c/c6/New_Era_University.svg";

export const COLLEGES = ["College of Medicine","College of Nursing","College of Medical Technology","College of Physical Therapy","College of Respiratory Therapy","College of Midwifery","College of Engineering and Architecture","College of Informatics and Computing Studies (CICS)","College of Accountancy","College of Business Administration","College of Criminology","College of Law","College of Arts and Sciences","College of Education","College of Communication","College of Music","School of International Relations","School of Graduate Studies","College of Evangelical Ministry","College of Agriculture","Integrated School","Other"];
export const INDUSTRIES = [
  // IT & Software
  "Software Development",
  "Web & Mobile Development",
  "IT Services & Consulting",
  "Business Process Outsourcing (BPO)",
  "Knowledge Process Outsourcing (KPO)",
  // Tech & Infra
  "Cybersecurity",
  "Cloud Computing & DevOps",
  "Network & Infrastructure",
  "Data Analytics & AI",
  "Game Development",
  // Telecom & Media
  "Telecommunications",
  "Media & Broadcasting",
  "Digital Marketing & Advertising",
  // Finance & Gov
  "Banking & Financial Technology (FinTech)",
  "Government Agency / LGU",
  "E-Commerce",
  // Other
  "Education & EdTech",
  "Healthcare & MedTech",
  "Engineering & Manufacturing",
  "Non-Government Organization (NGO)",
  "Other",
];
export const STATUSES = [
  { key:"APPROVED: Signed by President",        group:"APPROVED",    color:"#047857", bg:"#d1fae5", border:"#6ee7b7" },
  { key:"APPROVED: On-going notarization",       group:"APPROVED",    color:"#065f46", bg:"#ecfdf5", border:"#a7f3d0" },
  { key:"APPROVED: No notarization needed",      group:"APPROVED",    color:"#0369a1", bg:"#e0f2fe", border:"#7dd3fc" },
  { key:"PROCESSING: Awaiting signature by HTE partner",              group:"PROCESSING", color:"#b45309", bg:"#fef3c7", border:"#fcd34d" },
  { key:"PROCESSING: MOA draft sent to Legal Office",                 group:"PROCESSING", color:"#c2410c", bg:"#fff7ed", border:"#fdba74" },
  { key:"PROCESSING: Sent to VPAA/OP for approval",                   group:"PROCESSING", color:"#7c3aed", bg:"#ede9fe", border:"#c4b5fd" },
  { key:"EXPIRED: No renewal done",             group:"EXPIRED",     color:"#dc2626", bg:"#fef2f2", border:"#fca5a5" },
  { key:"EXPIRING: Two months before expiration",group:"EXPIRING",   color:"#be185d", bg:"#fdf2f8", border:"#f9a8d4" },
];
const getStatusMeta = (key) => STATUSES.find(s => s.key === key) || { color:"#64748b", bg:"#f1f5f9", border:"#e2e8f0" };

const EMPTY = { hteid:"", companyName:"", address:"", contactPerson:"", contactEmail:"", industry:"Software Development", effectiveDate:"", expiryDate:"", status: STATUSES[0].key, endorsedByCollege: COLLEGES[0] };

const TABS = [
  { id:"dashboard", label:"Dashboard", icon:"▣" },
  { id:"moas",      label:"MOA Records", icon:"≡" },
  { id:"add",       label:"Add MOA", icon:"+" },
  { id:"seed",      label:"Load OJT Partners", icon:"🌱" },
  { id:"users",     label:"Users", icon:"⊕" },
  { id:"audit",     label:"Audit Trail", icon:"◎" },
];

const SEED_MOAS = [
  { hteid:"HTE-2024-001", companyName:"Accenture Philippines", address:"Tower 1, High Street South Corporate Plaza, BGC, Taguig City", contactPerson:"Maria Santos", contactEmail:"ojt@accenture.com.ph", industry:"IT Services & Consulting", effectiveDate:"2024-01-15", expiryDate:"2026-01-15", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-002", companyName:"IBM Philippines", address:"22F Ayala Tower One, Ayala Avenue, Makati City", contactPerson:"Jose Reyes", contactEmail:"ojt@ph.ibm.com", industry:"IT Services & Consulting", effectiveDate:"2024-02-01", expiryDate:"2026-02-01", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-003", companyName:"Concentrix Philippines", address:"Robinsons Cybergate, Pioneer St., Mandaluyong City", contactPerson:"Ana Cruz", contactEmail:"internship@concentrix.com", industry:"Business Process Outsourcing (BPO)", effectiveDate:"2024-03-10", expiryDate:"2026-03-10", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-004", companyName:"Globe Telecom Inc.", address:"The Globe Tower, 32nd St., BGC, Taguig City", contactPerson:"Ricardo Dela Cruz", contactEmail:"internship@globe.com.ph", industry:"Telecommunications", effectiveDate:"2024-01-20", expiryDate:"2026-01-20", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-005", companyName:"PLDT Inc.", address:"Ramon Cojuangco Building, Makati Avenue, Makati City", contactPerson:"Liza Manalo", contactEmail:"ojt@pldt.com.ph", industry:"Telecommunications", effectiveDate:"2024-02-15", expiryDate:"2026-02-15", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-006", companyName:"Trend Micro Philippines", address:"Cybergate Tower 3, Pioneer St., Mandaluyong City", contactPerson:"Kevin Tan", contactEmail:"careers.ph@trendmicro.com", industry:"Cybersecurity", effectiveDate:"2024-04-01", expiryDate:"2026-04-01", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-007", companyName:"Solvento Philippines Inc.", address:"Eastwood City, Libis, Quezon City", contactPerson:"Patricia Lim", contactEmail:"hr@solvento.com.ph", industry:"Software Development", effectiveDate:"2024-03-01", expiryDate:"2026-03-01", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-008", companyName:"FiLDEV Cloud Business & Software", address:"UP Ayala Technohub, Commonwealth Ave., Quezon City", contactPerson:"Daniel Flores", contactEmail:"intern@fildev.io", industry:"Cloud Computing & DevOps", effectiveDate:"2024-05-01", expiryDate:"2026-05-01", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-009", companyName:"Philippine Global Communications (PhilCom)", address:"Philcom Building, Pasay Road, Makati City", contactPerson:"Roberto Garcia", contactEmail:"ojt@philcom.com.ph", industry:"Telecommunications", effectiveDate:"2024-01-10", expiryDate:"2026-01-10", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-010", companyName:"Integrated Computer Systems Inc.", address:"ICS Building, Quezon Avenue, Quezon City", contactPerson:"Helen Villanueva", contactEmail:"hr@ics.com.ph", industry:"IT Services & Consulting", effectiveDate:"2024-02-20", expiryDate:"2026-02-20", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-011", companyName:"Achieve Without Borders Inc. (AWB)", address:"Makati City, Metro Manila", contactPerson:"Sophia Mendoza", contactEmail:"internship@awb.com.ph", industry:"Knowledge Process Outsourcing (KPO)", effectiveDate:"2024-06-01", expiryDate:"2026-06-01", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-012", companyName:"SoluxionLab Inc.", address:"Muntinlupa City, Metro Manila", contactPerson:"James Ong", contactEmail:"intern@soluxionlab.com", industry:"Web & Mobile Development", effectiveDate:"2024-04-15", expiryDate:"2026-04-15", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-013", companyName:"Department of Information and Communications Technology (DICT)", address:"C.P. Garcia Ave., UP Campus, Diliman, Quezon City", contactPerson:"Dir. Anna Reyes", contactEmail:"ojt@dict.gov.ph", industry:"Government Agency / LGU", effectiveDate:"2024-01-05", expiryDate:"2026-01-05", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-014", companyName:"Commission on Elections (COMELEC)", address:"Palacio del Gobernador, Intramuros, Manila", contactPerson:"Atty. Mario Bautista", contactEmail:"mis@comelec.gov.ph", industry:"Government Agency / LGU", effectiveDate:"2024-03-15", expiryDate:"2026-03-15", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-015", companyName:"BDO Unibank Inc.", address:"BDO Corporate Center, Makati City", contactPerson:"Grace Sy", contactEmail:"itintern@bdo.com.ph", industry:"Banking & Financial Technology (FinTech)", effectiveDate:"2024-02-10", expiryDate:"2026-02-10", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-016", companyName:"GCash (Mynt - Globe Fintech Innovations)", address:"5F Cybergate Tower 3, Mandaluyong City", contactPerson:"Tricia Aquino", contactEmail:"internship@gcash.com", industry:"Banking & Financial Technology (FinTech)", effectiveDate:"2024-05-15", expiryDate:"2026-05-15", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-017", companyName:"iTechrise Inc.", address:"Quezon City, Metro Manila", contactPerson:"Nathan Ko", contactEmail:"ojt@itechrise.com", industry:"Web & Mobile Development", effectiveDate:"2024-06-10", expiryDate:"2026-06-10", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-018", companyName:"Eagle Broadcasting Corporation", address:"Eagle News Center, New Era, Quezon City", contactPerson:"Dir. Paul Dela Fuente", contactEmail:"hr@eaglenews.ph", industry:"Media & Broadcasting", effectiveDate:"2024-01-25", expiryDate:"2026-01-25", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-019", companyName:"Emerson Electric Philippines", address:"25F Zuellig Building, Makati City", contactPerson:"Carla Reyes", contactEmail:"ph.internship@emerson.com", industry:"Engineering & Manufacturing", effectiveDate:"2024-03-20", expiryDate:"2026-03-20", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
  { hteid:"HTE-2024-020", companyName:"Deloitte Philippines", address:"Burgundy Corporate Tower, Sen. Gil Puyat Ave., Makati City", contactPerson:"Atty. Victor Chan", contactEmail:"ojt@deloitte.com.ph", industry:"IT Services & Consulting", effectiveDate:"2024-04-10", expiryDate:"2026-04-10", status:"APPROVED: Signed by President", endorsedByCollege:"College of Informatics and Computing Studies (CICS)" },
];

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");
  const [moas, setMoas] = useState([]);
  const [users, setUsers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [busy, setBusy] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [fCollege, setFCollege] = useState("All");
  const [fStatus, setFStatus] = useState("All");
  const [fIndustry, setFIndustry] = useState("All");
  const [fDateFrom, setFDateFrom] = useState("");
  const [fDateTo, setFDateTo] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3200); };

  const seedData = async () => {
    if (!window.confirm(`This will add ${SEED_MOAS.length} sample NEU CICS OJT partner MOAs to the database. Continue?`)) return;
    setSaving(true);
    let count = 0;
    for (const m of SEED_MOAS) {
      await addDoc(collection(db,"moas"), {
        ...m, isDeleted:false,
        createdAt: serverTimestamp(),
        createdBy: currentUser.email,
        createdByName: currentUser.displayName || "",
      });
      count++;
    }
    showToast(`✅ ${count} partner MOAs seeded successfully!`);
    fetchAll();
    setSaving(false);
  };

  const fetchAll = useCallback(async () => {
    setBusy(true);
    const [moaSnap, userSnap, auditSnap] = await Promise.all([
      getDocs(query(collection(db,"moas"), orderBy("createdAt","desc"))),
      getDocs(collection(db,"moa_users")),
      getDocs(query(collection(db,"audit_trail"), orderBy("timestamp","desc"))),
    ]);
    setMoas(moaSnap.docs.map(d => ({ id:d.id, ...d.data() })));
    setUsers(userSnap.docs.map(d => ({ id:d.id, ...d.data() })));
    setAudit(auditSnap.docs.map(d => ({ id:d.id, ...d.data() })));
    setBusy(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const logAudit = async (operation, moaId, companyName) => {
    await addDoc(collection(db,"audit_trail"), {
      userId: currentUser.uid, userEmail: currentUser.email,
      userName: currentUser.displayName || "", operation, moaId, companyName,
      timestamp: serverTimestamp(),
    });
  };

  const handleSave = async () => {
    if (!form.hteid.trim() || !form.companyName.trim()) { showToast("⚠️ HTE ID and Company Name are required."); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(db,"moas",editId), { ...form, updatedAt: serverTimestamp(), updatedBy: currentUser.email, updatedByName: currentUser.displayName });
        await logAudit("EDIT", editId, form.companyName);
        showToast("✅ MOA updated successfully!");
      } else {
        const ref = await addDoc(collection(db,"moas"), { ...form, isDeleted: false, createdAt: serverTimestamp(), createdBy: currentUser.email, createdByName: currentUser.displayName || "" });
        await logAudit("INSERT", ref.id, form.companyName);
        showToast("✅ MOA added successfully!");
      }
      setForm(EMPTY); setEditId(null); fetchAll(); setTab("moas");
    } catch { showToast("❌ Error saving. Try again."); }
    setSaving(false);
  };

  const handleDelete = async (moa) => {
    if (!window.confirm(`Soft-delete "${moa.companyName}"?`)) return;
    await updateDoc(doc(db,"moas",moa.id), { isDeleted:true, deletedAt: serverTimestamp(), deletedBy: currentUser.email });
    await logAudit("DELETE", moa.id, moa.companyName);
    showToast("🗑 MOA soft-deleted.");
    fetchAll();
  };

  const handleRecover = async (moa) => {
    await updateDoc(doc(db,"moas",moa.id), { isDeleted:false, recoveredAt: serverTimestamp(), recoveredBy: currentUser.email });
    await logAudit("RECOVER", moa.id, moa.companyName);
    showToast("↩ MOA recovered.");
    fetchAll();
  };

  const handleEdit = (moa) => {
    setForm({ hteid:moa.hteid||"", companyName:moa.companyName||"", address:moa.address||"", contactPerson:moa.contactPerson||"", contactEmail:moa.contactEmail||"", industry:moa.industry||"Software Development", effectiveDate:moa.effectiveDate||"", expiryDate:moa.expiryDate||"", status:moa.status||STATUSES[0].key, endorsedByCollege:moa.endorsedByCollege||COLLEGES[0] });
    setEditId(moa.id); setTab("add");
  };

  const handleBlockUser = async (u) => {
    await updateDoc(doc(db,"moa_users",u.id), { isBlocked: !u.isBlocked });
    showToast(u.isBlocked ? "✅ User unblocked." : "🚫 User blocked.");
    fetchAll();
  };

  const handleSetRole = async (u, role) => {
    await updateDoc(doc(db,"moa_users",u.id), { role });
    showToast(`✅ Role updated to ${role}.`);
    fetchAll();
  };

  // Stats
  const active = moas.filter(m => !m.isDeleted);
  const approvedCount   = active.filter(m => m.status?.startsWith("APPROVED")).length;
  const processingCount = active.filter(m => m.status?.startsWith("PROCESSING")).length;
  const expiredCount    = active.filter(m => m.status?.startsWith("EXPIRED")).length;
  const expiringCount   = active.filter(m => m.status?.startsWith("EXPIRING")).length;

  // Filter MOAs
  const filtered = moas.filter(m => {
    if (!showDeleted && m.isDeleted) return false;
    if (showDeleted && !m.isDeleted) return false;
    const q = search.toLowerCase();
    if (q && ![m.companyName,m.contactPerson,m.address,m.endorsedByCollege,m.industry,m.contactEmail].some(v => v?.toLowerCase().includes(q))) return false;
    if (fCollege !== "All" && m.endorsedByCollege !== fCollege) return false;
    if (fStatus !== "All" && m.status !== fStatus) return false;
    if (fIndustry !== "All" && m.industry !== fIndustry) return false;
    if (fDateFrom && m.effectiveDate && m.effectiveDate < fDateFrom) return false;
    if (fDateTo && m.effectiveDate && m.effectiveDate > fDateTo) return false;
    return true;
  });

  // College breakdown for chart
  const collegeCounts = COLLEGES.map(c => ({ name: c.replace("College of ","").replace("School of ","").split("(")[0].trim(), count: active.filter(m => m.endorsedByCollege === c).length })).filter(x => x.count > 0).slice(0,8);
  const maxCC = Math.max(...collegeCounts.map(x => x.count), 1);



  return (
    <div style={s.layout}>
      {/* Toast */}
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.sideHead}>
          <div style={s.sideLogoRing}><img src={NEU_LOGO} alt="NEU" style={s.sideLogo} onError={e => e.target.style.display="none"}/></div>
          <div style={s.sideAppName}>NEU MOA</div>
          <div style={s.sideRole}>Admin Portal</div>
        </div>

        <nav style={s.nav}>
          {TABS.map(t => (
            <button key={t.id} style={{ ...s.navItem, ...(tab===t.id ? s.navActive : {}) }} onClick={() => setTab(t.id)}>
              <span style={s.navIcon}>{t.icon}</span>
              <span>{t.label}</span>
              {t.id==="moas" && <span style={s.navBadge}>{active.length}</span>}
              {t.id==="audit" && <span style={s.navBadge}>{audit.length}</span>}
            </button>
          ))}
        </nav>

        <div style={s.sideFooter}>
          <div style={s.sideUser}>
            {currentUser?.photoURL
              ? <img src={currentUser.photoURL} alt="profile" style={{...s.sideAvatar, objectFit:"cover"}} referrerPolicy="no-referrer" />
              : <div style={s.sideAvatar}>{currentUser?.displayName?.charAt(0)||"A"}</div>
            }
            <div>
              <div style={s.sideUserName}>{currentUser?.displayName?.split(" ")[0]}</div>
              <div style={s.sideUserRole}>Administrator</div>
            </div>
          </div>
          <button style={s.logoutBtn} onClick={async () => { await logout(); navigate("/"); }}>Sign Out</button>
        </div>
      </aside>

      {/* Main content */}
      <main style={s.main}>
        <div style={s.topBar}>
          <div>
            <h1 style={s.pageTitle}>{TABS.find(t=>t.id===tab)?.label}</h1>
            <p style={s.pageSub}>{new Date().toLocaleDateString("en-PH",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}</p>
          </div>
        </div>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard" && (
          <div style={s.fadeIn}>
            <div style={s.statGrid}>
              {[
                { label:"Total Active MOAs", val:active.length,  icon:"📋", c:"#2563eb", bg:"#dbeafe" },
                { label:"Approved",          val:approvedCount,   icon:"✅", c:"#047857", bg:"#d1fae5" },
                { label:"Processing",        val:processingCount, icon:"⏳", c:"#b45309", bg:"#fef3c7" },
                { label:"Expired",           val:expiredCount,    icon:"❌", c:"#dc2626", bg:"#fee2e2" },
                { label:"Expiring Soon",     val:expiringCount,   icon:"⚠️", c:"#be185d", bg:"#fdf2f8" },
                { label:"Total Users",       val:users.length,    icon:"👥", c:"#7c3aed", bg:"#ede9fe" },
              ].map(c => (
                <div key={c.label} style={{ ...s.statCard, borderTop:`3px solid ${c.c}` }}>
                  <div style={{ ...s.statIconBox, background:c.bg }}>{c.icon}</div>
                  <div style={{ ...s.statNum, color:c.c }}>{busy ? "—" : c.val}</div>
                  <div style={s.statLabel}>{c.label}</div>
                </div>
              ))}
            </div>

            <div style={s.chartRow}>
              {/* Status breakdown */}
              <div style={s.chartCard}>
                <div style={s.chartHead}>
                  <h3 style={s.chartTitle}>Status Breakdown</h3>
                  <span style={s.chartSub}>All active MOAs</span>
                </div>
                {STATUSES.map(st => {
                  const cnt = active.filter(m => m.status===st.key).length;
                  const pct = active.length ? Math.round(cnt/active.length*100) : 0;
                  return (
                    <div key={st.key} style={s.barItem}>
                      <div style={s.barMeta}>
                        <span style={{ ...s.barDot, background:st.color }}/>
                        <span style={s.barText}>{st.group} · {st.key.split(":")[1]?.trim().slice(0,28)}</span>
                        <span style={{ ...s.barCount, color:st.color }}>{cnt}</span>
                      </div>
                      <div style={s.barTrack}>
                        <div style={{ ...s.barFill, width:`${pct}%`, background:st.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* College chart */}
              <div style={s.chartCard}>
                <div style={s.chartHead}>
                  <h3 style={s.chartTitle}>MOAs by College</h3>
                  <span style={s.chartSub}>Top colleges</span>
                </div>
                {collegeCounts.length === 0
                  ? <p style={s.emptyNote}>Add MOAs to see analytics.</p>
                  : collegeCounts.map((c,i) => (
                    <div key={c.name} style={s.colBarItem}>
                      <div style={s.colBarLabel}>{c.name}</div>
                      <div style={s.colBarTrack}>
                        <div style={{ ...s.colBarFill, width:`${Math.round(c.count/maxCC*100)}%`, opacity: 1-(i*0.08) }} />
                      </div>
                      <div style={s.colBarCount}>{c.count}</div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Filter panel for dashboard */}
            <div style={s.dashFilters}>
              <span style={s.dashFilterLabel}>Filter Dashboard:</span>
              <select style={s.smallSel} value={fCollege} onChange={e=>setFCollege(e.target.value)}>
                <option value="All">All Colleges</option>
                {COLLEGES.map(c=><option key={c}>{c}</option>)}
              </select>
              <select style={s.smallSel} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                {STATUSES.map(s=><option key={s.key} value={s.key}>{s.key}</option>)}
              </select>
              <input type="date" style={s.smallSel} value={fDateFrom} onChange={e=>setFDateFrom(e.target.value)} title="From date"/>
              <input type="date" style={s.smallSel} value={fDateTo}   onChange={e=>setFDateTo(e.target.value)}   title="To date"/>
              <button style={s.clearBtn} onClick={()=>{setFCollege("All");setFStatus("All");setFDateFrom("");setFDateTo("");}}>Clear</button>
            </div>

            {/* Seed sample partners */}
            <div style={{ marginTop:24, padding:"20px 24px", background:"#eff6ff", borderRadius:14, border:"1px solid #bfdbfe", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#1d4ed8", marginBottom:4 }}>🏢 Load Sample NEU CICS OJT Partner Companies</div>
                <div style={{ fontSize:12, color:"#3b82f6" }}>Adds 20 real industry partner MOAs (IT, BPO, Telecom, Gov, FinTech) endorsed by CICS. Run once to populate the database.</div>
              </div>
              <button
                style={{ background:"#1d4ed8", color:"#fff", border:"none", borderRadius:10, padding:"10px 22px", fontSize:13, fontWeight:700, cursor:"pointer", whiteSpace:"nowrap", opacity: saving ? 0.6 : 1 }}
                onClick={seedData}
                disabled={saving}>
                {saving ? "Loading..." : "➕ Seed Partner MOAs"}
              </button>
            </div>
          </div>
        )}

        {/* ── MOA RECORDS ── */}
        {tab==="moas" && (
          <div style={s.fadeIn}>
            {/* Filters */}
            <div style={s.filtersBar}>
              <input style={s.bigSearch} placeholder="🔍  Search by company, contact, address, college, industry, email…" value={search} onChange={e=>setSearch(e.target.value)}/>
              <div style={s.filterRow}>
                <select style={s.sel} value={fCollege} onChange={e=>setFCollege(e.target.value)}>
                  <option value="All">All Colleges</option>
                  {COLLEGES.map(c=><option key={c}>{c}</option>)}
                </select>
                <select style={s.sel} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
                  <option value="All">All Statuses</option>
                  {STATUSES.map(s=><option key={s.key} value={s.key}>{s.key}</option>)}
                </select>
                <select style={s.sel} value={fIndustry} onChange={e=>setFIndustry(e.target.value)}>
                  <option value="All">All Industries</option>
                  {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                </select>
                <input type="date" style={s.sel} value={fDateFrom} onChange={e=>setFDateFrom(e.target.value)} title="Effective date from"/>
                <input type="date" style={s.sel} value={fDateTo}   onChange={e=>setFDateTo(e.target.value)}   title="Effective date to"/>
                <button style={{ ...s.toggleBtn, ...(showDeleted ? s.toggleBtnActive : {}) }} onClick={()=>setShowDeleted(!showDeleted)}>
                  {showDeleted ? "🗑 Deleted Records" : "📋 Active Records"}
                </button>
              </div>
            </div>
            <div style={s.recordsInfo}>{filtered.length} record{filtered.length!==1?"s":""} · {showDeleted?"Deleted":"Active"} view</div>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>{["HTE ID","Company Name","Address","Contact Person","Email","Industry","Effective Date","Expiry Date","Status","College","Actions"].map(h=>(
                    <th key={h} style={s.th}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {busy ? <tr><td colSpan={11} style={s.tdEmpty}>Loading…</td></tr>
                        : filtered.length===0 ? <tr><td colSpan={11} style={s.tdEmpty}>No records found.</td></tr>
                        : filtered.map((m,i) => {
                    const sm = getStatusMeta(m.status);
                    return (
                      <tr key={m.id} style={{ ...s.tr, background: m.isDeleted?"#fff8f8": i%2===0?"#fff":"#f9fbff", opacity:m.isDeleted?.72:1 }}>
                        <td style={s.td}><span style={s.hteChip}>{m.hteid}</span></td>
                        <td style={{ ...s.td, fontWeight:600, color:"#0a2342", maxWidth:160 }}>{m.companyName}</td>
                        <td style={{ ...s.td, color:"#64748b", maxWidth:140 }}>{m.address}</td>
                        <td style={s.td}>{m.contactPerson}</td>
                        <td style={s.td}><a href={`mailto:${m.contactEmail}`} style={s.emailLink}>{m.contactEmail}</a></td>
                        <td style={s.td}><span style={s.industryChip}>{m.industry}</span></td>
                        <td style={s.td}>{m.effectiveDate||"—"}</td>
                        <td style={s.td}>{m.expiryDate||"—"}</td>
                        <td style={s.td}><span style={{ ...s.statusChip, color:sm.color, background:sm.bg, border:`1px solid ${sm.border}` }}>{m.status?.split(":")[0]} · {m.status?.split(":")[1]?.trim().slice(0,22)}</span></td>
                        <td style={{ ...s.td, maxWidth:120 }}>{m.endorsedByCollege?.split("(")[0].trim()}</td>
                        <td style={s.td}>
                          <div style={s.actions}>
                            {m.isDeleted
                              ? <button style={s.recBtn} onClick={()=>handleRecover(m)}>↩ Recover</button>
                              : <><button style={s.editBtn} onClick={()=>handleEdit(m)}>✏️ Edit</button>
                                  <button style={s.delBtn}  onClick={()=>handleDelete(m)}>🗑</button></>
                            }
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ADD / EDIT MOA ── */}
        {tab==="add" && (
          <div style={s.fadeIn}>
            <div style={s.formCard}>
              <div style={s.formCardHead}>
                <div>
                  <h3 style={s.formCardTitle}>{editId ? "Edit MOA Entry" : "New MOA Entry"}</h3>
                  <p style={s.formCardSub}>Fill in all fields carefully. HTE ID and Company Name are required.</p>
                </div>
                {editId && <button style={s.cancelBtn} onClick={()=>{setEditId(null);setForm(EMPTY);}}>✕ Cancel</button>}
              </div>
              <div style={s.formGrid}>
                {[
                  { label:"HTE ID *", key:"hteid", placeholder:"e.g. HTE-2024-001" },
                  { label:"Company Name *", key:"companyName", placeholder:"Full company name" },
                  { label:"Company Address", key:"address", placeholder:"Full address" },
                  { label:"Contact Person", key:"contactPerson", placeholder:"Full name" },
                  { label:"Email of Contact Person", key:"contactEmail", placeholder:"email@company.com", type:"email" },
                  { label:"Effective Date", key:"effectiveDate", type:"date" },
                  { label:"Expiry Date", key:"expiryDate", type:"date" },
                ].map(f => (
                  <div key={f.key} style={s.field}>
                    <label style={s.fieldLabel}>{f.label}</label>
                    <input style={s.fieldInput} type={f.type||"text"} placeholder={f.placeholder||""} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}/>
                  </div>
                ))}
                <div style={s.field}>
                  <label style={s.fieldLabel}>Type of Industry</label>
                  <select style={s.fieldInput} value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})}>
                    {INDUSTRIES.map(i=><option key={i}>{i}</option>)}
                  </select>
                </div>
                <div style={s.field}>
                  <label style={s.fieldLabel}>Endorsed by College</label>
                  <select style={s.fieldInput} value={form.endorsedByCollege} onChange={e=>setForm({...form,endorsedByCollege:e.target.value})}>
                    {COLLEGES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{ ...s.field, gridColumn:"1/-1" }}>
                  <label style={s.fieldLabel}>MOA Status</label>
                  <select style={s.fieldInput} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                    {STATUSES.map(s=><option key={s.key} value={s.key}>{s.key}</option>)}
                  </select>
                </div>
              </div>
              <div style={s.formActions}>
                <button style={{ ...s.saveBtn, opacity:saving?.72:1 }} onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : editId ? "💾 Update MOA" : "✅ Save MOA Entry"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab==="users" && (
          <div style={s.fadeIn}>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr>{["Name","Email","Role","Status","Actions"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {users.map((u,i)=>(
                    <tr key={u.id} style={{...s.tr, background:i%2===0?"#fff":"#f9fbff"}}>
                      <td style={{...s.td,fontWeight:600}}>{u.fullName}</td>
                      <td style={s.td}>{u.email}</td>
                      <td style={s.td}>
                        <span style={{...s.roleBadge,
                          background: u.role==="admin"?"#ede9fe":u.role==="faculty"?"#dbeafe":"#f1f5f9",
                          color:      u.role==="admin"?"#7c3aed":u.role==="faculty"?"#2563eb":"#64748b"}}>
                          {u.role}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{...s.roleBadge, background:u.isBlocked?"#fee2e2":"#d1fae5", color:u.isBlocked?"#dc2626":"#047857"}}>
                          {u.isBlocked?"Blocked":"Active"}
                        </span>
                      </td>
                      <td style={s.td}>
                        {u.role!=="admin" && (
                          <div style={s.actions}>
                            <select style={s.roleSelect} value={u.role} onChange={e=>handleSetRole(u,e.target.value)}>
                              <option value="student">student</option>
                              <option value="faculty">faculty</option>
                            </select>
                            <button style={{...s.editBtn, background:u.isBlocked?"#d1fae5":"#fee2e2", color:u.isBlocked?"#047857":"#dc2626"}} onClick={()=>handleBlockUser(u)}>
                              {u.isBlocked?"Unblock":"Block"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── AUDIT TRAIL ── */}
        {tab==="audit" && (
          <div style={s.fadeIn}>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr>{["Date & Time","User Name","Email","Operation","Company Name","MOA ID"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {audit.length===0 ? <tr><td colSpan={6} style={s.tdEmpty}>No audit entries yet.</td></tr>
                  : audit.map((a,i)=>{
                    const opColors = { INSERT:{bg:"#d1fae5",c:"#047857"}, EDIT:{bg:"#dbeafe",c:"#2563eb"}, DELETE:{bg:"#fee2e2",c:"#dc2626"}, RECOVER:{bg:"#fef3c7",c:"#b45309"} };
                    const op = opColors[a.operation] || {bg:"#f1f5f9",c:"#64748b"};
                    return (
                      <tr key={a.id} style={{...s.tr,background:i%2===0?"#fff":"#f9fbff"}}>
                        <td style={s.td}>{a.timestamp?.toDate?.()?.toLocaleString("en-PH")||"—"}</td>
                        <td style={{...s.td,fontWeight:600}}>{a.userName}</td>
                        <td style={s.td}>{a.userEmail}</td>
                        <td style={s.td}><span style={{...s.roleBadge,background:op.bg,color:op.c}}>{a.operation}</span></td>
                        <td style={{...s.td,fontWeight:600,color:"#0a2342"}}>{a.companyName}</td>
                        <td style={s.td}><span style={s.hteChip}>{a.moaId?.slice(0,12)}…</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab==="seed" && (
          <div style={s.fadeIn}>
            <div style={{background:"#fff",borderRadius:16,padding:32,border:"1px solid #e2e8f0",maxWidth:720}}>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:700,color:"#0a2342",margin:"0 0 8px"}}>🌱 Load CICS OJT Partner Companies</h2>
              <p style={{fontSize:14,color:"#64748b",margin:"0 0 24px",lineHeight:1.7}}>
                This will add <strong>{SEED_MOAS.length} real industry partner companies</strong> into the MOA database as approved entries — these are actual Philippine companies that CICS students can apply to for OJT. Click the button below to load them into Firestore.
              </p>
              <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:12,padding:"16px 20px",marginBottom:24}}>
                <p style={{fontSize:13,fontWeight:700,color:"#047857",margin:"0 0 10px"}}>✅ Companies to be added ({SEED_MOAS.length} total):</p>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px 24px"}}>
                  {SEED_MOAS.map((m,i)=>(
                    <div key={i} style={{fontSize:12,color:"#374151",padding:"3px 0",borderBottom:"1px solid #e5e7eb"}}>
                      <span style={{fontWeight:600,color:"#0a2342"}}>{m.companyName}</span>
                      <span style={{color:"#94a3b8",marginLeft:6}}>— {m.industry}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <button
                  style={{background:"#047857",color:"#fff",border:"none",borderRadius:10,padding:"12px 28px",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 12px rgba(4,120,87,.3)"}}
                  onClick={async () => {
                    if (!window.confirm(`Add all ${SEED_MOAS.length} OJT partner companies to Firestore?`)) return;
                    let count = 0;
                    for (const moa of SEED_MOAS) {
                      await addDoc(collection(db,"moas"), { ...moa, createdAt: serverTimestamp(), createdBy: currentUser.email, createdByName: currentUser.displayName||"Admin" });
                      count++;
                    }
                    showToast(`✅ Loaded ${count} OJT partner companies!`);
                    fetchAll();
                    setTab("moas");
                  }}
                >
                  🌱 Load All {SEED_MOAS.length} Partners into Firestore
                </button>
                <span style={{fontSize:12,color:"#94a3b8"}}>⚠️ Only click once — clicking again will add duplicates.</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}}
        tr:hover td{background:rgba(37,99,235,.03)!important;}
        input[type=date]{color-scheme:light}
      `}</style>
    </div>
  );
}

const s = {
  layout:{display:"flex",minHeight:"100vh",background:"#f0f3f8",fontFamily:"'Outfit',sans-serif"},
  toast:{position:"fixed",top:20,right:20,background:"#1a3a5c",color:"#fff",borderRadius:12,padding:"12px 22px",fontSize:14,fontWeight:600,zIndex:9999,boxShadow:"0 8px 32px rgba(0,0,0,.2)",animation:"slideIn .3s ease"},
  sidebar:{width:234,background:"#0a2342",display:"flex",flexDirection:"column",padding:"0",position:"sticky",top:0,height:"100vh",flexShrink:0},
  sideHead:{textAlign:"center",padding:"28px 20px 20px",borderBottom:"1px solid rgba(255,255,255,.08)"},
  sideLogoRing:{width:62,height:62,borderRadius:"50%",overflow:"hidden",margin:"0 auto 12px",border:"2.5px solid rgba(255,255,255,.2)",boxShadow:"0 0 0 6px rgba(255,255,255,.04)"},
  sideLogo:{width:"100%",height:"100%",objectFit:"cover"},
  sideAppName:{fontSize:15,fontWeight:700,color:"#fff",marginBottom:2},
  sideRole:{fontSize:10,color:"rgba(255,255,255,.35)",letterSpacing:2,textTransform:"uppercase"},
  nav:{flex:1,padding:"16px 12px",display:"flex",flexDirection:"column",gap:4},
  navItem:{background:"none",border:"none",borderRadius:10,padding:"10px 14px",textAlign:"left",fontSize:13,color:"rgba(255,255,255,.58)",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all .2s",position:"relative"},
  navActive:{background:"rgba(255,255,255,.11)",color:"#fff",fontWeight:600},
  navIcon:{fontSize:15,width:18,textAlign:"center"},
  navBadge:{marginLeft:"auto",background:"rgba(255,255,255,.14)",color:"rgba(255,255,255,.7)",borderRadius:99,padding:"2px 8px",fontSize:10,fontWeight:700},
  sideFooter:{padding:"16px 16px 20px",borderTop:"1px solid rgba(255,255,255,.08)"},
  sideUser:{display:"flex",alignItems:"center",gap:10,marginBottom:10},
  sideAvatar:{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#3b82f6,#8b5cf6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff"},
  sideUserName:{fontSize:13,fontWeight:600,color:"#fff"},
  sideUserRole:{fontSize:10,color:"rgba(255,255,255,.35)"},
  logoutBtn:{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"8px",color:"rgba(255,255,255,.55)",fontSize:12,cursor:"pointer",transition:"all .2s"},
  main:{flex:1,padding:"28px 32px",overflow:"auto"},
  topBar:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:26},
  pageTitle:{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:700,color:"#0a2342",margin:"0 0 4px"},
  pageSub:{fontSize:12,color:"#94a3b8",margin:0},
  fadeIn:{animation:"fadeUp .4s ease forwards"},
  statGrid:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:24},
  statCard:{background:"#fff",borderRadius:16,padding:"20px 22px",boxShadow:"0 1px 8px rgba(0,0,0,.06)"},
  statIconBox:{width:42,height:42,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,marginBottom:14},
  statNum:{fontFamily:"'Cormorant Garamond',serif",fontSize:38,fontWeight:700,lineHeight:1,marginBottom:6},
  statLabel:{fontSize:12,color:"#94a3b8",fontWeight:500},
  chartRow:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20},
  chartCard:{background:"#fff",borderRadius:16,padding:"22px",boxShadow:"0 1px 8px rgba(0,0,0,.06)"},
  chartHead:{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:18},
  chartTitle:{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:700,color:"#0a2342",margin:0},
  chartSub:{fontSize:11,color:"#94a3b8"},
  barItem:{marginBottom:11},
  barMeta:{display:"flex",alignItems:"center",gap:7,marginBottom:5},
  barDot:{width:8,height:8,borderRadius:"50%",flexShrink:0},
  barText:{fontSize:11,color:"#64748b",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},
  barCount:{fontSize:12,fontWeight:700,width:22,textAlign:"right",flexShrink:0},
  barTrack:{height:5,background:"#f1f5f9",borderRadius:99,overflow:"hidden"},
  barFill:{height:"100%",borderRadius:99,transition:"width .5s ease"},
  colBarItem:{display:"flex",alignItems:"center",gap:10,marginBottom:10},
  colBarLabel:{fontSize:11,color:"#64748b",width:110,flexShrink:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"},
  colBarTrack:{flex:1,height:9,background:"#f1f5f9",borderRadius:99,overflow:"hidden"},
  colBarFill:{height:"100%",background:"linear-gradient(90deg,#0a2342,#2563eb)",borderRadius:99,transition:"width .5s ease"},
  colBarCount:{fontSize:12,fontWeight:700,color:"#0a2342",width:22,textAlign:"right"},
  emptyNote:{fontSize:13,color:"#94a3b8",fontStyle:"italic"},
  dashFilters:{background:"#fff",borderRadius:14,padding:"16px 20px",display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",boxShadow:"0 1px 6px rgba(0,0,0,.05)"},
  dashFilterLabel:{fontSize:12,fontWeight:600,color:"#64748b",flexShrink:0},
  smallSel:{padding:"7px 10px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:12,background:"#f9fbff",outline:"none",cursor:"pointer"},
  clearBtn:{padding:"7px 14px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#fff",fontSize:12,cursor:"pointer",color:"#64748b"},
  filtersBar:{background:"#fff",borderRadius:14,padding:"16px 18px",marginBottom:14,boxShadow:"0 1px 6px rgba(0,0,0,.05)"},
  bigSearch:{width:"100%",padding:"11px 16px",borderRadius:10,border:"1.5px solid #e2e8f0",fontSize:13,marginBottom:12,background:"#f9fbff",outline:"none",boxSizing:"border-box"},
  filterRow:{display:"flex",gap:8,flexWrap:"wrap"},
  sel:{padding:"8px 10px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:12,background:"#f9fbff",outline:"none",cursor:"pointer"},
  toggleBtn:{padding:"8px 14px",borderRadius:8,border:"1.5px solid #e2e8f0",background:"#f9fbff",fontSize:12,fontWeight:600,cursor:"pointer",color:"#64748b"},
  toggleBtnActive:{background:"#fee2e2",border:"1.5px solid #fca5a5",color:"#dc2626"},
  recordsInfo:{fontSize:12,color:"#94a3b8",marginBottom:10},
  tableWrap:{background:"#fff",borderRadius:16,overflow:"auto",boxShadow:"0 1px 8px rgba(0,0,0,.06)"},
  table:{width:"100%",borderCollapse:"collapse",fontSize:12},
  th:{background:"#0a2342",color:"rgba(255,255,255,.85)",padding:"12px 14px",textAlign:"left",fontWeight:600,fontSize:11,letterSpacing:.4,whiteSpace:"nowrap"},
  tr:{borderBottom:"1px solid #f1f5f9",transition:"background .15s"},
  td:{padding:"11px 14px",verticalAlign:"middle",color:"#374151",maxWidth:180,overflow:"hidden",textOverflow:"ellipsis"},
  tdEmpty:{padding:"48px",textAlign:"center",color:"#94a3b8",fontSize:14},
  hteChip:{background:"#eef2ff",color:"#4f46e5",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"},
  emailLink:{color:"#2563eb",textDecoration:"none",fontSize:11},
  industryChip:{background:"#f0fdf4",color:"#166534",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:600},
  statusChip:{borderRadius:99,padding:"4px 10px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"},
  roleBadge:{borderRadius:99,padding:"3px 10px",fontSize:11,fontWeight:700},
  actions:{display:"flex",gap:6,alignItems:"center"},
  editBtn:{background:"#dbeafe",color:"#2563eb",border:"none",borderRadius:7,padding:"5px 10px",fontSize:11,fontWeight:600,cursor:"pointer"},
  delBtn:{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:7,padding:"5px 9px",fontSize:11,cursor:"pointer"},
  recBtn:{background:"#fef3c7",color:"#b45309",border:"none",borderRadius:7,padding:"5px 10px",fontSize:11,fontWeight:600,cursor:"pointer"},
  roleSelect:{padding:"5px 8px",borderRadius:7,border:"1.5px solid #e2e8f0",fontSize:11,background:"#fff",cursor:"pointer",outline:"none"},
  formCard:{background:"#fff",borderRadius:20,padding:"32px",boxShadow:"0 1px 8px rgba(0,0,0,.06)",maxWidth:820},
  formCardHead:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:26},
  formCardTitle:{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:"#0a2342",margin:"0 0 4px"},
  formCardSub:{fontSize:13,color:"#94a3b8",margin:0},
  cancelBtn:{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer",flexShrink:0},
  formGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:26},
  field:{display:"flex",flexDirection:"column",gap:6},
  fieldLabel:{fontSize:12,fontWeight:600,color:"#374151"},
  fieldInput:{padding:"10px 14px",borderRadius:10,border:"1.5px solid #e2e8f0",fontSize:13,outline:"none",background:"#f9fbff",transition:"border .2s"},
  formActions:{},
  saveBtn:{background:"linear-gradient(135deg,#0a2342 0%,#1d4ed8 100%)",color:"#fff",border:"none",borderRadius:12,padding:"14px 36px",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 16px rgba(10,35,66,.22)",transition:"all .2s"},
};
