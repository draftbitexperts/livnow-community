import type {
  DemoCommunityAttachmentRow,
  DemoCommunityContactRow,
  DemoCommunityRecord,
} from '@/lib/demoCommunities';
import { buildCommunityDrawerDetail } from '@/lib/communityDrawerDetail';

export type CommunityFormFields = {
  communityName: string;
  communityType: string;
  parentCompanyId: string;
  status: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  officePhone: string;
  website: string;
  numberOfUnits: string;
  contractDate: string;
  onboardingDate: string;
  relocationSpecialist: string;
  importantNotes: string;
};

export type CommunityContactFormRow = {
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

const SPECIALIST_DISPLAY_TO_ID: Record<string, string> = {
  'Jane Doe': 'demo-spec-1',
  'Alex Morgan': 'demo-spec-2',
  'Sam Rivera': 'demo-spec-3',
  'Morgan Blake': 'demo-spec-4',
  'Kathleen Fredendall': 'demo-spec-5',
  'Kathy Fredendall': 'demo-spec-5',
};

export function specialistIdFromDisplay(displayName: string): string {
  return SPECIALIST_DISPLAY_TO_ID[displayName] ?? '';
}

function unitsStringFromDetail(unitsLabel: string): string {
  const m = unitsLabel.match(/\d+/);
  return m ? m[0] : '';
}

function contactRowFromSaved(c: DemoCommunityContactRow, index: number, communityId: string): CommunityContactFormRow {
  return {
    id: `loaded-${communityId}-${index}`,
    firstName: c.first_name ?? '',
    lastName: c.last_name ?? '',
    address: '',
    address2: '',
    city: '',
    state: '',
    zip: '',
    directLine: c.direct_line ?? '',
    cellPhone: c.cell_phone ?? '',
    email: c.email ?? '',
    website: c.website ?? '',
  };
}

function applyAddressSummaryToContact(row: CommunityContactFormRow, summary: string): CommunityContactFormRow {
  if (!summary.trim()) return row;
  return { ...row, address: summary.trim() };
}

function contactFromDrawerFallback(
  communityId: string,
  displayName: string,
  addressLine: string,
  directLine: string,
  cellPhone: string,
  email: string,
  website: string,
): CommunityContactFormRow {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const firstName = parts[0] ?? '';
  const lastName = parts.slice(1).join(' ');
  return {
    id: `fallback-${communityId}`,
    firstName,
    lastName,
    address: addressLine,
    address2: '',
    city: '',
    state: '',
    zip: '',
    directLine,
    cellPhone,
    email,
    website,
  };
}

export function hydrateCommunityFormFromRecord(r: DemoCommunityRecord): {
  form: CommunityFormFields;
  contacts: CommunityContactFormRow[];
  existingAttachments: DemoCommunityAttachmentRow[];
} {
  const d = buildCommunityDrawerDetail(r);
  const specId = specialistIdFromDisplay(r.relocation_specialist_display);

  const form: CommunityFormFields = {
    communityName: r.name,
    communityType: r.community_type,
    parentCompanyId: r.parent_company_id,
    status: r.status ?? '',
    address: r.address_line1 ?? '',
    address2: r.address_line2 ?? '',
    city: r.city ?? '',
    state: r.state && r.state !== '—' ? r.state : '',
    zip: r.zip ?? '',
    officePhone: r.office_phone ?? d.officePhone,
    website: r.website ?? d.website,
    numberOfUnits:
      r.number_of_units !== undefined && r.number_of_units !== ''
        ? String(r.number_of_units)
        : unitsStringFromDetail(d.unitsLabel),
    contractDate: r.contract_date?.trim() ?? '',
    onboardingDate: r.onboarding_date?.trim() ?? '',
    relocationSpecialist: specId,
    importantNotes: r.important_notes ?? d.importantNotes,
  };

  let contacts: CommunityContactFormRow[];
  if (r.contacts && r.contacts.length > 0) {
    contacts = r.contacts.map((c, i) => {
      let row = contactRowFromSaved(c, i, r.id);
      if (c.address_summary?.trim()) {
        row = applyAddressSummaryToContact(row, c.address_summary);
      }
      return row;
    });
  } else {
    const dc = d.contacts[0];
    contacts = [
      contactFromDrawerFallback(
        r.id,
        dc.displayName,
        dc.addressLine,
        dc.directLine,
        dc.cellPhone,
        dc.email,
        dc.websiteDisplay,
      ),
    ];
  }

  const existingAttachments: DemoCommunityAttachmentRow[] =
    r.attachments && r.attachments.length > 0 ? [...r.attachments] : [];

  return { form, contacts, existingAttachments };
}

function contactFormToSaved(c: CommunityContactFormRow): DemoCommunityContactRow {
  const summaryParts = [
    c.address.trim(),
    c.address2.trim(),
    [c.city.trim(), c.state.trim(), c.zip.trim()].filter(Boolean).join(' '),
  ].filter(Boolean);
  return {
    first_name: c.firstName.trim(),
    last_name: c.lastName.trim(),
    address_summary: summaryParts.length ? summaryParts.join(', ') : undefined,
    direct_line: c.directLine.trim() || undefined,
    cell_phone: c.cellPhone.trim() || undefined,
    email: c.email.trim() || undefined,
    website: c.website.trim() || undefined,
  };
}

export function buildDemoCommunityRecordFromForm(params: {
  id: string;
  form: CommunityFormFields;
  contacts: CommunityContactFormRow[];
  existingAttachments: DemoCommunityAttachmentRow[];
  newFiles: File[];
  specialistDisplay: string;
  parentLabel: string;
  teamContractExpiration?: string | null;
}): DemoCommunityRecord {
  const {
    id,
    form,
    contacts,
    existingAttachments,
    newFiles,
    specialistDisplay,
    parentLabel,
    teamContractExpiration,
  } = params;

  const newAttachmentRows: DemoCommunityAttachmentRow[] = newFiles.map((f, i) => ({
    id: `upload-${id}-${Date.now()}-${i}`,
    filename: f.name,
  }));

  const attachments = [...existingAttachments, ...newAttachmentRows];
  const savedContacts = contacts.map(contactFormToSaved).filter((c) => {
    const has =
      c.first_name ||
      c.last_name ||
      c.address_summary ||
      c.direct_line ||
      c.cell_phone ||
      c.email ||
      c.website;
    return Boolean(has);
  });

  const stateVal = form.state.trim() || '—';

  return {
    id,
    name: form.communityName.trim(),
    state: stateVal,
    relocation_specialist_display: specialistDisplay,
    parent_company_id: form.parentCompanyId.trim(),
    parent_company_name: parentLabel,
    community_type: form.communityType.trim(),
    status: form.status.trim() || undefined,
    city: form.city.trim() || undefined,
    address_line1: form.address.trim() || undefined,
    address_line2: form.address2.trim() || undefined,
    zip: form.zip.trim() || undefined,
    office_phone: form.officePhone.trim() || undefined,
    website: form.website.trim() || undefined,
    number_of_units: form.numberOfUnits.trim() || undefined,
    contract_date: form.contractDate.trim() || null,
    onboarding_date: form.onboardingDate.trim() || null,
    important_notes: form.importantNotes.trim() || null,
    team_contract_expiration: teamContractExpiration?.trim() || null,
    contacts: savedContacts.length ? savedContacts : undefined,
    attachments: attachments.length ? attachments : undefined,
  };
}
