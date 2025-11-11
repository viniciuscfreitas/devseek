'use client';

import { useEffect, useState } from 'react';

interface Convidado {
  id: number;
  nome: string;
  telefone?: string;
  entrou: number;
  total_confirmados: number;
  acompanhantes_presentes: number;
}

export default function RelatoriosPage() {
  const [convidados, setConvidados] = useState<Convidado[]>([]);

  useEffect(() => {
    fetch('/api/convidados')
      .then((res) => res.json())
      .then((data) =>
        setConvidados(
          Array.isArray(data)
            ? data.map((item: any) => ({
                ...item,
                entrou: item.entrou === 1 ? 1 : 0,
                total_confirmados: Math.max(1, Number(item.total_confirmados) || 1),
                acompanhantes_presentes: Math.max(
                  0,
                  Number(item.acompanhantes_presentes ?? 0) || 0
                ),
              }))
            : []
        )
      );
  }, []);

  const presentesPorConvidado = (convidado: Convidado) =>
    (convidado.entrou === 1 ? 1 : 0) +
    (convidado.entrou === 1 ? convidado.acompanhantes_presentes : 0);
  const totalConvidados = convidados.length;
  const totalPrevistos = convidados.reduce(
    (acc, c) => acc + Math.max(1, c.total_confirmados ?? 1),
    0
  );
  const presentes = convidados.reduce(
    (acc, c) => acc + presentesPorConvidado(c),
    0
  );
  const titularesPresentes = convidados.filter((c) => c.entrou === 1).length;
  const ausentes = Math.max(0, totalPrevistos - presentes);
  const taxa = totalPrevistos > 0 ? Math.round((presentes / totalPrevistos) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Relatórios</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Convidados</div>
            <div className="text-3xl font-bold">{totalConvidados}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Previstos (pessoas)</div>
            <div className="text-3xl font-bold">{totalPrevistos}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Presentes (titulares)</div>
            <div className="text-3xl font-bold text-green-600">{titularesPresentes}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Presentes</div>
            <div className="text-3xl font-bold text-green-600">{presentes}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Ausentes</div>
            <div className="text-3xl font-bold text-gray-400">{ausentes}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Taxa</div>
            <div className="text-3xl font-bold">{taxa}%</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Taxa de Presença</h2>
          <div className="w-full bg-gray-200 rounded-full h-6">
            <div
              className="bg-green-600 h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs"
              style={{ width: `${taxa}%` }}
            >
              {taxa > 10 && `${taxa}%`}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Presentes (pessoas: {presentes})</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {convidados
                .filter((c) => c.entrou === 1)
                .map((c) => {
                  const acompanhantes = c.acompanhantes_presentes;
                  const pessoas = presentesPorConvidado(c);
                  return (
                    <div key={c.id} className="p-2 bg-green-50 rounded">
                      <div className="font-medium">{c.nome}</div>
                      {c.telefone && <div className="text-sm text-gray-500">{c.telefone}</div>}
                      <div className="text-xs text-gray-500">
                        Titular + {acompanhantes} acompanhante{acompanhantes === 1 ? '' : 's'} (
                        {pessoas} pessoa{pessoas === 1 ? '' : 's'} no total)
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Previsto x Ausente ({ausentes})</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {convidados
                .filter((c) => c.entrou === 0)
                .map((c) => {
                  const previsto = Math.max(1, c.total_confirmados ?? 1);
                  return (
                    <div key={c.id} className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">{c.nome}</div>
                      {c.telefone && <div className="text-sm text-gray-500">{c.telefone}</div>}
                      <div className="text-xs text-gray-500">
                        Previsto: {previsto} pessoa{previsto === 1 ? '' : 's'}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

