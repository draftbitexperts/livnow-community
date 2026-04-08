import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, ChevronRight } from 'lucide-react';
import SearchNormalIcon from '@/components/SearchNormalIcon';
import { useAuth } from '@/hooks/useAuth';
import { useSidebarLayout } from '@/contexts/SidebarLayoutContext';
import { useDemoResidents } from '@/contexts/DemoResidentsContext';
import { findDemoResidentInList, residentDisplayName } from '@/lib/demoResidents';
import { DEMO_PARENT_COMPANIES } from '@/lib/demoCommunities';
import type { ParentCompanyDetailLocationState } from '@/pages/ParentCompanyDetail';

interface HeaderProps {
  onMenuClick: () => void;
  variant?: 'desktop' | 'tablet' | 'mobile';
  /** When set, overrides auth name for greeting / initials (Admin parity) */
  userName?: string | null;
  /** Under title, e.g. All Residents > Mary Smith */
  breadcrumb?: { parentLabel: string; parentHref?: string; currentLabel: string };
}

export default function Header({
  onMenuClick,
  variant = 'desktop',
  userName,
  breadcrumb,
}: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { sidebarWidth } = useSidebarLayout();
  const { records } = useDemoResidents();

  const residentSegment = location.pathname.match(/^\/residents\/([^/]+)$/)?.[1];
  const residentBreadcrumb =
    residentSegment && residentSegment !== 'all'
      ? (() => {
          const r = findDemoResidentInList(records, residentSegment);
          if (!r) return undefined;
          return {
            parentLabel: 'All Residents',
            parentHref: '/residents/all',
            currentLabel: residentDisplayName(r),
          };
        })()
      : undefined;

  const parentDetailMatch = location.pathname.match(/^\/communities\/parent-companies\/([^/]+)$/);
  const parentDetailBreadcrumb =
    parentDetailMatch != null
      ? (() => {
          const id = parentDetailMatch[1];
          const st = location.state as ParentCompanyDetailLocationState | null;
          const name =
            st?.parentCompanyRecord?.id === id
              ? st.parentCompanyRecord.name
              : (DEMO_PARENT_COMPANIES.find((p) => p.id === id)?.name ?? 'Parent Company');
          return {
            parentLabel: 'All Parent Companies',
            parentHref: '/communities?tab=parentCompanies',
            currentLabel: name,
          };
        })()
      : undefined;

  const effectiveBreadcrumb = breadcrumb ?? residentBreadcrumb ?? parentDetailBreadcrumb;

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const rawName =
    userName ??
    user?.name ??
    user?.email?.split('@')[0] ??
    'User';

  const displayName =
    rawName.length === 0
      ? rawName
      : rawName
          .trim()
          .split(/\s+/)
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');

  const pageTitle = (() => {
    const path = location.pathname;
    if (path === '/residents/all' || path.startsWith('/residents/')) return 'Residents';
    if (path === '/communities' || path.startsWith('/communities/parent-companies/')) return 'Communities';
    if (path === '/team') return 'Team';
    if (path === '/knowledge-base') return 'Knowledge Base';
    if (path === '/profile') return 'User Profile';
    return `Hi, ${displayName}`;
  })();

  const initials =
    rawName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
    navigate('/', { replace: true });
  };

  if (variant === 'mobile') {
    return (
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 text-white"
        style={{ backgroundColor: '#307584' }}
      >
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded p-2 transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <Menu size={24} />
        </button>
        <h1 className="text-sm font-medium">{pageTitle}</h1>
        <button
          type="button"
          className="rounded p-2 transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <SearchNormalIcon size={20} />
        </button>
      </header>
    );
  }

  if (variant === 'tablet') {
    return (
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 text-white"
        style={{ backgroundColor: '#307584' }}
      >
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded p-2 transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <Menu size={24} />
        </button>
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <button
          type="button"
          className="rounded p-2 transition-opacity hover:opacity-80"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <SearchNormalIcon size={20} />
        </button>
      </header>
    );
  }

  return (
    <header
      className="fixed top-0 z-30 flex items-center justify-center"
      style={{
        left: sidebarWidth,
        right: 0,
        height: '110px',
        backgroundColor: '#F0F5F7',
        paddingTop: '36px',
        paddingBottom: '24px',
        paddingLeft: 0,
        paddingRight: 0,
      }}
    >
      <div
        className="flex w-full min-w-0 items-center justify-between gap-4"
        style={{
          paddingLeft: 'var(--main-section-padding-x, 80px)',
          paddingRight: 'var(--main-section-padding-x, 80px)',
        }}
      >
        <div>
          <h1
            className="font-poppins"
            style={{
              fontFamily: 'var(--font-poppins), sans-serif',
              fontWeight: 600,
              fontSize: '42px',
              lineHeight: '100%',
              letterSpacing: '0%',
              verticalAlign: 'bottom',
              color: '#323234',
              textAlign: 'left',
              margin: 0,
              padding: 0,
            }}
          >
            {pageTitle}
          </h1>
          {effectiveBreadcrumb && (
            <nav className="mt-2 flex items-center gap-2 font-source-sans-3">
              {effectiveBreadcrumb.parentHref != null ? (
                <a
                  href={effectiveBreadcrumb.parentHref}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(effectiveBreadcrumb.parentHref!);
                  }}
                  className="hover:opacity-90"
                  style={{
                    fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                    fontWeight: 500,
                    fontSize: 20,
                    lineHeight: '24px',
                    letterSpacing: '0%',
                    color: '#323234',
                    textDecoration: 'none',
                    margin: 0,
                    padding: 0,
                  }}
                >
                  {effectiveBreadcrumb.parentLabel}
                </a>
              ) : (
                <span
                  style={{
                    fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                    fontWeight: 500,
                    fontSize: 20,
                    lineHeight: '24px',
                    letterSpacing: '0%',
                    color: '#323234',
                    margin: 0,
                    padding: 0,
                  }}
                >
                  {effectiveBreadcrumb.parentLabel}
                </span>
              )}
              <ChevronRight
                size={20}
                strokeWidth={2}
                className="flex-shrink-0"
                style={{ color: '#323234' }}
                aria-hidden
              />
              <span
                style={{
                  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                  fontWeight: 600,
                  fontSize: 20,
                  lineHeight: '24px',
                  letterSpacing: '0%',
                  color: '#359689',
                  margin: 0,
                  padding: 0,
                }}
              >
                {effectiveBreadcrumb.currentLabel}
              </span>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-4" style={{ justifyContent: 'flex-end' }}>
          <div
            className="relative flex items-center"
            style={{
              width: '465px',
              height: '50px',
              borderRadius: '360px',
              backgroundColor: '#FFFFFF',
            }}
          >
            <input
              type="text"
              placeholder="Search..."
              className="h-full w-full bg-transparent px-4 pr-12 outline-none"
              style={{ borderRadius: '360px' }}
              aria-label="Search"
            />
            <button type="button" className="absolute right-3 flex items-center justify-center p-2" aria-label="Search">
              <SearchNormalIcon size={22} />
            </button>
          </div>
          <button
            type="button"
            disabled
            aria-label="Notifications (coming soon)"
            title="Notifications coming soon"
            className="relative flex cursor-not-allowed items-center justify-center rounded-full border border-gray-300 p-2 opacity-70"
            style={{ width: '40px', height: '40px', borderWidth: '1px' }}
          >
            <Bell size={24} className="text-gray-500" />
          </button>
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full font-inter font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#307584' }}
              aria-expanded={profileMenuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
            >
              {initials}
            </button>
            {profileMenuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="py-1">
                  <div className="px-4 py-2 font-source-sans-3 text-xs text-gray-500">Account</div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full px-4 py-2 text-left font-source-sans-3 text-sm font-bold text-gray-900 hover:bg-gray-100"
                  >
                    User Profile
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left font-source-sans-3 text-sm font-bold text-gray-900 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
