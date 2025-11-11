const SIGLA_LENGTH_THRESHOLD = 3;

export function padronizarNome(nome: string): string {
  if (!nome) return '';

  let nomePadronizado = nome.trim().replace(/\s+/g, ' ');

  nomePadronizado = nomePadronizado
    .split(' ')
    .map((palavra) => {
      if (palavra.length === 0) return '';
      if (palavra.length <= SIGLA_LENGTH_THRESHOLD && palavra === palavra.toUpperCase()) {
        return palavra;
      }
      return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
    })
    .join(' ');

  return nomePadronizado;
}

export function padronizarTelefone(telefone: string | undefined): string | undefined {
  if (!telefone) return undefined;

  let telefoneLimpo = telefone.replace(/[^\d+]/g, '');

  if (telefoneLimpo.startsWith('+')) {
    return telefoneLimpo;
  }

  telefoneLimpo = telefoneLimpo.replace(/^0+/, '');

  if (telefoneLimpo.length === 0) {
    return undefined;
  }

  if (telefoneLimpo.length >= 10 && telefoneLimpo.length <= 11) {
    const ddd = telefoneLimpo.substring(0, 2);
    const numero = telefoneLimpo.substring(2);

    if (numero.length === 9) {
      return `${ddd} ${numero.substring(0, 5)}-${numero.substring(5)}`;
    }
    if (numero.length === 8) {
      return `${ddd} ${numero.substring(0, 4)}-${numero.substring(4)}`;
    }
  }

  return telefoneLimpo;
}

export function normalizarTotalConfirmados(valor: unknown): number {
  const numero = typeof valor === 'string' ? parseInt(valor.replace(/[^\d]/g, ''), 10) : Number(valor);
  if (Number.isNaN(numero) || numero <= 0) return 1;
  return numero;
}

