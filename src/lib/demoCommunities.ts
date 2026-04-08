export interface DemoCommunityContactRow {
  first_name: string;
  last_name: string;
  address_summary?: string;
  direct_line?: string;
  cell_phone?: string;
  email?: string;
  website?: string;
}

export interface DemoCommunityAttachmentRow {
  id: string;
  filename: string;
}

export interface DemoCommunityRecord {
  id: string;
  name: string;
  state: string;
  relocation_specialist_display: string;
  parent_company_id: string;
  parent_company_name: string;
  community_type: string;
  status?: string;
  city?: string;
  address_line1?: string;
  address_line2?: string;
  zip?: string;
  office_phone?: string;
  website?: string;
  number_of_units?: string | number;
  contract_date?: string | null;
  onboarding_date?: string | null;
  important_notes?: string | null;
  team_contract_expiration?: string | null;
  contacts?: DemoCommunityContactRow[];
  attachments?: DemoCommunityAttachmentRow[];
}

/** Static demo rows for the Communities list (replace with API later). */
export const DEMO_COMMUNITIES: DemoCommunityRecord[] = [
  {
    id: 'c1',
    name: 'Lakeside Commons',
    state: 'IL',
    relocation_specialist_display: 'Morgan Blake',
    parent_company_id: 'pc1',
    parent_company_name: 'Horizon Living Group',
    community_type: 'Independent Living',
  },
  {
    id: 'c2',
    name: 'River North Residences',
    state: 'IL',
    relocation_specialist_display: 'Jane Doe',
    parent_company_id: 'pc1',
    parent_company_name: 'Horizon Living Group',
    community_type: 'Assisted Living',
  },
  {
    id: 'c3',
    name: 'Oak Park Gardens',
    state: 'WI',
    relocation_specialist_display: 'Alex Morgan',
    parent_company_id: 'pc2',
    parent_company_name: 'Summit Senior Housing',
    community_type: 'Memory Care',
  },
  {
    id: 'c4',
    name: 'Maple Grove Estates',
    state: 'MN',
    relocation_specialist_display: 'Sam Rivera',
    parent_company_id: 'pc2',
    parent_company_name: 'Summit Senior Housing',
    community_type: 'CCRC',
  },
  {
    id: 'c5',
    name: 'Cedar Ridge Villas',
    state: 'IL',
    relocation_specialist_display: 'Morgan Blake',
    parent_company_id: 'pc3',
    parent_company_name: 'Prairie Care Communities',
    community_type: 'Independent Living',
  },
  {
    id: 'c6',
    name: 'Willow Creek Place',
    state: 'IN',
    relocation_specialist_display: 'Jane Doe',
    parent_company_id: 'pc3',
    parent_company_name: 'Prairie Care Communities',
    community_type: 'Assisted Living',
  },
  {
    id: 'c7',
    name: 'Brighton Court',
    state: 'IL',
    relocation_specialist_display: 'Alex Morgan',
    parent_company_id: 'pc1',
    parent_company_name: 'Horizon Living Group',
    community_type: 'Memory Care',
  },
  {
    id: 'c8',
    name: 'Harbor View Senior Living',
    state: 'MI',
    relocation_specialist_display: 'Sam Rivera',
    parent_company_id: 'pc4',
    parent_company_name: 'Great Lakes Partners',
    community_type: 'Skilled Nursing',
  },
  {
    id: 'c9',
    name: 'Pinehurst Manor',
    state: 'WI',
    relocation_specialist_display: 'Morgan Blake',
    parent_company_id: 'pc4',
    parent_company_name: 'Great Lakes Partners',
    community_type: 'Independent Living',
  },
  {
    id: 'c10',
    name: 'Silver Birch Commons',
    state: 'IL',
    relocation_specialist_display: 'Jane Doe',
    parent_company_id: 'pc2',
    parent_company_name: 'Summit Senior Housing',
    community_type: 'CCRC',
  },
  {
    id: 'c11',
    name: 'Evergreen Terrace',
    state: 'MN',
    relocation_specialist_display: 'Alex Morgan',
    parent_company_id: 'pc5',
    parent_company_name: 'North Star Holdings',
    community_type: 'Assisted Living',
  },
  {
    id: 'c12',
    name: 'Meadowbrook Suites',
    state: 'IN',
    relocation_specialist_display: 'Sam Rivera',
    parent_company_id: 'pc5',
    parent_company_name: 'North Star Holdings',
    community_type: 'Independent Living',
  },
];

export type ParentCompanyContactLevel = 'primary' | 'secondary' | 'other';

export interface DemoParentCompanyContactRow {
  first_name: string;
  last_name: string;
  contact_level: ParentCompanyContactLevel;
  office_phone?: string;
  cell_phone?: string;
  email?: string;
}

export interface DemoParentCompanyRecord {
  id: string;
  name: string;
  community_count: number;
  company_type: string;
  primary_contact_name: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  important_notes?: string | null;
  logo_filename?: string | null;
  contacts?: DemoParentCompanyContactRow[];
}

/** Static demo rows for the All Parent Companies tab (replace with API later). */
export const DEMO_PARENT_COMPANIES: DemoParentCompanyRecord[] = [
  {
    id: 'pp-aviva',
    name: 'Aviva Senior Living',
    community_count: 15,
    company_type: 'Management',
    primary_contact_name: 'Jordan Smith',
    address_line1: '500 Executive Parkway',
    city: 'Chicago',
    state: 'IL',
    zip: '60601',
    website: 'www.avivasl.com',
    important_notes: 'This is a really cool parent company, everyone likes them.',
    logo_filename: 'companylogo.png',
    contacts: [
      {
        first_name: 'Jordan',
        last_name: 'Smith',
        contact_level: 'primary',
        office_phone: '(312) 555-0100',
        cell_phone: '(312) 555-0199',
        email: 'jordan.smith@aviva.com',
      },
    ],
  },
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `pp-placeholder-${i + 1}`,
    name: 'Parent Co Name',
    community_count: 15,
    company_type: 'Management',
    primary_contact_name: 'Contact Name',
  })),
];
