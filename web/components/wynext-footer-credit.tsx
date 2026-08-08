export function WynextFooterCredit() {
  const year = new Date().getFullYear();

  return (
    <footer className="shrink-0 border-t border-white/10 bg-black/90 px-3 py-2 text-center text-[10px] leading-snug text-white/55 sm:text-[11px]">
      <p>
        © {year}{" "}
        <a
          href="https://wynext.online"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-white/80 underline-offset-2 hover:text-white hover:underline"
        >
          Wynext
        </a>{" "}
        — Willy Gomes. Todos os direitos reservados.
      </p>
      <p className="mt-0.5">
        <a
          href="https://wynext.online"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/70 underline-offset-2 hover:text-white hover:underline"
        >
          Conhecer serviços Wynext
        </a>
      </p>
    </footer>
  );
}
