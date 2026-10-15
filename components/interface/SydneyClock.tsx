"use client";

import { useEffect, useRef } from "react";

// Sydney's local time, so visitors anywhere can see how far away it is. Filled in after mount,
// because the server's clock and the visitor's clock never agree.
export function SydneyClock() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-AU", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "Australia/Sydney",
    });
    const update = () => {
      if (ref.current) ref.current.textContent = `SYD ${format.format(new Date())}`;
    };
    update();
    const id = window.setInterval(update, 15000);
    return () => window.clearInterval(id);
  }, []);

  return <span ref={ref} className="site-clock" title="Current time in Sydney" />;
}
