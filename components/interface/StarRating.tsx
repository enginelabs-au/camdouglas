"use client";

import { useId, useState } from "react";

const STAR =
  "M12 2.15l2.62 5.31 5.86.85-4.24 4.13 1 5.82L12 15.5l-5.24 2.76 1-5.82-4.24-4.13 5.86-.85L12 2.15z";

function fillFor(value: number, index: number): "empty" | "half" | "full" {
  if (value >= index) return "full";
  if (value >= index - 0.5) return "half";
  return "empty";
}

function StarIcon({ fill, gradId }: { fill: "empty" | "half" | "full"; gradId: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {fill === "half" ? (
        <defs>
          <linearGradient id={gradId}>
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
      ) : null}
      <path
        d={STAR}
        fill={fill === "full" ? "currentColor" : fill === "half" ? `url(#${gradId})` : "none"}
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (next: number) => void;
  readOnly?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const [draft, setDraft] = useState<number | null>(null);
  const shown = draft ?? value;
  const label = value > 0 ? `${value} out of 5 stars` : "No rating selected";
  const className = [
    "star-rating",
    readOnly ? "is-readonly" : "",
    !readOnly && draft !== null ? "is-draft" : "",
    !readOnly && draft === null && value > 0 ? "is-set" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      role={readOnly ? "img" : "slider"}
      aria-label="Rating"
      aria-valuemin={readOnly ? undefined : 0.5}
      aria-valuemax={readOnly ? undefined : 5}
      aria-valuenow={readOnly ? undefined : value || 0.5}
      aria-valuetext={draft ? `${draft} out of 5 stars` : label}
      onPointerLeave={readOnly ? undefined : () => setDraft(null)}
      onKeyDown={
        readOnly || !onChange
          ? undefined
          : (event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                onChange(Math.min(5, Math.round((value + 0.5) * 2) / 2 || 0.5));
              } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                onChange(Math.max(0.5, Math.round((value - 0.5) * 2) / 2));
              }
            }
      }
      tabIndex={readOnly ? undefined : 0}
    >
      {[1, 2, 3, 4, 5].map((index) => (
        <span key={index} className="star">
          <StarIcon fill={fillFor(shown, index)} gradId={`${uid}-${index}`} />
          {readOnly ? null : (
            <>
              <button
                type="button"
                className="star-hit left"
                aria-label={`${index - 0.5} stars`}
                onPointerEnter={() => setDraft(index - 0.5)}
                onFocus={() => setDraft(index - 0.5)}
                onClick={() => {
                  onChange?.(index - 0.5);
                  setDraft(null);
                }}
              />
              <button
                type="button"
                className="star-hit right"
                aria-label={`${index} stars`}
                onPointerEnter={() => setDraft(index)}
                onFocus={() => setDraft(index)}
                onClick={() => {
                  onChange?.(index);
                  setDraft(null);
                }}
              />
            </>
          )}
        </span>
      ))}
    </div>
  );
}
