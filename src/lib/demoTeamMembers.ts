export type DemoTeamMemberRecord = {
  id: string;
  name: string;
  title: string;
  /** Display like "Los Angeles, CA"; omit or empty for em dash in table */
  location: string | null;
  email: string;
  phone: string;
};

export const DEMO_TEAM_MEMBERS: DemoTeamMemberRecord[] = [
  {
    id: 'tm-1',
    name: 'Laura Barca',
    title: 'Relocation Specialist',
    location: 'City, TX',
    email: 'lbarca@livnowrelocation.com',
    phone: '(214) 555-0101',
  },
  {
    id: 'tm-2',
    name: 'Sam Davis',
    title: 'Admin',
    location: 'Los Angeles, CA',
    email: 'sdavis@livnowrelocation.com',
    phone: '(310) 555-0102',
  },
  {
    id: 'tm-3',
    name: 'Jane Sells',
    title: 'Relocation Consultant',
    location: null,
    email: 'jsells@livnowrelocation.com',
    phone: '224-292-7648',
  },
  {
    id: 'tm-4',
    name: 'Michael Chen',
    title: 'Relocation Specialist',
    location: 'Austin, TX',
    email: 'mchen@livnowrelocation.com',
    phone: '(512) 555-0104',
  },
  {
    id: 'tm-5',
    name: 'Priya Sharma',
    title: 'Director of Client Success',
    location: 'Chicago, IL',
    email: 'psharma@livnowrelocation.com',
    phone: '(312) 555-0105',
  },
];
