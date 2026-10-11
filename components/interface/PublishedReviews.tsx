"use client";

import { useEffect, useState } from "react";
import { StarRating } from "@/components/interface/StarRating";
import { formatReviewDate } from "@/config/reviews";
import type { Review } from "@/config/types";

export function PublishedReviews({ heading }: { heading?: string }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/reviews", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { reviews?: Review[] }) => {
        if (!cancelled) setReviews(payload.reviews ?? []);
      })
      .catch(() => {
        if (!cancelled) setReviews([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!reviews?.length) return null;

  return (
    <section className="reviews-feed" aria-label={heading ?? "Approved reviews"}>
      {heading ? <h3>{heading}</h3> : null}
      <ul className="reviews">
        {reviews.map((review) => {
          const stamped = formatReviewDate(review.date);
          return (
          <li key={review.id}>
            <blockquote className="review-card">
              <StarRating value={review.rating} readOnly />
              <p>{review.quote}</p>
              <footer>
                {review.avatar ? (
                  <img src={review.avatar} alt="" width={36} height={36} referrerPolicy="no-referrer" />
                ) : (
                  <span className="review-avatar-fallback" />
                )}
                <span>
                  <cite>{review.name}</cite>
                  {review.profileUrl ? (
                    <a className="review-profile" href={review.profileUrl} target="_blank" rel="noreferrer">
                      View profile
                    </a>
                  ) : null}
                  {stamped ? (
                    <time className="review-date" dateTime={review.date}>
                      {stamped}
                    </time>
                  ) : null}
                </span>
              </footer>
            </blockquote>
          </li>
          );
        })}
      </ul>
    </section>
  );
}
