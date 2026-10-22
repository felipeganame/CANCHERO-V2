export default function BuscarLoading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center bg-ground px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-line border-t-bordo"
          role="status"
          aria-label="Cargando resultados"
        />
        <p className="text-sm font-semibold text-muted">
          Buscando canchas disponibles...
        </p>
      </div>
    </main>
  );
}
