"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Constants ──
const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const LEVEL_COLORS = {
  Beginner: "bg-green-500", Intermediate: "bg-blue-500",
  Advanced: "bg-violet-500", Expert: "bg-orange-500",
};
const TYPE_STYLES = {
  manual:        { bg: "bg-violet-100 dark:bg-violet-900/50", text: "text-violet-700 dark:text-violet-300", label: "📝 Post" },
  github:        { bg: "bg-blue-100 dark:bg-blue-900/50",     text: "text-blue-700 dark:text-blue-300",     label: "🐙 GitHub" },
  hackerrank:    { bg: "bg-green-100 dark:bg-green-900/50",   text: "text-green-700 dark:text-green-300",   label: "🏅 HackerRank" },
  certification: { bg: "bg-orange-100 dark:bg-orange-900/50", text: "text-orange-700 dark:text-orange-300", label: "🎓 Certificate" },
};

function timeAgo(date) {
  const d = Math.floor((Date.now() - new Date(date)) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
}

function Avatar({ name = "?", size = "md", extra = "" }) {
  const sz = { xs:"w-6 h-6 text-xs", sm:"w-8 h-8 text-xs", md:"w-10 h-10 text-sm", lg:"w-14 h-14 text-xl", xl:"w-20 h-20 text-3xl" };
  const colors = ["from-violet-500 to-purple-600","from-blue-500 to-cyan-500","from-pink-500 to-rose-500","from-green-500 to-emerald-500","from-orange-500 to-amber-500"];
  const c = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`${sz[size]} rounded-full bg-gradient-to-br ${c} flex items-center justify-center font-bold text-white shrink-0 ${extra}`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

// ── SLIDE PROFILE PANEL ──
function ProfilePanel({ profileUser, currentUser, onClose, dark }) {
  const [tab, setTab] = useState("posts");
  const [data, setData] = useState({ posts:[], skills:[], projects:[], certs:[] });
  const [followData, setFollowData] = useState({ followers:0, following:0, isFollowing:false });
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);

  // Skills form
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [skillForm, setSkillForm] = useState({ name:"", level:"Beginner" });
  // HackerRank
  const [hrUsername, setHrUsername] = useState("");
  const [hrData, setHrData] = useState(null);
  const [hrLoading, setHrLoading] = useState(false);
  const [hrSelected, setHrSelected] = useState({ certs:[], badges:[] });
  // Project form
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [ghUsername, setGhUsername] = useState("");
  const [ghRepos, setGhRepos] = useState([]);
  const [ghUser, setGhUser] = useState(null);
  const [ghLoading, setGhLoading] = useState(false);
  // Cert form
  const [showCertForm, setShowCertForm] = useState(false);
  const [certForm, setCertForm] = useState({ title:"", issuer:"", issueDate:"", credentialUrl:"", credentialId:"" });
  // Post form
  const [showPostForm, setShowPostForm] = useState(false);
  const [postForm, setPostForm] = useState({ title:"", description:"", link:"" });
  const [msg, setMsg] = useState("");

  const isOwn = currentUser?.id === profileUser?.id || currentUser?.username === profileUser?.username;
  const th = {
    panel: dark ? "bg-gray-900 text-white" : "bg-white text-gray-900",
    sub: dark ? "text-gray-400" : "text-gray-500",
    card: dark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200",
    inp: dark ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-violet-500" : "bg-gray-50 border-gray-300 text-gray-900 focus:border-violet-500",
    tab: dark ? "border-gray-700" : "border-gray-200",
    btn: dark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600",
  };

  const showMsg = (t) => { setMsg(t); setTimeout(() => setMsg(""), 3000); };

  useEffect(() => {
    if (!profileUser) return;
    fetchProfileData();
    fetchFollowData();
  }, [profileUser]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      if (isOwn) {
        const [s, p, c, po] = await Promise.all([
          fetch("/api/skills").then(r => r.json()),
          fetch("/api/projects").then(r => r.json()),
          fetch("/api/certifications").then(r => r.json()),
          fetch("/api/posts").then(r => r.json()),
        ]);
        setData({ skills: s.skills||[], projects: p.projects||[], certs: c.certifications||[], posts: po.posts||[] });
      } else {
        const res = await fetch(`/api/posts/feed?username=${profileUser.username}`);
        const d = await res.json();
        setData(prev => ({ ...prev, posts: d.posts||[] }));
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const fetchFollowData = async () => {
    if (!profileUser?.id) return;
    const res = await fetch(`/api/follow?userId=${profileUser.id}`);
    const d = await res.json();
    if (res.ok) setFollowData(d);
  };

  const handleFollow = async () => {
    setFollowing(true);
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ targetUserId: profileUser.id }),
    });
    const d = await res.json();
    if (res.ok) {
      setFollowData(prev => ({
        ...prev,
        isFollowing: d.isFollowing,
        followers: d.isFollowing ? prev.followers + 1 : prev.followers - 1,
      }));
    }
    setFollowing(false);
  };

  // ── Skills ──
  const addSkill = async () => {
    if (!skillForm.name) return;
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(skillForm),
    });
    const d = await res.json();
    if (res.ok) { setData(prev => ({ ...prev, skills: d.skills })); setSkillForm({ name:"", level:"Beginner" }); setShowSkillForm(false); showMsg("Skill added! +10 XP ⚡"); }
    else showMsg(d.error);
  };

  const deleteSkill = async (skillId) => {
    const res = await fetch("/api/skills", { method:"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ skillId }) });
    const d = await res.json();
    if (res.ok) setData(prev => ({ ...prev, skills: d.skills }));
  };

  // ── GitHub ──
  const fetchGhRepos = async () => {
    if (!ghUsername) return;
    setGhLoading(true);
    const res = await fetch(`/api/github?username=${ghUsername}`);
    const d = await res.json();
    if (res.ok) { setGhUser(d.user); setGhRepos(d.repos); }
    else showMsg(d.error);
    setGhLoading(false);
  };

  const importRepo = async (repo) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...repo, source: "github" }),
    });
    const d = await res.json();
    if (res.ok) { setData(prev => ({ ...prev, projects: d.projects })); showMsg(`"${repo.title}" added! +20 XP 🎉`); }
    else showMsg(d.error);
  };

  const deleteProject = async (projectId) => {
    const res = await fetch("/api/projects", { method:"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ projectId }) });
    const d = await res.json();
    if (res.ok) setData(prev => ({ ...prev, projects: d.projects }));
  };

  // ── Certifications ──
  const addCert = async () => {
    if (!certForm.title || !certForm.issuer) return;
    const res = await fetch("/api/certifications", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(certForm) });
    const d = await res.json();
    if (res.ok) { setData(prev => ({ ...prev, certs: d.certifications })); setCertForm({ title:"", issuer:"", issueDate:"", credentialUrl:"", credentialId:"" }); setShowCertForm(false); showMsg("Cert added! +30 XP 🏅"); }
    else showMsg(d.error);
  };

  const deleteCert = async (certId) => {
    const res = await fetch("/api/certifications", { method:"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ certId }) });
    const d = await res.json();
    if (res.ok) setData(prev => ({ ...prev, certs: d.certifications }));
  };

  // ── HackerRank ──
  const fetchHR = async () => {
    if (!hrUsername) return;
    setHrLoading(true); setHrData(null);
    const res = await fetch(`/api/hackerrank?username=${hrUsername}`);
    const d = await res.json();
    if (res.ok) { setHrData(d); setHrSelected({ certs:[], badges:[] }); }
    else showMsg(d.error);
    setHrLoading(false);
  };

  const toggleHrCert = (cert) => {
    setHrSelected(prev => {
      const exists = prev.certs.find(c => c.slug === cert.slug);
      return { ...prev, certs: exists ? prev.certs.filter(c => c.slug !== cert.slug) : [...prev.certs, cert] };
    });
  };

  const toggleHrBadge = (badge) => {
    setHrSelected(prev => {
      const exists = prev.badges.find(b => b.name === badge.name);
      return { ...prev, badges: exists ? prev.badges.filter(b => b.name !== badge.name) : [...prev.badges, badge] };
    });
  };

  const importHR = async () => {
    const res = await fetch("/api/hackerrank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ certificates: hrSelected.certs, badges: hrSelected.badges, hackerrankUsername: hrUsername }),
    });
    const d = await res.json();
    if (res.ok) { showMsg(d.message); setHrData(null); setHrUsername(""); fetchProfileData(); }
    else showMsg(d.error);
  };

  // ── Post ──
  const createPost = async () => {
    if (!postForm.title) return;
    const res = await fetch("/api/posts", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ ...postForm, type:"manual" }) });
    const d = await res.json();
    if (res.ok) { setData(prev => ({ ...prev, posts: [d.post, ...prev.posts] })); setPostForm({ title:"", description:"", link:"" }); setShowPostForm(false); showMsg("Posted! 🎉"); }
    else showMsg(d.error);
  };

  const inpClass = `w-full rounded-xl px-4 py-2.5 text-sm border outline-none transition-colors ${th.inp}`;

  return (
    <div className={`fixed inset-y-0 right-0 w-full sm:w-[480px] z-30 shadow-2xl flex flex-col transition-transform duration-300 ${th.panel}`}>
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 shrink-0">
        <button onClick={onClose} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${th.btn}`}>
          ✕
        </button>
        {isOwn && (
          <button onClick={() => { setShowPostForm(!showPostForm); setTab("posts"); }}
            className="bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-1.5 rounded-full font-semibold transition-colors">
            + Post
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Cover + Avatar */}
        <div className="h-24 bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 relative">
          <div className="absolute -bottom-8 left-5">
            <Avatar name={profileUser?.name || "?"} size="xl" extra="border-4 border-white dark:border-gray-900 shadow-xl" />
          </div>
        </div>

        <div className="pt-12 px-5 pb-4">
          {/* Name + Follow */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{profileUser?.name}</h2>
              <p className={`text-sm ${th.sub}`}>@{profileUser?.username}</p>
            </div>
            {!isOwn && currentUser && (
              <button onClick={handleFollow} disabled={following}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${followData.isFollowing ? `border ${dark ? "border-gray-600 text-gray-300 hover:bg-gray-800" : "border-gray-300 text-gray-600 hover:bg-gray-50"}` : "bg-violet-600 hover:bg-violet-700 text-white"}`}>
                {following ? "..." : followData.isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-5 mt-4">
            {[
              { label: "Followers", val: followData.followers },
              { label: "Following", val: followData.following },
              { label: "Skills", val: data.skills.length },
              { label: "Projects", val: data.projects.length },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="font-bold text-lg">{s.val}</div>
                <div className={`text-xs ${th.sub}`}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Toast */}
        {msg && <div className="mx-5 mb-3 bg-green-900 border border-green-600 text-green-200 px-4 py-2 rounded-xl text-sm">{msg}</div>}

        {/* Tabs */}
        <div className={`flex border-b ${th.tab} px-5`}>
          {(isOwn
            ? ["posts","skills","projects","certs","hackerrank"]
            : ["posts"]
          ).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 ${tab === t ? "border-violet-500 text-violet-500" : `border-transparent ${th.sub} hover:text-white`}`}>
              {t === "hackerrank" ? "HackerRank" : t}
            </button>
          ))}
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* ── POSTS TAB ── */}
              {tab === "posts" && (
                <div className="space-y-3">
                  {/* Create post form */}
                  {isOwn && showPostForm && (
                    <div className={`border rounded-xl p-4 mb-3 ${th.card}`}>
                      <div className="space-y-2">
                        <input className={inpClass} placeholder="What did you build or achieve?" value={postForm.title} onChange={e => setPostForm({...postForm, title:e.target.value})} />
                        <textarea className={`${inpClass} resize-none h-20`} placeholder="Tell your story..." value={postForm.description} onChange={e => setPostForm({...postForm, description:e.target.value})} />
                        <input className={inpClass} placeholder="🔗 Link (optional)" value={postForm.link} onChange={e => setPostForm({...postForm, link:e.target.value})} />
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => setShowPostForm(false)} className={`px-4 py-2 rounded-lg text-sm ${th.btn}`}>Cancel</button>
                          <button onClick={createPost} disabled={!postForm.title} className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">Post</button>
                        </div>
                      </div>
                    </div>
                  )}
                  {data.posts.length === 0 ? (
                    <p className={`text-center py-10 ${th.sub}`}>No posts yet</p>
                  ) : data.posts.map((p, i) => (
                    <div key={i} className={`border rounded-xl p-4 ${th.card}`}>
                      <div className="flex justify-between items-start mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_STYLES[p.type]?.bg} ${TYPE_STYLES[p.type]?.text}`}>
                          {TYPE_STYLES[p.type]?.label}
                        </span>
                        <span className={`text-xs ${th.sub}`}>{timeAgo(p.createdAt)}</span>
                      </div>
                      <p className="font-semibold text-sm mt-1">{p.title}</p>
                      {p.description && <p className={`text-xs mt-1 ${th.sub}`}>{p.description}</p>}
                      {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="text-xs text-violet-400 hover:underline mt-1 block truncate">🔗 {p.link}</a>}
                    </div>
                  ))}
                </div>
              )}

              {/* ── SKILLS TAB ── */}
              {tab === "skills" && isOwn && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Skills ({data.skills.length})</h3>
                    <button onClick={() => setShowSkillForm(!showSkillForm)} className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-3 py-1.5 rounded-lg">
                      {showSkillForm ? "Cancel" : "+ Add"}
                    </button>
                  </div>
                  {showSkillForm && (
                    <div className={`border rounded-xl p-4 mb-3 ${th.card}`}>
                      <div className="space-y-2">
                        <input className={inpClass} placeholder="Skill name (e.g. React, Python)" value={skillForm.name} onChange={e => setSkillForm({...skillForm, name:e.target.value})} />
                        <select className={inpClass} value={skillForm.level} onChange={e => setSkillForm({...skillForm, level:e.target.value})}>
                          {LEVELS.map(l => <option key={l}>{l}</option>)}
                        </select>
                        <button onClick={addSkill} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2 rounded-lg text-sm font-semibold">Add Skill (+10 XP)</button>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {data.skills.map((s, i) => (
                      <div key={i} className={`border rounded-xl p-3 flex items-center justify-between ${th.card}`}>
                        <div>
                          <p className="font-medium text-sm">{s.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full text-white ${LEVEL_COLORS[s.level]}`}>{s.level}</span>
                        </div>
                        <button onClick={() => deleteSkill(s._id)} className={`text-sm hover:text-red-400 transition-colors ${th.sub}`}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── PROJECTS TAB ── */}
              {tab === "projects" && isOwn && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Projects ({data.projects.length})</h3>
                    <button onClick={() => setShowProjectForm(!showProjectForm)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded-lg">
                      {showProjectForm ? "Cancel" : "⬇ GitHub"}
                    </button>
                  </div>
                  {showProjectForm && (
                    <div className={`border rounded-xl p-4 mb-3 ${th.card}`}>
                      <div className="flex gap-2 mb-3">
                        <input className={`flex-1 rounded-xl px-3 py-2 text-sm border outline-none ${th.inp}`} placeholder="GitHub username" value={ghUsername} onChange={e => setGhUsername(e.target.value)} onKeyDown={e => e.key==="Enter" && fetchGhRepos()} />
                        <button onClick={fetchGhRepos} disabled={ghLoading || !ghUsername} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
                          {ghLoading ? "..." : "Fetch"}
                        </button>
                      </div>
                      {ghUser && (
                        <div className="flex items-center gap-2 mb-3 p-2 bg-gray-800 rounded-lg">
                          <img src={ghUser.avatar} alt="" className="w-8 h-8 rounded-full" />
                          <div>
                            <p className="text-sm font-semibold">{ghUser.name}</p>
                            <p className="text-xs text-gray-400">{ghUser.publicRepos} repos</p>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {ghRepos.map(repo => {
                          const added = data.projects.some(p => p.githubUrl === repo.githubUrl);
                          return (
                            <div key={repo.id} className="flex items-center justify-between bg-gray-800 rounded-lg p-2.5 gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{repo.title}</p>
                                <p className="text-xs text-gray-400 truncate">{repo.description}</p>
                                <div className="flex gap-1 mt-1">
                                  {repo.techStack[0] && <span className="bg-blue-900 text-blue-300 text-xs px-1.5 py-0.5 rounded">{repo.techStack[0]}</span>}
                                  <span className="text-gray-500 text-xs">⭐ {repo.stars}</span>
                                </div>
                              </div>
                              <button onClick={() => importRepo(repo)} disabled={added}
                                className={`text-xs px-3 py-1.5 rounded-lg shrink-0 ${added ? "bg-gray-700 text-gray-500" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                                {added ? "✓" : "+ Add"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className="space-y-2">
                    {data.projects.map((p, i) => (
                      <div key={i} className={`border rounded-xl p-4 ${th.card}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm">{p.title}</p>
                              {p.source === "github" && <span className="text-xs bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded-full">GitHub</span>}
                            </div>
                            <p className={`text-xs mt-1 ${th.sub}`}>{p.description}</p>
                            {p.techStack?.length > 0 && (
                              <div className="flex gap-1 flex-wrap mt-2">
                                {p.techStack.map((t, ti) => <span key={ti} className="bg-blue-900 text-blue-300 text-xs px-1.5 py-0.5 rounded">{t}</span>)}
                              </div>
                            )}
                            {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-400 hover:underline mt-1 block">🔗 GitHub</a>}
                          </div>
                          <button onClick={() => deleteProject(p._id)} className={`text-sm hover:text-red-400 ml-2 ${th.sub}`}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CERTS TAB ── */}
              {tab === "certs" && isOwn && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Certifications ({data.certs.length})</h3>
                    <button onClick={() => setShowCertForm(!showCertForm)} className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg">
                      {showCertForm ? "Cancel" : "+ Add"}
                    </button>
                  </div>
                  {showCertForm && (
                    <div className={`border rounded-xl p-4 mb-3 ${th.card}`}>
                      <div className="space-y-2">
                        <input className={inpClass} placeholder="Certificate title" value={certForm.title} onChange={e => setCertForm({...certForm, title:e.target.value})} />
                        <input className={inpClass} placeholder="Issuer (e.g. Google, Coursera)" value={certForm.issuer} onChange={e => setCertForm({...certForm, issuer:e.target.value})} />
                        <input className={inpClass} type="date" value={certForm.issueDate} onChange={e => setCertForm({...certForm, issueDate:e.target.value})} />
                        <input className={inpClass} placeholder="Credential ID (optional)" value={certForm.credentialId} onChange={e => setCertForm({...certForm, credentialId:e.target.value})} />
                        <input className={inpClass} placeholder="Certificate URL (optional)" value={certForm.credentialUrl} onChange={e => setCertForm({...certForm, credentialUrl:e.target.value})} />
                        <button onClick={addCert} className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold">Add Cert (+30 XP)</button>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2">
                    {data.certs.map((c, i) => (
                      <div key={i} className={`border rounded-xl p-3 flex justify-between items-start ${th.card}`}>
                        <div>
                          <p className="font-semibold text-sm">{c.title}</p>
                          <p className="text-green-400 text-xs">{c.issuer}</p>
                          {c.issueDate && <p className={`text-xs ${th.sub}`}>📅 {new Date(c.issueDate).toLocaleDateString()}</p>}
                          {c.credentialUrl && <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-400 hover:underline">🔗 View</a>}
                        </div>
                        <button onClick={() => deleteCert(c._id)} className={`text-sm hover:text-red-400 ml-2 ${th.sub}`}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── HACKERRANK TAB ── */}
              {tab === "hackerrank" && isOwn && (
                <div>
                  <div className={`border rounded-xl p-4 mb-4 ${th.card}`}>
                    <p className="text-sm font-semibold mb-3">🏅 Connect HackerRank Profile</p>
                    <div className="flex gap-2">
                      <input className={`flex-1 rounded-xl px-3 py-2 text-sm border outline-none ${th.inp}`} placeholder="Your HackerRank username" value={hrUsername} onChange={e => setHrUsername(e.target.value)} onKeyDown={e => e.key==="Enter" && fetchHR()} />
                      <button onClick={fetchHR} disabled={hrLoading || !hrUsername} className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold disabled:opacity-50">
                        {hrLoading ? "..." : "Fetch"}
                      </button>
                    </div>
                  </div>

                  {hrData && (
                    <div className="space-y-4">
                      {/* Profile header */}
                      <div className={`border rounded-xl p-4 flex items-center gap-3 ${th.card}`}>
                        {hrData.avatar ? <img src={hrData.avatar} alt="" className="w-12 h-12 rounded-full border-2 border-green-500" /> : <Avatar name={hrData.displayName} size="lg" />}
                        <div>
                          <p className="font-bold">{hrData.displayName}</p>
                          <p className={`text-xs ${th.sub}`}>@{hrData.username}</p>
                          {hrData.country && <p className={`text-xs ${th.sub}`}>🌍 {hrData.country}</p>}
                          {hrData.school && <p className={`text-xs ${th.sub}`}>🎓 {hrData.school}</p>}
                        </div>
                      </div>

                      {/* Badges */}
                      {hrData.badges?.length > 0 && (
                        <div>
                          <p className="font-semibold text-sm mb-2">⭐ Language Badges (select to import as skills)</p>
                          <div className="grid grid-cols-2 gap-2">
                            {hrData.badges.map((b, i) => {
                              const sel = hrSelected.badges.find(x => x.name === b.name);
                              return (
                                <button key={i} onClick={() => toggleHrBadge(b)}
                                  className={`border rounded-xl p-3 text-left transition-colors ${sel ? "border-green-500 bg-green-900/30" : dark ? "border-gray-700 bg-gray-800 hover:border-green-600" : "border-gray-200 bg-gray-50 hover:border-green-400"}`}>
                                  <p className="font-semibold text-sm capitalize">{b.name}</p>
                                  <div className="flex gap-0.5 mt-1">
                                    {[...Array(5)].map((_, si) => (
                                      <span key={si} className={`text-sm ${si < b.stars ? "text-yellow-400" : "text-gray-600"}`}>★</span>
                                    ))}
                                  </div>
                                  <p className={`text-xs mt-0.5 ${th.sub}`}>{b.stars}/{b.totalStars} stars</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Certificates */}
                      {hrData.certificates?.length > 0 && (
                        <div>
                          <p className="font-semibold text-sm mb-2">🏅 Certificates (select to import)</p>
                          <div className="space-y-2">
                            {hrData.certificates.map((c, i) => {
                              const sel = hrSelected.certs.find(x => x.slug === c.slug);
                              const name = c.name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                              return (
                                <button key={i} onClick={() => toggleHrCert(c)}
                                  className={`w-full border rounded-xl p-3 text-left transition-colors ${sel ? "border-green-500 bg-green-900/30" : dark ? "border-gray-700 bg-gray-800 hover:border-green-600" : "border-gray-200 bg-gray-50 hover:border-green-400"}`}>
                                  <p className="font-semibold text-sm">🏅 {name}</p>
                                  <p className={`text-xs ${th.sub}`}>HackerRank Verified</p>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* No data */}
                      {hrData.badges?.length === 0 && hrData.certificates?.length === 0 && (
                        <div className={`text-center py-8 ${th.sub}`}>
                          <p>No badges or certificates found on this profile.</p>
                          <p className="text-xs mt-1">Make sure the username is correct and profile is public.</p>
                        </div>
                      )}

                      {/* Import button */}
                      {(hrSelected.certs.length > 0 || hrSelected.badges.length > 0) && (
                        <button onClick={importHR}
                          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold text-sm transition-colors">
                          ✅ Import {hrSelected.certs.length + hrSelected.badges.length} selected items
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── MAIN HOME PAGE ──
export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("manual"); // ← CHANGED FROM "all" TO "manual"
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [dark, setDark] = useState(true);
  const [sharing, setSharing] = useState(null);
  const [msg, setMsg] = useState({ type:"", text:"" });

  // Profile panel
  const [panelUser, setPanelUser] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  // Create post
  const [showCreate, setShowCreate] = useState(false);
  const [postForm, setPostForm] = useState({ title:"", description:"", link:"" });
  const [posting, setPosting] = useState(false);

  const showMsg = (type, text) => { setMsg({type,text}); setTimeout(() => setMsg({type:"",text:""}), 3000); };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    setUser(JSON.parse(stored));
    const t = localStorage.getItem("theme");
    if (t) setDark(t === "dark");
    fetchFeed(1, "manual"); // ← CHANGED FROM "all" TO "manual"
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", dark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const fetchFeed = async (pg = 1, type = filter) => {
    if (pg === 1) setLoading(true);
    const res = await fetch(`/api/posts/feed?page=${pg}&type=${type}`);
    const d = await res.json();
    setPosts(pg === 1 ? (d.posts||[]) : prev => [...prev, ...(d.posts||[])]);
    setHasMore(d.hasMore || false);
    setPage(pg);
    setLoading(false);
  };

  const openProfile = (postUser) => {
    setPanelUser(postUser);
    setShowPanel(true);
  };

  const openOwnProfile = () => {
    if (!user) return;
    setPanelUser({ id: user.id, name: user.name, username: user.username });
    setShowPanel(true);
  };

  const handleShare = async (postId) => {
    setSharing(postId);
    const res = await fetch("/api/posts/share", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ postId }) });
    const d = await res.json();
    if (res.ok) { showMsg("success","Shared! 🔁"); fetchFeed(1, filter); }
    else showMsg("error", d.error);
    setSharing(null);
  };

  const handleCreatePost = async () => {
    if (!postForm.title.trim()) return;
    setPosting(true);
    const res = await fetch("/api/posts", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ ...postForm, type:"manual" }) });
    const d = await res.json();
    if (res.ok) { setPostForm({title:"",description:"",link:""}); setShowCreate(false); showMsg("success","Posted! 🎉"); fetchFeed(1, filter); }
    else showMsg("error", d.error);
    setPosting(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method:"POST" });
    localStorage.removeItem("user");
    router.push("/login");
  };

  const th = {
    page:    dark ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-900",
    nav:     dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200",
    card:    dark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-200",
    inp:     dark ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-violet-500" : "bg-gray-50 border-gray-300 text-gray-900 focus:border-violet-500",
    sub:     dark ? "text-gray-400" : "text-gray-500",
    btn:     dark ? "bg-gray-800 hover:bg-gray-700 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600",
    divider: dark ? "border-gray-800" : "border-gray-100",
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${th.page}`}>

      {/* Navbar */}
      <nav className={`border-b ${th.nav} px-4 py-3 sticky top-0 z-20 shadow-sm`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <span className="text-xl font-black bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent shrink-0">
            SkillVault<span className="text-violet-400">TN</span>
          </span>

          {/* Search */}
          <div className={`hidden md:flex flex-1 max-w-xs items-center gap-2 rounded-full px-4 py-2 text-sm ${dark ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-400"}`}>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"/>
            </svg>
            <span>Search people, skills...</span>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            <button onClick={() => setDark(!dark)} className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-colors ${th.btn}`}>
              {dark ? "☀️" : "🌙"}
            </button>

            {/* ━━━ NEW AI BUTTONS ━━━ */}
            <button
              onClick={() => router.push("/ai-assistant")}
              className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-2 rounded-lg transition-colors hidden sm:block"
            >
              🤖 AI Coach
            </button>

            <button
              onClick={() => router.push("/assessments")}
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-3 py-2 rounded-lg transition-colors hidden sm:block"
            >
              📝 Assessments
            </button>

            <button
              onClick={() => router.push("/profile")}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded-lg transition-colors hidden sm:block"
            >
              👤 Profile
            </button>

            {/* Mobile dropdown menu */}
            <div className="sm:hidden flex gap-1">
              <button
                onClick={() => router.push("/ai-assistant")}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-2 rounded-lg transition-colors"
                title="AI Assistant"
              >
                🤖
              </button>
              <button
                onClick={() => router.push("/assessments")}
                className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-2 py-2 rounded-lg transition-colors"
                title="Assessments"
              >
                📝
              </button>
            </div>

            {user ? (
              <>
                <button onClick={openOwnProfile} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar name={user.name} size="sm" />
                  <span className={`text-sm font-medium hidden sm:block ${dark ? "text-gray-300" : "text-gray-700"}`}>{user.name.split(" ")[0]}</span>
                </button>
                <button onClick={handleLogout} className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${th.btn}`}>
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/login" className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-semibold">Sign in</Link>
            )}
          </div>
        </div>
      </nav>

      {/* Toast */}
      {msg.text && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-xl border ${msg.type === "success" ? "bg-green-900 border-green-700 text-green-200" : "bg-red-900 border-red-700 text-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Overlay */}
      {showPanel && <div className="fixed inset-0 bg-black/50 z-20 backdrop-blur-sm" onClick={() => setShowPanel(false)} />}

      {/* Slide Profile Panel */}
      {showPanel && (
        <ProfilePanel
          profileUser={panelUser}
          currentUser={user}
          onClose={() => setShowPanel(false)}
          dark={dark}
        />
      )}

      {/* Main Layout */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Filter tabs */}
        <div className={`border rounded-2xl p-3 flex gap-2 overflow-x-auto shadow-sm ${th.card}`}>
          {[
            { k:"all", l:"🌍 All" },
            { k:"manual", l:"📝 Posts" },
            { k:"github", l:"🐙 GitHub" },
            { k:"hackerrank", l:"🏅 HackerRank" },
            { k:"certification", l:"🎓 Certs" },
          ].map(f => (
            <button key={f.k} onClick={() => { setFilter(f.k); fetchFeed(1, f.k); }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${filter === f.k ? "bg-violet-600 text-white" : th.btn}`}>
              {f.l}
            </button>
          ))}
        </div>

        {/* Create Post Box */}
        {user && (
          <div className={`border rounded-2xl p-4 shadow-sm ${th.card}`}>
            {!showCreate ? (
              <div className="flex items-center gap-3">
                <Avatar name={user.name} size="md" />
                <button onClick={() => setShowCreate(true)}
                  className={`flex-1 text-left rounded-full border px-4 py-2.5 text-sm transition-colors ${dark ? "border-gray-700 text-gray-500 hover:bg-gray-800" : "border-gray-300 text-gray-400 hover:bg-gray-50"}`}>
                  Share an achievement or update...
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={user.name} size="md" />
                  <div>
                    <p className="font-semibold text-sm">{user.name}</p>
                    <p className={`text-xs ${th.sub}`}>Post to feed</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <input className={`w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors ${th.inp}`} placeholder="What did you build or achieve?" value={postForm.title} onChange={e => setPostForm({...postForm,title:e.target.value})} />
                  <textarea className={`w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors resize-none h-20 ${th.inp}`} placeholder="Tell your story..." value={postForm.description} onChange={e => setPostForm({...postForm,description:e.target.value})} />
                  <input className={`w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors ${th.inp}`} placeholder="🔗 Link (optional)" value={postForm.link} onChange={e => setPostForm({...postForm,link:e.target.value})} />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setShowCreate(false)} className={`px-4 py-2 rounded-lg text-sm ${th.btn}`}>Cancel</button>
                    <button onClick={handleCreatePost} disabled={posting || !postForm.title.trim()} className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                      {posting ? "Posting..." : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feed Posts */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className={`text-sm ${th.sub}`}>Loading feed...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className={`border rounded-2xl p-16 text-center shadow-sm ${th.card}`}>
            <div className="text-5xl mb-4">📭</div>
            <p className="font-semibold mb-2">No posts yet</p>
            <p className={`text-sm ${th.sub}`}>Be the first to share an achievement!</p>
          </div>
        ) : (
          posts.map((post, i) => {
            const typeInfo = TYPE_STYLES[post.type] || TYPE_STYLES.manual;
            const isOwner = user?.id === post.userId?.toString();
            const hasShared = post.shares?.some(s => s.userId?.toString() === user?.id);

            return (
              <div key={i} className={`border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 ${th.card}`}>
                <div className="p-5 pb-0">
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => openProfile({ id: post.userId, name: post.userName, username: post.userUsername })}
                      className="flex items-start gap-3 text-left hover:opacity-80 transition-opacity"
                    >
                      <Avatar name={post.userName || "?"} size="md" />
                      <div>
                        <p className="font-semibold text-sm hover:text-violet-500 transition-colors">{post.userName}</p>
                        <p className={`text-xs ${th.sub}`}>@{post.userUsername}</p>
                        <p className={`text-xs ${th.sub}`}>{timeAgo(post.createdAt)}</p>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeInfo.bg} ${typeInfo.text}`}>
                        {typeInfo.label}
                      </span>
                      {isOwner && (
                        <button onClick={async () => {
                          await fetch("/api/posts", { method:"DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ postId: post._id }) });
                          setPosts(prev => prev.filter(p => p._id !== post._id));
                        }} className={`text-xs hover:text-red-400 transition-colors px-1 ${th.sub}`}>✕</button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4">
                  <h3 className="font-bold text-base mb-1">{post.title}</h3>
                  {post.description && <p className={`text-sm leading-relaxed ${th.sub}`}>{post.description}</p>}
                  {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {post.tags.map((t, ti) => (
                        <span key={ti} className={`text-xs px-2.5 py-1 rounded-full ${dark ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-600"}`}>#{t}</span>
                      ))}
                    </div>
                  )}
                  {post.link && (
                    <a href={post.link} target="_blank" rel="noreferrer"
                      className={`mt-3 flex items-center gap-2 border rounded-xl px-4 py-3 text-sm transition-colors group ${dark ? "border-gray-700 hover:border-violet-600 hover:bg-gray-800" : "border-gray-200 hover:border-violet-400 hover:bg-gray-50"}`}>
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs shrink-0">🔗</div>
                      <span className="text-violet-400 truncate text-xs">{post.link}</span>
                    </a>
                  )}
                </div>

                {post.shares?.length > 0 && (
                  <div className={`px-5 pb-2 text-xs ${th.sub}`}>🔁 {post.shares.length} {post.shares.length === 1 ? "person" : "people"} shared this</div>
                )}

                <div className={`mx-5 border-t ${th.divider}`} />
                <div className="px-5 py-3 flex items-center gap-2">
                  {!isOwner && user && (
                    <button onClick={() => handleShare(post._id)} disabled={sharing === post._id || hasShared}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${hasShared ? (dark ? "text-violet-400" : "text-violet-600") + " cursor-default" : th.btn}`}>
                      🔁 {sharing === post._id ? "..." : hasShared ? "Shared" : "Share"}
                    </button>
                  )}
                  <button
                    onClick={() => openProfile({ id: post.userId, name: post.userName, username: post.userUsername })}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${th.btn}`}>
                    👤 View Profile
                  </button>
                </div>
              </div>
            );
          })
        )}

        {hasMore && (
          <button onClick={() => fetchFeed(page + 1, filter)}
            className={`w-full py-3 rounded-xl text-sm font-medium transition-colors border ${dark ? "border-gray-800 hover:bg-gray-800 text-gray-400" : "border-gray-200 hover:bg-gray-50 text-gray-500"}`}>
            Load more...
          </button>
        )}
      </div>
    </div>
  );
}