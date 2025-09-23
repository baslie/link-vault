export function AppShellSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-6 w-28 rounded-md bg-muted animate-pulse" />
              <div className="hidden h-3 w-44 rounded-full bg-muted/80 animate-pulse md:block" />
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden h-9 w-32 rounded-md bg-muted animate-pulse sm:inline-flex" />
              <div className="h-10 w-10 rounded-md bg-muted animate-pulse" />
              <div className="h-10 w-24 rounded-md bg-muted animate-pulse" />
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="h-10 w-full rounded-md bg-muted animate-pulse sm:max-w-xl" />
            <div className="flex items-center gap-3">
              <div className="h-10 w-40 rounded-md bg-muted animate-pulse" />
              <div className="h-9 w-32 rounded-md bg-muted animate-pulse sm:hidden" />
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto flex w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:py-12">
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <div className="h-32 rounded-xl bg-muted/80 animate-pulse" />
          <div className="h-32 rounded-xl bg-muted/80 animate-pulse" />
        </div>
      </main>
    </div>
  );
}
