import { Decode } from "@/components/interface/Decode";

// The small mono line above each panel title.
export function Kicker({ text }: { text: string }) {
  return (
    <p className="kicker">
      <span>
        <Decode text={text} />
      </span>
    </p>
  );
}
