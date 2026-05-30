// 将 Supabase auth (GoTrue) 的英文错误翻译为中文。
// 优先按 error.code 匹配（v2.x 起稳定），fallback 按 message 关键词匹配。

const CODE_MAP: Record<string, string> = {
  invalid_credentials: '邮箱或密码错误',
  email_not_confirmed: '邮箱尚未验证，请点击验证邮件中的链接',
  user_already_exists: '该邮箱已注册，请直接登录',
  user_not_found: '用户不存在',
  weak_password: '密码过于简单，请至少使用 8 位字符',
  email_address_invalid: '邮箱格式不正确',
  over_email_send_rate_limit: '邮件发送过于频繁，请稍后再试',
  over_request_rate_limit: '请求过于频繁，请稍后再试',
  signup_disabled: '暂未开放注册',
  same_password: '新密码不能与旧密码相同',
  otp_expired: '验证链接已过期，请重新发送',
  otp_disabled: '当前不支持邮件验证码',
  validation_failed: '输入内容不符合要求',
  email_exists: '该邮箱已注册，请直接登录',
  identity_already_exists: '该邮箱已注册，请直接登录',
  bad_jwt: '登录已失效，请重新登录',
  session_expired: '登录已失效，请重新登录',
  user_banned: '该账号已被封禁',
  provider_disabled: '该登录方式未启用',
  unexpected_failure: '服务暂时异常，请稍后再试',
};

const MESSAGE_PATTERNS: Array<[RegExp, string]> = [
  [/invalid login credentials/i, '邮箱或密码错误'],
  [/email not confirmed/i, '邮箱尚未验证，请点击验证邮件中的链接'],
  [/user already registered/i, '该邮箱已注册，请直接登录'],
  [/password should be at least (\d+) characters?/i, '密码至少需要 $1 位字符'],
  [/unable to validate email address/i, '邮箱格式不正确'],
  [/email rate limit exceeded/i, '邮件发送过于频繁，请稍后再试'],
  [/for security purposes,? you can only request this after/i, '请求过于频繁，请稍后再试'],
  [/signups not allowed/i, '暂未开放注册'],
  [/token has expired or is invalid/i, '链接已过期或无效'],
  [/new password should be different/i, '新密码不能与旧密码相同'],
  [/user not found/i, '用户不存在'],
  [/network/i, '网络异常，请稍后重试'],
  [/fetch/i, '网络异常，请稍后重试'],
];

export function translateAuthError(error: unknown): string {
  if (!error) return '未知错误';
  const code = (error as { code?: string }).code;
  if (code && CODE_MAP[code]) return CODE_MAP[code];

  const message = (error as { message?: string }).message ?? '';
  if (!message) return '未知错误';

  for (const [re, zh] of MESSAGE_PATTERNS) {
    const m = message.match(re);
    if (m) return zh.replace(/\$(\d+)/g, (_, n) => m[Number(n)] ?? '');
  }
  return message;
}
