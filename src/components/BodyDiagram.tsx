"use client";

import { useEffect, useState, useMemo } from "react";
import { getMuscleColor, MUSCLE_MAPPING } from "../lib/muscle-paths";

type RankingData = {
  tier: string;
  percentile: number;
  color: string;
};

type Rankings = Record<string, RankingData>;

type Props = {
  rankings: Rankings;
};

export default function BodyDiagram({ rankings }: Props) {
  const [frontSvg, setFrontSvg] = useState<string>("");
  const [backSvg, setBackSvg] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch("/images/body-front.svg").then((r) => r.text()),
      fetch("/images/body-back.svg").then((r) => r.text()),
    ]).then(([front, back]) => {
      setFrontSvg(front);
      setBackSvg(back);
    });
  }, []);

  // Get colors for all muscles
  const colors = useMemo(() => {
    const result: Record<string, string> = {};
    Object.keys(MUSCLE_MAPPING).forEach((muscleName) => {
      result[muscleName] = getMuscleColor(muscleName, rankings);
    });
    return result;
  }, [rankings]);

  // Process SVG to add colors to muscle groups
  const processSvg = (svg: string) => {
    if (!svg) return "";

    let processed = svg;

    // Remove the default muscle fill color (#515761) and replace with our colors
    // Target each muscle by its ID
    Object.entries(MUSCLE_MAPPING).forEach(([muscleName, ids]) => {
      const color = colors[muscleName];
      
      // Color front muscle
      if (ids.front) {
        // Replace fill in the muscle group
        processed = processed.replace(
          new RegExp(`(<g[^>]*id=["']${ids.front}["'][^>]*>)`, "gi"),
          (match) => match.replace(/>$/, ` fill="${color}">`)
        );
      }
      
      // Color back muscle  
      if (ids.back) {
        processed = processed.replace(
          new RegExp(`(<g[^>]*id=["']${ids.back}["'][^>]*>)`, "gi"),
          (match) => match.replace(/>$/, ` fill="${color}">`)
        );
      }
    });

    // Also try to target paths directly with the muscle class and specific IDs
    Object.entries(MUSCLE_MAPPING).forEach(([muscleName, ids]) => {
      const color = colors[muscleName];
      
      // Target paths inside muscle groups
      if (ids.front) {
        processed = processed.replace(
          new RegExp(`(<path[^>]*id=["']${ids.front}["'][^>]*)(/?>)`, "gi"),
          `$1 fill="${color}" $2`
        );
      }
      if (ids.back) {
        processed = processed.replace(
          new RegExp(`(<path[^>]*id=["']${ids.back}["'][^>]*)(/?>)`, "gi"),
          `$1 fill="${color}" $2`
        );
      }
    });

    // Replace default muscle fill color
    processed = processed.replace(/class="muscle" fill="#515761"/g, (match) => {
      // Find which muscle this is and apply correct color
      return 'class="muscle"';
    });

    return processed;
  };

  const coloredFront = processSvg(frontSvg);
  const coloredBack = processSvg(backSvg);

  if (!frontSvg || !backSvg) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neutral-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 justify-center items-start">
      {/* Front View */}
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Front
        </h3>
        <div 
          className="w-56 md:w-72"
          dangerouslySetInnerHTML={{ __html: coloredFront }}
        />
      </div>

      {/* Back View */}
      <div className="flex flex-col items-center">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Back
        </h3>
        <div 
          className="w-56 md:w-72"
          dangerouslySetInnerHTML={{ __html: coloredBack }}
        />
      </div>
    </div>
  );
}
