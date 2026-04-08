import { useState, useEffect, useMemo, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import { formSelectOverrides } from '@/lib/formStyles';
import { toInputDate } from '@/lib/dateUtils';
import StateSearchSelect from '@/components/StateSearchSelect';
import { ThemeDateTimePicker } from '@/components/ThemeDateTimePicker';
import { SearchableFormSelect, type SearchableFormSelectOption } from '@/components/SearchableFormSelect';
import { useDemoResidents } from '@/contexts/DemoResidentsContext';
import type { BottomToastPayload } from '@/components/BottomToast';

const DUMMY_COMMUNITIES = [
  { id: 'demo-comm-1', name: 'Whitestone' },
  { id: 'demo-comm-2', name: 'Harbor View' },
  { id: 'demo-comm-3', name: 'Maple Ridge' },
];

const DUMMY_SPECIALISTS = [
  { id: 'demo-spec-1', email: 'jane.doe@example.com', display_name: 'Jane Doe' },
  { id: 'demo-spec-2', email: 'alex.morgan@example.com', display_name: 'Alex Morgan' },
  { id: 'demo-spec-3', email: 'sam.rivera@example.com', display_name: 'Sam Rivera' },
];

const ADD_RESIDENT_RELATIONSHIP_OPTIONS: SearchableFormSelectOption[] = [
  { value: 'Son', label: 'Son' },
  { value: 'Daughter', label: 'Daughter' },
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Sibling', label: 'Sibling' },
  { value: 'Other', label: 'Other' },
];

const emptyResidentForm = () => ({
  relocationSpecialist: '',
  firstName: '',
  lastName: '',
  address: '',
  address2: '',
  city: '',
  state: '',
  zipCode: '',
  email: '',
  phone: '',
  primaryContactFirstName: '',
  primaryContactLastName: '',
  primaryContactEmail: '',
  primaryContactPhone: '',
  primaryContactRelationship: '',
  primaryContactNotes: '',
  community: '',
  moveInDate: '',
  importantNotes: '',
});

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

export type ResidentFormSlidePanelProps = {
  /** When false, panel is not rendered */
  open: boolean;
  /** Called after close animation (~300ms) — clear parent open state */
  onClose: () => void;
  /** Edit mode when set; add mode when null */
  editingResidentId: string | null;
  onSaveSuccess?: (payload: BottomToastPayload) => void;
};

export default function ResidentFormSlidePanel({
  open,
  onClose,
  editingResidentId,
  onSaveSuccess,
}: ResidentFormSlidePanelProps) {
  const { records: demoRecords, setRecords: setDemoRecords } = useDemoResidents();
  const [residentForm, setResidentForm] = useState(emptyResidentForm);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [panelEntered, setPanelEntered] = useState(false);

  const communitySearchOptions = useMemo(
    () => DUMMY_COMMUNITIES.map((c) => ({ value: c.id, label: c.name })),
    [],
  );
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
    if (!open || !editingResidentId) return;
    const data = demoRecords.find((row) => row.id === editingResidentId);
    if (!data) return;
    const r = data;
    const pc = r.primary_contact;
    setResidentForm({
      relocationSpecialist: r.assigned_relocation_specialist_id ?? '',
      firstName: r.first_name ?? '',
      lastName: r.last_name ?? '',
      address: r.address ?? '',
      address2: r.address_2 ?? '',
      city: r.city ?? '',
      state: r.state ?? '',
      zipCode: r.zip_code ?? '',
      email: r.email ?? '',
      phone: r.phone ?? '',
      primaryContactFirstName: pc?.first_name ?? '',
      primaryContactLastName: pc?.last_name ?? '',
      primaryContactEmail: pc?.email ?? '',
      primaryContactPhone: pc?.phone ?? '',
      primaryContactRelationship: pc?.relationship ?? '',
      primaryContactNotes: pc?.notes ?? '',
      community: r.community_id ?? '',
      moveInDate: r.move_in_date ? toInputDate(r.move_in_date) : '',
      importantNotes: r.important_notes ?? '',
    });
  }, [open, editingResidentId, demoRecords]);

  useEffect(() => {
    if (open && !editingResidentId) {
      setResidentForm(emptyResidentForm());
    }
  }, [open, editingResidentId]);

  const requestClose = () => {
    setPanelEntered(false);
    window.setTimeout(() => {
      onClose();
      setResidentForm(emptyResidentForm());
      setSubmitError(null);
    }, 300);
  };

  function handleSaveResident() {
    const communityId = residentForm.community.trim();
    const firstName = residentForm.firstName.trim();
    const lastName = residentForm.lastName.trim();
    if (!communityId) {
      setSubmitError('Please select a community.');
      return;
    }
    if (!firstName || !lastName) {
      setSubmitError('First name and last name are required.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);

    const specId = residentForm.relocationSpecialist.trim() || null;
    const specName = specId
      ? (DUMMY_SPECIALISTS.find((s) => s.id === specId)?.display_name ?? '—')
      : '—';
    const commName = DUMMY_COMMUNITIES.find((c) => c.id === communityId)?.name ?? '—';

    const primaryPayload = {
      first_name: residentForm.primaryContactFirstName.trim() || null,
      last_name: residentForm.primaryContactLastName.trim() || null,
      email: residentForm.primaryContactEmail.trim() || null,
      phone: residentForm.primaryContactPhone.trim() || null,
      relationship: residentForm.primaryContactRelationship.trim() || null,
      notes: residentForm.primaryContactNotes.trim() || null,
    };

    const hasPrimary =
      (primaryPayload.first_name ?? '') !== '' ||
      (primaryPayload.last_name ?? '') !== '' ||
      (primaryPayload.email ?? '') !== '' ||
      (primaryPayload.phone ?? '') !== '';

    try {
      if (editingResidentId) {
        setDemoRecords((prev) =>
          prev.map((row) => {
            if (row.id !== editingResidentId) return row;
            const nextPc = hasPrimary
              ? {
                  id: row.primary_contact?.id ?? `demo-pc-${editingResidentId}`,
                  ...primaryPayload,
                }
              : row.primary_contact;
            return {
              ...row,
              first_name: firstName,
              last_name: lastName,
              community_id: communityId,
              community_name: commName,
              assigned_relocation_specialist_id: specId,
              relocation_specialist_display: specName,
              zip_code: residentForm.zipCode.trim() || null,
              move_in_date: residentForm.moveInDate.trim() || null,
              important_notes: residentForm.importantNotes.trim() || null,
              email: residentForm.email.trim() || null,
              phone: residentForm.phone.trim() || null,
              address: residentForm.address.trim() || null,
              address_2: residentForm.address2.trim() || null,
              city: residentForm.city.trim() || null,
              state: residentForm.state.trim() || null,
              primary_contact: nextPc,
            };
          }),
        );
      } else {
        const newId = `demo-r-${Date.now()}`;
        setDemoRecords((prev) => [
          ...prev,
          {
            id: newId,
            first_name: firstName,
            last_name: lastName,
            community_id: communityId,
            community_name: commName,
            assigned_relocation_specialist_id: specId,
            relocation_specialist_display: specName,
            zip_code: residentForm.zipCode.trim() || null,
            move_in_date: residentForm.moveInDate.trim() || null,
            status: 'pending',
            email: residentForm.email.trim() || null,
            phone: residentForm.phone.trim() || null,
            address: residentForm.address.trim() || null,
            address_2: residentForm.address2.trim() || null,
            city: residentForm.city.trim() || null,
            state: residentForm.state.trim() || null,
            important_notes: residentForm.importantNotes.trim() || null,
            primary_contact: hasPrimary
              ? { id: `demo-pc-${newId}`, ...primaryPayload }
              : null,
            secondary_contact: null,
            additional_contacts: [],
          },
        ]);
      }
      onSaveSuccess?.({
        message: editingResidentId ? 'Resident successfully updated' : 'New resident successfully added',
        variant: 'success',
      });
      requestClose();
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  const moveInFieldId = `resident-move-in-${editingResidentId ?? 'new'}`;

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
        aria-labelledby="add-resident-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white p-4 md:p-6">
          <div className="flex items-center gap-3 md:gap-4">
            <button
              type="button"
              onClick={requestClose}
              className="rounded p-1 hover:bg-gray-100"
              aria-label="Close"
            >
              <X size={20} className="text-gray-600" />
            </button>
            <h2
              id="add-resident-title"
              className="font-source-sans-3"
              style={{
                fontFamily: 'var(--font-source-sans-3), Source Sans 3, sans-serif',
                fontWeight: 600,
                fontSize: 24,
                lineHeight: '28px',
                letterSpacing: '0%',
                color: '#323234',
              }}
            >
              {editingResidentId ? 'Edit Resident' : 'Add Resident'}
            </h2>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={requestClose}
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
              onClick={handleSaveResident}
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
            <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
              Relocation Specialist
            </label>
            <SearchableFormSelect
              value={residentForm.relocationSpecialist}
              onChange={(v) => setResidentForm({ ...residentForm, relocationSpecialist: v })}
              options={relocationSpecialistSearchOptions}
              placeholder="Select Relocation Specialist"
              disabled={submitting}
              emptyMessage="No specialists match."
              style={{ ...formInputStyle, ...formSelectOverrides }}
              inputClassName="placeholder:text-lg"
            />
          </div>

          <div>
            <h3 className="mb-3 font-source-sans-3 md:mb-4" style={formSectionHeaderStyle}>
              Resident Information
            </h3>
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="Input First Name"
                  value={residentForm.firstName}
                  onChange={(e) => setResidentForm({ ...residentForm, firstName: e.target.value })}
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
                  placeholder="Input Last Name"
                  value={residentForm.lastName}
                  onChange={(e) => setResidentForm({ ...residentForm, lastName: e.target.value })}
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
                  value={residentForm.address}
                  onChange={(e) => setResidentForm({ ...residentForm, address: e.target.value })}
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
                  value={residentForm.address2}
                  onChange={(e) => setResidentForm({ ...residentForm, address2: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  City
                </label>
                <input
                  type="text"
                  placeholder="Input City"
                  value={residentForm.city}
                  onChange={(e) => setResidentForm({ ...residentForm, city: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  State
                </label>
                <StateSearchSelect
                  value={residentForm.state}
                  onChange={(next) => setResidentForm({ ...residentForm, state: next })}
                  placeholder="Select State"
                  className="w-full bg-white pr-10 font-source-sans-3 placeholder:text-lg focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ ...formSelectStyle, color: residentForm.state ? '#323234' : '#ACACAD' }}
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Zip Code
                </label>
                <input
                  type="text"
                  placeholder="Input Zip Code"
                  value={residentForm.zipCode}
                  onChange={(e) => setResidentForm({ ...residentForm, zipCode: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Input Email"
                  value={residentForm.email}
                  onChange={(e) => setResidentForm({ ...residentForm, email: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="Input Phone"
                  value={residentForm.phone}
                  onChange={(e) => setResidentForm({ ...residentForm, phone: e.target.value })}
                  className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-source-sans-3 md:mb-4" style={formSectionHeaderStyle}>
              Primary Resident Contact Information
            </h3>
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="Input First Name"
                  value={residentForm.primaryContactFirstName}
                  onChange={(e) =>
                    setResidentForm({ ...residentForm, primaryContactFirstName: e.target.value })
                  }
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
                  placeholder="Input Last Name"
                  value={residentForm.primaryContactLastName}
                  onChange={(e) =>
                    setResidentForm({ ...residentForm, primaryContactLastName: e.target.value })
                  }
                  className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Input Email"
                  value={residentForm.primaryContactEmail}
                  onChange={(e) =>
                    setResidentForm({ ...residentForm, primaryContactEmail: e.target.value })
                  }
                  className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Phone
                </label>
                <input
                  type="tel"
                  placeholder="Input Phone"
                  value={residentForm.primaryContactPhone}
                  onChange={(e) =>
                    setResidentForm({ ...residentForm, primaryContactPhone: e.target.value })
                  }
                  className="w-full font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={formInputStyle}
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Relationship
                </label>
                <SearchableFormSelect
                  value={residentForm.primaryContactRelationship}
                  onChange={(v) => setResidentForm({ ...residentForm, primaryContactRelationship: v })}
                  options={ADD_RESIDENT_RELATIONSHIP_OPTIONS}
                  placeholder="Select Relationship"
                  disabled={submitting}
                  emptyMessage="No relationships match."
                  style={{ ...formInputStyle, ...formSelectOverrides }}
                  inputClassName="placeholder:text-lg"
                />
              </div>
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Notes
                </label>
                <textarea
                  placeholder="Kenra handles most of the things..."
                  value={residentForm.primaryContactNotes}
                  onChange={(e) =>
                    setResidentForm({ ...residentForm, primaryContactNotes: e.target.value })
                  }
                  rows={3}
                  className="w-full resize-y font-source-sans-3 placeholder:leading-5 placeholder:text-lg placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ ...formInputStyle, height: 'auto', minHeight: 48 }}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-source-sans-3 md:mb-4" style={formSectionHeaderStyle}>
              Community Information
            </h3>
            <div className="space-y-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
              <div>
                <label className="mb-2 block font-source-sans-3" style={formLabelStyle}>
                  Community
                </label>
                <SearchableFormSelect
                  value={residentForm.community}
                  onChange={(v) => setResidentForm({ ...residentForm, community: v })}
                  options={communitySearchOptions}
                  placeholder="Select Community"
                  disabled={submitting}
                  emptyMessage="No communities match."
                  style={{ ...formInputStyle, ...formSelectOverrides }}
                  inputClassName="placeholder:text-lg"
                />
              </div>
              <div>
                <ThemeDateTimePicker
                  id={moveInFieldId}
                  label="Move in Date (mm/dd/yyyy)"
                  dateOnly
                  value={(() => {
                    const d = toInputDate(residentForm.moveInDate);
                    return d ? `${d}T00:00` : '';
                  })()}
                  onChange={(v) =>
                    setResidentForm({
                      ...residentForm,
                      moveInDate: v.trim() ? v.split('T')[0] : '',
                    })
                  }
                  emptyLabel="mm/dd/yyyy"
                  allowClear
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-source-sans-3 md:mb-4" style={formSectionHeaderStyle}>
              Important Notes
            </h3>
            <textarea
              placeholder="Input important resident notes here"
              value={residentForm.importantNotes}
              onChange={(e) => setResidentForm({ ...residentForm, importantNotes: e.target.value })}
              rows={5}
              className="w-full resize-y font-source-sans-3 placeholder:leading-5 placeholder:text-base placeholder:font-medium placeholder:text-[#ACACAD] focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              style={{ ...formInputStyle, height: 'auto', minHeight: 120 }}
            />
          </div>

          <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-gray-200 bg-white pb-4 pt-4 md:hidden">
            <button
              type="button"
              onClick={requestClose}
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
              onClick={handleSaveResident}
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
