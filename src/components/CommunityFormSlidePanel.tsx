import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { X, Plus, Info, Trash2 } from 'lucide-react';
import { formSelectOverrides } from '@/lib/formStyles';
import { toInputDate } from '@/lib/dateUtils';
import StateSearchSelect from '@/components/StateSearchSelect';
import { ThemeDateTimePicker } from '@/components/ThemeDateTimePicker';
import { SearchableFormSelect, type SearchableFormSelectOption } from '@/components/SearchableFormSelect';
import {
  DEMO_COMMUNITIES,
  DEMO_PARENT_COMPANIES,
  type DemoCommunityRecord,
} from '@/lib/demoCommunities';
import type { BottomToastPayload } from '@/components/BottomToast';
import type { DemoCommunityAttachmentRow } from '@/lib/demoCommunities';
import {
  buildDemoCommunityRecordFromForm,
  hydrateCommunityFormFromRecord,
} from '@/lib/communityFormFromRecord';

const DUMMY_SPECIALISTS = [
  { id: 'demo-spec-1', email: 'jane.doe@example.com', display_name: 'Jane Doe' },
  { id: 'demo-spec-2', email: 'alex.morgan@example.com', display_name: 'Alex Morgan' },
  { id: 'demo-spec-3', email: 'sam.rivera@example.com', display_name: 'Sam Rivera' },
  { id: 'demo-spec-4', email: 'morgan.blake@example.com', display_name: 'Morgan Blake' },
  { id: 'demo-spec-5', email: 'kathleen.f@example.com', display_name: 'Kathleen Fredendall' },
];

const STATUS_OPTIONS: SearchableFormSelectOption[] = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Coming Soon', label: 'Coming Soon' },
];

const formSectionHeaderStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: 20,
  lineHeight: '24px',
  letterSpacing: '0%',
  verticalAlign: 'middle',
  color: '#000000',
};
const formLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: 18,
  lineHeight: '20px',
  letterSpacing: '0%',
  verticalAlign: 'middle',
  color: '#323234',
};
const formInputStyle: CSSProperties = {
  width: '100%',
  maxWidth: 335,
  height: 48,
  borderRadius: 8,
  border: '1px solid #d1d5db',
  padding: 16,
  gap: 8,
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 500,
  fontSize: 18,
  lineHeight: '20px',
  letterSpacing: '0%',
  color: '#323234',
};
const formSelectStyle: CSSProperties = {
  ...formInputStyle,
  ...formSelectOverrides,
};

type ContactRow = {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  directLine: string;
  cellPhone: string;
  email: string;
  website: string;
};

