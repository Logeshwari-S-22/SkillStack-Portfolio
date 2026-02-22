"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function AssessmentResults() {
  const router = useRouter();
  const params = useParams();
  const skill = params.skill;

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("Results page mounted");
    console.log("Current skill param:", skill);
    
    // ✅ FIX: Check if results already loaded to avoid double-mount issues
    if (results !== null) {
      console.log("Results already loaded, skipping");
      return;
    }

    // Get results from sessionStorage
    const storedResults = sessionStorage.getItem("assessmentResults");
    console.log("Stored results in sessionStorage:", storedResults);

    if (!storedResults) {
      console.error("No results found in sessionStorage");
      setError("No assessment results found. Please take an assessment first.");
      setLoading(false);
      
      // Redirect after 3 seconds
      setTimeout(() => router.push("/assessments"), 3000);
      return;
    }

    try {
      const parsedResults = JSON.parse(storedResults);
      console.log("Parsed results:", parsedResults);

      // Validate results structure
      if (!parsedResults || typeof parsedResults.score === "undefined") {
        setError("Invalid results data");
        setLoading(false);
        return;
      }

      setResults(parsedResults);
      setLoading(false);
      
      // ✅ FIX: Clear sessionStorage after successfully setting state
      // Use a slight delay to ensure state is set first
      setTimeout(() => {
        sessionStorage.removeItem("assessmentResults");
        console.log("✅ Cleared sessionStorage");
      }, 100);
    } catch (err) {
      console.error("Parse error:", err);
      setError("Failed to parse results: " + err.message);
      setLoading(false);
    }
  }, [skill]); // ✅ Removed router from dependencies to avoid re-running

  // Rest of the component stays the same...
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 flex items-center justify-center p-6">
        <div className="bg-red-900 border border-red-600 rounded-xl p-8 max-w-md text-center">
          <p className="text-4xl mb-4">❌</p>
          <p className="text-red-200 text-lg font-bold">Error Loading Results</p>
          <p className="text-red-300 mt-4 mb-6">{error || "No results available"}</p>
          <button
            onClick={() => router.push("/assessments")}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  // ... rest of your JSX code stays the same ...
  const getScoreColor = (score) => {
    if (score >= 86) return "from-emerald-600 to-emerald-700";
    if (score >= 66) return "from-blue-600 to-blue-700";
    if (score >= 41) return "from-yellow-600 to-yellow-700";
    return "from-red-600 to-red-700";
  };

  const getLevelColor = (level) => {
    switch (level) {
      case "Expert":
        return "text-red-400";
      case "Advanced":
        return "text-orange-400";
      case "Intermediate":
        return "text-purple-400";
      case "Beginner":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Main Score Card */}
        <div className={`bg-gradient-to-br ${getScoreColor(results.score)} rounded-2xl p-1 mb-8`}>
          <div className="bg-gray-900 rounded-2xl p-12 text-center">
            <p className="text-gray-400 mb-4 text-lg">Your Score</p>
            <p className="text-7xl font-bold text-white mb-4">{results.score}%</p>
            <p className={`text-3xl font-bold ${getLevelColor(results.level)}`}>
              {results.level} Level
            </p>
          </div>
        </div>

        {/* Pass/Fail Message */}
        {results.passed ? (
          <div className="bg-green-900 border border-green-600 rounded-xl p-8 mb-8 text-center">
            <p className="text-5xl mb-4">🎉</p>
            <p className="text-green-200 text-2xl font-bold mb-2">Congratulations!</p>
            <p className="text-green-300 text-lg">{results.message}</p>
          </div>
        ) : (
          <div className="bg-yellow-900 border border-yellow-600 rounded-xl p-8 mb-8 text-center">
            <p className="text-5xl mb-4">📚</p>
            <p className="text-yellow-200 text-2xl font-bold mb-2">Keep Learning!</p>
            <p className="text-yellow-300 text-lg">{results.message}</p>
          </div>
        )}

        {/* Credential Card (if earned) */}
        {results.credential ? (
          <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-1 mb-8">
            <div className="bg-gray-900 rounded-2xl p-8">
              <div className="text-center mb-8">
                <p className="text-5xl mb-4">🏆</p>
                <p className="text-gray-400 text-sm mb-2">Credential Issued</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-2">Skill</p>
                  <p className="text-2xl font-bold text-white">
                    {results.credential.skill}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-2">Level</p>
                  <p
                    className={`text-2xl font-bold ${getLevelColor(
                      results.credential.level
                    )}`}
                  >
                    {results.credential.level}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-2">Score</p>
                  <p className="text-2xl font-bold text-green-400">
                    {results.credential.score}%
                  </p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <p className="text-gray-400 text-xs mb-2">Credential ID</p>
                <p className="text-gray-300 font-mono text-sm break-all">
                  {results.credential.id}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/credentials/verify/${results.credential.id}`;
                    navigator.clipboard.writeText(url);
                    alert("✅ Verification link copied to clipboard!");
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition"
                >
                  📋 Copy Verification Link
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/credentials/verify/${results.credential.id}`;
                    const text = `I earned a ${results.credential.level} credential in ${results.credential.skill}! 🏆`;
                    if (navigator.share) {
                      navigator.share({
                        title: `${results.credential.skill} Credential`,
                        text: text,
                        url: url,
                      });
                    } else {
                      window.open(
                        `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                          text
                        )}&url=${encodeURIComponent(url)}`,
                        "_blank"
                      );
                    }
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
                >
                  𝕏 Share
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 mb-8 text-center">
            <p className="text-gray-300 mb-4">
              You need 40% or higher to earn a credential.
            </p>
            <p className="text-gray-400">
              Keep practicing and try again to earn your badge! 💪
            </p>
          </div>
        )}

        {/* Anti-cheat Warning */}
        {results.suspicious && (
          <div className="bg-red-900 border border-red-600 rounded-xl p-6 mb-8">
            <p className="text-red-200 font-semibold mb-2">⚠️ Anti-Cheat Notice</p>
            <p className="text-red-300 text-sm">
              Suspicious activity was detected during your assessment (tab switches
              or paste attempts). Your score has been reduced by 30%. Please
              complete assessments honestly next time.
            </p>
          </div>
        )}

        {/* Statistics */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Assessment Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm mb-2">Score</p>
              <p className="text-3xl font-bold text-white">{results.score}%</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm mb-2">Level</p>
              <p className={`text-2xl font-bold ${getLevelColor(results.level)}`}>
                {results.level}
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm mb-2">Status</p>
              <p
                className={`text-lg font-bold ${
                  results.passed ? "text-green-400" : "text-red-400"
                }`}
              >
                {results.passed ? "✅ PASSED" : "❌ FAILED"}
              </p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <p className="text-gray-400 text-sm mb-2">Skill</p>
              <p className="text-lg font-bold text-white">{skill}</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-xl p-6 mb-8">
          <p className="text-blue-200 mb-2">
            <strong>💡 Next Steps:</strong>
          </p>
          {results.passed ? (
            <ul className="text-blue-200 text-sm space-y-1">
              <li>✓ Your credential has been issued</li>
              <li>✓ Share your credential on social media</li>
              <li>✓ Take another assessment to earn more credentials</li>
            </ul>
          ) : (
            <ul className="text-blue-200 text-sm space-y-1">
              <li>✓ Review the topics you found challenging</li>
              <li>✓ Practice and improve your skills</li>
              <li>✓ Retake the assessment after studying</li>
            </ul>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/assessments")}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg font-semibold transition"
          >
            ← Take Another Assessment
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-3 rounded-lg font-semibold transition"
          >
            View Dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}