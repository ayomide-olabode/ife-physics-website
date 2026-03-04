export default async function Page({
  params,
}: {
  params: Promise<{ groupId: string; id: string }>;
}) {
  const { groupId, id } = await params;

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">Edit Publication</h1>
      <p className="text-muted-foreground mt-2">
        {groupId} / {id}
      </p>
    </main>
  );
}
