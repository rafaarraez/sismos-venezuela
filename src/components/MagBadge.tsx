import { magnitudeInfo } from "@/lib/constants";
import { formatMag } from "@/lib/format";

export function MagBadge({
  mag,
  size = "md",
}: {
  mag: number | null;
  size?: "sm" | "md" | "lg";
}) {
  const info = magnitudeInfo(mag);
  const dims =
    size === "lg"
      ? "h-14 w-14 text-xl"
      : size === "sm"
      ? "h-9 w-9 text-sm"
      : "h-11 w-11 text-base";

  return (
    <div
      className={`${dims} flex shrink-0 items-center justify-center rounded-xl font-bold tabular-nums`}
      style={{
        color: info.color,
        background: `${info.color}1f`,
        boxShadow: `inset 0 0 0 1px ${info.color}55`,
      }}
      title={`${info.label} — ${info.desc}`}
    >
      {formatMag(mag)}
    </div>
  );
}
