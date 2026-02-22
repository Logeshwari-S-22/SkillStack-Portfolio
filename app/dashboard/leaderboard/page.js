"use client";
import { useState, useEffect } from "react";

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("All");
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState(null);

  const skills = ["All", "JavaScript", "Python", "React", "TypeScript", "Node.js", "Java"];

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(`/api/analytics/leaderboard?skill=${selectedSkill}`);
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
        setUserRank(data.userRank);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedSkill]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const getRankColor = (rank) => {
    if (rank === 1) return "from-yellow-600 to-yellow-700";
    if (rank === 2) return "from-gray-600 to-gray-700";
    if (rank === 3) return "from-orange-600 to-orange-700";
    return "from-violet-600 to-purple-600";
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return "";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">🏆 Global Leaderboard</h1>
          <p className="text-gray-400">See where you rank in the SkillStackTN community</p>
        </div>

        {/* Skill Filter */}
        <div className="mb-8">
          <p className="text-gray-400 text-sm mb-3">Filter by skill:</p>
          <div className="flex gap-2 flex-wrap">
            {skills.map((skill) => (
              <button
                key={skill}
                onClick={() => setSelectedSkill(skill)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedSkill === skill
                    ? "bg-violet-600 text-white"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 Podium */}
        {topThree.length > 0 && (
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl p-6 text-center order-first md:order-none">
                  <p className="text-4xl mb-2">🥈</p>
                  <p className="text-gray-300 font-bold text-lg">{topThree[1].name}</p>
                  <p className="text-gray-400 text-sm mt-2">{topThree[1].xp} XP</p>
                  <p className="text-gray-400 text-xs">Rank #{topThree[1].rank}</p>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl p-8 text-center md:scale-110">
                  <p className="text-5xl mb-2">🥇</p>
                  <p className="text-white font-bold text-xl">{topThree[0].name}</p>
                  <p className="text-white text-sm mt-2">{topThree[0].xp} XP</p>
                  <p className="text-yellow-100 text-xs">Rank #1</p>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-center order-last md:order-none">
                  <p className="text-4xl mb-2">🥉</p>
                  <p className="text-white font-bold text-lg">{topThree[2].name}</p>
                  <p className="text-orange-100 text-sm mt-2">{topThree[2].xp} XP</p>
                  <p className="text-orange-100 text-xs">Rank #{topThree[2].rank}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rest of Leaderboard */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700 bg-gray-800">
                <th className="px-6 py-4 text-left text-gray-400 font-semibold">Rank</th>
                <th className="px-6 py-4 text-left text-gray-400 font-semibold">User</th>
                <th className="px-6 py-4 text-right text-gray-400 font-semibold">XP</th>
                <th className="px-6 py-4 text-right text-gray-400 font-semibold">Skills</th>
                <th className="px-6 py-4 text-right text-gray-400 font-semibold">Credentials</th>
              </tr>
            </thead>
            <tbody>
              {rest.map((user, idx) => (
                <tr
                  key={user._id}
                  className="border-b border-gray-700 hover:bg-gray-800 transition"
                >
                  <td className="px-6 py-4 text-gray-300 font-semibold">#{user.rank}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-violet-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold">{user.name?.charAt(0) || "U"}</span>
                      </div>
                      <p className="text-white font-medium">{user.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-white font-bold">{user.xp}</td>
                  <td className="px-6 py-4 text-right text-gray-400">{user.skillCount}</td>
                  <td className="px-6 py-4 text-right text-gray-400">{user.credentialCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No users yet. Take an assessment to appear on the leaderboard!</p>
          </div>
        )}
      </div>
    </div>
  );
}