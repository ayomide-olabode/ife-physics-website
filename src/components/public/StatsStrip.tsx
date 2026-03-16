const stats = [
  { value: '1962', label: 'est.' },
  { value: '3', label: 'academic programmes' },
  { value: '8', label: 'research groups' },
  { value: '2000+', label: 'students' },
];

export function StatsStrip() {
  return (
    <div className="relative -mt-20 z-20 w-full max-w-6xl mx-auto px-4">
      <div className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.1)] rounded-[1px] py-10 px-8 grid grid-cols-2 space-y-4 gap-4 md:space-y-0 md:flex flex-col md:flex-row justify-between items-start md:items-center text-[#002147]">
        <div className="flex flex-col-reverse md:flex-row text-center md:text-left items-center gap-1 md:gap-2">
          <span className="text-sm font-medium text-gray-500 leading-tight">{stats[0].label}</span>
          <span className="text-5xl font-bold">{stats[0].value}</span>
        </div>

        <Divider />

        <StatsItem value={stats[1].value} label={stats[1].label} />

        <Divider />

        <StatsItem value={stats[2].value} label={stats[2].label} />

        <Divider />

        <StatsItem value={stats[3].value} label={stats[3].label} />
      </div>
    </div>
  );
}

function StatsItem({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col md:flex-row text-center md:text-left items-center gap-1 md:gap-3">
      <span className="text-5xl font-bold">{value}</span>
      <span className="text-sm font-medium text-gray-500 leading-tight w-24">{label}</span>
    </div>
  );
}

function Divider() {
  return <div className="hidden md:block w-px h-12 bg-gray-200 mx-4" />;
}
