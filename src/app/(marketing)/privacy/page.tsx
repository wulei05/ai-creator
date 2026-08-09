import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '隐私政策 — iHuiToken',
  description: 'iHuiToken 隐私政策，了解我们如何收集、使用和保护您的个人信息。',
}

const SECTIONS = [
  {
    title: '一、信息收集',
    content: `我们收集以下类型的信息：
• 账户信息：注册时您提供的邮箱地址和密码（密码经过加密存储）。
• 使用数据：您在平台上的创作记录、积分消费明细、生成的图像和视频（存储于您的个人空间）。
• 设备信息：浏览器类型、操作系统、IP 地址，用于安全验证和服务优化。
• 支付信息：充值订单信息由第三方支付平台处理，我们不存储完整的银行卡或支付账号信息。`,
  },
  {
    title: '二、信息使用',
    content: `我们使用收集的信息用于：
• 提供、维护和改进我们的 AI 创作服务。
• 处理您的积分充值和使用记录。
• 向您发送服务通知、安全警报和账户相关信息。
• 分析使用趋势以优化产品体验（仅使用去标识化的聚合数据）。
• 侦测和防范欺诈、滥用及安全威胁。`,
  },
  {
    title: '三、信息共享',
    content: `我们不会出售您的个人信息。我们仅在以下情况下共享信息：
• 服务提供商：我们使用第三方 AI 模型 API（如 OpenAI、Google、Anthropic 等）处理您的生成请求，您的提示词将作为 API 调用参数传输。
• 法律要求：当法律法规要求或应政府合法请求时。
• 业务转让：如发生合并、收购，您的信息可能作为资产转移，届时我们将提前通知。`,
  },
  {
    title: '四、数据安全',
    content: `我们采取行业标准的安全措施保护您的数据：
• 所有数据传输使用 TLS/HTTPS 加密。
• 密码使用 bcrypt 等强哈希算法存储。
• 定期进行安全审计和漏洞扫描。
• 严格的员工访问控制，遵循最小权限原则。`,
  },
  {
    title: '五、数据保留',
    content: `• 账户数据：在账户存续期间保留，注销后 30 天内删除。
• 生成内容：按您的设置保留，您可随时在创作室中手动删除。
• 日志数据：出于安全目的保留最多 90 天。
• 积分和交易记录：依据财务合规要求保留 5 年。`,
  },
  {
    title: '六、您的权利',
    content: `您享有以下权利：
• 访问权：查看我们持有的关于您的个人数据。
• 更正权：更新不准确的个人信息。
• 删除权：请求删除您的账户及相关数据。
• 数据可携权：以通用格式导出您的创作内容。
• 撤销同意：随时撤销您对数据处理的同意（不影响撤销前的处理合法性）。
如需行使上述权利，请通过页面底部的联系方式与我们联系。`,
  },
  {
    title: '七、Cookie 使用',
    content: `我们使用 Cookie 和类似技术：
• 必要 Cookie：维持登录状态和会话安全，不可禁用。
• 分析 Cookie：帮助我们了解功能使用情况，可在浏览器设置中禁用。
我们不使用广告追踪 Cookie。`,
  },
  {
    title: '八、未成年人保护',
    content: `iHuiToken 的服务面向 18 周岁及以上用户。我们不会故意收集未成年人的个人信息。如发现我们误收集了未成年人信息，请立即联系我们，我们将尽快删除相关数据。`,
  },
  {
    title: '九、政策更新',
    content: `我们可能不定期更新本隐私政策。重大变更时，我们将通过站内通知或邮件提前告知。继续使用服务即表示您接受更新后的政策。`,
  },
  {
    title: '十、联系我们',
    content: `如有隐私相关问题或请求，请联系：
• 邮箱：privacy@ihuitoken.com
• 地址：中国
我们将在收到请求后 15 个工作日内回复。`,
  },
]

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-[800px] px-6 py-20">
      <div className="mb-10">
        <div className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: '#f59e0b' }}>法律文件</div>
        <h1 className="font-bold tracking-[-0.03em] mb-3" style={{ fontSize: 'clamp(1.8rem,4vw,2.75rem)', color: '#f0f4ff' }}>隐私政策</h1>
        <p style={{ color: '#8b92a8', fontSize: '0.9375rem' }}>最后更新：2026 年 8 月 1 日</p>
      </div>

      <div
        className="rounded-[20px] p-6 mb-8 text-[0.9375rem] leading-[1.7]"
        style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)', color: '#8b92a8' }}
      >
        iHuiToken（以下简称「我们」或「本平台」）尊重并保护用户隐私。本政策说明了我们在您使用
        <strong style={{ color: '#fbbf24' }}> https://ihuitoken.com </strong>
        及相关服务时，如何收集、使用、存储和保护您的个人信息。
      </div>

      <div className="space-y-8">
        {SECTIONS.map((sec) => (
          <div key={sec.title} className="rounded-[16px] p-6" style={{ background: '#0d1017', border: '1px solid rgba(255,255,255,.06)' }}>
            <h2 className="font-semibold mb-3" style={{ color: '#f0f4ff', fontSize: '1.0625rem' }}>{sec.title}</h2>
            <p className="whitespace-pre-line text-[0.875rem] leading-[1.8]" style={{ color: '#8b92a8' }}>{sec.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
