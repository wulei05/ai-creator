'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface UserRow {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed: boolean;
  balance: number;
  credits_spent: number;
  tasks: { total: number; image: number; video: number; chat: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">用户管理 <span className="text-sm font-normal text-muted-foreground ml-2">共 {total} 位用户</span></h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="搜索邮箱..."
              className="pl-8 h-8 text-sm w-52"
            />
          </div>
          <Button type="submit" size="sm" variant="outline">搜索</Button>
        </form>
      </div>

      <div className="rounded-xl border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">用户</th>
              <th className="text-left px-4 py-3 font-medium">注册时间</th>
              <th className="text-left px-4 py-3 font-medium">最后登录</th>
              <th className="text-right px-4 py-3 font-medium">余额</th>
              <th className="text-right px-4 py-3 font-medium">已消耗</th>
              <th className="text-right px-4 py-3 font-medium">图像</th>
              <th className="text-right px-4 py-3 font-medium">视频</th>
              <th className="text-right px-4 py-3 font-medium">对话</th>
              <th className="text-center px-4 py-3 font-medium">验证</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">加载中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">没有找到用户</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium truncate max-w-[200px]">{u.email}</div>
                  <div className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)}…</div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(u.created_at).toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                  {u.last_sign_in_at
                    ? new Date(u.last_sign_in_at).toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
                    : '—'}
                </td>
                <td className="px-4 py-3 text-right font-medium text-amber-600">{u.balance}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{u.credits_spent}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{u.tasks.image}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{u.tasks.video}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{u.tasks.chat}</td>
                <td className="px-4 py-3 text-center">
                  {u.confirmed
                    ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                    : <XCircle className="h-4 w-4 text-muted-foreground mx-auto" />}
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => router.push(`/admin/logs?user_id=${u.id}`)}
                  >
                    日志
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>第 {page} / {totalPages} 页</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
