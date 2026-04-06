import type { CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  User,
  Users,
  ChevronDown,
  Heart,
  BookText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useSidebarLayout } from '@/contexts/SidebarLayoutContext';

/** Heart inside circle outline — matches LivNow-Admin Sidebar */
function HeartCircleIcon({ size = 22 }: { size?: number }) {
  return (
    <span
      className="inline-flex flex-shrink-0 items-center justify-center rounded-full border border-white text-white"
      style={{ width: size, height: size }}
    >
      <Heart size={Math.round(size * 0.5)} strokeWidth={1.5} />
    </span>
  );
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const smallLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), sans-serif',
  fontWeight: 500,
  fontSize: '16px',
  lineHeight: '20px',
  letterSpacing: '0%',
  color: '#FFFFFF',
};

const bigNavStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), sans-serif',
  fontWeight: 500,
  fontSize: '20px',
  lineHeight: '24px',
  letterSpacing: '0%',
  color: '#FFFFFF',
  whiteSpace: 'nowrap',
  textAlign: 'left',
};

const dividerStyle: CSSProperties = {
  height: 0,
  opacity: 1,
  border: '1px solid #FFFFFF',
  borderWidth: '1px 0 0 0',
  width: '100%',
  marginTop: 19,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
};

const navItemBaseStyle: CSSProperties = {
  width: '100%',
  minWidth: 207,
  height: 44,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 16px',
  borderRadius: 360,
  opacity: 1,
};

const selectedNavItemStyle: CSSProperties = {
  ...navItemBaseStyle,
  backgroundColor: '#FFFFFF26',
};

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { collapsed, setCollapsed, sidebarWidth } = useSidebarLayout();

  const residentsActive = location.pathname.startsWith('/residents');

  const sections = [
    {
      smallLabel: 'Home',
      items: [
        {
          label: 'Dashboard',
          href: '/dashboard',
          icon: Home,
          active: location.pathname === '/dashboard',
        },
      ],
    },
    {
      smallLabel: 'Residents',
      items: [
        {
          label: 'All Residents',
          href: '/residents/all',
          icon: User,
          active: residentsActive,
          trailingCaret: true,
        },
      ],
    },
    {
      smallLabel: 'Management',
      items: [
        {
          label: 'Communities',
          href: '/communities',
          icon: HeartCircleIcon,
          active: location.pathname === '/communities',
        },
      ],
    },
    {
      smallLabel: 'Resources',
      items: [
        {
          label: 'Knowledge Base',
          href: '/knowledge-base',
          icon: BookText,
          active: location.pathname === '/knowledge-base',
        },
        {
          label: 'Team',
          href: '/team',
          icon: Users,
          active: location.pathname === '/team',
        },
      ],
    },
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 text-white
          transform transition-transform duration-300 ease-in-out
          transition-[width] duration-300 ease-in-out
          lg:static
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        style={{
          backgroundColor: '#307584',
          width: sidebarWidth,
          minWidth: collapsed ? 72 : 256,
        }}
      >
        <div className="flex h-full w-full min-w-0 flex-col">
          <div
            className={`flex shrink-0 items-center transition-[padding] duration-300 ${collapsed ? 'justify-center p-3' : 'justify-between p-4'}`}
          >
            {!collapsed && (
              <h2 className="font-source-sans-3 text-lg font-semibold text-white">LivNow</h2>
            )}
            <button
              type="button"
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setCollapsed(!collapsed);
                } else {
                  onClose();
                }
              }}
              className="flex-shrink-0 rounded p-1.5 hover:bg-white/10"
              aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
            >
              {collapsed ? (
                <ChevronRight size={20} className="text-white" />
              ) : (
                <ChevronLeft size={20} className="text-white" />
              )}
            </button>
          </div>

          <nav
            className="min-w-0 flex-1 overflow-y-auto"
            style={{
              paddingLeft: collapsed ? 16 : 24,
              paddingRight: collapsed ? 16 : 24,
              paddingTop: 104,
            }}
          >
            {sections.map((section, sectionIndex) => (
              <div key={section.smallLabel} className={collapsed ? 'py-2' : 'py-4'}>
                {!collapsed && (
                  <div className="mb-2 px-2 font-source-sans-3" style={smallLabelStyle}>
                    {section.smallLabel}
                  </div>
                )}
                <div className={collapsed ? 'flex flex-col items-center space-y-1' : 'space-y-1'}>
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const showCaret = !collapsed && 'trailingCaret' in item && item.trailingCaret;
                    return (
                      <Link
                        key={item.label}
                        to={item.href}
                        onClick={() => {
                          if (window.innerWidth < 1024) onClose();
                        }}
                        className={`flex items-center transition-colors hover:bg-white/10 ${collapsed ? 'h-10 w-10 justify-center rounded-full' : ''}`}
                        style={{
                          ...(item.active ? selectedNavItemStyle : navItemBaseStyle),
                          gap: 8,
                          ...(collapsed
                            ? { minWidth: 0, width: 40, justifyContent: 'center', padding: 0 }
                            : { minWidth: 207, width: '100%', justifyContent: 'space-between', padding: '10px 16px' }),
                        }}
                      >
                        <Icon size={22} className="flex-shrink-0 text-white" strokeWidth={1.5} />
                        {!collapsed && (
                          <>
                            <span className="min-w-0 flex-1 font-source-sans-3" style={bigNavStyle}>
                              {item.label}
                            </span>
                            {showCaret ? (
                              <ChevronDown size={20} className="flex-shrink-0 text-white" strokeWidth={1.5} />
                            ) : (
                              <span style={{ width: 22 }} />
                            )}
                          </>
                        )}
                      </Link>
                    );
                  })}
                </div>
                {sectionIndex < sections.length - 1 && !collapsed && (
                  <div role="separator" style={dividerStyle} />
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
