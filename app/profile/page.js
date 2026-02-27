"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [credentials, setCredentials] = useState([]);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState(null);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    headline: "",
    bio: "",
    location: "",
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch profile
      const profileRes = await fetch("/api/profile");
      if (!profileRes.ok) {
        if (profileRes.status === 401) router.push("/login");
        return;
      }
      const profileData = await profileRes.json();
      setProfile(profileData);
      setFormData({
        name: profileData.name || "",
        headline: profileData.headline || "",
        bio: profileData.bio || "",
        location: profileData.location || "",
      });

      // Fetch credentials
      const credRes = await fetch("/api/credentials");
      if (credRes.ok) {
        const credData = await credRes.json();
        setCredentials(credData.credentials || []);
      }

      // Fetch skills
      const skillRes = await fetch("/api/skills");
      if (skillRes.ok) {
        const skillData = await skillRes.json();
        setSkills(skillData.skills || []);
      }

      // Fetch projects
      const projRes = await fetch("/api/projects");
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData.projects || []);
      }

      // Fetch certifications
      const certRes = await fetch("/api/certifications");
      if (certRes.ok) {
        const certData = await certRes.json();
        setCerts(certData.certifications || []);
      }

      setLoading(false);
      
      // Fetch recommendations
      fetchRecommendations();
    } catch (err) {
      console.error("Error:", err);
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    setLoadingRecommendations(true);
    try {
      const res = await fetch("/api/profile/recommendations");
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const handleSaveBasic = async () => {
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        alert("Error saving profile");
        return;
      }

      alert("✅ Profile updated!");
      setIsEditing(false);
      fetchAllData();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">👤 My Profile</h1>
            <p className="text-gray-400">Your professional presence</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            {isEditing ? "❌ Cancel" : "✏️ Edit"}
          </button>
        </div>

        {/* Edit Mode */}
        {isEditing && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Edit Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2 font-semibold">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-semibold">
                  Headline (e.g., "Senior Frontend Developer at Google")
                </label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-semibold">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2 font-semibold">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white h-32"
                />
              </div>

              <button
                onClick={handleSaveBasic}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* Read-Only Profile View */}
        {!isEditing && profile && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 mb-8">
            <h2 className="text-3xl font-bold text-white">{profile.name}</h2>
            {profile.headline && (
              <p className="text-violet-400 text-lg mt-2">{profile.headline}</p>
            )}
            {profile.location && (
              <p className="text-gray-400 mt-1">📍 {profile.location}</p>
            )}
            {profile.bio && (
              <p className="text-gray-300 mt-4">{profile.bio}</p>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-violet-400">{credentials.length}</p>
            <p className="text-gray-400 text-sm mt-2">Credentials Earned</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-blue-400">{skills.length}</p>
            <p className="text-gray-400 text-sm mt-2">Skills</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-green-400">{projects.length}</p>
            <p className="text-gray-400 text-sm mt-2">Projects</p>
          </div>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 text-center">
            <p className="text-3xl font-bold text-orange-400">{certs.length}</p>
            <p className="text-gray-400 text-sm mt-2">Certificates</p>
          </div>
        </div>

        {/* Credentials Section */}
        {credentials.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">🏆 Earned Credentials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {credentials.map((cred, idx) => (
                <div key={idx} className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-lg p-6">
                  <p className="text-white font-bold text-lg">{cred.skill}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold text-white ${
                      cred.level === "Expert" ? "bg-red-600" :
                      cred.level === "Advanced" ? "bg-orange-600" :
                      cred.level === "Intermediate" ? "bg-blue-600" :
                      "bg-green-600"
                    }`}>
                      {cred.level}
                    </span>
                    <span className="text-white font-bold">{cred.score}%</span>
                  </div>
                  <p className="text-gray-200 text-xs mt-2">
                    📅 {new Date(cred.createdAt).toLocaleDateString()}
                  </p>
                  <a
                    href={`/credentials/verify/${cred.credentialId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-xs mt-3 inline-block hover:underline"
                  >
                    View Credential →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Section */}
        {skills.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">🎯 Skills</h2>
            <div className="flex flex-wrap gap-3">
              {skills.map((skill, idx) => (
                <div key={idx} className="bg-blue-900 text-blue-200 px-4 py-2 rounded-full">
                  <p className="font-semibold">{skill.name}</p>
                  <p className="text-xs text-blue-300">{skill.level}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Section */}
        {projects.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">💻 Projects</h2>
            <div className="space-y-4">
              {projects.map((proj, idx) => (
                <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <p className="text-white font-bold">{proj.title}</p>
                  <p className="text-gray-300 text-sm mt-1">{proj.description}</p>
                  {proj.githubUrl && (
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 text-sm mt-2 inline-block hover:underline"
                    >
                      View on GitHub →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications Section */}
        {certs.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">🎓 Certifications</h2>
            <div className="space-y-3">
              {certs.map((cert, idx) => (
                <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                  <p className="text-white font-bold">{cert.title}</p>
                  <p className="text-green-400 text-sm">{cert.issuer}</p>
                  {cert.credentialUrl && (
                    <a
                      href={cert.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-violet-400 text-sm mt-2 inline-block hover:underline"
                    >
                      View Certificate →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations Section */}
        {recommendations && !loadingRecommendations && (
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-1">
            <div className="bg-gray-900 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">✨ AI Recommendations</h2>
              
              <p className="text-gray-300 mb-6">{recommendations.summary}</p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-bold text-green-400 mb-4">💪 Your Strengths</h3>
                  <ul className="space-y-2">
                    {recommendations.strengths?.map((strength, idx) => (
                      <li key={idx} className="text-gray-300 flex items-start gap-2">
                        <span className="text-green-400 mt-1">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-orange-400 mb-4">📈 Areas to Improve</h3>
                  <ul className="space-y-2">
                    {recommendations.areasToImprove?.map((area, idx) => (
                      <li key={idx} className="text-gray-300 flex items-start gap-2">
                        <span className="text-orange-400 mt-1">!</span>
                        {area}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-bold text-blue-400 mb-4">🎯 Skills to Learn Next</h3>
                <div className="flex flex-wrap gap-2">
                  {recommendations.recommendedSkills?.map((skill, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-900 text-blue-200 px-4 py-2 rounded-full text-sm font-semibold"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-bold text-purple-400 mb-2">🚀 Next Career Step</h3>
                <p className="text-gray-300">{recommendations.careerPathSuggestion}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-cyan-400 mb-3">✅ Action Items</h3>
                <ol className="space-y-2">
                  {recommendations.actionItems?.map((item, idx) => (
                    <li key={idx} className="text-gray-300">{item}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        )}

        {loadingRecommendations && (
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Generating AI recommendations...</p>
          </div>
        )}
      </div>
    </div>
  );
}