import { formatDateToAmerican } from '@/lib/dateUtils';
import type { DemoCommunityRecord, DemoCommunityContactRow } from '@/lib/demoCommunities';

export type CommunityDrawerContact = {
  displayName: string;
  addressLine: string;
  directLine: string;
  cellPhone: string;
  email: string;
  websiteDisplay: string;
};

export type CommunityDrawerDetail = {
  name: string;
  communityType: string;
  parentCompanyName: string;
  status: string;
  addressLine: string;
  officePhone: string;
  website: string;
  unitsLabel: string;
  contractDateDisplay: string;
  onboardingDateDisplay: string;
  contacts: CommunityDrawerContact[];
  teamMemberName: string;
  teamExpirationDisplay: string;
  importantNotes: string;
  attachments: { id: string; filename: string }[];
};

const STATE_CITIES: Record<string, string> = {
  IL: 'Chicago',
  WI: 'Milwaukee',
  MN: 'Minneapolis',
  IN: 'Indianapolis',
  MI: 'Detroit',
};

function stableHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function slugFromName(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 24);
  return s || 'community';
}

function fakePhone(seed: number): string {
  const a = 200 + (seed % 799);
  const b = 100 + ((seed >> 4) % 899);
  const c = 1000 + ((seed >> 8) % 8999);
  return `(${String(a).padStart(3, '0').slice(0, 3)}) ${b}-${c}`;
}

function formatOptionalDate(value: string | null | undefined, fallbackIso: string): string {
  if (value != null && value.trim()) {
    const d = formatDateToAmerican(value);
    if (d && d !== '—') return d;
  }
  return formatDateToAmerican(fallbackIso) || '—';
}

function mapContact(c: DemoCommunityContactRow, seed: number): CommunityDrawerContact {
  const name = `${c.first_name} ${c.last_name}`.trim() || 'Contact';
  const cityPart = c.address_summary ?? '';
  return {
    displayName: name,
    addressLine: cityPart,
    directLine: c.direct_line ?? fakePhone(seed),
    cellPhone: c.cell_phone ?? fakePhone(seed + 1),
    email: c.email ?? `${slugFromName(name)}@company.com`,
    websiteDisplay: c.website ?? `www.${slugFromName(name)}.com`,
  };
}

export function buildCommunityDrawerDetail(r: DemoCommunityRecord): CommunityDrawerDetail {
  const seed = stableHash(r.id);
  const city = r.city ?? STATE_CITIES[r.state] ?? 'Springfield';
  const zip = r.zip ?? String(10000 + (seed % 89999)).padStart(5, '0').slice(0, 5);
  const streetNum = 100 + (seed % 899);
  const line1 = r.address_line1 ?? `${streetNum} Oak Street`;
  const addressLine = `${line1}, ${city}, ${r.state} ${zip}`;

  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Riley'];
  const lastNames = ['Smith', 'Johnson', 'Garcia', 'Brown'];
  const defaultName = `${firstNames[seed % firstNames.length]} ${lastNames[(seed >> 2) % lastNames.length]}`;

  const contacts: CommunityDrawerContact[] =
    r.contacts && r.contacts.length > 0
      ? r.contacts.map((c, i) =>
          mapContact(
            {
              ...c,
              address_summary:
                c.address_summary ?? `${line1}, ${city}, ${r.state} ${zip}`,
            },
            seed + i * 7,
          ),
        )
      : [
          {
            displayName: defaultName,
            addressLine: addressLine,
            directLine: fakePhone(seed),
            cellPhone: fakePhone(seed + 3),
            email: `${slugFromName(defaultName)}@company.com`,
            websiteDisplay: r.website ?? `www.${slugFromName(r.name)}.com`,
          },
        ];

  const attachments =
    r.attachments && r.attachments.length > 0
      ? r.attachments
      : [{ id: `att-${r.id}`, filename: 'FloorPlan.png' }];

  return {
    name: r.name,
    communityType: r.community_type,
    parentCompanyName: r.parent_company_name,
    status: r.status ?? 'Active',
    addressLine,
    officePhone: r.office_phone ?? fakePhone(seed + 11),
    website: r.website ?? `www.${slugFromName(r.name)}.com`,
    unitsLabel:
      r.number_of_units !== undefined && r.number_of_units !== ''
        ? `${r.number_of_units} Units`
        : `${50 + (seed % 200)} Units`,
    contractDateDisplay: formatOptionalDate(r.contract_date ?? null, '2025-03-24'),
    onboardingDateDisplay: formatOptionalDate(r.onboarding_date ?? null, '2025-03-24'),
    contacts,
    teamMemberName: r.relocation_specialist_display,
    teamExpirationDisplay: formatOptionalDate(r.team_contract_expiration ?? null, '2025-12-31'),
    importantNotes:
      r.important_notes?.trim() ||
      'We have placed over 150 residents in this community.',
    attachments,
  };
}
