import { requireAuth } from '@/lib/auth';
import { createConvidado, getAllConvidados } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  if (!requireAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const search = request.nextUrl.searchParams.get('search') || undefined;
    const convidados = getAllConvidados(search);
    return NextResponse.json(Array.isArray(convidados) ? convidados : []);
  } catch (error) {
    console.error('Erro ao listar convidados:', error);
    return NextResponse.json({ error: 'Erro interno ao listar convidados.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!requireAuth(request)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const { nome, telefone, totalConfirmados } = await request.json();
    if (!nome?.trim()) {
      return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
    }
    const total = Number.isFinite(totalConfirmados) ? Number(totalConfirmados) : 1;
    const convidadosTotal = total > 0 ? Math.floor(total) : 1;
    const convidado = createConvidado(nome.trim(), telefone?.trim(), convidadosTotal);
    return NextResponse.json(convidado, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar convidado:', error);
    return NextResponse.json({ error: 'Erro interno ao criar convidado.' }, { status: 500 });
  }
}

