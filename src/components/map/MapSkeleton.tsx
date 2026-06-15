export function MapSkeleton({ className }: { className?: string }) {
  return (
    <div className={`relative h-full w-full overflow-hidden ${className ?? ""}`}>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #dceada 0%, #e8efe4 40%, #cfe0ea 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(0deg, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="rounded-md bg-white/80 px-3 py-1.5 text-sm font-semibold text-muted-foreground shadow">
          Harita yükleniyor…
        </span>
      </div>
    </div>
  );
}