function newContactRow(): ContactRow {
  return {
    id: `cc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    firstName: '',
    lastName: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    directLine: '',
    cellPhone: '',
    email: '',
    website: '',
  };
}

function emptyCommunityForm() {
  return {
    communityName: '',
    communityType: '',
    parentCompanyId: '',
    status: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    officePhone: '',
    website: '',
    numberOfUnits: '',
    contractDate: '',
    onboardingDate: '',
    relocationSpecialist: '',
    importantNotes: '',
  };
}

export type CommunityFormSlidePanelProps = {
  open: boolean;
  onClose: () => void;
  onSaveSuccess?: (payload: BottomToastPayload) => void;
  /** Current communities list (for dropdown options and edit hydration). */
  communitiesList: DemoCommunityRecord[];
  /** When set, panel loads this community for editing. */
  editingCommunityId?: string | null;
  onAdd: (row: DemoCommunityRecord) => void;
  onUpdate?: (row: DemoCommunityRecord) => void;
  /** Edit mode: leave form and return to read-only community drawer (Cancel / X / backdrop). */
  onExitEdit?: (communityId: string) => void;
};

export default function CommunityFormSlidePanel({
  open,
  onClose,
  onSaveSuccess,
  communitiesList,
  editingCommunityId = null,
  onAdd,
  onUpdate,
  onExitEdit,
}: CommunityFormSlidePanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contacts, setContacts] = useState<ContactRow[]>(() => [newContactRow()]);
  const [form, setForm] = useState(emptyCommunityForm);
  const [existingAttachments, setExistingAttachments] = useState<DemoCommunityAttachmentRow[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);

  const communityTypeOptions = useMemo(
    () =>
      [...new Set([...DEMO_COMMUNITIES, ...communitiesList].map((c) => c.community_type))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [communitiesList],
  );
  const communityTypeSelectOptions: SearchableFormSelectOption[] = useMemo(
    () => communityTypeOptions.map((t) => ({ value: t, label: t })),
    [communityTypeOptions],
  );

  const parentCompanyOptions: SearchableFormSelectOption[] = useMemo(() => {
    const m = new Map<string, string>();
    communitiesList.forEach((c) => m.set(c.parent_company_id, c.parent_company_name));
    DEMO_COMMUNITIES.forEach((c) => m.set(c.parent_company_id, c.parent_company_name));
    DEMO_PARENT_COMPANIES.forEach((p) => m.set(p.id, p.name));
    return [...m.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [communitiesList]);

  const relocationSpecialistSearchOptions = useMemo(
    () => DUMMY_SPECIALISTS.map((s) => ({ value: s.id, label: s.display_name })),
    [],
  );

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => setPanelEntered(true));
      return () => cancelAnimationFrame(frame);
    }
    setPanelEntered(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (editingCommunityId) return;
    const first = newContactRow();
    setContacts([first]);
    setForm(emptyCommunityForm());
    setExistingAttachments([]);
    setAttachmentFiles([]);
    setSubmitError(null);
  }, [open, editingCommunityId]);

  useEffect(() => {
    if (!open || !editingCommunityId) return;
    const r = communitiesList.find((c) => c.id === editingCommunityId);
    if (!r) {
      setSubmitError('Community not found.');
      return;
    }
    const h = hydrateCommunityFormFromRecord(r);
    setForm(h.form);
    setContacts(h.contacts);
    setExistingAttachments(h.existingAttachments);
    setAttachmentFiles([]);
    setSubmitError(null);
  }, [open, editingCommunityId, communitiesList]);

  const resetFormState = () => {
    const first = newContactRow();
    setContacts([first]);
    setForm(emptyCommunityForm());
    setExistingAttachments([]);
    setAttachmentFiles([]);
    setSubmitError(null);
  };

  const requestClose = () => {
    setPanelEntered(false);
    window.setTimeout(() => {
      onClose();
      resetFormState();
    }, 300);
  };

  const leaveEditForViewDrawer = () => {
    const id = editingCommunityId;
    setPanelEntered(false);
    window.setTimeout(() => {
      if (id && onExitEdit) {
        onExitEdit(id);
      } else {
        onClose();
      }
      resetFormState();
    }, 300);
  };

  const handleCancel = () => {
    if (editingCommunityId) {
      leaveEditForViewDrawer();
    } else {
      requestClose();
    }
  };

  const updateContact = (id: string, patch: Partial<ContactRow>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const addContactRow = () => {
    const row = newContactRow();
    setContacts((prev) => [...prev, row]);
  };

  const mergeFiles = (list: FileList | null) => {
    if (!list?.length) return;
    setAttachmentFiles((prev) => [...prev, ...Array.from(list)]);
  };

  const removeNewAttachmentAt = (index: number) => {
    setAttachmentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  function handleSave() {
    const name = form.communityName.trim();
    const type = form.communityType.trim();
    const parentId = form.parentCompanyId.trim();
    const specId = form.relocationSpecialist.trim();
    if (!name) {
      setSubmitError('Please enter a community name.');
      return;
    }
    if (!type) {
      setSubmitError('Please select a community type.');
      return;
    }
    if (!parentId) {
      setSubmitError('Please select a parent company.');
      return;
    }
    if (!specId) {
      setSubmitError('Please select a relocation specialist.');
      return;
    }
    const parentLabel = parentCompanyOptions.find((o) => o.value === parentId)?.label ?? '—';
    const spec = DUMMY_SPECIALISTS.find((s) => s.id === specId);
    const previous =
      editingCommunityId != null
        ? communitiesList.find((c) => c.id === editingCommunityId)
        : undefined;
    setSubmitting(true);
    try {
      const row = buildDemoCommunityRecordFromForm({
        id: editingCommunityId ?? `c-${Date.now()}`,
        form,
        contacts,
        existingAttachments,
        newFiles: attachmentFiles,
        specialistDisplay: spec?.display_name ?? '—',
        parentLabel,
        teamContractExpiration: previous?.team_contract_expiration ?? null,
      });
      if (editingCommunityId) {
        onUpdate?.({ ...row, id: editingCommunityId });
        onSaveSuccess?.({ message: 'Community successfully updated', variant: 'success' });
      } else {
        onAdd(row);
        onSaveSuccess?.({ message: 'New community successfully added', variant: 'success' });
      }
      requestClose();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const isEdit = Boolean(editingCommunityId);
  const contractFieldId = `community-contract-${editingCommunityId ?? 'new'}`;
  const onboardingFieldId = `community-onboarding-${editingCommunityId ?? 'new'}`;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
        style={{ opacity: panelEntered ? 1 : 0 }}
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        className={`fixed right-0 top-0 bottom-0 z-50 h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out lg:max-w-3xl ${
          panelEntered ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="community-form-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white p-4 md:p-6">
          <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-4">
            <button
              type="button"
              onClick={requestClose}
              className="shrink-0 rounded p-1 hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={20} className="text-gray-600" />
            </button>
            <h2
              id="community-form-title"
              className="min-w-0 font-source-sans-3"
              style={{
                fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                fontWeight: 600,
                fontSize: 24,
                lineHeight: '28px',
                letterSpacing: '0%',
                color: '#323234',
              }}
            >
              {isEdit ? 'View or Edit Community' : 'Add Community'}
            </h2>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center justify-center font-source-sans-3 transition-opacity hover:opacity-90"
              style={{
                width: 94,
                height: 48,
                minWidth: 48,
                opacity: 1,
                borderRadius: 9999,
                border: '1px solid #83ACB5',
                gap: 8,
                paddingTop: 10,
                paddingRight: 24,
                paddingBottom: 10,
                paddingLeft: 24,
                backgroundColor: '#EAF1F3',
                fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                fontWeight: 500,
                fontSize: 16,
                lineHeight: '22px',
                letterSpacing: '0%',
                color: '#307584',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="flex items-center justify-center font-source-sans-3 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{
                width: 81,
                height: 48,
                minWidth: 48,
                opacity: 1,
                borderRadius: 9999,
                gap: 8,
                paddingTop: 10,
                paddingRight: 24,
                paddingBottom: 10,
                paddingLeft: 24,
                backgroundColor: '#307584',
                fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                fontWeight: 500,
                fontSize: 16,
                lineHeight: '22px',
                letterSpacing: '0%',
                color: '#FFFFFF',
              }}
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="space-y-4 p-4 md:space-y-6 md:p-6">
          {submitError && (
            <div className="font-source-sans-3 text-sm text-red-600" role="alert">
              {submitError}
            </div>
          )}

          <div>
            <h3 className="mb-3 font-source-sans-3 md:mb-4" style={formSectionHeaderStyle}>
              Community Information
            </h3>
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Community Name
                </label>
                <input
                  type="text"
                  placeholder="Input Name"
                  value={form.communityName}
                  onChange={(e) => setForm({ ...form, communityName: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Community Type
                </label>
                <SearchableFormSelect
                  value={form.communityType}
                  onChange={(v) => setForm({ ...form, communityType: v })}
                  options={communityTypeSelectOptions}
                  placeholder="Select"
                  disabled={submitting}
                  emptyMessage="No types match."
                  style={{ ...formInputStyle, ...formSelectOverrides }}
                  inputClassName="placeholder:text-lg"
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Parent Company Name
                </label>
                <SearchableFormSelect
                  value={form.parentCompanyId}
                  onChange={(v) => setForm({ ...form, parentCompanyId: v })}
                  options={parentCompanyOptions}
                  placeholder="Select"
                  disabled={submitting}
                  emptyMessage="No companies match."
                  style={{ ...formInputStyle, ...formSelectOverrides }}
                  inputClassName="placeholder:text-lg"
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Status
                </label>
                <SearchableFormSelect
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v })}
                  options={STATUS_OPTIONS}
                  placeholder="Select"
                  disabled={submitting}
                  emptyMessage="No statuses match."
                  style={{ ...formInputStyle, ...formSelectOverrides }}
                  inputClassName="placeholder:text-lg"
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Input Street Address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Address 2 (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Input Address Line 2"
                  value={form.address2}
                  onChange={(e) => setForm({ ...form, address2: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  City
                </label>
                <input
                  type="text"
                  placeholder="Input City"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
              <div className="hidden md:block" aria-hidden />
              <div className="md:col-span-2 md:grid md:grid-cols-[minmax(140px,200px)_1fr] md:gap-4">
                <div>
                  <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                    State
                  </label>
                  <StateSearchSelect
                    value={form.state}
                    onChange={(next) => setForm({ ...form, state: next })}
                    placeholder="Select"
                    className="w-full bg-white pr-10 font-source-sans-3 placeholder:text-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    style={{ ...formSelectStyle, color: form.state ? '#323234' : '#ACACAD' }}
                  />
                </div>
                <div>
                  <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                    Zip Code
                  </label>
                  <input
                    type="text"
                    placeholder="Input Zip Code"
                    value={form.zip}
                    onChange={(e) => setForm({ ...form, zip: e.target.value })}
                    className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    style={formInputStyle}
                  />
                </div>
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Office Phone
                </label>
                <input
                  type="tel"
                  placeholder="Input Office Phone"
                  value={form.officePhone}
                  onChange={(e) => setForm({ ...form, officePhone: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Website
                </label>
                <input
                  type="url"
                  placeholder="Input Website"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Number of Units
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Input Number"
                  value={form.numberOfUnits}
                  onChange={(e) => setForm({ ...form, numberOfUnits: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
              <div>
                <ThemeDateTimePicker
                  id={contractFieldId}
                  label="Contract Date"
                  dateOnly
                  value={(() => {
                    const d = toInputDate(form.contractDate);
                    return d ? `${d}T00:00` : '';
                  })()}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      contractDate: v.trim() ? v.split('T')[0] : '',
                    })
                  }
                  emptyLabel="Select or Input Date"
                  allowClear
                />
              </div>
              <div>
                <ThemeDateTimePicker
                  id={onboardingFieldId}
                  label="Onboarding Date"
                  dateOnly
                  value={(() => {
                    const d = toInputDate(form.onboardingDate);
                    return d ? `${d}T00:00` : '';
                  })()}
                  onChange={(v) =>
                    setForm({
                      ...form,
                      onboardingDate: v.trim() ? v.split('T')[0] : '',
                    })
                  }
                  emptyLabel="Select or Input Date"
                  allowClear
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-source-sans-3 md:mb-4" style={formSectionHeaderStyle}>
              Contact
            </h3>
            {contacts.map((c, idx) => (
              <div
                key={c.id}
                className={idx > 0 ? 'mt-6 border-t border-gray-200 pt-6' : ''}
              >
                <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={c.firstName}
                      onChange={(e) => updateContact(c.id, { firstName: e.target.value })}
                      className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={c.lastName}
                      onChange={(e) => updateContact(c.id, { lastName: e.target.value })}
                      className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                      Address
                    </label>
                    <input
                      type="text"
                      placeholder="Input Street Address"
                      value={c.address}
                      onChange={(e) => updateContact(c.id, { address: e.target.value })}
                      className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                      Address 2 (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="Input Address Line 2"
                      value={c.address2}
                      onChange={(e) => updateContact(c.id, { address2: e.target.value })}
                      className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="Input City"
                      value={c.city}
                      onChange={(e) => updateContact(c.id, { city: e.target.value })}
                      className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={formInputStyle}
                    />
                  </div>
                  <div className="hidden md:block" aria-hidden />
                  <div className="md:col-span-2 md:grid md:grid-cols-[minmax(140px,200px)_1fr] md:gap-4">
                    <div>
                      <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                        State
                      </label>
                      <StateSearchSelect
                        value={c.state}
                        onChange={(next) => updateContact(c.id, { state: next })}
                        placeholder="Select"
                        className="w-full bg-white pr-10 font-source-sans-3 placeholder:text-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        style={{ ...formSelectStyle, color: c.state ? '#323234' : '#ACACAD' }}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                        Zip Code
                      </label>
                      <input
                        type="text"
                        placeholder="Input Zip Code"
                        value={c.zip}
                        onChange={(e) => updateContact(c.id, { zip: e.target.value })}
                        className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        style={formInputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                      Direct Line
                    </label>
                    <input
                      type="tel"
                      value={c.directLine}
                      onChange={(e) => updateContact(c.id, { directLine: e.target.value })}
                      className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                      Cell Phone
                    </label>
                    <input
                      type="tel"
                      value={c.cellPhone}
                      onChange={(e) => updateContact(c.id, { cellPhone: e.target.value })}
                      className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                      Primary Email
                    </label>
                    <input
                      type="email"
                      value={c.email}
                      onChange={(e) => updateContact(c.id, { email: e.target.value })}
                      className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                      Website
                    </label>
                    <input
                      type="url"
                      placeholder="Input Website"
                      value={c.website}
                      onChange={(e) => updateContact(c.id, { website: e.target.value })}
                      className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={formInputStyle}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={addContactRow}
                className="inline-flex items-center gap-1.5 font-source-sans-3 text-base font-medium transition-opacity hover:opacity-80"
                style={{ color: '#307584' }}
              >
                <Plus size={18} strokeWidth={2.5} aria-hidden />
                Add Another Contact
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-source-sans-3 md:mb-4" style={formSectionHeaderStyle}>
              Team
            </h3>
            <div>
              <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                Relocation Specialist
              </label>
              <SearchableFormSelect
                value={form.relocationSpecialist}
                onChange={(v) => setForm({ ...form, relocationSpecialist: v })}
                options={relocationSpecialistSearchOptions}
                placeholder="Select"
                disabled={submitting}
                emptyMessage="No specialists match."
                style={{ ...formInputStyle, ...formSelectOverrides }}
                inputClassName="placeholder:text-lg"
              />
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-source-sans-3 md:mb-4" style={formSectionHeaderStyle}>
              Important Notes
            </h3>
            <textarea
              placeholder="Input important community notes here"
              value={form.importantNotes}
              onChange={(e) => setForm({ ...form, importantNotes: e.target.value })}
              rows={5}
              className="w-full resize-y font-source-sans-3 placeholder:leading-5 placeholder:text-base placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              style={{ ...formInputStyle, height: 'auto', minHeight: 120, maxWidth: '100%' }}
            />
          </div>

          <div>
            <h3
              className="mb-3 flex items-center gap-2 font-source-sans-3 md:mb-4"
              style={formSectionHeaderStyle}
            >
              Attachments
              <span className="inline-flex text-[#307584]" title="Upload supporting documents">
                <Info size={20} strokeWidth={2} aria-hidden />
              </span>
            </h3>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="sr-only"
              onChange={(e) => {
                mergeFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                mergeFiles(e.dataTransfer.files);
              }}
              className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/80 px-4 py-10 font-source-sans-3 text-lg font-medium text-[#ACACAD] transition-colors hover:border-[#307584]/40 hover:bg-gray-50"
            >
              Drag your files here to upload
            </button>
            {(existingAttachments.length > 0 || attachmentFiles.length > 0) && (
              <ul className="mt-4 space-y-2">
                {existingAttachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 font-source-sans-3 text-sm font-medium text-[#323234]"
                  >
                    <span className="min-w-0 truncate">{a.filename}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setExistingAttachments((prev) => prev.filter((x) => x.id !== a.id))
                      }
                      className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                      aria-label={`Remove ${a.filename}`}
                    >
                      <Trash2 size={18} strokeWidth={1.75} />
                    </button>
                  </li>
                ))}
                {attachmentFiles.map((f, i) => (
                  <li
                    key={`${f.name}-${i}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 font-source-sans-3 text-sm font-medium text-[#323234]"
                  >
                    <span className="min-w-0 truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeNewAttachmentAt(i)}
                      className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                      aria-label={`Remove ${f.name}`}
                    >
                      <Trash2 size={18} strokeWidth={1.75} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-white pb-4 pt-4 md:hidden">
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center justify-center font-source-sans-3 transition-opacity hover:opacity-90"
              style={{
                width: 94,
                height: 48,
                minWidth: 48,
                opacity: 1,
                borderRadius: 9999,
                border: '1px solid #83ACB5',
                gap: 8,
                paddingTop: 10,
                paddingRight: 24,
                paddingBottom: 10,
                paddingLeft: 24,
                backgroundColor: '#EAF1F3',
                fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                fontWeight: 500,
                fontSize: 16,
                lineHeight: '22px',
                letterSpacing: '0%',
                color: '#307584',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={submitting}
              className="flex items-center justify-center font-source-sans-3 transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{
                width: 81,
                height: 48,
                minWidth: 48,
                opacity: 1,
                borderRadius: 9999,
                gap: 8,
                paddingTop: 10,
                paddingRight: 24,
                paddingBottom: 10,
                paddingLeft: 24,
                backgroundColor: '#307584',
                fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                fontWeight: 500,
                fontSize: 16,
                lineHeight: '22px',
                letterSpacing: '0%',
                color: '#FFFFFF',
              }}
            >
              {submitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
