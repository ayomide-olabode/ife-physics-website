export default async function Page({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">Research Group Detail</h1>
      <p className="text-muted-foreground mt-2">{groupId}</p>
    </main>
  );
}
