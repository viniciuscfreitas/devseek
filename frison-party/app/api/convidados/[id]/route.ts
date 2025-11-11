import { requireAuth } from '@/lib/auth';
import { updateConvidadoStatus } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!requireAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const { entrou, acompanhantesPresentes } = await request.json();
    if (typeof entrou === 'undefined' && typeof acompanhantesPresentes === 'undefined') {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar informado.' },
        { status: 400 }
      );
    }

    const entrouValue = typeof entrou === 'boolean' ? entrou : undefined;
    if (typeof entrouValue === 'undefined') {
      return NextResponse.json({ error: 'Campo "entrou" obrigatório.' }, { status: 400 });
    }

    const acompanhanteNumber =
      typeof acompanhantesPresentes === 'undefined'
        ? undefined
        : Math.max(0, Math.floor(Number(acompanhantesPresentes) || 0));

    const convidado = updateConvidadoStatus(id, entrouValue, acompanhanteNumber);

    return convidado
      ? NextResponse.json(convidado)
      : NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
  } catch (error: any) {
    // SQLite com WAL mode lida bem com concorrência
    // Se realmente tiver problema, usuário pode tentar novamente
    console.error('Erro ao atualizar check-in:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar. Tente novamente.' },
      { status: 500 }
    );
  }
}

