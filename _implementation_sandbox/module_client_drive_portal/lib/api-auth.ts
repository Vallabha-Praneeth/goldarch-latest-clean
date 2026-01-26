import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from './supabase-server';
import { fetchSectionAccess, isSectionAllowed, type CRMSection, type AccessLevel } from './permissions/section-access';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email?: string;
    role?: string | null;
    sectionAccess?: Record<string, AccessLevel>;
  };
}

export interface ApiAuthOptions {
  requireAuth?: boolean;
  requiredRole?: 'Admin' | 'Manager' | 'Viewer' | 'Procurement';
  requiredSection?: CRMSection;
  requiredAccessLevel?: AccessLevel;
}

export type ApiHandler = (
  req: AuthenticatedRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse> | NextResponse;

export function withApiAuth(handler: ApiHandler, options: ApiAuthOptions = {}): ApiHandler {
  return async (req: AuthenticatedRequest, context?: { params?: Record<string, string> }) => {
    const {
      requireAuth = true,
      requiredRole,
      requiredSection,
      requiredAccessLevel = 'view',
    } = options;

    if (requireAuth) {
      const supabase = createSupabaseServerClient(req);
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      const role = userRole?.role || null;
      const sectionAccess = await fetchSectionAccess(supabase, user.id, role);

      req.user = {
        id: user.id,
        email: user.email || '',
        role,
        sectionAccess,
      };

      if (requiredRole && role !== requiredRole) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      if (requiredSection) {
        const allowed = isSectionAllowed(sectionAccess, requiredSection, requiredAccessLevel);
        if (!allowed) {
          return NextResponse.json({ error: 'Section access denied' }, { status: 403 });
        }
      }
    }

    return handler(req, context);
  };
}
