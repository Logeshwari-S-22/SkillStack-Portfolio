"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/analytics/user-stats");
        if (!res.ok) {
          if (res.status === 401) router.push("/login");
          return;
        }
        const data = await res.json();
        setStats(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-gray-400">Failed to load analytics. Please refresh.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">📊 Your Analytics</h1>
          <p className="text-gray-400">Track your progress and skill development</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl p-6">
            <p className="text-gray-200 text-sm mb-2">Total XP</p>
            <p className="text-4xl font-bold text-white">{stats.xp || 0}</p>
            <p className="text-purple-200 text-xs mt-2">Experience Points</p>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6">
            <p className="text-gray-200 text-sm mb-2">Rank</p>
            <p className="text-4xl font-bold text-white">#{stats.rank || "N/A"}</p>
            <p className="text-blue-200 text-xs mt-2">Global Ranking</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6">
            <p className="text-gray-200 text-sm mb-2">Skills</p>
            <p className="text-4xl font-bold text-white">{stats.skillCount || 0}</p>
            <p className="text-green-200 text-xs mt-2">Verified Skills</p>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6">
            <p className="text-gray-200 text-sm mb-2">Credentials</p>
            <p className="text-4xl font-bold text-white">{stats.credentialCount || 0}</p>
            <p className="text-orange-200 text-xs mt-2">Earned Badges</p>
          </div>
        </div>

        {/* Skills Breakdown */}
        {stats.skills && stats.skills.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-white mb-6">Skills Breakdown</h2>
            <div className="space-y-4">
              {stats.skills.slice(0, 10).map((skill, idx) => (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-white font-medium">{skill.name}</p>
                    <p className="text-gray-400 text-sm">{skill.proficiency || "N/A"}</p>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-violet-600 h-2 rounded-full transition-all"
                      style={{ width: `${(idx + 1) * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Assessments */}
        {stats.recentAssessments && stats.recentAssessments.length > 0 && (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Assessments</h2>
            <div className="space-y-3">
              {stats.recentAssessments.map((assessment, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{assessment.skill}</p>
                    <p className="text-gray-400 text-sm">{assessment.difficulty} • {new Date(assessment.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${assessment.passed ? "text-green-400" : "text-red-400"}`}>
                      {assessment.score}%
                    </p>
                    <p className="text-xs text-gray-400">{assessment.passed ? "Passed ✓" : "Retake"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}