"use client";

import { useEffect, useState } from "react";
import { getMuscleColor } from "../lib/muscle-paths";

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

  const colorizeFrontSvg = (svg: string): string => {
    if (!svg) return svg;
    
    let processed = svg;
    
    processed = processed.replace(
      /<g class="muscle" id = "pectorals">/g,
      `<g class="muscle" id="pectorals" style="fill: ${getMuscleColor("Chest", rankings)};">`
    );
    processed = processed.replace(
      /<g class="muscle" id = "quadriceps">/g,
      `<g class="muscle" id="quadriceps" style="fill: ${getMuscleColor("Quads", rankings)};">`
    );
    processed = processed.replace(
      /<g class="muscle" id = "biceps">/g,
      `<g class="muscle" id="biceps" style="fill: ${getMuscleColor("Biceps", rankings)};">`
    );
    processed = processed.replace(
      /<g class="muscle" id = "deltoids">/g,
      `<g class="muscle" id="deltoids" style="fill: ${getMuscleColor("Shoulders", rankings)};">`
    );
    processed = processed.replace(
      /<g class="muscle" id = "abdomen">/g,
      `<g class="muscle" id="abdomen" style="fill: ${getMuscleColor("Abs", rankings)};">`
    );
    processed = processed.replace(
      /<g class="muscle" id = "trapezoid">/g,
      `<g class="muscle" id="trapezoid" style="fill: ${getMuscleColor("Traps", rankings)};">`
    );
    processed = processed.replace(
      /<g class="muscle" id = "flexors">/g,
      `<g class="muscle" id="flexors" style="fill: ${getMuscleColor("Forearms", rankings)};">`
    );
    processed = processed.replace(
      /<g class="muscle" id = "gastrocnemius">/g,
      `<g class="muscle" id="gastrocnemius" style="fill: ${getMuscleColor("Calves", rankings)};">`
    );
    processed = processed.replace(
      /<g class="muscle" id = "tibialis">/g,
      `<g class="muscle" id="tibialis" style="fill: ${getMuscleColor("Calves", rankings)};">`
    );
    processed = processed.replace(
      /<g class="muscle" id = "abductors">/g,
      `<g class="muscle" id="abductors" style="fill: ${getMuscleColor("Glutes", rankings)};">`
    );
    
    return processed;
  };

  const colorizeBackSvg = (svg: string): string => {
    if (!svg) return svg;
    
    let processed = svg;
  
    processed = processed.replace(
      /<g class="muscle" id = "trapezoidback">/g,
      `<g class="muscle" id="trapezoidback" style="fill: ${getMuscleColor("Traps", rankings)};">`
    );
    processed = processed.replace(
      /<g class="muscle" id = "backdeltoids">/g,
      `<g class="muscle" id="backdeltoids" style="fill: ${getMuscleColor("Shoulders", rankings)};">`
    );
    processed = processed.replace(
      /<g class="muscle" id = "triceps">/g,
      `<g class="muscle" id="triceps" style="fill: ${getMuscleColor("Triceps", rankings)};">`
    );
    processed = processed.replace(
      /<g class="muscle" id = "lowerback">/g,
      `<g class="muscle" id="lowerback" style="fill: ${getMuscleColor("Back", rankings)};">`
    );
    processed = processed.replace(
      /<g class="muscle" id = "gluteus">/g,
      `<g class="muscle" id="gluteus" style="fill: ${getMuscleColor("Glutes", rankings)};">`
    );
    processed = processed.replace(
      /<g class="muscle" id = "hamstrings">/g,
      `<g class="muscle" id="hamstrings" style="fill: ${getMuscleColor("Hamstrings", rankings)};">`
    );
    processed = processed.replace(
      /<g class="muscle" id = "lowerleg">/g,
      `<g class="muscle" id="lowerleg" style="fill: ${getMuscleColor("Calves", rankings)};">`
    );
    
    return processed;
  };

  const coloredFront = colorizeFrontSvg(frontSvg);
  const coloredBack = colorizeBackSvg(backSvg);

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
