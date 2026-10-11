"use client";

import { sceneCredit } from "@/config/scene";
import { useExperience } from "@/components/experience/ExperienceContext";

export function SceneControls() {
  const { exploring, setExploring, resetView, status } = useExperience();
  if (status !== "ready") return null;

  return (
    <div className="scene-controls glass-chip">
      <button type="button" onClick={() => setExploring(!exploring)} aria-pressed={exploring}>
        {exploring ? "Leave" : "Explore"}
      </button>
      <button type="button" onClick={resetView}>
        Reset
      </button>
      <p className="scene-credit">{sceneCredit}</p>
    </div>
  );
}
