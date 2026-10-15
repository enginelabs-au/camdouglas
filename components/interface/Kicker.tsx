import { Decode } from "@/components/interface/Decode";

// The small mono line above each panel title, with the panel's place in the site on the right.
export function Kicker({ text, index }: { text: string; index?: string }) {
  return (
    <p className="kicker">
      <span>
        <Decode text={text} />
      </span>
      {index ? <span className="panel-tag">{index}</span> : null}
    </p>
  );
}
