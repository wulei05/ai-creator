'use client';

import { useState } from 'react';

const TABS = [
  { label: '全部',    href: '/' },
  { label: 'AI 对话', href: '/chat' },
  { label: '图像生成', href: '/image' },
  { label: '视频生成', href: '/video' },
  { label: '探索',    href: '/explore' },
];

export function MarketingNav() {
  const [active, setActive] = useState(0);

  return (
    <nav className="hidden md:flex">
      <ul
        className="flex gap-1 list-none rounded-full p-1"
        style={{ background: '#12161f', border: '1px solid rgba(255,255,255,.08)' }}
      >
        {TABS.map((tab, i) => (
          <li key={tab.label}>
            <a
              href={tab.href}
              onClick={() => setActive(i)}
              className="block px-4 py-1.5 rounded-full text-[0.8125rem] font-medium transition-all whitespace-nowrap no-underline"
              style={
                active === i
                  ? { background: '#181d28', color: '#f0f4ff', border: '1px solid rgba(255,255,255,.18)' }
                  : { color: '#8b92a8' }
              }
            >
              {tab.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
