/** Resident detail contacts — primary / secondary / additional list */
export type DemoResidentContact = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  relationship: string | null;
  notes: string | null;
};

export function isDemoContactEmpty(c: DemoResidentContact | null | undefined): boolean {
  if (!c) return true;
  return !(c.first_name ?? '').trim() && !(c.last_name ?? '').trim();
}

/** Full demo row — replace with backend model when the API is connected */
export type DemoResidentRecord = {
  id: string;
  first_name: string;
  last_name: string;
  community_id: string;
  community_name: string;
  assigned_relocation_specialist_id: string | null;
  relocation_specialist_display: string;
  zip_code: string | null;
  move_in_date: string | null;
  status: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  address_2: string | null;
  city: string | null;
  state: string | null;
  important_notes: string | null;
  gender?: string | null;
  primary_contact: DemoResidentContact | null;
  secondary_contact: DemoResidentContact | null;
  additional_contacts: DemoResidentContact[];
};

export function toResidentSlug(firstName: string | null, lastName: string | null): string {
  const first = (firstName ?? '').trim();
  const last = (lastName ?? '').trim();
  return ([first, last].filter(Boolean).join('_') || '').toLowerCase();
}

export function residentDisplayName(r: DemoResidentRecord): string {
  return [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || '—';
}

/** Match by id, name slug, or full name (e.g. Dashboard links with spaces). */
export function findDemoResidentInList(
  records: DemoResidentRecord[],
  routeParam: string,
): DemoResidentRecord | null {
  const raw = decodeURIComponent(routeParam ?? '').trim();
  if (!raw) return null;

  const byId = records.find((r) => r.id === raw);
  if (byId) return byId;

  const lower = raw.toLowerCase();
  const bySlug = records.find((r) => toResidentSlug(r.first_name, r.last_name) === lower);
  if (bySlug) return bySlug;

  const byName = records.find((r) => residentDisplayName(r).toLowerCase() === lower);
  if (byName) return byName;

  return null;
}

export function buildInitialDemoRecords(): DemoResidentRecord[] {
  return [
    {
      id: 'demo-r-1',
      first_name: 'Mary',
      last_name: 'Smith',
      community_id: 'demo-comm-1',
      community_name: 'Whitestone',
      assigned_relocation_specialist_id: 'demo-spec-1',
      relocation_specialist_display: 'Jane Doe',
      zip_code: '24707',
      move_in_date: '2025-03-17',
      status: 'active',
      email: 'mary.smith@example.com',
      phone: '555-0100',
      address: '12 Oak Street',
      address_2: null,
      city: 'Bluefield',
      state: 'VA',
      important_notes: null,
      gender: 'Female',
      primary_contact: {
        id: 'demo-pc-1',
        first_name: 'Kenra',
        last_name: 'Smith',
        email: 'ksmith@gmail.com',
        phone: '1234567890',
        relationship: 'Daughter',
        notes:
          'Kenra handles most things, but her brother, Nick, will handle the loans.',
      },
      secondary_contact: {
        id: 'demo-sc-1',
        first_name: 'Nick',
        last_name: 'Smith',
        email: 'nsmith@gmail.com',
        phone: '1234567890',
        relationship: 'Son',
        notes: 'Nick is back up and is better for loan questions',
      },
      additional_contacts: [
        {
          id: 'demo-ac-1',
          first_name: 'George',
          last_name: 'Smith',
          email: 'gsmith@gmail.com',
          phone: '1234567890',
          relationship: 'Son in law',
          notes: 'Married to Kenra',
        },
      ],
    },
    {
      id: 'demo-r-2',
      first_name: 'Robert',
      last_name: 'Chen',
      community_id: 'demo-comm-2',
      community_name: 'Harbor View',
      assigned_relocation_specialist_id: 'demo-spec-2',
      relocation_specialist_display: 'Alex Morgan',
      zip_code: '60614',
      move_in_date: '2025-01-08',
      status: 'active',
      email: 'robert.chen@example.com',
      phone: '555-0200',
      address: '400 Lake Ave',
      address_2: 'Unit 3B',
      city: 'Chicago',
      state: 'IL',
      important_notes: 'Prefers morning calls.',
      primary_contact: {
        id: 'demo-pc-2',
        first_name: 'Linda',
        last_name: 'Chen',
        email: 'linda@example.com',
        phone: '555-0202',
        relationship: 'Spouse',
        notes: null,
      },
      secondary_contact: null,
      additional_contacts: [],
    },
    {
      id: 'demo-r-3',
      first_name: 'Patricia',
      last_name: 'Nguyen',
      community_id: 'demo-comm-1',
      community_name: 'Whitestone',
      assigned_relocation_specialist_id: null,
      relocation_specialist_display: '—',
      zip_code: '97205',
      move_in_date: null,
      status: 'pending',
      email: null,
      phone: '555-0300',
      address: null,
      address_2: null,
      city: 'Portland',
      state: 'OR',
      important_notes: null,
      primary_contact: null,
      secondary_contact: null,
      additional_contacts: [],
    },
    {
      id: 'demo-r-4',
      first_name: 'James',
      last_name: 'Wilson',
      community_id: 'demo-comm-3',
      community_name: 'Maple Ridge',
      assigned_relocation_specialist_id: 'demo-spec-3',
      relocation_specialist_display: 'Sam Rivera',
      zip_code: '80202',
      move_in_date: '2024-11-22',
      status: 'on_hold',
      email: 'james.w@example.com',
      phone: null,
      address: '88 Pine Rd',
      address_2: null,
      city: 'Denver',
      state: 'CO',
      important_notes: null,
      primary_contact: {
        id: 'demo-pc-4',
        first_name: 'Emma',
        last_name: 'Wilson',
        email: null,
        phone: '555-0404',
        relationship: 'Daughter',
        notes: 'Primary point of contact.',
      },
      secondary_contact: null,
      additional_contacts: [],
    },
    {
      id: 'demo-r-5',
      first_name: 'Elena',
      last_name: 'Martinez',
      community_id: 'demo-comm-2',
      community_name: 'Harbor View',
      assigned_relocation_specialist_id: 'demo-spec-1',
      relocation_specialist_display: 'Jane Doe',
      zip_code: '33139',
      move_in_date: '2024-06-01',
      status: 'completed',
      email: 'elena.m@example.com',
      phone: null,
      address: null,
      address_2: null,
      city: 'Miami',
      state: 'FL',
      important_notes: null,
      primary_contact: null,
      secondary_contact: null,
      additional_contacts: [],
    },
    {
      id: 'demo-r-6',
      first_name: 'David',
      last_name: 'Park',
      community_id: 'demo-comm-3',
      community_name: 'Maple Ridge',
      assigned_relocation_specialist_id: 'demo-spec-2',
      relocation_specialist_display: 'Alex Morgan',
      zip_code: '98101',
      move_in_date: null,
      status: 'waitlisted',
      email: null,
      phone: '555-0606',
      address: '9 Cedar Ln',
      address_2: null,
      city: 'Seattle',
      state: 'WA',
      important_notes: null,
      primary_contact: null,
      secondary_contact: null,
      additional_contacts: [],
    },
    {
      id: 'demo-r-7',
      first_name: 'Susan',
      last_name: 'Lee',
      community_id: 'demo-comm-1',
      community_name: 'Whitestone',
      assigned_relocation_specialist_id: 'demo-spec-3',
      relocation_specialist_display: 'Sam Rivera',
      zip_code: '94102',
      move_in_date: '2025-02-14',
      status: 'canceled',
      email: 'susan.lee@example.com',
      phone: null,
      address: null,
      address_2: null,
      city: 'San Francisco',
      state: 'CA',
      important_notes: null,
      primary_contact: null,
      secondary_contact: null,
      additional_contacts: [],
    },
  ];
}
