import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { COLLEGES, INDUSTRIES, STATUSES } from "./AdminDashboard";

const NEU_LOGO = "https://upload.wikimedia.org/wikipedia/en/c/c6/New_Era_University.svg";
const EMPTY = { hteid:"", companyName:"", address:"", contactPerson:"", contactEmail:"", industry:"Technology", effectiveDate:"", expiryDate:"", status: STATUSES[0].key, endorsedByCollege: COLLEGES[0] };
const getStatusMeta = (key) => STATUSES.find(s => s.key === key) || { color:"#64748b", bg:"#f1f5f9", border:"#e2e8f0" };

export default function FacultyDashboard() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("moas");
  const [moas, setMoas] = useState([]);
  const [busy, setBusy] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [fCollege, setFCollege] = useState("All");
  const [fStatus, setFStatus] = useState("All");
  const [fIndustry, setFIndustry] = useState("All");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""), 3000); };

  const fetchMoas = useCallback(async () => {
    setBusy(true);
    const snap = await getDocs(query(collection(db,"moas"), orderBy("createdAt","desc")));
    setMoas(snap.docs.map(d=>({id:d.id,...d.data()})).filter(m=>!m.isDeleted));
    setBusy(false);
  }, []);

  useEffect(()=>{ fetchMoas(); },[fetchMoas]);

  const logAudit = async (operation, moaId, companyName) => {
    await addDoc(collection(db,"audit_trail"),{ userId:currentUser.uid, userEmail:currentUser.email, userName:currentUser.displayName||"", operation, moaId, companyName, timestamp:serverTimestamp() });
  };

  const handleSave = async () => {
    if (!form.hteid.trim()||!form.companyName.trim()){showToast("⚠️ HTE ID and Company Name required.");return;}
    setSaving(true);
    try {
      if(editId){
        await updateDoc(doc(db,"moas",editId),{...form,updatedAt:serverTimestamp(),updatedBy:currentUser.email,updatedByName:currentUser.displayName});
        await logAudit("EDIT",editId,form.companyName);
        showToast("✅ MOA updated!");
      } else {
        const ref = await addDoc(collection(db,"moas"),{...form,isDeleted:false,createdAt:serverTimestamp(),createdBy:currentUser.email,createdByName:currentUser.displayName||""});
        await logAudit("INSERT",ref.id,form.companyName);
        showToast("✅ MOA added!");
      }
      setForm(EMPTY); setEditId(null); fetchMoas(); setTab("moas");
    } catch { showToast("❌ Error saving."); }
    setSaving(false);
  };

  const handleDelete = async (moa) => {
    if(!window.confirm(`Soft-delete "${moa.companyName}"?`))return;
    await updateDoc(doc(db,"moas",moa.id),{isDeleted:true,deletedAt:serverTimestamp(),deletedBy:currentUser.email});
    await logAudit("DELETE",moa.id,moa.companyName);
    showToast("🗑 Deleted."); fetchMoas();
  };

  const handleEdit = (moa) => {
    setForm({hteid:moa.hteid||"",companyName:moa.companyName||"",address:moa.address||"",contactPerson:moa.contactPerson||"",contactEmail:moa.contactEmail||"",industry:moa.industry||"Technology",effectiveDate:moa.effectiveDate||"",expiryDate:moa.expiryDate||"",status:moa.status||STATUSES[0].key,endorsedByCollege:moa.endorsedByCollege||COLLEGES[0]});
    setEditId(moa.id); setTab("add");
  };

  const filtered = moas.filter(m=>{
    const q=search.toLowerCase();
    if(q&&![m.companyName,m.contactPerson,m.address,m.endorsedByCollege,m.industry,m.contactEmail].some(v=>v?.toLowerCase().includes(q)))return false;
    if(fCollege!=="All"&&m.endorsedByCollege!==fCollege)return false;
    if(fStatus!=="All"&&m.status!==fStatus)return false;
    if(fIndustry!=="All"&&m.industry!==fIndustry)return false;
    return true;
  });

  return (
    <div style={s.layout}>
      {toast && <div style={s.toast}>{toast}</div>}
      <aside style={s.sidebar}>
        <div style={s.sideHead}>
          <div style={s.logoRing}><img src={NEU_LOGO} alt="NEU" style={s.logo} onError={e=>e.target.style.display="none"}/></div>
          <div style={s.appName}>NEU MOA</div>
          <div style={s.appSub}>Faculty Portal</div>
        </div>
        <nav style={s.nav}>
          {[{id:"moas",label:"MOA Records",icon:"≡"},{id:"add",label:"Add / Edit MOA",icon:"+"}].map(t=>(
            <button key={t.id} style={{...s.navItem,...(tab===t.id?s.navActive:{})}} onClick={()=>setTab(t.id)}>
              <span style={s.navIcon}>{t.icon}</span>{t.label}
              {t.id==="moas"&&<span style={s.navBadge}>{moas.length}</span>}
            </button>
          ))}
        </nav>
        <div style={s.sideFooter}>
          <div style={s.sideUser}>
            {currentUser?.photoURL
              ? <img src={currentUser.photoURL} alt="profile" style={{...s.avatar, objectFit:"cover"}} referrerPolicy="no-referrer" />
              : <div style={s.avatar}>{currentUser?.displayName?.charAt(0)||"F"}</div>
            }
            <div><div style={s.userName}>{currentUser?.displayName?.split(" ")[0]}</div><div style={s.userRole}>Faculty</div></div>
          </div>
          <button style={s.logoutBtn} onClick={async()=>{await logout();navigate("/");}}>Sign Out</button>
        </div>
      </aside>

      <main style={s.main}>
        <div style={s.topBar}>
          <div>
            <h1 style={s.pageTitle}>{tab==="moas"?"MOA Records":"Add / Edit MOA"}</h1>
            <p style={s.pageSub}>Faculty View · Active non-deleted rows · All columns except audit trail</p>
          </div>
        </div>

        {tab==="moas" && (
          <div style={s.fadeIn}>
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
              </div>
            </div>
            <div style={s.recordsInfo}>{filtered.length} active record{filtered.length!==1?"s":""}</div>
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead><tr>{["HTE ID","Company Name","Address","Contact Person","Email","Industry","Effective Date","Expiry Date","Status","College","Actions"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {busy?<tr><td colSpan={11} style={s.tdEmpty}>Loading…</td></tr>
                  :filtered.length===0?<tr><td colSpan={11} style={s.tdEmpty}>No records found.</td></tr>
                  :filtered.map((m,i)=>{
                    const sm=getStatusMeta(m.status);
                    return(
                      <tr key={m.id} style={{...s.tr,background:i%2===0?"#fff":"#f9fbff"}}>
                        <td style={s.td}><span style={s.hteChip}>{m.hteid}</span></td>
                        <td style={{...s.td,fontWeight:600,color:"#0a2342"}}>{m.companyName}</td>
                        <td style={{...s.td,color:"#64748b"}}>{m.address}</td>
                        <td style={s.td}>{m.contactPerson}</td>
                        <td style={s.td}><a href={`mailto:${m.contactEmail}`} style={{color:"#2563eb",textDecoration:"none",fontSize:11}}>{m.contactEmail}</a></td>
                        <td style={s.td}><span style={s.industryChip}>{m.industry}</span></td>
                        <td style={s.td}>{m.effectiveDate||"—"}</td>
                        <td style={s.td}>{m.expiryDate||"—"}</td>
                        <td style={s.td}><span style={{...s.statusChip,color:sm.color,background:sm.bg,border:`1px solid ${sm.border}`}}>{m.status?.split(":")[0]}·{m.status?.split(":")[1]?.trim().slice(0,18)}</span></td>
                        <td style={s.td}>{m.endorsedByCollege?.split("(")[0].trim()}</td>
                        <td style={s.td}>
                          <div style={{display:"flex",gap:6}}>
                            <button style={s.editBtn} onClick={()=>handleEdit(m)}>✏️ Edit</button>
                            <button style={s.delBtn} onClick={()=>handleDelete(m)}>🗑</button>
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

        {tab==="add" && (
          <div style={s.fadeIn}>
            <div style={s.formCard}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
                <div>
                  <h3 style={s.formTitle}>{editId?"Edit MOA Entry":"New MOA Entry"}</h3>
                  <p style={{fontSize:13,color:"#94a3b8",margin:0}}>HTE ID and Company Name are required.</p>
                </div>
                {editId&&<button style={s.cancelBtn} onClick={()=>{setEditId(null);setForm(EMPTY);}}>✕ Cancel</button>}
              </div>
              <div style={s.formGrid}>
                {[{l:"HTE ID *",k:"hteid"},{l:"Company Name *",k:"companyName"},{l:"Address",k:"address"},{l:"Contact Person",k:"contactPerson"},{l:"Email of Contact Person",k:"contactEmail",t:"email"},{l:"Effective Date",k:"effectiveDate",t:"date"},{l:"Expiry Date",k:"expiryDate",t:"date"}].map(f=>(
                  <div key={f.k} style={s.field}><label style={s.fieldLabel}>{f.l}</label><input style={s.fieldInput} type={f.t||"text"} value={form[f.k]} onChange={e=>setForm({...form,[f.k]:e.target.value})}/></div>
                ))}
                <div style={s.field}><label style={s.fieldLabel}>Industry</label><select style={s.fieldInput} value={form.industry} onChange={e=>setForm({...form,industry:e.target.value})}>{INDUSTRIES.map(i=><option key={i}>{i}</option>)}</select></div>
                <div style={s.field}><label style={s.fieldLabel}>Endorsed by College</label><select style={s.fieldInput} value={form.endorsedByCollege} onChange={e=>setForm({...form,endorsedByCollege:e.target.value})}>{COLLEGES.map(c=><option key={c}>{c}</option>)}</select></div>
                <div style={{...s.field,gridColumn:"1/-1"}}><label style={s.fieldLabel}>MOA Status</label><select style={s.fieldInput} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{STATUSES.map(s=><option key={s.key} value={s.key}>{s.key}</option>)}</select></div>
              </div>
              <button style={{...s.saveBtn,opacity:saving?.72:1}} onClick={handleSave} disabled={saving}>{saving?"Saving…":editId?"💾 Update MOA":"✅ Save MOA"}</button>
            </div>
          </div>
        )}
      </main>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}} @keyframes slideIn{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:translateX(0)}} tr:hover td{background:rgba(37,99,235,.03)!important;}`}</style>
    </div>
  );
}

const s = {
  layout:{display:"flex",minHeight:"100vh",background:"#f0f3f8",fontFamily:"'Outfit',sans-serif"},
  toast:{position:"fixed",top:20,right:20,background:"#1a3a5c",color:"#fff",borderRadius:12,padding:"12px 22px",fontSize:14,fontWeight:600,zIndex:9999,boxShadow:"0 8px 32px rgba(0,0,0,.2)",animation:"slideIn .3s ease"},
  sidebar:{width:230,background:"#1a3a5c",display:"flex",flexDirection:"column",padding:"0",position:"sticky",top:0,height:"100vh",flexShrink:0},
  sideHead:{textAlign:"center",padding:"28px 20px 20px",borderBottom:"1px solid rgba(255,255,255,.08)"},
  logoRing:{width:58,height:58,borderRadius:"50%",overflow:"hidden",margin:"0 auto 12px",border:"2.5px solid rgba(255,255,255,.2)"},
  logo:{width:"100%",height:"100%",objectFit:"cover"},
  appName:{fontSize:14,fontWeight:700,color:"#fff",marginBottom:2},
  appSub:{fontSize:10,color:"rgba(255,255,255,.35)",letterSpacing:2,textTransform:"uppercase"},
  nav:{flex:1,padding:"16px 12px",display:"flex",flexDirection:"column",gap:4},
  navItem:{background:"none",border:"none",borderRadius:10,padding:"10px 14px",textAlign:"left",fontSize:13,color:"rgba(255,255,255,.58)",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"all .2s"},
  navActive:{background:"rgba(255,255,255,.11)",color:"#fff",fontWeight:600},
  navIcon:{fontSize:15,width:18,textAlign:"center"},
  navBadge:{marginLeft:"auto",background:"rgba(255,255,255,.14)",color:"rgba(255,255,255,.7)",borderRadius:99,padding:"2px 8px",fontSize:10,fontWeight:700},
  sideFooter:{padding:"16px 16px 20px",borderTop:"1px solid rgba(255,255,255,.08)"},
  sideUser:{display:"flex",alignItems:"center",gap:10,marginBottom:10},
  avatar:{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#06b6d4,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff"},
  userName:{fontSize:13,fontWeight:600,color:"#fff"},
  userRole:{fontSize:10,color:"rgba(255,255,255,.35)"},
  logoutBtn:{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.1)",borderRadius:8,padding:"8px",color:"rgba(255,255,255,.55)",fontSize:12,cursor:"pointer"},
  main:{flex:1,padding:"28px 32px",overflow:"auto"},
  topBar:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24},
  pageTitle:{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:700,color:"#0a2342",margin:"0 0 4px"},
  pageSub:{fontSize:12,color:"#94a3b8",margin:0},
  fadeIn:{animation:"fadeUp .4s ease forwards"},
  filtersBar:{background:"#fff",borderRadius:14,padding:"16px 18px",marginBottom:14,boxShadow:"0 1px 6px rgba(0,0,0,.05)"},
  bigSearch:{width:"100%",padding:"11px 16px",borderRadius:10,border:"1.5px solid #e2e8f0",fontSize:13,marginBottom:12,background:"#f9fbff",outline:"none",boxSizing:"border-box"},
  filterRow:{display:"flex",gap:8,flexWrap:"wrap"},
  sel:{padding:"8px 10px",borderRadius:8,border:"1.5px solid #e2e8f0",fontSize:12,background:"#f9fbff",outline:"none",cursor:"pointer"},
  recordsInfo:{fontSize:12,color:"#94a3b8",marginBottom:10},
  tableWrap:{background:"#fff",borderRadius:16,overflow:"auto",boxShadow:"0 1px 8px rgba(0,0,0,.06)"},
  table:{width:"100%",borderCollapse:"collapse",fontSize:12},
  th:{background:"#1a3a5c",color:"rgba(255,255,255,.85)",padding:"12px 14px",textAlign:"left",fontWeight:600,fontSize:11,letterSpacing:.4,whiteSpace:"nowrap"},
  tr:{borderBottom:"1px solid #f1f5f9",transition:"background .15s"},
  td:{padding:"11px 14px",verticalAlign:"middle",color:"#374151",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis"},
  tdEmpty:{padding:"48px",textAlign:"center",color:"#94a3b8",fontSize:14},
  hteChip:{background:"#eef2ff",color:"#4f46e5",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:700},
  industryChip:{background:"#f0fdf4",color:"#166534",borderRadius:6,padding:"3px 8px",fontSize:11,fontWeight:600},
  statusChip:{borderRadius:99,padding:"4px 10px",fontSize:10,fontWeight:700,whiteSpace:"nowrap"},
  editBtn:{background:"#dbeafe",color:"#2563eb",border:"none",borderRadius:7,padding:"5px 10px",fontSize:11,fontWeight:600,cursor:"pointer"},
  delBtn:{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:7,padding:"5px 9px",fontSize:11,cursor:"pointer"},
  formCard:{background:"#fff",borderRadius:20,padding:"32px",boxShadow:"0 1px 8px rgba(0,0,0,.06)",maxWidth:820},
  formTitle:{fontFamily:"'Cormorant Garamond',serif",fontSize:24,fontWeight:700,color:"#0a2342",margin:"0 0 4px"},
  cancelBtn:{background:"#fee2e2",color:"#dc2626",border:"none",borderRadius:8,padding:"9px 18px",fontSize:13,fontWeight:600,cursor:"pointer"},
  formGrid:{display:"grid",gridTemplateColumns:"1fr 1fr",gap:18,marginBottom:26},
  field:{display:"flex",flexDirection:"column",gap:6},
  fieldLabel:{fontSize:12,fontWeight:600,color:"#374151"},
  fieldInput:{padding:"10px 14px",borderRadius:10,border:"1.5px solid #e2e8f0",fontSize:13,outline:"none",background:"#f9fbff"},
  saveBtn:{background:"linear-gradient(135deg,#1a3a5c 0%,#2563eb 100%)",color:"#fff",border:"none",borderRadius:12,padding:"14px 36px",fontSize:14,fontWeight:700,cursor:"pointer",boxShadow:"0 4px 16px rgba(26,58,92,.22)"},
};
