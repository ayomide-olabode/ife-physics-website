export default async function Page({
  params,
}: {
  params: Promise<{ programmeCode: string; id: string }>;
}) {
  const { programmeCode, id } = await params;

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">Edit Study Option</h1>
      <p className="text-muted-foreground mt-2">
        {programmeCode} / {id}
      </p>
    </main>
  );
}
