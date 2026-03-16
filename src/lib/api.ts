import { Gender, WeightUnit, ExperienceLevel } from "../generated/prisma/client";


export type ProfileInput = {
  display_name: string;
  gender: Gender;
  bodyweight: number;
  bodyweight_unit: WeightUnit;
  experience_level: ExperienceLevel;
};

export type LiftEntryInput = {
  lift_id: number;
  weight: number;
  reps: number;
};

export type LiftEntryUpdateInput = {
  weight?: number;
  reps?: number;
};

export type RankingResult = {
  tier: ExperienceLevel | "UNTRAINED";
  percentile: number;
  color: string;
};


async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }
  return response.json();
}

// Profile API
export async function getProfile() {
  const res = await fetch('/api/profile/profile_route');
  return handleResponse(res);
}

export async function createProfile(data: ProfileInput) {
  const res = await fetch('/api/profile/profile_route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function updateProfile(data: ProfileInput) {
  const res = await fetch('/api/profile/profile_route', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

// Lifts API
export async function getLiftEntries() {
  const res = await fetch('/api/lifts/lifts_route');
  return handleResponse(res);
}

export async function createLiftEntry(data: LiftEntryInput) {
  const res = await fetch('/api/lifts/lifts_route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function updateLiftEntry(id: number, data: LiftEntryUpdateInput) {
  const res = await fetch(`/api/lifts/lifts_route?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function deleteLiftEntry(id: number) {
  const res = await fetch(`/api/lifts/lifts_route?id=${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP ${res.status}`);
  }
  // DELETE returns 204 No Content, so no JSON to parse
  return true;
}

// Rankings API
export async function getRankings(): Promise<Record<string, RankingResult>> {
  const res = await fetch('/api/rankings/ranking_route');
  return handleResponse(res);
}

// Helper to check if user is authenticated (returns true if 401)
export async function checkAuth(): Promise<boolean> {
  try {
    await getProfile();
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('401')) {
      return false;
    }
    throw error;
  }
}