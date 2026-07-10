export function PublicAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-8 sm:px-6">
        {children}
      </div>
    </main>
  );
}
