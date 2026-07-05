'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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
}

type StageOutput = {
  id: string
  stage_code: string
  output_text: string
  created_at: string
}

const stages = [
  { code: '01_prd_read', name: '01｜会前准备：PRD 初读' },
  { code: '02_clarify', name: '02｜口径澄清：更新问题状态' },
  { code: '03_meeting_review', name: '03｜会后复盘：会议纪要对照' },
  { code: '04_table_design', name: '04｜开工设计：产出数据表' },
]

export default function DemandDetail() {
  const params = useParams<{ id: string }>()
  const demandId = params.id

  const [demand, setDemand] = useState<Demand | null>(null)
  const [outputs, setOutputs] = useState<StageOutput[]>([])
  const [stageCode, setStageCode] = useState('01_prd_read')
  const [outputText, setOutputText] = useState('')
  const [loading, setLoading] = useState(false)

  async function loadData() {
    if (!demandId) return

    const { data: demandData, error: demandError } = await supabase
      .from('demands')
      .select('*')
      .eq('id', demandId)
      .single()

    if (demandError) {
      alert(demandError.message)
      return
    }

    setDemand(demandData)

    const { data: outputData, error: outputError } = await supabase
      .from('stage_outputs')
      .select('*')
      .eq('demand_id', demandId)
      .order('created_at', { ascending: false })

    if (outputError) {
      alert(outputError.message)
      return
    }

    setOutputs(outputData || [])
  }

  function buildPrompt() {
    if (!demand) return ''

    if (stageCode === '01_prd_read') {
      return `请按 Project Instruction 工作。当前只有 PRD，请执行“阶段 1：PRD 初读 + 背景补全”。

要求：
1. 先主动补全背景，不要只总结 PRD。
2. 输出保持简洁。
3. 只保留最多 5 个 P0 必问问题。
4. 如果背景材料没找到，标记“未找到”，不要编造。
5. 下一步只追问 1-3 个最关键问题。

需求信息：
- 需求名称：${demand.title}
- 需求类型：${demand.demand_type || ''}
- DS owner：${demand.ds_owner || ''}
- 产品 owner：${demand.product_owner || ''}
- PRD 链接：${demand.prd_url || ''}`
    }

    if (stageCode === '02_clarify') {
      return `请按 Project Instruction 工作。下面是产品/研发/DS 补充的信息，请执行“阶段 2：口径澄清”。

要求：
1. 不要重写完整 PRD 分析。
2. 判断本轮补充解决了哪个 P0 问题。
3. 更新问题状态：已明确 / 部分明确 / 待确认。
4. 如果仍有关键缺口，只继续问 1-3 个问题。
5. 如果已经足够进入数据表设计，请明确提示“可以进入数据表设计”。

需求名称：${demand.title}
PRD 链接：${demand.prd_url || ''}

补充信息：
【在这里粘贴产品/研发答复或 DS 补充】`
    }

    if (stageCode === '03_meeting_review') {
      return `请按 Project Instruction 工作。下面是会议纪要，请执行“阶段 4：会议纪要对照”。

要求：
1. 对照此前 P0 问题，判断哪些已回答、哪些仍待确认。
2. 不要总结会议全文。
3. 已回答最多 5 条，待确认最多 5 条。
4. 二次追问建议只列最关键 1-3 条。
5. 最后总结 DS 下次对接同类需求时应提前注意什么。

需求名称：${demand.title}
PRD 链接：${demand.prd_url || ''}

会议纪要：
【在这里粘贴会议纪要链接或正文】`
    }

    return `请按 Project Instruction 工作。现在进入“阶段 5：数据表设计”。

要求：
1. 停止继续扩展问题清单，直接产出 DS 可开工的数据表设计。
2. 必须区分：埋点行为数据、服务端推荐 plan、活动创建结果、支付/核销/退款行为数据。
3. 如果不知道真实表名和字段，不要编造，写“待 DS 查表 / 待研发提供”。
4. 输出数据表设计版本：v0 初版 / v1 澄清后 / v2 可开工版。
5. 最后区分“当前可先做”和“必须确认后再做”。

需求名称：${demand.title}
PRD 链接：${demand.prd_url || ''}

已明确口径或补充信息：
【粘贴已明确口径、Mira 前序输出或研发答复】`
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(buildPrompt())
    alert('Prompt 已复制，可以粘贴到 Mira')
  }

  async function saveOutput() {
    if (!demandId) {
      alert('缺少需求 ID')
      return
    }

    if (!outputText.trim()) {
      alert('请粘贴 Mira 输出')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('stage_outputs').insert({
      demand_id: demandId,
      stage_code: stageCode,
      output_text: outputText,
    })

    setLoading(false)

    if (error) {
      alert(error.message)
      return
    }

    setOutputText('')
    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [demandId])

  if (!demand) {
    return <main style={pageStyle}>加载中...</main>
  }

  return (
    <main style={pageStyle}>
      <section style={containerStyle}>
        <Link href="/" style={backLinkStyle}>← 返回需求列表</Link>

        <header style={headerStyle}>
          <h1 style={titleStyle}>{demand.title}</h1>
          <p style={metaStyle}>
            类型：{demand.demand_type || '-'} ｜ DS：{demand.ds_owner || '-'} ｜ 产品：{demand.product_owner || '-'}
          </p>
          <p style={urlStyle}>PRD：{demand.prd_url || '-'}</p>
        </header>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>阶段工作台</h2>

          <label>
            <div style={labelStyle}>选择阶段</div>
            <select value={stageCode} onChange={(e) => setStageCode(e.target.value)} style={inputStyle}>
              {stages.map((stage) => (
                <option key={stage.code} value={stage.code}>{stage.name}</option>
              ))}
            </select>
          </label>

          <button onClick={copyPrompt} style={buttonStyle}>复制 Mira Prompt</button>

          <label>
            <div style={{ ...labelStyle, marginTop: 16 }}>Mira 输出</div>
            <textarea
              value={outputText}
              onChange={(e) => setOutputText(e.target.value)}
              placeholder="把 Mira 输出粘贴到这里，然后保存"
              style={textareaStyle}
            />
          </label>

          <button onClick={saveOutput} disabled={loading} style={buttonStyle}>
            {loading ? '保存中...' : '保存阶段输出'}
          </button>
        </section>

        <section style={cardStyle}>
          <h2 style={sectionTitleStyle}>历史阶段输出</h2>

          {outputs.length === 0 ? (
            <div style={emptyStyle}>暂无阶段输出。先复制 Prompt 到 Mira，跑完后粘贴保存。</div>
          ) : (
            <div style={listStyle}>
              {outputs.map((output) => (
                <article key={output.id} style={outputCardStyle}>
                  <div style={outputHeaderStyle}>
                    <strong>{output.stage_code}</strong>
                    <span style={timeStyle}>{new Date(output.created_at).toLocaleString()}</span>
                  </div>
                  <pre style={preStyle}>{output.output_text}</pre>
                </article>
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

const backLinkStyle: React.CSSProperties = {
  color: '#4b5563',
  textDecoration: 'none',
  fontSize: 14,
}

const headerStyle: React.CSSProperties = {
  marginTop: 18,
  marginBottom: 24,
}

const titleStyle: React.CSSProperties = {
  fontSize: 32,
  lineHeight: 1.2,
  margin: '0 0 10px',
}

const metaStyle: React.CSSProperties = {
  margin: '0 0 6px',
  color: '#4b5563',
  fontSize: 14,
}

const urlStyle: React.CSSProperties = {
  margin: 0,
  color: '#9ca3af',
  fontSize: 13,
  wordBreak: 'break-all',
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

const textareaStyle: React.CSSProperties = {
  width: '100%',
  height: 180,
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
  marginRight: 12,
  padding: '12px 18px',
  borderRadius: 10,
  border: 'none',
  background: '#111827',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 600,
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

const outputCardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 16,
  background: '#fff',
}

const outputHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 10,
}

const timeStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: 13,
}

const preStyle: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  color: '#374151',
  fontSize: 14,
  lineHeight: 1.7,
  margin: 0,
}