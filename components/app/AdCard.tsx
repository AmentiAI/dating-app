type Props = {
  compact?: boolean;
};

export function AdCard({ compact = false }: Props) {
  return (
    <aside className={`card border-accent2/30 bg-surface2/60 ${compact ? "p-3" : "p-4"}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Sponsored</p>
      <p className={`mt-1 font-semibold text-ink ${compact ? "text-sm" : "text-base"}`}>
        Level up your profile photos in 10 minutes.
      </p>
      <p className={`mt-1 text-sub ${compact ? "text-xs" : "text-sm"}`}>
        Explorer includes occasional sponsor spots. Upgrade to Plus for an ad-free experience.
      </p>
    </aside>
  );
}
