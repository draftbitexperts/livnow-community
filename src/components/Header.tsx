import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** Account dropdown row hover / highlight (light blue-gray), matches design reference */
const accountMenuRowClass =
  'w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold text-gray-900 transition-colors font-source-sans-3 hover:bg-[hsla(197,32%,91%,1)] focus:outline-none focus-visible:bg-[hsla(197,32%,91%,1)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25';

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersHover = useMediaQuery('(hover: hover)');
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);

  const displayName = user?.name ?? 'User';

  const initials = user?.name
    ? user.name
        .split(/\s+/)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  useEffect(() => {
    if (!accountOpen) return;
    const onDocPointerDown = (e: PointerEvent) => {
      if (!accountRef.current?.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => document.removeEventListener('pointerdown', onDocPointerDown);
  }, [accountOpen]);

  const handleLogout = () => {
    setAccountOpen(false);
    logout();
    navigate('/', { replace: true });
  };

  return (
    <header className="flex h-16 items-center justify-between gap-4 bg-[#F0F4F7] px-4 sm:gap-5 sm:px-6 lg:px-8">
      <div className="flex min-w-0 shrink items-center gap-2">
        {onMenuClick && (
          <button
            type="button"
            className="flex-shrink-0 rounded-lg p-2 text-[var(--primary)] hover:bg-gray-200/70 lg:hidden"
            aria-label="Open menu"
            onClick={onMenuClick}
          >
            <Menu size={22} strokeWidth={2} aria-hidden />
          </button>
        )}
        <h1 className="min-w-0 max-w-[7.5rem] truncate text-base font-semibold text-gray-900 sm:max-w-none sm:overflow-visible sm:whitespace-normal sm:text-lg md:text-xl lg:text-2xl font-source-sans-3">
          Hi, {displayName}
        </h1>
      </div>

      <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3 md:gap-4">
        <div className="relative w-[min(100%,7.5rem)] min-w-0 sm:w-52 md:w-60 lg:w-64">
          <input
            type="search"
            placeholder="Search..."
            className="w-full rounded-full border border-gray-200/90 bg-white py-2.5 pl-4 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 font-source-sans-3"
            aria-label="Search"
          />
          <Search
            size={16}
            strokeWidth={2}
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--primary)]"
            aria-hidden
          />
        </div>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--primary)] bg-white text-[var(--primary)] transition-colors hover:bg-gray-50"
          aria-label="Notifications"
        >
          <Bell size={18} strokeWidth={2} aria-hidden />
        </button>

        <div
          ref={accountRef}
          className="relative"
          onMouseEnter={() => prefersHover && setAccountOpen(true)}
          onMouseLeave={() => prefersHover && setAccountOpen(false)}
        >
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white text-sm font-semibold text-white shadow-sm outline-none transition-opacity hover:opacity-95 focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40 font-source-sans-3"
            style={{ backgroundColor: 'var(--primary)' }}
            aria-expanded={accountOpen}
            aria-haspopup="menu"
            aria-label="Account menu"
            onClick={() => {
              if (!prefersHover) {
                setAccountOpen((o) => !o);
              }
            }}
          >
            {initials}
          </button>

          {accountOpen && (
            <div
              className="absolute right-0 top-full z-50 pt-2"
              role="menu"
              aria-label="Account"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="w-[min(calc(100vw-2rem),13.5rem)] rounded-xl bg-white px-3 py-3 text-left shadow-lg">
                <p className="mb-2 px-2 text-xs font-bold text-gray-500 font-source-sans-3">Account</p>
                <ul className="flex flex-col gap-1 p-0">
                  <li>
                    <Link
                      to="/profile"
                      role="menuitem"
                      className={`block ${accountMenuRowClass} ${
                        location.pathname.startsWith('/profile') ? 'bg-[hsla(197,32%,91%,1)]' : ''
                      }`}
                      onClick={() => setAccountOpen(false)}
                    >
                      User Profile
                    </Link>
                  </li>
                  <li>
                    <button
                      type="button"
                      role="menuitem"
                      className={accountMenuRowClass}
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
