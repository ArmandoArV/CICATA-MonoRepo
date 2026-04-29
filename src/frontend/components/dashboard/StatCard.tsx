import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface StatCardProps {
  icon: IconDefinition;
  iconColor: string;
  iconBg: string;
  value: number;
  label: string;
}

export function StatCard({
  icon,
  iconColor,
  iconBg,
  value,
  label,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
        style={{ backgroundColor: iconBg }}
      >
        <FontAwesomeIcon icon={icon} className="text-lg" style={{ color: iconColor }} />
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}
