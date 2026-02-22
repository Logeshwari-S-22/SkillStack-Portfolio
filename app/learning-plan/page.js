"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LearningPlanPage() {
  const router = useRouter();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    try {
      const res = await fetch("/api/ai/recommend");
      if (!res.ok) return;
      const data = await res.json();
      if (data.plan) setPlan(data.plan);
      setLoading(false);
    } catch (err) {
      console.error("Error:", err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-gray-400">Loading plan...</div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center p-6">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-md text-center">
          <p className="text-gray-400 mb-6">No learning plan yet. Generate one first!</p>
          <button
            onClick={() => router.push("/ai-assistant")}
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-lg"
          >
            Go to AI Assistant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">🎯 Your Learning Plan</h1>
        <p className="text-gray-400 mb-8">Target Role: {plan.targetRole}</p>

        {/* Overall Message */}
        <div className="bg-green-900 border border-green-600 rounded-xl p-6 mb-8">
          <p className="text-green-200 text-lg">{plan.overallMessage}</p>
        </div>

        {/* Career Match */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {plan.careerMatch?.map((match, idx) => (
            <div key={idx} className="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <h3 className="text-white font-bold text-lg mb-2">{match.role}</h3>
              <div className="relative h-8 bg-gray-800 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold"
                  style={{ width: `${match.matchPercent}%` }}
                >
                  {match.matchPercent}%
                </div>
              </div>
              <p className="text-gray-400 text-sm">Match Score</p>
            </div>
          ))}
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-green-400 font-bold text-lg mb-4">✅ Your Strengths</h3>
            <ul className="space-y-2">
              {plan.strengths?.map((strength, idx) => (
                <li key={idx} className="text-gray-300 flex items-start gap-2">
                  <span className="text-green-400 mt-1">✓</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
            <h3 className="text-orange-400 font-bold text-lg mb-4">⚠️ Areas to Improve</h3>
            <ul className="space-y-2">
              {plan.weaknesses?.map((weakness, idx) => (
                <li key={idx} className="text-gray-300 flex items-start gap-2">
                  <span className="text-orange-400 mt-1">!</span>
                  {weakness}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Skills Gap */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-8">
          <h3 className="text-white font-bold text-lg mb-4">📊 Skills Analysis</h3>
          <div className="space-y-3">
            {plan.skillsGap?.map((skill, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-white font-semibold">{skill.skill}</p>
                  <p className="text-gray-400 text-sm">Priority: {skill.priority || "N/A"}</p>
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      skill.status === "have"
                        ? "bg-green-900 text-green-200"
                        : "bg-red-900 text-red-200"
                    }`}
                  >
                    {skill.status === "have" ? "✓ Have" : "📚 Missing"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Plan */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-white font-bold text-lg mb-6">📅 Your Weekly Plan</h3>
          <div className="space-y-4">
            {plan.weeklyPlan?.map((day, idx) => (
              <div key={idx} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-white font-bold">Day {day.day}: {day.topic}</h4>
                    <p className="text-gray-400 text-sm">{day.duration}</p>
                  </div>
                  <span className="bg-violet-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Day {day.day}
                  </span>
                </div>
                <p className="text-gray-300 mb-2">{day.task}</p>
                {day.resource && (
                  <a
                    href={day.resource}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-400 hover:text-violet-300 text-sm"
                  >
                    📖 Resource →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => router.push("/assessments")}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-semibold transition"
          >
            📝 Take Relevant Assessments
          </button>
          <button
            onClick={() => router.push("/ai-assistant")}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition"
          >
            💬 Chat with AI Coach
          </button>
        </div>
      </div>
    </div>
  );
}