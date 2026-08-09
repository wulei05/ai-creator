import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '服务条款 — iHuiToken',
  description: 'iHuiToken 服务条款，请在使用前仔细阅读。',
}

const SECTIONS = [
  {
    title: '一、服务说明',
    content: `iHuiToken 是一个 AI 创作平台，通过积分制为用户提供对话、图像生成和视频生成等 AI 服务（以下简称「服务」）。使用本服务即表示您同意本条款。`,
  },
  {
    title: '二、账户注册',
    content: `• 您须年满 18 周岁方可注册使用本服务。
• 您需提供真实、准确的注册信息，并对账户安全负责。
• 禁止将账户出借、转让或出售给他人。
• 发现账户被盗用时，请立即联系我们。`,
  },
  {
    title: '三、积分制度',
    content: `• 积分是使用本平台 AI 服务的唯一凭证，1 积分 = 人民币 0.01 元。
• 积分一经充值不退款，永久有效，不设过期日期。
• 生成任务失败（服务端错误）时，积分自动原路返还。
• 因用户输入不当（如违规内容）导致的失败不予退还。
• 积分价格可能随时调整，调整前将提前公告。`,
  },
  {
    title: '四、禁止行为',
    content: `使用本服务时，您不得：
• 生成、传播违法、色情、暴力、恐怖、诽谤性内容。
• 侵犯他人知识产权、肖像权、隐私权。
• 使用自动化工具或脚本大量调用 API（未经书面授权）。
• 尝试破解、逆向工程或干扰本平台系统。
• 使用生成内容从事欺诈、虚假信息传播等违法活动。
违反上述规定将导致账户封禁，情节严重者将依法追究法律责任。`,
  },
  {
    title: '五、内容所有权',
    content: `• 用户生成内容（图像、视频等）的著作权归用户所有。
• 您授予 iHuiToken 非独家、免版税的许可，用于在平台内展示（如社区功能）和技术处理。
• 您可随时删除自己的创作内容，删除后我们将在合理时间内从服务器清除。`,
  },
  {
    title: '六、服务变更与中断',
    content: `• 我们保留随时修改、暂停或终止服务的权利，将尽合理努力提前通知。
• 因不可抗力（服务器故障、网络中断、第三方 API 不可用等）导致的服务中断不承担赔偿责任。
• 我们不保证服务 100% 无中断，SLA 目标为 99.5% 月度可用率。`,
  },
  {
    title: '七、免责声明',
    content: `• AI 生成内容具有随机性，我们不对内容的准确性、适用性作任何保证。
• 您对使用 AI 生成内容的方式及后果自行负责。
• 本服务「按现状」提供，不附带任何明示或暗示的保证。`,
  },
  {
    title: '八、责任限制',
    content: `在法律允许的最大范围内，iHuiToken 对您的任何间接、附带、特殊或惩罚性损害不承担责任。我们对您的最大赔偿责任不超过您在事件发生前 3 个月内实际支付的积分金额。`,
  },
  {
    title: '九、条款修改',
    content: `我们可能修改本条款。重大变更将通过站内通知或邮件告知。修改后继续使用服务视为接受新条款。`,
  },
  {
    title: '十、法律适用与争议解决',
    content: `本条款受中华人民共和国法律管辖。如发生争议，双方应首先协商解决；协商不成的，提交平台注册地有管辖权的人民法院诉讼解决。`,
  },
]

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-[800px] px-6 py-20">
      <div className="mb-10">
        <div className="text-[0.6875rem] font-bold uppercase tracking-[0.12em] mb-3" style={{ color: '#f59e0b' }}>法律文件</div>
        <h1 className="font-bold tracking-[-0.03em] mb-3" style={{ fontSize: 'clamp(1.8rem,4vw,2.75rem)', color: '#f0f4ff' }}>服务条款</h1>
        <p style={{ color: '#8b92a8', fontSize: '0.9375rem' }}>最后更新：2026 年 8 月 1 日</p>
      </div>

      <div
        className="rounded-[20px] p-6 mb-8 text-[0.9375rem] leading-[1.7]"
        style={{ background: 'rgba(245,158,11,.06)', border: '1px solid rgba(245,158,11,.2)', color: '#8b92a8' }}
      >
        请在使用 iHuiToken 服务前仔细阅读本条款。如您不同意本条款的任何部分，请停止使用本服务。
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
