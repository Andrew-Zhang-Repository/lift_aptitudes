import { Gender, WeightUnit, ExperienceLevel } from "../generated/prisma/client";
import useSWR from 'swr'

export type ProfileInput = {
  display_name: string;
  gender: Gender;
  bodyweight: number;
  bodyweight_unit: WeightUnit;
  experience_level: ExperienceLevel;
};

export type ProfileResponse = ProfileInput & {
  user_id: string;
  created_at: string;
  updated_at: string;
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

const fetcher = (url: string) => fetch(url).then(res => res.json());


export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR('/api/profile', fetcher);
  return { 
    profile: data, 
    isLoading, 
    error, 
    refresh: mutate 
  };
}
export function useRankings() {
  const { data, error, isLoading, mutate } = useSWR('/api/rankings', fetcher);
  return { 
    rankings: data, 
    isLoading, 
    error, 
    refresh: mutate 
  };
}
export function useLiftEntries() {
  const { data, error, isLoading, mutate } = useSWR('/api/lifts', fetcher);
  return { 
    entries: data, 
    isLoading, 
    error, 
    refresh: mutate 
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP ${response.status}`);
  }
  return response.json();
}

// Profile API
export async function getProfile(): Promise<ProfileResponse> {
  const res = await fetch('/api/profile');
  return handleResponse(res);
}

export async function createProfile(data: ProfileInput) {
  const res = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function updateProfile(data: ProfileInput): Promise<ProfileResponse> {
  const res = await fetch('/api/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

// Lifts API
export async function getLiftEntries() {
  const res = await fetch('/api/lifts');
  return handleResponse(res);
}

export type Lift = {
  id: number;
  name: string;
  muscle_group: string;
  secondary_muscles: string[];
  description: string;
  is_compound: boolean;
};

export async function getAvailableLifts(): Promise<Lift[]> {
  const res = await fetch('/api/lifts?available=true');
  return handleResponse(res);
}

export async function createLiftEntry(data: LiftEntryInput) {
  const res = await fetch('/api/lifts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function updateLiftEntry(id: number, data: LiftEntryUpdateInput) {
  const res = await fetch(`/api/lifts?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
}

export async function deleteLiftEntry(id: number) {
  const res = await fetch(`/api/lifts?id=${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP ${res.status}`);
  }
  // DELETE returns 204 No Content, so no JSON to parse
  return true;
}

export async function deleteAllLiftEntries() {
  const res = await fetch(`/api/lifts?all=true`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || `HTTP ${res.status}`);
  }
  return true;
}

// Rankings API
export async function getRankings(): Promise<Record<string, RankingResult>> {
  const res = await fetch('/api/rankings');
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