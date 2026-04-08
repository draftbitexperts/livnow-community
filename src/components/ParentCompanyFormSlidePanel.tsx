import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { formSelectOverrides } from '@/lib/formStyles';
import StateSearchSelect from '@/components/StateSearchSelect';
import { SearchableFormSelect, type SearchableFormSelectOption } from '@/components/SearchableFormSelect';
import {
  DEMO_PARENT_COMPANIES,
  type DemoParentCompanyRecord,
  type ParentCompanyContactLevel,
} from '@/lib/demoCommunities';
import type { BottomToastPayload } from '@/components/BottomToast';
import {
  buildParentCompanyRecordFromForm,
  hydrateParentCompanyFormFromRecord,
  newParentContactRow,
  type ParentContactFormRow,
} from '@/lib/parentCompanyFormFromRecord';

const TEAL = '#307584';

const formSectionHeaderStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: 20,
  lineHeight: '24px',
  color: '#000000',
};
const formLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 600,
  fontSize: 18,
  lineHeight: '20px',
  color: '#323234',
};
const formInputStyle: CSSProperties = {
  width: '100%',
  maxWidth: 335,
  height: 48,
  borderRadius: 8,
  border: '1px solid #d1d5db',
  padding: 16,
  fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
  fontWeight: 500,
  fontSize: 18,
  lineHeight: '20px',
  color: '#323234',
};
const formSelectStyle: CSSProperties = {
  ...formInputStyle,
  ...formSelectOverrides,
};

const LEVEL_OPTIONS: { value: ParentCompanyContactLevel; label: string }[] = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'other', label: 'Other' },
];

function emptyForm() {
  return {
    companyType: '',
    companyName: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    website: '',
    communityCount: '',
    importantNotes: '',
  };
}

export type ParentCompanyFormSlidePanelProps = {
  open: boolean;
  onClose: () => void;
  onSaveSuccess?: (payload: BottomToastPayload) => void;
  parentCompaniesList: DemoParentCompanyRecord[];
  editingParentId?: string | null;
  onAdd: (row: DemoParentCompanyRecord) => void;
  onUpdate?: (row: DemoParentCompanyRecord) => void;
  onExitEdit?: (parentId: string) => void;
};

