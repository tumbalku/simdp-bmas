import { notFound } from "next/navigation";

export default function ComponentPreviewRoute() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-4 px-6 py-12">
      <p className="text-sm font-medium text-muted-foreground">SIMDP local preview</p>
      <h1 className="text-2xl font-semibold tracking-tight">Component preview hanya untuk development</h1>
      <p className="text-muted-foreground">
        Route ini sengaja menampilkan halaman placeholder di development dan mengembalikan 404 pada production.
        Sandbox komponen detail tetap bersifat lokal dan tidak ikut version control.
      </p>
    </main>
  );
}
