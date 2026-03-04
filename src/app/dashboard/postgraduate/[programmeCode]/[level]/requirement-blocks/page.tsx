export default async function Page({
  params,
}: {
  params: Promise<{ programmeCode: string; level: string }>;
}) {
  const { programmeCode, level } = await params;

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">Requirement Blocks</h1>
      <p className="text-muted-foreground mt-2">
        {programmeCode} / {level}
      </p>
    </main>
  );
}
