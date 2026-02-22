"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const TABS = ["Overview", "Skills", "Projects", "Certifications", "HackerRank", "Posts", "Analytics"];
const LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"];
const LEVEL_COLORS = {
  Beginner: "from-green-500 to-emerald-600",
  Intermediate: "from-blue-500 to-cyan-600",
  Advanced: "from-violet-500 to-purple-600",
  Expert: "from-orange-500 to-amber-600",
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("Overview");
  const [loading, setLoading] = useState(true);

  // GitHub states — add these after your existing useState lines
const [githubUsername, setGithubUsername] = useState("");
const [githubRepos, setGithubRepos] = useState([]);
const [githubUser, setGithubUser] = useState(null);
const [githubLoading, setGithubLoading] = useState(false);
  // Data states
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certs, setCerts] = useState([]);
  const [xp, setXp] = useState(0);

  // Form states
  const [skillForm, setSkillForm] = useState({ name: "", level: "Beginner", proofLink: "" });
  const [projectForm, setProjectForm] = useState({ title: "", description: "", techStack: "", githubUrl: "", demoUrl: "" });
  const [certForm, setCertForm] = useState({ title: "", issuer: "", issueDate: "", credentialUrl: "", credentialId: "" });

  // UI states
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showCertForm, setShowCertForm] = useState(false);
// HackerRank states
const [hrCertId, setHrCertId] = useState("");
const [hrCertData, setHrCertData] = useState(null);
const [hrLoading, setHrLoading] = useState(false);
const [hrImporting, setHrImporting] = useState(false);

// Posts states
const [myPosts, setMyPosts] = useState([]);
const [postForm, setPostForm] = useState({ title: "", description: "", link: "" });
const [showPostForm, setShowPostForm] = useState(false);
const [posting, setPosting] = useState(false);
  // Show message helper
  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    setUser(JSON.parse(stored));
    fetchAllData();
  }, []);
const fetchAllData = async () => {
  try {
    const [s, p, c, posts] = await Promise.all([
      fetch("/api/skills").then(r => r.json()),
      fetch("/api/projects").then(r => r.json()),
      fetch("/api/certifications").then(r => r.json()),
      fetch("/api/posts").then(r => r.json()),      // ← add this
    ]);
    setSkills(s.skills || []);
    setProjects(p.projects || []);
    setCerts(c.certifications || []);
    setMyPosts(posts.posts || []);                   // ← add this
    setXp(s.xp || 0);
  } catch (err) {
    console.error("Fetch error:", err);
  } finally {
    setLoading(false);
  }
};
  // Add this function after fetchAllData()
const syncToFeed = async () => {
  const res = await fetch("/api/sync", { method: "POST" });
  const data = await res.json();
  if (res.ok) showMsg("success", data.message);
  else showMsg("error", data.error);
};
  // ── Skills ──
  const addSkill = async () => {
    if (!skillForm.name || !skillForm.level) return;
    setSubmitting(true);
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(skillForm),
    });
    const data = await res.json();
    if (res.ok) {
      setSkills(data.skills);
      setXp(data.xp);
      setSkillForm({ name: "", level: "Beginner", proofLink: "" });
      setShowSkillForm(false);
      showMsg("success", "Skill added! +10 XP 🎉");
    } else {
      showMsg("error", data.error);
    }
    setSubmitting(false);
  };

  const deleteSkill = async (skillId) => {
    const res = await fetch("/api/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skillId }),
    });
    const data = await res.json();
    if (res.ok) { setSkills(data.skills); setXp(data.xp); showMsg("success", "Skill removed"); }
  };

  // ── Projects ──
  const addProject = async () => {
    if (!projectForm.title || !projectForm.description) return;
    setSubmitting(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(projectForm),
    });
    const data = await res.json();
    if (res.ok) {
      setProjects(data.projects);
      setXp(data.xp);
      setProjectForm({ title: "", description: "", techStack: "", githubUrl: "", demoUrl: "" });
      setShowProjectForm(false);
      showMsg("success", "Project added! +20 XP 🎉");
    } else {
      showMsg("error", data.error);
    }
    setSubmitting(false);
  };

  const deleteProject = async (projectId) => {
    const res = await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    const data = await res.json();
    if (res.ok) { setProjects(data.projects); showMsg("success", "Project removed"); }
  };

  // ── Certifications ──
  const addCert = async () => {
    if (!certForm.title || !certForm.issuer) return;
    setSubmitting(true);
    const res = await fetch("/api/certifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(certForm),
    });
    const data = await res.json();
    if (res.ok) {
      setCerts(data.certifications);
      setXp(data.xp);
      setCertForm({ title: "", issuer: "", issueDate: "", credentialUrl: "", credentialId: "" });
      setShowCertForm(false);
      showMsg("success", "Certification added! +30 XP 🎉");
    } else {
      showMsg("error", data.error);
    }
    setSubmitting(false);
  };

  const deleteCert = async (certId) => {
    const res = await fetch("/api/certifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ certId }),
    });
    const data = await res.json();
    if (res.ok) { setCerts(data.certifications); showMsg("success", "Certification removed"); }
  };
