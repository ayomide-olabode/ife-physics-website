import Image from 'next/image';

type FocusAreaItem = {
  id: string;
  title: string;
  imageUrl?: string | null;
};

export function FocusAreasGrid({ items }: { items: FocusAreaItem[] }) {
  if (items.length === 0) {
    return (
      <div className="border border-gray-200 bg-white p-6 text-sm text-gray-500 rounded-none">
        No focus areas available for this group yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <article
          key={item.id}
          className="border border-gray-200 bg-white rounded-none overflow-hidden"
        >
          <div className="relative h-44 bg-gray-100">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-brand-navy/80 to-brand-navy/60 flex items-center justify-center">
                <span className="text-brand-yellow text-xs font-semibold tracking-widest uppercase">
                  Focus Area
                </span>
              </div>
            )}
          </div>
          <div className="p-4">
            <h3 className="text-brand-navy font-semibold leading-snug">{item.title}</h3>
          </div>
        </article>
      ))}
    </div>
  );
}
