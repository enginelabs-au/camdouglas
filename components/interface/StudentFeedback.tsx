import { approvedReviews, reviewProviders } from "@/config/reviews";

export function StudentFeedback() {
  return (
    <section className="stack" aria-labelledby="feedback-heading">
      <h3 id="feedback-heading">Reviews</h3>
      {approvedReviews.length === 0 ? (
        <p className="empty-state">Approved reviews appear here with the person’s platform username.</p>
      ) : (
        <ul className="reviews">
          {approvedReviews.map((review) => (
            <li key={review.id}>
              <blockquote>
                <p>{review.quote}</p>
                <footer>
                  <cite>{review.name}</cite>
                  {review.profileUrl ? (
                    <a href={review.profileUrl} target="_blank" rel="noreferrer">
                      {review.provider === "github" ? `@${review.handle}` : review.handle} ·{" "}
                      {reviewProviders.find((item) => item.id === review.provider)?.label}
                    </a>
                  ) : (
                    <span>
                      {review.handle} · {reviewProviders.find((item) => item.id === review.provider)?.label}
                    </span>
                  )}
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
