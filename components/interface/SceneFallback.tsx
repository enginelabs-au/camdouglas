import { fallbackImage, sceneCredit } from "@/config/scene";

type SceneFallbackProps = {
  reason: "unsupported" | "error";
  message?: string | null;
};

export function SceneFallback({ reason, message }: SceneFallbackProps) {
  return (
    <div className="fallback">
      <img className="fallback-image" src={fallbackImage.src} alt={fallbackImage.alt} />
      <div className="fallback-copy">
        <p className="kicker">Still image</p>
        <h2>{reason === "unsupported" ? "This browser cannot render the world." : "The world could not be loaded."}</h2>
        <p>
          {message ??
            "The ASCII galaxy needs a current browser with canvas support. The written site remains available."}
        </p>
        <p className="note">{sceneCredit}</p>
      </div>
    </div>
  );
}
