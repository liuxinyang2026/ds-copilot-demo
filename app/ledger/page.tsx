'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Demand = {
  id: string
  title: string
  demand_type: string | null
  ds_owner: string | null
  product_owner: string | null
  prd_url: string | null
  current_stage: string | null
  status: string | null
  created_at: string
}

type StageOutput = {
  id: string
  demand_id: string
  stage_code: string
  output_text: string
  created_at: string
}

const stageNameMap: Record<string, string> = {
  '01_prd_read': '会前准备',
  '02_clarify': '口径澄清',
  '03_meeting_review': '会后复盘',
  '04_table_design': '数据表设计',
}

export default function LedgerPage() {
  const [demands, setDemands] = useState<Demand[]>([])
  const [outputs, setOutputs] = useState<StageOutput[]>([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)

    const { data: demandData, error: demandError } = await supabase
      .from('demands')
      .select('*')
      .order('created_at', { ascending: false })

    if (demandError) {
      alert(demandError.message)
      setLoading(false)
      return
    }

    const { data: outputData, error: outputError } = await supabase
      .from('stage_outputs')
      .select('*')
      .order('created_at', { ascending: false })

    if (outputError) {
      alert(outputError.message)
      setLoading(false)
      return
    }

    setDemands(demandData || [])
    setOutputs(outputData || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const outputCountByDemand = useMemo(() => {
    const map: Record<string, number> = {}
    outputs.forEach((item) => {
      map[item.demand_id] = (map[item.demand_id] || 0) + 1
    })
    return map
  }, [outputs])

  const latestStageByDemand = useMemo(() => {
    const map: Record<string, string> = {}
    outputs.forEach((item) => {
      if (!map[item.demand_id]) {
        map[item.demand_id] = item.stage_code
      }
    })
    return map
  }, [outputs])

  const experimentDemandCount = demands.filter((item) => item.demand_type === '实验分析').length
  const demandsWithOutputCount = demands.filter((item) => outputCountByDemand[item.id] > 0).length

  return (
    <main style={pageStyle}>
      <section style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <Link href="/" style={backLinkStyle}>← 返回需求列表</Link>
            <h1 style={titleStyle}>DS 需求对接台账</h1>
            <p style={subtitleStyle}>沉淀需求对接过程、阶段输出和可复盘的 DS 共创痕迹。</p>
          </div>
          <button onClick={loadData} style={buttonStyle}>刷新数据</button>
        </header>

        <section style={metricGridStyle}>
          <MetricCard label="需求总数" value={String(demands.length)} note="已进入系统的产品需求" />
          <MetricCard label="实验分析需求" value={String(experimentDemandCount)} note="当前 Demo 的核心场景" />
          <MetricCard label="已有阶段输出" value={String(demandsWithOutputCount)} note="至少保存过一次 Mira 输出" />
          <MetricCard label="输出记录数" value={String(outputs.length)} note="所有阶段沉淀记录" />
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>需求明细</h2>

          {loading ? (
            <div style={emptyStyle}>加载中...</div>
          ) : demands.length === 0 ? (
            <div style={emptyStyle}>暂无需求，先回首页创建一条需求。</div>
          ) : (
            <div style={tableWrapStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>需求名称</th>
                    <th style={thStyle}>类型</th>
                    <th style={thStyle}>DS</th>
                    <th style={thStyle}>产品</th>
                    <th style={thStyle}>最新阶段</th>
                    <th style={thStyle}>输出数</th>
                    <th style={thStyle}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {demands.map((demand) => {
                    const latestStage = latestStageByDemand[demand.id] || demand.current_stage || '-'
                    const outputCount = outputCountByDemand[demand.id] || 0

                    return (
                      <tr key={demand.id}>
                        <td style={tdStyle}>{demand.title}</td>
                        <td style={tdStyle}>{demand.demand_type || '-'}</td>
                        <td style={tdStyle}>{demand.ds_owner || '-'}</td>
                        <td style={tdStyle}>{demand.product_owner || '-'}</td>
                        <td style={tdStyle}>{stageNameMap[latestStage] || latestStage}</td>
                        <td style={tdStyle}>{outputCount}</td>
                        <td style={tdStyle}>
                          <Link href={`/demands/${demand.id}`} style={detailLinkStyle}>查看</Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div style={metricCardStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={metricValueStyle}>{value}</div>
      <div style={metricNoteStyle}>{note}</div>
    </div>
  )
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  padding: 32,
  background: '#f7f8fa',
  fontFamily: 'Arial, sans-serif',
  color: '#111827',
}

const containerStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 24,
}

const backLinkStyle: React.CSSProperties = {
  color: '#4b5563',
  textDecoration: 'none',
  fontSize: 14,
}

const titleStyle: React.CSSProperties = {
  fontSize: 34,
  lineHeight: 1.2,
  margin: '12px 0 8px',
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#6b7280',
  fontSize: 15,
}

const buttonStyle: React.CSSProperties = {
  padding: '12px 18px',
  borderRadius: 10,
  border: 'none',
  background: '#111827',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
}

const metricGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 16,
  marginBottom: 24,
}

const metricCardStyle: React.CSSProperties = {
  background: '#fff',
  padding: 20,
  borderRadius: 16,
  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
}

const metricLabelStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: 14,
}

const metricValueStyle: React.CSSProperties = {
  marginTop: 8,
  fontSize: 32,
  fontWeight: 800,
}

const metricNoteStyle: React.CSSProperties = {
  marginTop: 6,
  color: '#9ca3af',
  fontSize: 13,
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  padding: 24,
  borderRadius: 16,
  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 20,
  margin: '0 0 16px',
}

const emptyStyle: React.CSSProperties = {
  padding: 24,
  borderRadius: 12,
  background: '#f9fafb',
  color: '#6b7280',
}

const tableWrapStyle: React.CSSProperties = {
  overflowX: 'auto',
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '12px 10px',
  borderBottom: '1px solid #e5e7eb',
  color: '#4b5563',
  fontWeight: 700,
}

const tdStyle: React.CSSProperties = {
  padding: '14px 10px',
  borderBottom: '1px solid #f3f4f6',
  color: '#374151',
  verticalAlign: 'top',
}

const detailLinkStyle: React.CSSProperties = {
  color: '#111827',
  fontWeight: 700,
  textDecoration: 'none',
}