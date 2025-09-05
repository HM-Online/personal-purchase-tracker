type KpiCardProps = {
  title: string;
  value: number | undefined;
};

export default function KpiCard({ title, value }: KpiCardProps) {
  return (
    <div className="bg-surface-dark p-4 rounded-lg text-center shadow-lg">
      <p className="text-sm font-medium text-text-muted">{title}</p>
      <p className="text-3xl font-bold text-text-light mt-1">
        {value === undefined ? '...' : value}
      </p>
    </div>
  );
}