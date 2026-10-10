export function PageSkeleton() {
  return (
    <div
      className="page-skeleton"
      aria-label="Loading workspace"
      aria-busy="true"
    >
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-subtitle" />
      <div className="skeleton-metrics">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton" />
        ))}
      </div>
      <div className="skeleton-columns">
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    </div>
  );
}
