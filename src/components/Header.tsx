import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, ChevronRight, CheckCheck } from 'lucide-react';
import notificationIcon from '../../LivNow Icons/notification.png';
import SearchNormalIcon from '@/components/SearchNormalIcon';
import { useAuth } from '@/hooks/useAuth';
import { useSidebarLayout } from '@/contexts/SidebarLayoutContext';
import { useDemoResidents } from '@/contexts/DemoResidentsContext';
import { findDemoResidentInList, residentDisplayName } from '@/lib/demoResidents';
import { DEMO_PARENT_COMPANIES } from '@/lib/demoCommunities';
import type { ParentCompanyDetailLocationState } from '@/pages/ParentCompanyDetail';

type DemoNotification = {
  id: string;
  title: string;
  dateLabel: string;
  initials: string;
  unread: boolean;
};

const DEMO_NOTIFICATIONS_INITIAL: DemoNotification[] = [
  {
    id: '1',
    title: 'New Resident added',
    dateLabel: '04/13/2026',
    initials: 'AS',
    unread: true,
  },
  {
    id: '2',
    title: 'New chat message received',
    dateLabel: '04/13/2026',
    initials: 'AS',
    unread: true,
  },
  {
    id: '3',
    title: 'Task has been assigned',
    dateLabel: '04/13/2026',
    initials: 'AS',
    unread: false,
  },
];

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
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<DemoNotification[]>(DEMO_NOTIFICATIONS_INITIAL);

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

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (profileMenuRef.current && !profileMenuRef.current.contains(target)) {
        setProfileMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false);
      }
    }
    if (profileMenuOpen || notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen, notificationsOpen]);

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
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                setNotificationsOpen((o) => !o);
              }}
              className="relative flex items-center justify-center rounded-full border p-2 transition-opacity hover:opacity-90"
              style={{
                width: '40px',
                height: '40px',
                borderWidth: '1px',
                borderColor: '#359689',
                backgroundColor: '#FFFFFF',
              }}
              aria-expanded={notificationsOpen}
              aria-haspopup="dialog"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <img src={notificationIcon} alt="" width={24} height={24} className="block" />
              {unreadCount > 0 && (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 font-source-sans-3 text-[11px] font-bold leading-none text-white"
                  style={{ backgroundColor: '#E57373' }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div
                className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,400px)] rounded-xl border border-gray-200 bg-white font-source-sans-3 shadow-lg"
                style={{ boxShadow: '0 8px 24px rgba(50, 50, 52, 0.12)' }}
                role="dialog"
                aria-label="Notifications"
              >
                <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                  <span className="text-base font-bold text-[#323234]">Notifications</span>
                  <button
                    type="button"
                    onClick={() => setNotifications((list) => list.map((n) => ({ ...n, unread: false })))}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ color: '#359689' }}
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck size={18} strokeWidth={2.25} aria-hidden />
                    Mark all as read
                  </button>
                </div>
                <ul className="max-h-[min(70vh,360px)] space-y-3 overflow-y-auto p-4">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() =>
                          setNotifications((list) =>
                            list.map((item) =>
                              item.id === n.id ? { ...item, unread: false } : item,
                            ),
                          )
                        }
                        className="flex w-full items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 text-left transition-colors hover:bg-gray-50"
                      >
                        <span
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: '#359689' }}
                          aria-hidden
                        >
                          {n.initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#323234]">{n.title}</p>
                          <p className="mt-0.5 text-xs text-gray-500">{n.dateLabel}</p>
                        </div>
                        {n.unread && (
                          <span
                            className="mt-2 h-2 w-2 flex-shrink-0 rounded-full"
                            style={{ backgroundColor: '#E57373' }}
                            aria-label="Unread"
                          />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => {
                setNotificationsOpen(false);
                setProfileMenuOpen(!profileMenuOpen);
              }}
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
