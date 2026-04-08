import { useEffect, useMemo, useState } from 'react';
import { X, Pencil, FileText } from 'lucide-react';
import type { DemoCommunityRecord } from '@/lib/demoCommunities';
import { buildCommunityDrawerDetail } from '@/lib/communityDrawerDetail';

const TEAL = '#307584';
const CARD_BG = '#EEF4F6';

const sectionTitleStyle = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: 18,
  lineHeight: '22px',
  color: TEAL,
} as const;

const bodyStyle = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 500,
  fontSize: 16,
  lineHeight: '24px',
  color: '#323234',
} as const;

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="rounded-xl p-4 md:p-5"
      style={{ backgroundColor: CARD_BG }}
    >
      <h3 className="mb-3 font-source-sans-3" style={sectionTitleStyle}>
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export type CommunityViewDrawerProps = {
  open: boolean;
  onClose: () => void;
  community: DemoCommunityRecord | null;
  onEdit?: () => void;
};

export default function CommunityViewDrawer({
  open,
  onClose,
  community,
  onEdit,
}: CommunityViewDrawerProps) {
  const [entered, setEntered] = useState(false);

  const detail = useMemo(
    () => (community ? buildCommunityDrawerDetail(community) : null),
    [community],
  );

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

  if (!open || !community || !detail) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        style={{ opacity: entered ? 1 : 0 }}
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 flex h-full w-full max-w-2xl flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out lg:max-w-xl ${
          entered ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-view-title"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-white px-4 pb-3 pt-4 md:px-6 md:pt-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={requestClose}
              className="shrink-0 rounded p-1 hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={22} className="text-gray-600" />
            </button>
            <h2
              id="community-view-title"
              className="min-w-0 font-source-sans-3 text-xl font-semibold leading-tight text-[#323234] md:text-2xl"
            >
              View or Edit Community
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onEdit?.()}
            className="shrink-0 rounded-lg p-2 transition-opacity hover:bg-gray-100 hover:opacity-90"
            style={{ color: TEAL }}
            aria-label="Edit community"
          >
            <Pencil size={22} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 px-4 pb-8 md:gap-5 md:px-6">
          <SectionCard title="Community Information">
            <p style={bodyStyle}>{detail.name}</p>
            <p style={bodyStyle}>{detail.communityType}</p>
            <p style={bodyStyle}>{detail.parentCompanyName}</p>
            <p style={bodyStyle}>{detail.status}</p>
            <p style={bodyStyle}>{detail.addressLine}</p>
            <p style={bodyStyle}>Office Phone: {detail.officePhone}</p>
            <p style={bodyStyle}>{detail.website}</p>
            <p style={bodyStyle}>{detail.unitsLabel}</p>
            <p style={bodyStyle}>Contract Date: {detail.contractDateDisplay}</p>
            <p style={bodyStyle}>Onboarding Date: {detail.onboardingDateDisplay}</p>
          </SectionCard>

          {detail.contacts.map((c, i) => (
            <SectionCard key={`${c.email}-${i}`} title={detail.contacts.length > 1 ? `Contact ${i + 1}` : 'Contact'}>
              <p style={bodyStyle}>{c.displayName}</p>
              <p style={bodyStyle}>{c.addressLine}</p>
              <p style={bodyStyle}>Direct Line Phone: {c.directLine}</p>
              <p style={bodyStyle}>Cell Phone: {c.cellPhone}</p>
              <p style={bodyStyle}>
                <a
                  href={`mailto:${c.email}`}
                  className="font-medium underline"
                  style={{ color: TEAL }}
                >
                  {c.email}
                </a>
              </p>
              <p style={bodyStyle}>{c.websiteDisplay}</p>
            </SectionCard>
          ))}

          <SectionCard title="Team">
            <p style={bodyStyle}>{detail.teamMemberName}</p>
            <p style={bodyStyle}>Expiration: {detail.teamExpirationDisplay}</p>
          </SectionCard>

          <SectionCard title="Important Notes">
            <p className="whitespace-pre-wrap" style={bodyStyle}>
              {detail.importantNotes}
            </p>
          </SectionCard>

          <SectionCard title="Attachments">
            <ul className="space-y-2">
              {detail.attachments.map((a) => (
                <li key={a.id} className="flex items-center gap-2" style={bodyStyle}>
                  <FileText size={20} strokeWidth={1.5} style={{ color: TEAL }} aria-hidden />
                  <span>{a.filename}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
