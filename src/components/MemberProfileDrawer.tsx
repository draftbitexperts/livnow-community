import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { DemoTeamMemberRecord } from '@/lib/demoTeamMembers';

const TEAL = '#359689';
const CARD_BG = '#EEF4F6';

const nameStyle = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 700,
  fontSize: 22,
  lineHeight: '28px',
  color: '#323234',
} as const;

const titleStyle = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 500,
  fontSize: 16,
  lineHeight: '22px',
  color: '#323234',
} as const;

function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (parts.length === 1) return (parts[0][0] + parts[0][0]).toUpperCase();
  return '—';
}

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '');
}

export type MemberProfileDrawerProps = {
  open: boolean;
  onClose: () => void;
  member: DemoTeamMemberRecord | null;
};

export default function MemberProfileDrawer({ open, onClose, member }: MemberProfileDrawerProps) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(id);
    }
    setEntered(false);
  }, [open]);

  const requestClose = () => {
    setEntered(false);
    window.setTimeout(() => onClose(), 300);
  };

  if (!open || !member) return null;

  const tel = digitsOnly(member.phone);
  const telHref = tel.length >= 10 ? `tel:${tel}` : undefined;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        style={{ opacity: entered ? 1 : 0 }}
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out lg:max-w-md ${
          entered ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-profile-title"
      >
        <div className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 pb-3 pt-4 md:px-6 md:pt-6">
          <button
            type="button"
            onClick={requestClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
            aria-label="Close"
          >
            <X size={20} strokeWidth={2} />
          </button>
          <h2
            id="member-profile-title"
            className="min-w-0 font-source-sans-3 text-xl font-semibold leading-tight text-[#323234]"
          >
            Member Profile
          </h2>
        </div>

        <div className="flex flex-1 flex-col px-4 pb-8 md:px-6">
          <div className="rounded-2xl p-5" style={{ backgroundColor: CARD_BG }}>
            <div className="flex gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: '#307584' }}
                aria-hidden
              >
                {memberInitials(member.name)}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="font-source-sans-3" style={nameStyle}>
                  {member.name}
                </p>
                <p className="font-source-sans-3" style={titleStyle}>
                  {member.title}
                </p>
                <a
                  href={`mailto:${member.email}`}
                  className="block font-source-sans-3 text-base font-medium hover:underline"
                  style={{ color: TEAL }}
                >
                  {member.email}
                </a>
                {telHref ? (
                  <a
                    href={telHref}
                    className="block font-source-sans-3 text-base font-medium text-[#323234] hover:underline"
                  >
                    {member.phone}
                  </a>
                ) : (
                  <p className="font-source-sans-3 text-base font-medium text-[#323234]">{member.phone}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
