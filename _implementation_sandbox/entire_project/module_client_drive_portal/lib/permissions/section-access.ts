import type { SupabaseClient } from '@supabase/supabase-js';

export type CRMSection =
  | 'dashboard'
  | 'suppliers'
  | 'projects'
  | 'deals'
  | 'quotes'
  | 'documents'
  | 'plans'
  | 'tasks'
  | 'activities'
  | 'team'
  | 'client_portal';

export type AccessLevel = 'none' | 'view' | 'edit';

export type SectionAccessRecord = {
  user_id: string;
  section: CRMSection;
  access_level: AccessLevel;
};

export type SectionAccessMap = Record<CRMSection, AccessLevel>;

const ALL_SECTIONS: CRMSection[] = [
  'dashboard',
  'suppliers',
  'projects',
  'deals',
  'quotes',
  'documents',
  'plans',
  'tasks',
  'activities',
  'team',
  'client_portal',
];

export function getDefaultSectionAccess(): SectionAccessMap {
  return ALL_SECTIONS.reduce((acc, section) => {
    acc[section] = 'none';
    return acc;
  }, {} as SectionAccessMap);
}

export function isSectionAllowed(
  accessMap: SectionAccessMap,
  section: CRMSection,
  required: AccessLevel = 'view',
): boolean {
  const level = accessMap[section] || 'none';
  if (required === 'view') {
    return level === 'view' || level === 'edit';
  }
  return level === 'edit';
}

export async function fetchSectionAccess(
  supabase: SupabaseClient,
  userId: string,
  userRole: string | null,
): Promise<SectionAccessMap> {
  if (userRole === 'Admin' || userRole === 'Manager') {
    return ALL_SECTIONS.reduce((acc, section) => {
      acc[section] = 'edit';
      return acc;
    }, {} as SectionAccessMap);
  }

  const { data, error } = await supabase
    .from('crm_section_access')
    .select('section, access_level')
    .eq('user_id', userId);

  if (error) {
    return getDefaultSectionAccess();
  }

  const map = getDefaultSectionAccess();
  (data || []).forEach((row) => {
    map[row.section as CRMSection] = row.access_level as AccessLevel;
  });

  return map;
}
