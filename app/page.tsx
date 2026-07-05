'use client'

import { useEffect, useState } from 'react'
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

export default function Home() {
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: '',
    demand_type: '实验分析',
    ds_owner: '刘心杨',
    product_owner: '',
    prd_url: '',
  })

  async function loadDemands() {
    const { data, error } = await supabase
      .from('demands')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      alert(error.message)
      return
    }

    setDemands(data || [])
  }

  async function createDemand() {
    if (!form.title.trim()) {
      alert('请填写需求名称')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('demands').insert({
      title: form.title,
      demand_type: form.demand_type,
      ds_owner: form.ds_owner,
      product_owner: form.product_owner,
      prd_url: form.prd_url,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setForm({
      title: '',
      demand_type: '实验分析',
      ds_owner: '刘心杨',
      product_owner: '',
      prd_url: '',
    })

    await loadDemands()
  }

  useEffect(() => {
    loadDemands()
  }, [])

  return (
    <main style={pageStyle}>
      <section style={containerStyle}>
        <header style={headerStyle}>
          <div>
            <h1 style={titleStyle}>DS 需求共创助手</h1>
            <p style={subtitleStyle}>
              创建需求，沉淀 PRD 初读、口径澄清、会议复盘和数据表设计过程。
            </p>
          </div>
          <div style={badgeStyle}>Demo</div>
        </header>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>新建需求</h2>

          <div style={formGridStyle}>
            <label>
              <div style={labelStyle}>需求名称</div>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="例如：商家营销选品&定价推荐能力建设"
                style={inputStyle}
              />
            </label>

            <label>
              <div style={labelStyle}>需求类型</div>
              <select
                value={form.demand_type}
                onChange={(e) => setForm({ ...form, demand_type: e.target.value })}
                style={inputStyle}
              >
                <option>实验分析</option>
                <option>埋点设计</option>
                <option>简单取数</option>
                <option>空间摸排</option>
                <option>方向机会探索</option>
              </select>
            </label>

            <label>
              <div style={labelStyle}>DS owner</div>
              <input
                value={form.ds_owner}
                onChange={(e) => setForm({ ...form, ds_owner: e.target.value })}
                placeholder="例如：刘心杨"
                style={inputStyle}
              />
            </label>

            <label>
              <div style={labelStyle}>产品 owner</div>
              <input
                value={form.product_owner}
                onChange={(e) => setForm({ ...form, product_owner: e.target.value })}
                placeholder="例如：黄映雪"
                style={inputStyle}
              />
            </label>

            <label style={{ gridColumn: '1 / 3' }}>
              <div style={labelStyle}>PRD 链接</div>
              <input
                value={form.prd_url}
                onChange={(e) => setForm({ ...form, prd_url: e.target.value })}
                placeholder="粘贴飞书 PRD 链接"
                style={inputStyle}
              />
            </label>
          </div>

          <button onClick={createDemand} disabled={loading} style={buttonStyle}>
            {loading ? '保存中...' : '创建需求'}
          </button>
        </section>

        <section style={cardStyle}>
          <div style={listHeaderStyle}>
            <h2 style={sectionTitleStyle}>需求列表</h2>
            <span style={countStyle}>{demands.length} 个需求</span>
          </div>

          {demands.length === 0 ? (
            <div style={emptyStyle}>暂无需求，先创建一条用于演示。</div>
          ) : (
            <div style={listStyle}>
              {demands.map((demand) => (
                <Link
                  key={demand.id}
                  href={`/demands/${demand.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <article style={demandCardStyle}>
                    <div style={demandTitleStyle}>{demand.title}</div>
                    <div style={metaStyle}>
                      类型：{demand.demand_type || '-'} ｜ DS：{demand.ds_owner || '-'} ｜ 产品：
                      {demand.product_owner || '-'} ｜ 阶段：{demand.current_stage || '-'}
                    </div>
                    <div style={urlStyle}>PRD：{demand.prd_url || '-'}</div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
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
  maxWidth: 1080,
  margin: '0 auto',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 24,
}

const titleStyle: React.CSSProperties = {
  fontSize: 34,
  lineHeight: 1.2,
  margin: '0 0 8px',
}

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#6b7280',
  fontSize: 15,
}

const badgeStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 999,
  background: '#111827',
  color: '#fff',
  fontSize: 13,
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  padding: 24,
  borderRadius: 16,
  marginBottom: 24,
  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 20,
  margin: '0 0 16px',
}

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 16,
}

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#374151',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  marginTop: 6,
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}

const buttonStyle: React.CSSProperties = {
  marginTop: 16,
  padding: '12px 18px',
  borderRadius: 10,
  border: 'none',
  background: '#111827',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
}

const listHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const countStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: 14,
}

const emptyStyle: React.CSSProperties = {
  padding: 24,
  borderRadius: 12,
  background: '#f9fafb',
  color: '#6b7280',
}

const listStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}

const demandCardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 16,
  cursor: 'pointer',
  background: '#fff',
}

const demandTitleStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: 16,
  marginBottom: 8,
}

const metaStyle: React.CSSProperties = {
  color: '#4b5563',
  fontSize: 14,
  lineHeight: 1.7,
}

const urlStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: 13,
  marginTop: 6,
  wordBreak: 'break-all',
}