export default function ParentCompanyFormSlidePanel({
  open,
  onClose,
  onSaveSuccess,
  parentCompaniesList,
  editingParentId = null,
  onAdd,
  onUpdate,
  onExitEdit,
}: ParentCompanyFormSlidePanelProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState(emptyForm);
  const [contacts, setContacts] = useState<ParentContactFormRow[]>(() => [newParentContactRow('primary')]);
  const [existingLogoFilename, setExistingLogoFilename] = useState<string | null>(null);
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);

  const companyTypeOptions = useMemo(
    () =>
      [...new Set([...DEMO_PARENT_COMPANIES, ...parentCompaniesList].map((p) => p.company_type))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [parentCompaniesList],
  );
  const companyTypeSelectOptions: SearchableFormSelectOption[] = useMemo(
    () => companyTypeOptions.map((t) => ({ value: t, label: t })),
    [companyTypeOptions],
  );

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => setPanelEntered(true));
      return () => cancelAnimationFrame(frame);
    }
    setPanelEntered(false);
  }, [open]);

  const resetAll = () => {
    setForm(emptyForm());
    setContacts([newParentContactRow('primary')]);
    setExistingLogoFilename(null);
    setNewLogoFile(null);
    setSubmitError(null);
  };

  useEffect(() => {
    if (!open) return;
    if (editingParentId) return;
    resetAll();
  }, [open, editingParentId]);

  useEffect(() => {
    if (!open || !editingParentId) return;
    const r = parentCompaniesList.find((p) => p.id === editingParentId);
    if (!r) {
      setSubmitError('Parent company not found.');
      return;
    }
    const h = hydrateParentCompanyFormFromRecord(r);
    setForm(h.form);
    setContacts(h.contacts.length ? h.contacts : [newParentContactRow('primary')]);
    setExistingLogoFilename(h.existingLogoFilename);
    setNewLogoFile(null);
    setSubmitError(null);
  }, [open, editingParentId, parentCompaniesList]);

  const resetFormState = () => {
    resetAll();
  };

  const requestClose = () => {
    setPanelEntered(false);
    window.setTimeout(() => {
      onClose();
      resetFormState();
    }, 300);
  };

  const leaveEditForViewDrawer = () => {
    const id = editingParentId;
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
    if (editingParentId) {
      leaveEditForViewDrawer();
    } else {
      requestClose();
    }
  };

  const updateContact = (id: string, patch: Partial<ParentContactFormRow>) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const addContactRow = () => {
    setContacts((prev) => [...prev, newParentContactRow('secondary')]);
  };

  const onLogoFiles = (list: FileList | null) => {
    const f = list?.[0];
    if (f) {
      setNewLogoFile(f);
      setExistingLogoFilename(null);
    }
  };

  function handleSave() {
    const type = form.companyType.trim();
    const name = form.companyName.trim();
    if (!type) {
      setSubmitError('Please select a parent company type.');
      return;
    }
    if (!name) {
      setSubmitError('Please enter a parent company name.');
      return;
    }
    setSubmitting(true);
    try {
      const row = buildParentCompanyRecordFromForm({
        id: editingParentId ?? `pp-${Date.now()}`,
        form,
        contacts,
        existingLogoFilename,
        newLogoFile,
      });
      if (editingParentId) {
        onUpdate?.({ ...row, id: editingParentId });
        onSaveSuccess?.({ message: 'Parent company successfully updated', variant: 'success' });
      } else {
        onAdd(row);
        onSaveSuccess?.({ message: 'New parent company successfully added', variant: 'success' });
      }
      requestClose();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const isEdit = Boolean(editingParentId);
  const displayLogoName = newLogoFile?.name ?? existingLogoFilename;

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
        aria-labelledby="parent-company-form-title"
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
              id="parent-company-form-title"
              className="min-w-0 font-source-sans-3"
              style={{
                fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                fontWeight: 600,
                fontSize: 24,
                lineHeight: '28px',
                color: '#323234',
              }}
            >
              {isEdit ? 'View or Edit Parent Company' : 'Add Parent Company'}
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
                borderRadius: 9999,
                border: '1px solid #83ACB5',
                padding: '10px 24px',
                backgroundColor: '#EAF1F3',
                fontWeight: 500,
                fontSize: 16,
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
                borderRadius: 9999,
                padding: '10px 24px',
                backgroundColor: '#307584',
                fontWeight: 500,
                fontSize: 16,
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
            <div className="mb-3 flex items-center justify-between md:mb-4">
              <h3 className="font-source-sans-3" style={formSectionHeaderStyle}>
                Parent Company Logo
              </h3>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="rounded p-1 text-[#307584] hover:bg-gray-100"
                aria-label="Add logo"
              >
                <Plus size={22} strokeWidth={2} />
              </button>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                onLogoFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onLogoFiles(e.dataTransfer.files);
              }}
              className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50/80 px-4 py-10 font-source-sans-3 text-lg font-medium text-[#ACACAD] transition-colors hover:border-[#307584]/40"
            >
              Drag your file here to replace
            </button>
            {displayLogoName && (
              <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 font-source-sans-3 text-sm font-medium text-[#323234]">
                <span className="min-w-0 truncate">{displayLogoName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setNewLogoFile(null);
                    setExistingLogoFilename(null);
                  }}
                  className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                  aria-label="Remove logo"
                >
                  <Trash2 size={18} strokeWidth={1.75} />
                </button>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-3 font-source-sans-3 md:mb-4" style={formSectionHeaderStyle}>
              Parent Company Information
            </h3>
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Parent Company Type
                </label>
                <SearchableFormSelect
                  value={form.companyType}
                  onChange={(v) => setForm({ ...form, companyType: v })}
                  options={companyTypeSelectOptions}
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
                <input
                  type="text"
                  placeholder="Input Name"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Input Street Address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ ...formInputStyle, maxWidth: '100%' }}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Address 2 (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Input Address Line 2"
                  value={form.address2}
                  onChange={(e) => setForm({ ...form, address2: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ ...formInputStyle, maxWidth: '100%' }}
                />
              </div>
              <div className="md:col-span-2 md:grid md:grid-cols-3 md:gap-4">
                <div>
                  <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Input City"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full font-source-sans-3 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    style={formInputStyle}
                  />
                </div>
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
                    className="w-full font-source-sans-3 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    style={formInputStyle}
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Website
                </label>
                <input
                  type="url"
                  placeholder="Input Website"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ ...formInputStyle, maxWidth: '100%' }}
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  # of Communities
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={form.communityCount}
                  onChange={(e) => setForm({ ...form, communityCount: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-source-sans-3 md:mb-4" style={formSectionHeaderStyle}>
              Primary Contact
            </h3>
            {contacts.map((c, idx) => (
              <div key={c.id} className={idx > 0 ? 'mt-6 border-t border-gray-200 pt-6' : ''}>
                {idx > 0 && (
                  <p className="mb-3 font-source-sans-3 text-base font-semibold text-[#323234]">
                    Additional contact
                  </p>
                )}
                <p className="mb-3 font-source-sans-3 text-base font-semibold text-[#323234]">
                  Resident Contact Level
                </p>
                <div role="radiogroup" aria-label="Contact level" className="mb-4 flex flex-wrap gap-6">
                  {LEVEL_OPTIONS.map((opt) => {
                    const selected = c.contactLevel === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => updateContact(c.id, { contactLevel: opt.value })}
                        className="flex items-center gap-2 font-source-sans-3 text-base font-medium text-[#323234]"
                      >
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                          style={{
                            borderColor: selected ? TEAL : '#d1d5db',
                            backgroundColor: selected ? TEAL : 'transparent',
                          }}
                        >
                          {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                        </span>
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                      First Name
                    </label>
                    <input
                      type="text"
                      value={c.firstName}
                      onChange={(e) => updateContact(c.id, { firstName: e.target.value })}
                      className="w-full font-source-sans-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                      className="w-full font-source-sans-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                      Office Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="(123) 456-7890"
                      value={c.officePhone}
                      onChange={(e) => updateContact(c.id, { officePhone: e.target.value })}
                      className="w-full font-source-sans-3 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={formInputStyle}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                      Cell Phone
                    </label>
                    <input
                      type="tel"
                      placeholder="(123) 456-7890"
                      value={c.cellPhone}
                      onChange={(e) => updateContact(c.id, { cellPhone: e.target.value })}
                      className="w-full font-source-sans-3 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={formInputStyle}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                      Primary Email
                    </label>
                    <input
                      type="email"
                      value={c.email}
                      onChange={(e) => updateContact(c.id, { email: e.target.value })}
                      className="w-full font-source-sans-3 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      style={{ ...formInputStyle, maxWidth: '100%' }}
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
                style={{ color: TEAL }}
              >
                <Plus size={18} strokeWidth={2.5} aria-hidden />
                Add Another Contact
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-source-sans-3 md:mb-4" style={formSectionHeaderStyle}>
              Important Notes
            </h3>
            <textarea
              placeholder="Input important notes here"
              value={form.importantNotes}
              onChange={(e) => setForm({ ...form, importantNotes: e.target.value })}
              rows={5}
              className="w-full resize-y font-source-sans-3 placeholder:text-base placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              style={{ ...formInputStyle, height: 'auto', minHeight: 120, maxWidth: '100%' }}
            />
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
                borderRadius: 9999,
                border: '1px solid #83ACB5',
                padding: '10px 24px',
                backgroundColor: '#EAF1F3',
                fontWeight: 500,
                fontSize: 16,
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
                borderRadius: 9999,
                padding: '10px 24px',
                backgroundColor: '#307584',
                fontWeight: 500,
                fontSize: 16,
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
