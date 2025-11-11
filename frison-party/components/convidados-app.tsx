'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'

interface Convidado {
  id: number
  nome: string
  telefone?: string
  entrou: number
  total_confirmados: number
  acompanhantes_presentes: number
}

const ConvidadosApp = () => {
  const router = useRouter()
  const [convidados, setConvidados] = useState<Convidado[]>([])
  const [search, setSearch] = useState('')
  const [novoNome, setNovoNome] = useState('')
  const [novoTelefone, setNovoTelefone] = useState('')
  const [novoTotal, setNovoTotal] = useState('1')
  const [erroCadastro, setErroCadastro] = useState<string | null>(null)
  const [adicionando, setAdicionando] = useState(false)
  const [erroAcompanhantes, setErroAcompanhantes] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)

  useEffect(() => {
    const url = search
      ? `/api/convidados?search=${encodeURIComponent(search)}`
      : '/api/convidados'
    fetch(url)
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
      )
  }, [search])

  const handleAdicionarConvidado = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nome = novoNome.trim()
    const telefone = novoTelefone.trim()
    const total = Math.max(1, parseInt(novoTotal, 10) || 1)

    if (!nome) {
      setErroCadastro('Informe o nome do convidado.')
      return
    }

    setErroCadastro(null)
    setAdicionando(true)

    try {
      const response = await fetch('/api/convidados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          telefone: telefone || undefined,
          totalConfirmados: total,
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao cadastrar convidado.')
      }

      const criado: Convidado = await response.json()
      setConvidados((prev) =>
        [...prev, criado].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
      )
      setNovoNome('')
      setNovoTelefone('')
      setNovoTotal('1')
      setModalAberto(false)
    } catch (error) {
      setErroCadastro(
        error instanceof Error ? error.message : 'Não foi possível cadastrar o convidado.'
      )
    } finally {
      setAdicionando(false)
    }
  }

  const normalizarConvidado = (dados: any): Convidado => ({
    ...dados,
    entrou: dados.entrou === 1 || dados.entrou === true ? 1 : 0,
    total_confirmados: Math.max(1, Number(dados.total_confirmados) || 1),
    acompanhantes_presentes: Math.max(0, Number(dados.acompanhantes_presentes ?? 0) || 0),
  })

  const handleCheckIn = async (convidado: Convidado) => {
    let estadoAnterior: Convidado[] = []
    const novoEntrou = convidado.entrou === 1 ? 0 : 1
    const acompanhantesQuandoSai = novoEntrou === 1 ? convidado.acompanhantes_presentes : 0
    setConvidados((prev) => {
      estadoAnterior = prev.map((c) => ({ ...c }))
      return prev.map((c) =>
        c.id === convidado.id
          ? {
              ...c,
              entrou: novoEntrou,
              acompanhantes_presentes: novoEntrou === 1 ? c.acompanhantes_presentes : 0,
            }
          : c
      )
    })

    try {
      const response = await fetch(`/api/convidados/${convidado.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entrou: novoEntrou === 1,
          acompanhantesPresentes: acompanhantesQuandoSai,
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar')
      }

      const updated = normalizarConvidado(await response.json())
      setConvidados((prev) => prev.map((c) => (c.id === convidado.id ? updated : c)))
    } catch (error) {
      console.error(error)
      setConvidados(estadoAnterior)
    }
  }

  const atualizarAcompanhantes = async (id: number, delta: number) => {
    let estadoAnterior: Convidado[] = []
    let novoValor = 0
    let entrouAtual = false

    setErroAcompanhantes(null)

    setConvidados((prev) => {
      const alvo = prev.find((c) => c.id === id)
      if (!alvo) {
        return prev
      }

      if (alvo.entrou !== 1 && delta > 0) {
        setErroAcompanhantes('Marque o convidado como presente antes de adicionar acompanhantes.')
        return prev
      }

      const calculado = Math.max(0, alvo.acompanhantes_presentes + delta)
      if (calculado === alvo.acompanhantes_presentes) {
        return prev
      }

      estadoAnterior = prev.map((c) => ({ ...c }))
      novoValor = calculado
      entrouAtual = alvo.entrou === 1

      return prev.map((c) =>
        c.id === id ? { ...c, acompanhantes_presentes: calculado } : c
      )
    })

    if (!estadoAnterior.length) {
      return
    }

    try {
      const response = await fetch(`/api/convidados/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entrou: entrouAtual,
          acompanhantesPresentes: novoValor,
        }),
      })

      if (!response.ok) {
        throw new Error('Falha ao atualizar acompanhantes')
      }

      const atualizado = normalizarConvidado(await response.json())
      setConvidados((prev) => prev.map((c) => (c.id === id ? atualizado : c)))
    } catch (error) {
      console.error(error)
      setConvidados(estadoAnterior)
      setErroAcompanhantes('Não foi possível atualizar os acompanhantes. Tente novamente.')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      router.replace('/login')
      router.refresh()
    }
  }

  const presentesPorConvidado = (convidado: Convidado) =>
    (convidado.entrou === 1 ? 1 : 0) +
    (convidado.entrou === 1 ? convidado.acompanhantes_presentes : 0)
  const totalConvidados = convidados.length
  const totalPrevistos = convidados.reduce(
    (acc, c) => acc + Math.max(1, c.total_confirmados ?? 1),
    0
  )
  const presentes = convidados.reduce(
    (acc, c) => acc + presentesPorConvidado(c),
    0
  )
  const titularesPresentes = convidados.filter((c) => c.entrou === 1).length

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Lista de Presença</h1>
              <p className="text-sm text-gray-500">Somente usuários autorizados podem visualizar.</p>
            </div>
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => setModalAberto(true)}
                className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700"
              >
                Adicionar convidado
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                Sair
              </button>
            </div>
          </div>
          <div className="flex gap-6 mb-4">
            <div>
              <span className="text-sm text-gray-600">Convidados: </span>
              <span className="font-bold">{totalConvidados}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Previstos: </span>
              <span className="font-bold">{totalPrevistos}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Presentes (titulares): </span>
              <span className="font-bold text-green-600">{titularesPresentes}</span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Presentes (pessoas): </span>
              <span className="font-bold text-green-600">{presentes}</span>
            </div>
          </div>
          <Input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
          {erroAcompanhantes && (
            <p className="mt-2 text-sm text-red-500">{erroAcompanhantes}</p>
          )}
        </div>

        <div className="space-y-2">
          {convidados.map((c) => (
            <div
              key={c.id}
              className={`flex items-center gap-4 p-4 bg-white rounded-lg border ${
                c.entrou === 1 ? 'border-green-300 bg-green-50' : ''
              }`}
            >
              <Checkbox
                checked={c.entrou === 1}
                onCheckedChange={() => handleCheckIn(c)}
              />
              <div className="flex-1">
                <div className="font-medium">{c.nome}</div>
                {c.telefone && <div className="text-sm text-gray-500">{c.telefone}</div>}
                <div className="text-xs text-gray-500">
                  Acompanhantes presentes: {c.entrou === 1 ? c.acompanhantes_presentes : 0}
                </div>
                <div className="text-xs text-gray-400">
                  Previsto: {Math.max(1, c.total_confirmados ?? 1)} pessoa
                  {Math.max(1, c.total_confirmados ?? 1) > 1 ? 's' : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => atualizarAcompanhantes(c.id, -1)}
                  disabled={c.acompanhantes_presentes === 0 || c.entrou !== 1}
                  className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-lg text-gray-600 transition hover:bg-gray-100 disabled:opacity-30"
                >
                  -
                </button>
                <span className="w-6 text-center text-sm font-medium">
                  {c.entrou === 1 ? c.acompanhantes_presentes : 0}
                </span>
                <button
                  type="button"
                  onClick={() => atualizarAcompanhantes(c.id, 1)}
                  disabled={c.entrou !== 1}
                  className="flex h-8 w-8 items-center justify-center rounded border border-gray-300 text-lg text-gray-600 transition hover:bg-gray-100 disabled:opacity-30"
                >
                  +
                </button>
              </div>
              {c.entrou === 1 && <span className="text-green-600 text-sm">✓</span>}
            </div>
          ))}
        </div>
      </div>
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Novo convidado</h2>
                <p className="text-sm text-gray-500">
                  Informe os dados do titular e o total previsto de pessoas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setModalAberto(false)
                  setErroCadastro(null)
                }}
                className="text-sm text-gray-500 transition hover:text-gray-700"
              >
                Fechar
              </button>
            </div>
            <form onSubmit={handleAdicionarConvidado} className="space-y-3">
              <Input
                placeholder="Nome do convidado"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
              />
              <Input
                placeholder="Telefone"
                value={novoTelefone}
                onChange={(e) => setNovoTelefone(e.target.value)}
              />
              <div className="flex items-center gap-3">
                <label htmlFor="total-confirmados" className="text-sm text-gray-600">
                  Total (convidado + acompanhantes)
                </label>
                <input
                  id="total-confirmados"
                  type="number"
                  min={1}
                  value={novoTotal}
                  onChange={(e) => setNovoTotal(e.target.value)}
                  className="w-24 rounded-md border border-gray-300 px-2 py-1 text-sm"
                />
              </div>
              {erroCadastro && <p className="text-sm text-red-500">{erroCadastro}</p>}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalAberto(false)
                    setErroCadastro(null)
                  }}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adicionando}
                  className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-60"
                >
                  {adicionando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConvidadosApp
