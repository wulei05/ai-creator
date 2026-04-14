export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-gray-950/80 backdrop-blur-md">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a href="/" className="text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            AI Creator
          </a>
          <div className="flex items-center gap-4">
            <a href="/login" className="text-sm text-gray-300 hover:text-white transition-colors">
              登录
            </a>
            <a
              href="/register"
              className="rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 transition-colors"
            >
              免费注册
            </a>
          </div>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  )
}
