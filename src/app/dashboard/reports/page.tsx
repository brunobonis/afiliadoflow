'use client'

import { useState } from 'react'

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Relatórios</h1>
          <p className="text-slate-400 mt-1">Análises e exportações de dados</p>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Período de Análise</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Data Início
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Data Fim</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="w-full px-4 py-2 bg-[#0F172A] border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
            />
          </div>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-[#38BDF8] text-white rounded-lg hover:bg-[#0EA5E9] transition-colors">
              Aplicar Filtro
            </button>
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportCard
          title="Desempenho de Produtos"
          description="Análise completa de vendas por produto"
          icon="📦"
          items={[
            'Top 10 produtos mais vendidos',
            'Taxa de conversão por produto',
            'Receita e comissões por produto',
            'Evolução temporal de vendas',
          ]}
        />

        <ReportCard
          title="Performance de Links"
          description="Análise de cliques e conversões"
          icon="🔗"
          items={[
            'Links com mais cliques',
            'Taxa de conversão por link',
            'Origem do tráfego (UTM)',
            'Horários de maior engajamento',
          ]}
        />

        <ReportCard
          title="Análise de Campanhas"
          description="ROI e efetividade das campanhas"
          icon="📢"
          items={[
            'Gastos vs. Receita por campanha',
            'ROI e ROAS',
            'Custo por aquisição (CPA)',
            'Performance por plataforma',
          ]}
        />

        <ReportCard
          title="Comissões e Pagamentos"
          description="Controle financeiro completo"
          icon="💰"
          items={[
            'Comissões confirmadas vs. pendentes',
            'Histórico de recebimentos',
            'Previsão de ganhos',
            'Comparativo mensal',
          ]}
        />
      </div>

      {/* Export Section */}
      <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Exportar Dados</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="px-4 py-3 bg-[#0F172A] border border-slate-700 text-white rounded-lg hover:bg-[#334155] transition-colors text-left">
            <div className="text-sm font-medium mb-1">📊 Relatório Completo (Excel)</div>
            <div className="text-xs text-slate-400">Todos os dados do período</div>
          </button>

          <button className="px-4 py-3 bg-[#0F172A] border border-slate-700 text-white rounded-lg hover:bg-[#334155] transition-colors text-left">
            <div className="text-sm font-medium mb-1">📄 Vendas (CSV)</div>
            <div className="text-xs text-slate-400">Exportar histórico de vendas</div>
          </button>

          <button className="px-4 py-3 bg-[#0F172A] border border-slate-700 text-white rounded-lg hover:bg-[#334155] transition-colors text-left">
            <div className="text-sm font-medium mb-1">🔗 Links (CSV)</div>
            <div className="text-xs text-slate-400">Cliques e conversões</div>
          </button>
        </div>
      </div>

      {/* Coming Soon */}
      <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-lg border border-slate-800 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#38BDF8]/10 rounded-full mb-4">
          <span className="text-3xl">📈</span>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Relatórios Avançados em Desenvolvimento
        </h3>
        <p className="text-slate-400 text-sm max-w-2xl mx-auto">
          Estamos preparando análises ainda mais profundas: gráficos interativos, comparativos
          de período, análise de cohort, previsões com IA e muito mais.
        </p>
      </div>
    </div>
  )
}

function ReportCard({
  title,
  description,
  icon,
  items,
}: {
  title: string
  description: string
  icon: string
  items: string[]
}) {
  return (
    <div className="bg-[#1E293B] rounded-lg border border-slate-800 p-6 hover:border-[#38BDF8]/50 transition-colors">
      <div className="flex items-start gap-4 mb-4">
        <div className="text-3xl">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400 mt-1">{description}</p>
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
            <span className="text-[#38BDF8] mt-1">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <button className="w-full mt-4 px-4 py-2 bg-[#0F172A] border border-slate-700 text-white rounded-lg hover:bg-[#334155] transition-colors text-sm">
        Gerar Relatório
      </button>
    </div>
  )
}
