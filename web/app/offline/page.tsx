import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">Você está offline</h1>
      <p className="text-sm text-muted-foreground">
        Verifique sua conexão e tente novamente para continuar o agendamento.
      </p>
      <Link
        href="/"
        className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
      >
        Tentar novamente
      </Link>
    </div>
  );
}
