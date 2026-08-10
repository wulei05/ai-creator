/**
 * 判断邮箱是否有管理员权限。
 * 环境变量 ADMIN_EMAIL 支持逗号分隔的多个邮箱，例如：
 *   ADMIN_EMAIL=a@example.com,b@example.com
 */
export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAIL ?? '';
  return raw.split(',').map(s => s.trim()).includes(email);
}
