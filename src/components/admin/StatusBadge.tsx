type Status = 'draft' | 'published' | 'archived' | string;

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-gray-700 text-gray-300 border-gray-600',
  published: 'bg-green-900/50 text-green-400 border-green-700',
  archived: 'bg-yellow-900/50 text-yellow-400 border-yellow-700',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};

interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();
  const style = STATUS_STYLES[normalized] ?? 'bg-gray-700 text-gray-300 border-gray-600';
  const label = STATUS_LABELS[normalized] ?? status;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style}`}>
      {label}
    </span>
  );
}
