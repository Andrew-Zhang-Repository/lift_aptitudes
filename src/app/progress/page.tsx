"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProfile } from "../../lib/api";
import prisma from "../../lib/prisma";
import { createServerClient } from "../../lib/supabase-server";

type MuscleHistory = {
  muscle_group: string;
  lift_name: string;
  weight: number;
  reps: number;
  estimated_1rm: number;
  date: Date;
};

export default function ProgressPage() {
  const router = useRouter();
  const { profile, isLoading: profileLoading, error: profileError } = useProfile();
  const [history, setHistory] = useState<MuscleHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/progress");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/onboarding");
          return;
        }
        throw new Error("Failed to fetch progress");
      }
      const data = await res.json();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || "Failed to load progress");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const { useAuth } = await import("../../app/contexts/AuthContext");
    const { logout } = useAuth();
    await logout();
    router.push("/login");
  };

  if (profileLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-500 mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Group history by muscle group
  const groupedHistory = history.reduce((acc, item) => {
    if (!acc[item.muscle_group]) {
      acc[item.muscle_group] = [];
    }
    acc[item.muscle_group].push(item);
    return acc;
  }, {} as Record<string, MuscleHistory[]>);

  const muscleOrder = [
    "Chest",
    "Back",
    "Quads",
    "Glutes",
    "Hamstrings",
    "Shoulders",
    "Biceps",
    "Triceps",
    "Calves",
    "Abs",
    "Traps",
  ];

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
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Progress
        </h1>
        <p className="text-gray-500 dark:text-neutral-400 mb-8">
          Your personal bests over time
        </p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {history.length === 0 ? (
          <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-8 text-center">
            <p className="text-gray-500 dark:text-neutral-400 mb-4">
              No personal bests recorded yet.
            </p>
            <Link
              href="/add-lift"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
            >
              Add Your First Lift
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {muscleOrder.map((muscle) => {
              const entries = groupedHistory[muscle];
              if (!entries || entries.length === 0) return null;

              return (
                <div
                  key={muscle}
                  className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 overflow-hidden"
                >
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-neutral-700">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {muscle}
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-neutral-700">
                    {entries.map((entry, index) => (
                      <div key={index} className="px-6 py-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {entry.lift_name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-neutral-400">
                            {entry.weight}kg × {entry.reps} reps
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {Math.round(entry.estimated_1rm)}kg e1RM
                          </p>
                          <p className="text-sm text-gray-500 dark:text-neutral-400">
                            {new Date(entry.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
