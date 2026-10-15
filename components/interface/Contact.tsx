import { Kicker } from "@/components/interface/Kicker";
import { contactCopy, site } from "@/config/site";

export function Contact() {
  const { booking } = contactCopy;

  return (
    <article className="panel">
      <Kicker text="Studio and agency" index="05 / 05" />
      <h1>{contactCopy.headline}</h1>
      <p className="lede">{contactCopy.lede}</p>
      <p>
        <a href={`mailto:${site.email}`}>{site.email}</a>
      </p>
      {booking.href ? (
        <section className="stack" aria-labelledby="booking-heading">
          <h3 id="booking-heading">{booking.heading}</h3>
          <a className="offer-cta booking-cta" href={booking.href} target="_blank" rel="noreferrer">
            {booking.label}
          </a>
        </section>
      ) : null}
    </article>
  );
}
