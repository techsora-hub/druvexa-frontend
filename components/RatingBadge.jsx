export default function RatingBadge({ rating }) {
  if (rating === null || rating === undefined) return null;

  return (
    <span className="inline-flex items-center gap-1.5 bg-bg-card border border-white/10 rounded-md overflow-hidden text-[12px] font-bold">
      <span className="bg-accent text-bg px-2 py-1">IMDb</span>
      <span className="px-2 py-1 text-text-hi">{rating.toFixed(1)}</span>
    </span>
  );
}