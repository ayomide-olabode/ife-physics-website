const stats = [
  { value: 'est. 1962', label: 'Year Founded' },
  { value: '3', label: 'Academic Programmes' },
  { value: '8', label: 'Research Groups' },
  { value: '2000+', label: 'Students' },
];

export function StatsStrip() {
  return (
    <div className="relative z-10 -mt-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="bg-white shadow-lg border border-gray-100">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
            {stats.map((stat) => (
              <div key={stat.label} className="px-6 py-6 text-center">
                <p className="text-2xl sm:text-3xl font-serif font-bold text-brand-navy">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
