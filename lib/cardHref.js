// Where a movie/series card should send the person: straight to the detail
// page (with ?autoplay=1 so the video starts right away) if they're already
// an active subscriber, otherwise straight to the plans/payment page, which
// carries the detail page along as ?redirect= so it can send them the rest
// of the way once payment succeeds. Keeps the flow to Home -> card click ->
// Payment -> Thank You -> video, without an extra detail-page stop for
// someone who hasn't paid yet.
export function cardHref(item) {
  const detailPath = `/${item.type === 'movie' ? 'movies' : 'series'}/${item.slug}`;
  const detailWithAutoplay = `${detailPath}?autoplay=1`;

  let isActiveSubscriber = false;
  if (typeof window !== 'undefined') {
    try {
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      // "active" alone isn't enough: the cached user may have expired since.
      isActiveSubscriber =
        user?.subscriptionStatus === 'active' &&
        (!user.subscriptionExpiry || new Date(user.subscriptionExpiry) > new Date());
    } catch {
      // malformed cached user — treat as not subscribed, plans page is safe
    }
  }

  return isActiveSubscriber ? detailWithAutoplay : `/plans?redirect=${encodeURIComponent(detailWithAutoplay)}`;
}