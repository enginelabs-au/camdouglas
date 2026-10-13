"use client";

import { useState, type KeyboardEvent } from "react";
import { aboutTabs, type AboutTabId } from "@/config/about";

export function About() {
  const [tab, setTab] = useState<AboutTabId>("music");
  const section = aboutTabs.find((item) => item.id === tab) ?? aboutTabs[0];

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowRight", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = aboutTabs.findIndex((item) => item.id === tab);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % aboutTabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + aboutTabs.length) % aboutTabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = aboutTabs.length - 1;
    const id = aboutTabs[next].id;
    setTab(id);
    document.getElementById(`about-tab-${id}`)?.focus();
  }

  return (
    <article className="panel panel-wide">
      <p className="kicker">{section.kicker}</p>
      <h1>About</h1>
      <div className="panel-tabs" role="tablist" aria-label="About sections" onKeyDown={onTabKeyDown}>
        {aboutTabs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`about-tab-${item.id}`}
            tabIndex={tab === item.id ? 0 : -1}
            aria-selected={tab === item.id}
            aria-controls={`about-panel-${item.id}`}
            onClick={() => setTab(item.id)}
          >
            {item.tab}
          </button>
        ))}
      </div>

      <div
        key={section.id}
        id={`about-panel-${section.id}`}
        role="tabpanel"
        aria-labelledby={`about-tab-${section.id}`}
      >
        <h3 className="about-heading">{section.headline}</h3>
        <p className="lede">{section.lede}</p>
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}

        <section className="stack" aria-labelledby={`${section.id}-skills-heading`}>
          <h4 id={`${section.id}-skills-heading`}>Skills</h4>
          <ul className="chip-row">
            {section.skills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </section>

        {section.stack ? (
          <section className="stack" aria-labelledby={`${section.id}-stack-heading`}>
            <h4 id={`${section.id}-stack-heading`}>Tech stack</h4>
            <ul className="chip-row">
              {section.stack.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="about-links">
          {section.links.map((link, index) => (
            <span key={link.href}>
              {index > 0 ? " · " : null}
              <a href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            </span>
          ))}
        </p>
      </div>
    </article>
  );
}
