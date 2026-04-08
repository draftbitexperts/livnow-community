import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Pencil } from 'lucide-react';
import type { DemoCommunityRecord, DemoParentCompanyRecord } from '@/lib/demoCommunities';
import { buildParentCompanyDrawerDetail } from '@/lib/parentCompanyDrawerDetail';

const TEAL = '#307584';
const CARD_BG = '#EEF4F6';

const sectionTitleStyle = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: 18,
  lineHeight: '22px',
  color: '#323234',
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
    <section className="rounded-xl p-4 md:p-5" style={{ backgroundColor: CARD_BG }}>
      <h3 className="mb-3 font-source-sans-3" style={sectionTitleStyle}>
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export type ParentCompanyViewDrawerProps = {
  open: boolean;
  onClose: () => void;
  parent: DemoParentCompanyRecord | null;
  /** Communities linked to this parent (session list); forwarded to the full detail route. */
  linkedCommunities: DemoCommunityRecord[];
  onEdit?: () => void;
};

export default function ParentCompanyViewDrawer({
  open,
  onClose,
  parent,
  linkedCommunities,
  onEdit,
}: ParentCompanyViewDrawerProps) {
  const navigate = useNavigate();
  const [entered, setEntered] = useState(false);

  const detail = useMemo(
    () => (parent ? buildParentCompanyDrawerDetail(parent) : null),
    [parent],
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

  if (!open || !parent || !detail) return null;

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
        aria-labelledby="parent-company-view-title"
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
              id="parent-company-view-title"
              className="min-w-0 font-source-sans-3 text-xl font-semibold leading-tight text-[#323234] md:text-2xl"
            >
              View or Edit Parent Company
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onEdit?.()}
            className="shrink-0 rounded-lg p-2 transition-opacity hover:bg-gray-100 hover:opacity-90"
            style={{ color: TEAL }}
            aria-label="Edit parent company"
          >
            <Pencil size={22} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-4 px-4 pb-8 md:gap-5 md:px-6">
          <button
            type="button"
            onClick={() => {
              navigate(`/communities/parent-companies/${parent.id}`, {
                state: {
                  parentCompanyRecord: parent,
                  linkedCommunities,
                },
              });
              requestClose();
            }}
            className="w-full rounded-xl border-2 px-4 py-3 text-center font-source-sans-3 text-base font-semibold transition-opacity hover:opacity-90"
            style={{ borderColor: TEAL, color: TEAL }}
          >
            Parent Company Detail Screen
          </button>

          <SectionCard title="Parent Company Information">
            <p style={bodyStyle}>{detail.companyType}</p>
            <p style={bodyStyle}>{detail.companyName}</p>
            <p style={bodyStyle}>{detail.addressLine}</p>
            <p style={bodyStyle}>{detail.website}</p>
          </SectionCard>

          <SectionCard title="Primary Contact">
            <p style={bodyStyle}>{detail.primaryContact.displayName}</p>
            <p style={bodyStyle}>Office Phone: {detail.primaryContact.officePhone}</p>
            <p style={bodyStyle}>Cell Phone: {detail.primaryContact.cellPhone}</p>
            <p style={bodyStyle}>
              <a
                href={`mailto:${detail.primaryContact.email}`}
                className="font-medium underline"
                style={{ color: TEAL }}
              >
                {detail.primaryContact.email}
              </a>
            </p>
          </SectionCard>

          <SectionCard title="Important Notes">
            <p className="whitespace-pre-wrap" style={bodyStyle}>
              {detail.importantNotes}
            </p>
          </SectionCard>
        </div>
      </div>
    </>
  );
}
