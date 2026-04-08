import type {
  DemoParentCompanyContactRow,
  DemoParentCompanyRecord,
  ParentCompanyContactLevel,
} from '@/lib/demoCommunities';

export type ParentCompanyFormFields = {
  companyType: string;
  companyName: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  website: string;
  communityCount: string;
  importantNotes: string;
};

export type ParentContactFormRow = {
  id: string;
  contactLevel: ParentCompanyContactLevel;
  firstName: string;
  lastName: string;
  officePhone: string;
  cellPhone: string;
  email: string;
};

function newContactRow(level: ParentCompanyContactLevel = 'primary'): ParentContactFormRow {
  return {
    id: `pc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    contactLevel: level,
    firstName: '',
    lastName: '',
    officePhone: '',
    cellPhone: '',
    email: '',
  };
}

function contactSavedToForm(c: DemoParentCompanyContactRow, index: number, parentId: string): ParentContactFormRow {
  return {
    id: `loaded-${parentId}-${index}`,
    contactLevel: c.contact_level,
    firstName: c.first_name ?? '',
    lastName: c.last_name ?? '',
    officePhone: c.office_phone ?? '',
    cellPhone: c.cell_phone ?? '',
    email: c.email ?? '',
  };
}

export function hydrateParentCompanyFormFromRecord(r: DemoParentCompanyRecord): {
  form: ParentCompanyFormFields;
  contacts: ParentContactFormRow[];
  existingLogoFilename: string | null;
} {
  const contacts: ParentContactFormRow[] =
    r.contacts && r.contacts.length > 0
      ? r.contacts.map((c, i) => contactSavedToForm(c, i, r.id))
      : [newContactRow('primary')];

  return {
    form: {
      companyType: r.company_type,
      companyName: r.name,
      address: r.address_line1 ?? '',
      address2: r.address_line2 ?? '',
      city: r.city ?? '',
      state: r.state ?? '',
      zip: r.zip ?? '',
      website: r.website ?? '',
      communityCount: String(r.community_count),
      importantNotes: r.important_notes ?? '',
    },
    contacts,
    existingLogoFilename: r.logo_filename ?? null,
  };
}

function formContactToSaved(c: ParentContactFormRow): DemoParentCompanyContactRow | null {
  const has =
    c.firstName.trim() ||
    c.lastName.trim() ||
    c.officePhone.trim() ||
    c.cellPhone.trim() ||
    c.email.trim();
  if (!has) return null;
  return {
    first_name: c.firstName.trim(),
    last_name: c.lastName.trim(),
    contact_level: c.contactLevel,
    office_phone: c.officePhone.trim() || undefined,
    cell_phone: c.cellPhone.trim() || undefined,
    email: c.email.trim() || undefined,
  };
}

export function buildParentCompanyRecordFromForm(params: {
  id: string;
  form: ParentCompanyFormFields;
  contacts: ParentContactFormRow[];
  existingLogoFilename: string | null;
  newLogoFile: File | null;
}): DemoParentCompanyRecord {
  const { id, form, contacts, existingLogoFilename, newLogoFile } = params;

  const savedContacts = contacts.map(formContactToSaved).filter(Boolean) as DemoParentCompanyContactRow[];

  const countParsed = parseInt(form.communityCount.trim(), 10);
  const communityCount = Number.isFinite(countParsed) ? countParsed : 0;

  const primary =
    savedContacts.find((c) => c.contact_level === 'primary') ?? savedContacts[0];
  const primary_contact_name = primary
    ? `${primary.first_name} ${primary.last_name}`.trim() || 'Contact'
    : 'Contact';

  const logo_filename = newLogoFile?.name ?? existingLogoFilename ?? null;

  return {
    id,
    name: form.companyName.trim(),
    community_count: communityCount,
    company_type: form.companyType.trim(),
    primary_contact_name,
    address_line1: form.address.trim() || undefined,
    address_line2: form.address2.trim() || undefined,
    city: form.city.trim() || undefined,
    state: form.state.trim() || undefined,
    zip: form.zip.trim() || undefined,
    website: form.website.trim() || undefined,
    important_notes: form.importantNotes.trim() || null,
    logo_filename,
    contacts: savedContacts.length ? savedContacts : undefined,
  };
}

export { newContactRow as newParentContactRow };
