"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CompareAthleteItem {
  id: string;
  name: string;
  position?: string;
  photoUrl?: string | null;
  teamName?: string;
  jerseyNumber?: string | number | null;
}

interface CompareStoreContextType {
  athletes: CompareAthleteItem[];
  selectedIds: string[];
  athleteIds: string[];
  addAthlete: (athlete: CompareAthleteItem) => boolean;
  removeAthlete: (id: string) => void;
  toggleAthlete: (athlete: CompareAthleteItem) => void;
  clearCompare: () => void;
  isSelected: (id: string) => boolean;
  count: number;
}

const STORAGE_KEY = "overview-scout:compare-dock";
const OLD_STORAGE_KEY = "the-net-scouting:compare-dock";
const MAX_COMPARE = 3;

const CompareContext = createContext<CompareStoreContextType | null>(null);

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [athletes, setAthletes] = useState<CompareAthleteItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hidratação a partir do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setAthletes(parsed.slice(0, MAX_COMPARE));
        }
      }
    } catch (e) {
      console.warn("Falha ao recuperar atletas de comparação:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persistência automática no localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(athletes));
      } catch (e) {
        console.warn("Falha ao salvar atletas de comparação:", e);
      }
    }
  }, [athletes, isHydrated]);

  function addAthlete(athlete: CompareAthleteItem): boolean {
    if (athletes.some((a) => a.id === athlete.id)) return true;
    if (athletes.length >= MAX_COMPARE) {
      // Substitui o último se já atingiu o limite de 3
      setAthletes((prev) => [...prev.slice(0, MAX_COMPARE - 1), athlete]);
      return true;
    }
    setAthletes((prev) => [...prev, athlete]);
    return true;
  }

  function removeAthlete(id: string) {
    setAthletes((prev) => prev.filter((a) => a.id !== id));
  }

  function toggleAthlete(athlete: CompareAthleteItem) {
    if (athletes.some((a) => a.id === athlete.id)) {
      removeAthlete(athlete.id);
    } else {
      addAthlete(athlete);
    }
  }

  function clearCompare() {
    setAthletes([]);
  }

  function isSelected(id: string): boolean {
    return athletes.some((a) => a.id === id);
  }

  const selectedIds = athletes.map((a) => a.id);
  const athleteIds = selectedIds;

  return (
    <CompareContext.Provider
      value={{
        athletes,
        selectedIds,
        athleteIds,
        addAthlete,
        removeAthlete,
        toggleAthlete,
        clearCompare,
        isSelected,
        count: athletes.length,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompareStore() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompareStore deve ser usado dentro de um CompareProvider");
  }
  return context;
}
