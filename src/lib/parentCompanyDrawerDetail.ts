import type { DemoParentCompanyRecord, DemoParentCompanyContactRow } from '@/lib/demoCommunities';

export type ParentCompanyDrawerContact = {
  displayName: string;
  officePhone: string;
  cellPhone: string;
  email: string;
};

export type ParentCompanyDrawerDetail = {
  companyType: string;
  companyName: string;
  addressLine: string;
  website: string;
  primaryContact: ParentCompanyDrawerContact;
  importantNotes: string;
};

function stableHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function fakePhone(seed: number): string {
  const ac = 200 + (seed % 700);
  const mid = 200 + ((seed >> 5) % 700);
  const last = 1000 + ((seed >> 10) % 9000);
  return `(${ac}) ${mid}-${last}`;
}

function slugFromName(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20);
  return s || 'company';
}

function pickPrimaryContact(r: DemoParentCompanyRecord): DemoParentCompanyContactRow | null {
  if (r.contacts && r.contacts.length > 0) {
    const primary = r.contacts.find((c) => c.contact_level === 'primary');
    return primary ?? r.contacts[0];
  }
  return null;
}

function parseNameFromPrimaryField(primaryName: string): { first: string; last: string } {
  const parts = primaryName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: 'First', last: 'Last' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

export function buildParentCompanyDrawerDetail(r: DemoParentCompanyRecord): ParentCompanyDrawerDetail {
  const seed = stableHash(r.id);
  const city = r.city ?? 'Chicago';
  const state = r.state ?? 'IL';
  const zip = r.zip ?? String(10000 + (seed % 89999)).slice(0, 5);
  const street = r.address_line1 ?? `${100 + (seed % 800)} Business Blvd`;
  const addressLine = `${street}, ${city}, ${state} ${zip}`;

  const website = r.website ?? `www.${slugFromName(r.name)}.com`;

  const saved = pickPrimaryContact(r);
  let displayName: string;
  let officePhone: string;
  let cellPhone: string;
  let email: string;

  if (saved) {
    displayName = `${saved.first_name} ${saved.last_name}`.trim() || r.primary_contact_name;
    officePhone = saved.office_phone ?? fakePhone(seed);
    cellPhone = saved.cell_phone ?? fakePhone(seed + 3);
    email =
      saved.email?.trim() ||
      (() => {
        const { first, last } = parseNameFromPrimaryField(displayName);
        return `${slugFromName(first)}${slugFromName(last) || 'contact'}@company.com`;
      })();
  } else {
    const { first, last } = parseNameFromPrimaryField(r.primary_contact_name);
    displayName = [first, last].filter(Boolean).join(' ') || 'First Last';
    officePhone = fakePhone(seed);
    cellPhone = fakePhone(seed + 3);
    email = `${slugFromName(first)}${slugFromName(last) || 'user'}@company.com`;
  }

  return {
    companyType: r.company_type,
    companyName: r.name,
    addressLine,
    website,
    primaryContact: {
      displayName,
      officePhone,
      cellPhone,
      email,
    },
    importantNotes:
      r.important_notes?.trim() ||
      'This is a really cool parent company, everyone likes them.',
  };
}
