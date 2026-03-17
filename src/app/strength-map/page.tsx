"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BodyDiagram from "../../components/BodyDiagram";
import { getRankings, getProfile, deleteAllLiftEntries, ProfileResponse } from "../../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useGuest } from "../contexts/GuestContext";

const TIER_COLORS = [
  { tier: "ELITE", color: "#EAB308", label: "Elite" },
  { tier: "ADVANCED", color: "#8B5CF6", label: "Advanced" },
  { tier: "INTERMEDIATE", color: "#22C55E", label: "Intermediate" },
  { tier: "NOVICE", color: "#F59E0B", label: "Novice" },
  { tier: "BEGINNER", color: "#EF4444", label: "Beginner" },
  { tier: "UNTRAINED", color: "#9CA3AF", label: "Untrained" },
];

export default function StrengthMapPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { guestEntries, clearGuestEntries, guestBodyweight, guestBodyweightUnit, guestGender, guestRankings, setGuestRankings } = useGuest();
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<Record<string, any>>({});
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  // Fetch guest rankings from API (only if not cached)
  const fetchGuestRankings = async () => {
    if (guestEntries.length === 0 || !guestBodyweight) return {};
    
    // Check if we have cached rankings
    if (Object.keys(guestRankings).length > 0) {
      return guestRankings;
    }
    
    try {
      const response = await fetch('/api/rankings/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodyweight: guestBodyweight,
          unit: guestBodyweightUnit,
          gender: guestGender,
          entries: guestEntries,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch rankings');
      }
      
      const rankingsData = await response.json();
      setGuestRankings(rankingsData);
      return rankingsData;
    } catch (err) {
      console.error('Error fetching guest rankings:', err);
      return {};
    }
  };

  // Load guest rankings on mount (use cache if available)
  useEffect(() => {
    if (!user && guestEntries.length > 0 && guestBodyweight > 0) {
      // If we have cached rankings, use them immediately
      if (Object.keys(guestRankings).length > 0) {
        setRankings(guestRankings);
      } else {
        fetchGuestRankings().then(setRankings);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      if (user) {
        const profileData = await getProfile();
        setProfile(profileData);

        const rankingsData = await getRankings();
        setRankings(rankingsData);
      } else {
        // For guests, use cached rankings if available
        if (Object.keys(guestRankings).length > 0) {
          setRankings(guestRankings);
        }
      }
    } catch (err: any) {
      if (!user) {
        // Guest mode - no profile needed
      } else if (err.message.includes("401") || err.message.includes("Not found")) {
        router.push("/onboarding");
      } else {
        setError("Failed to load data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Are you sure you want to clear all lift data? This cannot be undone.")) {
      return;
    }

    setClearing(true);
    try {
      if (user) {
        await deleteAllLiftEntries();
      } else {
        clearGuestEntries();
      }
      setRankings({});
    } catch (err: any) {
      setError(err.message || "Failed to clear data.");
    } finally {
      setClearing(false);
    }
  };

  // Use rankings (same for both guests and logged in users)
  const displayRankings = rankings;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-500 mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchData}
            className="mt-4 px-4 py-2 bg-neutral-900 text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="8" width="4" height="8" rx="1" />
              <rect x="18" y="8" width="4" height="8" rx="1" />
              <line x1="6" y1="12" x2="18" y2="12" />
            </svg>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              Lift Aptitudes
            </span>
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Your Strength Map
          </h1>
          <p className="mt-2 text-gray-500 dark:text-neutral-400">
            Visualize your strength by muscle group
          </p>
        </div>

        {/* Body Diagram */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-8 mb-8">
          <BodyDiagram rankings={displayRankings} />
        </div>

        {/* Legend */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Legend
          </h3>
          <div className="flex flex-wrap gap-4">
            {TIER_COLORS.map(({ tier, color, label }) => (
              <div key={tier} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm text-gray-600 dark:text-neutral-400">
                  {label}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-200" />
              <span className="text-sm text-gray-600 dark:text-neutral-400">
                No Data
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Link
            href="/add-lift"
            className="flex-1 py-3 px-6 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors text-center"
          >
            + Add More Lifts
          </Link>
          <button
            onClick={handleClearAll}
            disabled={clearing || Object.keys(rankings).length === 0}
            className="flex-1 py-3 px-6 rounded-lg border border-red-500 text-red-500 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clearing ? "Clearing..." : "Clear All Data"}
          </button>
        </div>

        {/* Muscle Group Details */}
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Muscle Group Rankings
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(rankings).map(([muscle, data]) => (
              <div
                key={muscle}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-neutral-900"
              >
                <span className="font-medium text-gray-900 dark:text-white">
                  {muscle}
                </span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: data.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-neutral-400">
                    {data.tier}
                  </span>
                </div>
              </div>
            ))}
            {Object.keys(rankings).length === 0 && (
              <p className="col-span-full text-center text-gray-500 dark:text-neutral-400">
                No lift data yet. Add your lifts to see your rankings! Log in to save.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
