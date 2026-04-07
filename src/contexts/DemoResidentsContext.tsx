import { createContext, useContext, useState, type Dispatch, type SetStateAction } from 'react';
import {
  type DemoResidentRecord,
  buildInitialDemoRecords,
} from '@/lib/demoResidents';

interface DemoResidentsContextValue {
  records: DemoResidentRecord[];
  setRecords: Dispatch<SetStateAction<DemoResidentRecord[]>>;
}

const DemoResidentsContext = createContext<DemoResidentsContextValue | null>(null);

export function DemoResidentsProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<DemoResidentRecord[]>(() => buildInitialDemoRecords());

  return (
    <DemoResidentsContext.Provider value={{ records, setRecords }}>
      {children}
    </DemoResidentsContext.Provider>
  );
}

export function useDemoResidents(): DemoResidentsContextValue {
  const ctx = useContext(DemoResidentsContext);
  if (!ctx) {
    throw new Error('useDemoResidents must be used within DemoResidentsProvider');
  }
  return ctx;
}