// ── HackerRank ──
const verifyHRCert = async () => {
  if (!hrCertId.trim()) return;
  setHrLoading(true);
  setHrCertData(null);
  const res = await fetch(`/api/hackerrank?certId=${hrCertId.trim()}`);
  const data = await res.json();
  if (res.ok) setHrCertData(data);
  else showMsg("error", data.error);
  setHrLoading(false);
};

const importHRCert = async () => {
  if (!hrCertData) return;
  setHrImporting(true);
  const res = await fetch("/api/hackerrank", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      certId: hrCertData.certId,
      certName: hrCertData.certName,
      verifyUrl: hrCertData.verifyUrl,
    }),
  });
  const data = await res.json();
  if (res.ok) {
    setCerts(data.certification ? [...certs, data.certification] : certs);
    setXp(data.xp);
    setHrCertId("");
    setHrCertData(null);
    showMsg("success", "Certificate imported + post created! +30 XP 🎉");
  } else {
    showMsg("error", data.error);
  }
  setHrImporting(false);
};

// ── My Posts ──
const fetchMyPosts = async () => {
  const res = await fetch("/api/posts");
  const data = await res.json();
  if (res.ok) setMyPosts(data.posts || []);
};

const createPost = async () => {
  if (!postForm.title.trim()) return;
  setPosting(true);
  const res = await fetch("/api/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...postForm, type: "manual" }),
  });
  const data = await res.json();
  if (res.ok) {
    setMyPosts([data.post, ...myPosts]);
    setPostForm({ title: "", description: "", link: "" });
    setShowPostForm(false);
    showMsg("success", "Post published to feed! 🎉");
  } else {
    showMsg("error", data.error);
  }
  setPosting(false);
};
// ── GitHub Import ──
const fetchGithubRepos = async () => {
  if (!githubUsername) return;
  setGithubLoading(true);
  setGithubRepos([]);
  setGithubUser(null);

  const res = await fetch(`/api/github?username=${githubUsername}`);
  const data = await res.json();

  if (res.ok) {
    setGithubUser(data.user);
    setGithubRepos(data.repos);
  } else {
    showMsg("error", data.error || "GitHub user not found");
  }
  setGithubLoading(false);
};

