export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a0f]/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <a href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            AI Creator
          </a>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
              登录
            </a>
            <a
              href="/register"
              className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              免费注册
            </a>
          </div>
        </nav>
      </header>
      <main className="pt-[52px]">{children}</main>
    </div>
  )
}