const importGithubRepo = async (repo) => {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: repo.title,
      description: repo.description,
      techStack: repo.techStack,
      githubUrl: repo.githubUrl,
      demoUrl: repo.demoUrl,
      source: "github",
    }),
  });
  const data = await res.json();
  if (res.ok) {
    setProjects(data.projects);
    setXp(data.xp);
    showMsg("success", `"${repo.title}" imported! +20 XP 🎉`);
  } else {
    showMsg("error", data.error);
  }
};

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return null;

  // Analytics data
  const pieData = [
    { name: "Skills", value: skills.length, color: "#7c3aed" },
    { name: "Projects", value: projects.length, color: "#2563eb" },
    { name: "Certs", value: certs.length, color: "#059669" },
  ].filter(d => d.value > 0);

  const levelData = LEVELS.map(l => ({
    level: l, count: skills.filter(s => s.level === l).length
  }));

  const xpData = [
    { name: "Skills", xp: skills.length * 10 },
    { name: "Projects", xp: projects.length * 20 },
    { name: "Certs", xp: certs.length * 30 },
  ];

  // Input class
  const inp = "w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors";

  return (
    <div className="min-h-screen bg-gray-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 bg-gray-950 z-10">
        <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
          SkillStackTN
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm hidden sm:block">👋 {user.name}</span>
          <button
  onClick={() => router.push("/assessments")}
  className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-semibold"
>
  📝 Take Assessment
</button>
          <span className="bg-violet-900 text-violet-300 text-xs px-3 py-1 rounded-full font-semibold">
            ⚡ {xp} XP
          </span>
          <button onClick={handleLogout} className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors">
            Sign Out
          </button>
        </div>
      </nav>

      {/* Toast Message */}
      {msg.text && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${msg.type === "success" ? "bg-green-900 border border-green-500 text-green-200" : "bg-red-900 border border-red-500 text-red-200"}`}>
          {msg.text}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-6">

        {/* Welcome */}
        <div className="bg-gradient-to-r from-violet-900 to-pink-900 rounded-2xl p-5 mb-6 border border-violet-700">
          <h2 className="text-xl font-bold">Welcome back, {user.name}! 🚀</h2>
          <p className="text-violet-300 text-sm mt-1">@{user.username} · {skills.length} skills · {projects.length} projects · {certs.length} certifications</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Skills", value: skills.length, icon: "⚡", color: "from-violet-600 to-purple-600" },
            { label: "Projects", value: projects.length, icon: "📁", color: "from-blue-600 to-cyan-600" },
            { label: "Certifications", value: certs.length, icon: "🏅", color: "from-green-600 to-emerald-600" },
            { label: "XP Points", value: xp, icon: "🎯", color: "from-orange-600 to-amber-600" },
          ].map((s, i) => (
            <div key={i} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              <div className={`text-2xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</div>
              <div className="text-gray-400 text-sm mt-1">{s.icon} {s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-6">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === t ? "bg-violet-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === "Overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "Add a Skill", desc: "Track your technical skills", icon: "⚡", color: "border-violet-600 hover:bg-violet-950", action: () => setTab("Skills") },
              { title: "Add a Project", desc: "Showcase your work", icon: "📁", color: "border-blue-600 hover:bg-blue-950", action: () => setTab("Projects") },
              { title: "Add Certification", desc: "Record your certificates", icon: "🏅", color: "border-green-600 hover:bg-green-950", action: () => setTab("Certifications") },
            ].map((a, i) => (
              <button key={i} onClick={a.action} className={`bg-gray-900 border ${a.color} rounded-xl p-5 text-left transition-colors w-full`}>
                <div className="text-3xl mb-3">{a.icon}</div>
                <div className="font-semibold text-white">{a.title}</div>
                <div className="text-gray-400 text-sm mt-1">{a.desc}</div>
              </button>
            ))}
          </div>
        )}
{/* Sync button — add inside Overview tab */}
<button
  onClick={syncToFeed}
  className="w-full mt-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 py-3 rounded-xl text-sm font-medium transition-colors"
>
  🔄 Sync existing data to Feed
</button>
        {/* ── SKILLS TAB ── */}
        {tab === "Skills" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Your Skills ({skills.length})</h2>
              <button onClick={() => setShowSkillForm(!showSkillForm)} className="bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                {showSkillForm ? "Cancel" : "+ Add Skill"}
              </button>
            </div>

            {/* Add Skill Form */}
            {showSkillForm && (
              <div className="bg-gray-900 border border-violet-700 rounded-xl p-5 mb-5">
                <h3 className="font-semibold mb-4 text-violet-300">Add New Skill</h3>
                <div className="space-y-3">
                  <input className={inp} placeholder="Skill name (e.g. React, Python)" value={skillForm.name} onChange={e => setSkillForm({ ...skillForm, name: e.target.value })} />
                  <select className={inp} value={skillForm.level} onChange={e => setSkillForm({ ...skillForm, level: e.target.value })}>
                    {LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                  <input className={inp} placeholder="Proof link (optional — GitHub, certificate URL)" value={skillForm.proofLink} onChange={e => setSkillForm({ ...skillForm, proofLink: e.target.value })} />
                  <button onClick={addSkill} disabled={submitting} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors">
                    {submitting ? "Adding..." : "Add Skill (+10 XP)"}
                  </button>
                </div>
              </div>
            )}

            {/* Skills List */}
            {skills.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-3">⚡</div>
                <p>No skills added yet. Add your first skill!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {skills.map((s, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-white">{s.name}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-gradient-to-r ${LEVEL_COLORS[s.level]} text-white mt-1 inline-block`}>
                        {s.level}
                      </span>
                      {s.proofLink && (
                        <a href={s.proofLink} target="_blank" rel="noreferrer" className="block text-xs text-violet-400 hover:underline mt-1 truncate max-w-xs">
                          🔗 View Proof
                        </a>
                      )}
                    </div>
                    <button onClick={() => deleteSkill(s._id)} className="text-gray-600 hover:text-red-400 text-lg transition-colors ml-2">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PROJECTS TAB ── */}
        {tab === "Projects" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Your Projects ({projects.length})</h2>
              <button
                onClick={() => setShowProjectForm(!showProjectForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
              >
                {showProjectForm ? "Cancel" : "⬇ Import from GitHub"}
              </button>
            </div>

            {/* GitHub Import Form */}
            {showProjectForm && (
              <div className="bg-gray-900 border border-blue-700 rounded-xl p-5 mb-5">
                <h3 className="font-semibold mb-1 text-blue-300">
                  Import from GitHub
                </h3>
                <p className="text-gray-400 text-xs mb-4">
                  Enter your GitHub username to fetch all your public repositories.
                </p>

                {/* Username input */}
                <div className="flex gap-2 mb-4">
                  <input
                    className="flex-1 bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Enter GitHub username (e.g. torvalds)"
                    value={githubUsername}
                    onChange={e => setGithubUsername(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && fetchGithubRepos()}
                  />
                  <button
                    onClick={fetchGithubRepos}
                    disabled={githubLoading || !githubUsername}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {githubLoading ? "Fetching..." : "Fetch Repos"}
                  </button>
                </div>

                {/* GitHub user info */}
                {githubUser && (
                  <div className="flex items-center gap-3 mb-4 p-3 bg-gray-800 rounded-lg">
                    <img
                      src={githubUser.avatar}
                      alt="avatar"
                      className="w-10 h-10 rounded-full border-2 border-blue-500"
                    />
                    <div>
                      <div className="font-semibold text-white text-sm">{githubUser.name}</div>
                      <div className="text-gray-400 text-xs">{githubUser.publicRepos} public repos</div>
                      {githubUser.bio && <div className="text-gray-400 text-xs">{githubUser.bio}</div>}
                    </div>
                  </div>
                )}

                {/* Repos list */}
                {githubRepos.length > 0 && (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    <p className="text-gray-400 text-xs mb-2">
                      {githubRepos.length} repositories found. Click "+ Add" to import:
                    </p>
                    {githubRepos.map(repo => {
                      const alreadyAdded = projects.some(p => p.githubUrl === repo.githubUrl);
                      return (
                        <div
                          key={repo.id}
                          className="flex items-start justify-between bg-gray-800 rounded-lg p-3 gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white text-sm truncate">
                              {repo.title}
                            </div>
                            <div className="text-gray-400 text-xs mt-0.5 line-clamp-2">
                              {repo.description}
                            </div>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {repo.techStack[0] && (
                                <span className="bg-blue-900 text-blue-300 text-xs px-2 py-0.5 rounded-md">
                                  {repo.techStack[0]}
                                </span>
                              )}
                              {repo.topics.slice(0, 2).map((t, i) => (
                                <span key={i} className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-md">
                                  {t}
                                </span>
                              ))}
                              <span className="text-gray-500 text-xs">⭐ {repo.stars}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => importGithubRepo(repo)}
                            disabled={alreadyAdded}
                            className={`text-xs px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap shrink-0 transition-colors ${
                              alreadyAdded
                                ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                          >
                            {alreadyAdded ? "✓ Added" : "+ Add"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Projects List */}
            {projects.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-3">📁</div>
                <p>No projects yet. Import from GitHub!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((p, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-base">{p.title}</h3>
                        {p.source === "github" && (
                          <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
                            GitHub
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => deleteProject(p._id)}
                        className="text-gray-600 hover:text-red-400 text-lg transition-colors ml-2"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{p.description}</p>
                    {p.techStack?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {p.techStack.map((t, ti) => (
                          <span key={ti} className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-3 mt-3">
                      {p.githubUrl && (
                        <a href={p.githubUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-400 hover:underline">
                          🔗 GitHub
                        </a>
                      )}
                      {p.demoUrl && (
                        <a href={p.demoUrl} target="_blank" rel="noreferrer" className="text-xs text-green-400 hover:underline">
                          🌐 Live Demo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* ── CERTIFICATIONS TAB ── */}
        {tab === "Certifications" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Your Certifications ({certs.length})</h2>
              <button onClick={() => setShowCertForm(!showCertForm)} className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                {showCertForm ? "Cancel" : "+ Add Certification"}
              </button>
            </div>

            {/* Add Cert Form */}
            {showCertForm && (
              <div className="bg-gray-900 border border-green-700 rounded-xl p-5 mb-5">
                <h3 className="font-semibold mb-4 text-green-300">Add New Certification</h3>
                <div className="space-y-3">
                  <input className={inp} placeholder="Certification title (e.g. AWS Cloud Practitioner)" value={certForm.title} onChange={e => setCertForm({ ...certForm, title: e.target.value })} />
                  <input className={inp} placeholder="Issuer (e.g. Amazon, Google, Coursera)" value={certForm.issuer} onChange={e => setCertForm({ ...certForm, issuer: e.target.value })} />
                  <input className={inp} type="date" value={certForm.issueDate} onChange={e => setCertForm({ ...certForm, issueDate: e.target.value })} />
                  <input className={inp} placeholder="Credential ID (optional)" value={certForm.credentialId} onChange={e => setCertForm({ ...certForm, credentialId: e.target.value })} />
                  <input className={inp} placeholder="Certificate URL (optional)" value={certForm.credentialUrl} onChange={e => setCertForm({ ...certForm, credentialUrl: e.target.value })} />
                  <button onClick={addCert} disabled={submitting} className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors">
                    {submitting ? "Adding..." : "Add Certification (+30 XP)"}
                  </button>
                </div>
              </div>
            )}

            {/* Certs List */}
            {certs.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-3">🏅</div>
                <p>No certifications yet. Add your certificates!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {certs.map((c, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-white">{c.title}</div>
                        <div className="text-green-400 text-sm mt-0.5">{c.issuer}</div>
                        {c.issueDate && (
                          <div className="text-gray-500 text-xs mt-1">
                            📅 {new Date(c.issueDate).toLocaleDateString()}
                          </div>
                        )}
                        {c.credentialId && <div className="text-gray-500 text-xs">ID: {c.credentialId}</div>}
                        {c.credentialUrl && (
                          <a href={c.credentialUrl} target="_blank" rel="noreferrer" className="text-xs text-violet-400 hover:underline mt-1 block">
                            🔗 View Certificate
                          </a>
                        )}
                      </div>
                      <button onClick={() => deleteCert(c._id)} className="text-gray-600 hover:text-red-400 text-lg transition-colors ml-2">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
{/* ── HACKERRANK TAB ── */}
        {tab === "HackerRank" && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-bold">HackerRank Certificates</h2>
              <p className="text-gray-400 text-sm mt-1">
                Paste your HackerRank Certificate ID to verify and auto-import it.
              </p>
            </div>

            {/* How to find cert ID */}
            <div className="bg-blue-950 border border-blue-700 rounded-xl p-4 mb-5 text-sm">
              <p className="text-blue-300 font-semibold mb-2">📋 How to find your Certificate ID:</p>
              <ol className="text-gray-300 space-y-1 text-xs list-decimal list-inside">
                <li>Go to hackerrank.com and log in</li>
                <li>Click your profile → "Certificates"</li>
                <li>Click on any certificate you earned</li>
                <li>The URL will be: hackerrank.com/certificates/<span className="text-yellow-300">THIS-IS-YOUR-ID</span></li>
                <li>Copy that ID and paste it below</li>
              </ol>
            </div>

            {/* Cert ID Input */}
            <div className="bg-gray-900 border border-green-700 rounded-xl p-5 mb-5">
              <h3 className="font-semibold text-green-300 mb-3">Verify Certificate</h3>
              <div className="flex gap-2 mb-4">
                <input
                  className="flex-1 bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-green-500 transition-colors"
                  placeholder="Paste certificate ID here..."
                  value={hrCertId}
                  onChange={e => setHrCertId(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && verifyHRCert()}
                />
                <button
                  onClick={verifyHRCert}
                  disabled={hrLoading || !hrCertId.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {hrLoading ? "Verifying..." : "Verify"}
                </button>
              </div>

              {/* Verified cert preview */}
              {hrCertData && (
                <div className="bg-green-950 border border-green-600 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">🏅</div>
                    <div className="flex-1">
                      <div className="font-bold text-white">{hrCertData.certName}</div>
                      <div className="text-green-400 text-sm">Issued by HackerRank</div>
                      {hrCertData.holderName && (
                        <div className="text-gray-400 text-xs mt-0.5">
                          Holder: {hrCertData.holderName}
                        </div>
                      )}
                      <a
                        href={hrCertData.verifyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-violet-400 hover:underline mt-1 block"
                      >
                        🔗 View on HackerRank
                      </a>
                    </div>
                  </div>
                  <button
                    onClick={importHRCert}
                    disabled={hrImporting}
                    className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors"
                  >
                    {hrImporting ? "Importing..." : "✅ Import Certificate + Create Post (+30 XP)"}
                  </button>
                </div>
              )}
            </div>

            {/* Already imported HackerRank certs */}
            {certs.filter(c => c.issuer === "HackerRank").length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-300 mb-3">
                  Imported HackerRank Certificates ({certs.filter(c => c.issuer === "HackerRank").length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {certs.filter(c => c.issuer === "HackerRank").map((c, i) => (
                    <div key={i} className="bg-gray-900 border border-green-800 rounded-xl p-4">
                      <div className="font-bold text-white text-sm">{c.title}</div>
                      <div className="text-green-400 text-xs mt-0.5">HackerRank ✓</div>
                      {c.credentialUrl && (
                        <a href={c.credentialUrl} target="_blank" rel="noreferrer"
                          className="text-xs text-violet-400 hover:underline mt-1 block">
                          🔗 Verify Certificate
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── POSTS TAB ── */}
        {tab === "Posts" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Your Posts ({myPosts.length})</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => router.push("/feed")}
                  className="bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  🌍 View Feed
                </button>
                <button
                  onClick={() => setShowPostForm(!showPostForm)}
                  className="bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  {showPostForm ? "Cancel" : "+ New Post"}
                </button>
              </div>
            </div>

            {/* Create Post Form */}
            {showPostForm && (
              <div className="bg-gray-900 border border-violet-700 rounded-xl p-5 mb-5">
                <h3 className="font-semibold text-violet-300 mb-3">Create a Post</h3>
                <div className="space-y-3">
                  <input
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    placeholder="What did you build, learn or achieve?"
                    value={postForm.title}
                    onChange={e => setPostForm({ ...postForm, title: e.target.value })}
                  />
                  <textarea
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none h-24"
                    placeholder="Tell your story in detail..."
                    value={postForm.description}
                    onChange={e => setPostForm({ ...postForm, description: e.target.value })}
                  />
                  <input
                    className="w-full bg-gray-800 border border-gray-600 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500 transition-colors"
                    placeholder="Link (optional — GitHub, demo, article)"
                    value={postForm.link}
                    onChange={e => setPostForm({ ...postForm, link: e.target.value })}
                  />
                  <button
                    onClick={createPost}
                    disabled={posting || !postForm.title.trim()}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 transition-colors"
                  >
                    {posting ? "Publishing..." : "Publish to Feed 🚀"}
                  </button>
                </div>
              </div>
            )}

            {/* My Posts List */}
            {myPosts.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-3">📢</div>
                <p>No posts yet. Share your achievements with the world!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myPosts.map((post, i) => (
                  <div key={i} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            post.type === "hackerrank" ? "bg-green-900 text-green-300" :
                            post.type === "github" ? "bg-blue-900 text-blue-300" :
                            "bg-violet-900 text-violet-300"
                          }`}>
                            {post.type === "hackerrank" ? "🏅 HackerRank" :
                             post.type === "github" ? "🐙 GitHub" : "📝 Post"}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-white font-semibold text-sm">{post.title}</p>
                        {post.description && (
                          <p className="text-gray-400 text-xs mt-1 line-clamp-2">{post.description}</p>
                        )}
                        {post.link && (
                          <a href={post.link} target="_blank" rel="noreferrer"
                            className="text-xs text-violet-400 hover:underline mt-1 block truncate">
                            🔗 {post.link}
                          </a>
                        )}
                        {post.shares?.length > 0 && (
                          <span className="text-gray-500 text-xs mt-1 block">
                            🔁 {post.shares.length} shares
                          </span>
                        )}
                      </div>
                      <button
                        onClick={async () => {
                          await fetch("/api/posts", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ postId: post._id }),
                          });
                          setMyPosts(myPosts.filter(p => p._id !== post._id));
                          showMsg("success", "Post deleted");
                        }}
                        className="text-gray-600 hover:text-red-400 text-lg transition-colors ml-3"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* ── ANALYTICS TAB ── */}
        {tab === "Analytics" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold">Your Analytics 📊</h2>

            {skills.length === 0 && projects.length === 0 && certs.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-3">📊</div>
                <p>Add skills, projects or certifications to see analytics!</p>
              </div>
            ) : (
              <>
                {/* XP Breakdown */}
                <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                  <h3 className="font-semibold mb-4 text-gray-300">XP Breakdown</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={xpData}>
                      <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} />
                      <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
                      <Bar dataKey="xp" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Skill Levels */}
                {skills.length > 0 && (
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                    <h3 className="font-semibold mb-4 text-gray-300">Skills by Level</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={levelData}>
                        <XAxis dataKey="level" stroke="#9ca3af" fontSize={11} />
                        <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
                        <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Portfolio Breakdown Pie */}
                {pieData.length > 0 && (
                  <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
                    <h3 className="font-semibold mb-4 text-gray-300">Portfolio Breakdown</h3>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <PieChart width={180} height={180}>
                        <Pie data={pieData} cx={85} cy={85} innerRadius={50} outerRadius={80} dataKey="value">
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
                      </PieChart>
                      <div className="space-y-2">
                        {pieData.map((d, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <div className="w-3 h-3 rounded-full" style={{ background: d.color }}></div>
                            <span className="text-gray-300">{d.name}: <span className="text-white font-semibold">{d.value}</span></span>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-gray-700">
                          <span className="text-gray-400 text-sm">Total XP: </span>
                          <span className="text-violet-400 font-bold">{xp} ⚡</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}