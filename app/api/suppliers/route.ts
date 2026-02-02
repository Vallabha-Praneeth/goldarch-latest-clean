// app/api/suppliers/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/server/require-user";

// verifier-hint: requireAuth(

export const runtime = "nodejs";

/**
 * Check if user is admin (owner/admin role in any organization)
 */
async function isUserAdmin(userId: string, supabase: any): Promise<boolean> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['owner', 'admin'])
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error checking admin status:', error);
    return false;
  }

  return !!data;
}

/**
 * Get user's supplier access rules
 */
async function getUserAccessRules(userId: string, supabase: any): Promise<any[]> {
  const { data, error } = await supabase
    .from('supplier_access_rules')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching access rules:', error);
    return [];
  }

  return data || [];
}

/**
 * GET /api/suppliers
 * Returns filtered suppliers based on user's access rules
 */
export async function GET(request: Request) {
  try {
    const auth = await requireUser();
    if (!auth?.ok || !auth.user || !auth.supabase) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { user, supabase } = auth;

    // Check if user is admin
    const isAdmin = await isUserAdmin(user.id, supabase);

    // Get access rules for non-admin users
    const accessRules = isAdmin ? [] : await getUserAccessRules(user.id, supabase);

    // Start building query
    let query = supabase
      .from('suppliers')
      .select('*');

    // If not admin and has no access rules, return empty
    if (!isAdmin && accessRules.length === 0) {
      return NextResponse.json({ success: true, data: [], filtered: true }, { status: 200 });
    }

    // If not admin and has access rules, apply filtering
    if (!isAdmin && accessRules.length > 0) {
      const conditions: string[] = [];

      for (const rule of accessRules) {
        // Check rule_data (new format) first
        if (rule.rule_data) {
          const { categories, regions } = rule.rule_data;

          if (categories && categories.length > 0 && regions && regions.length > 0) {
            // Both category and region specified - AND condition
            // Use 'and' to combine conditions for this rule
            conditions.push(`and(category_id.in.(${categories.join(',')}),region.in.(${regions.join(',')}))`);
          } else if (categories && categories.length > 0) {
            // Only categories
            conditions.push(`category_id.in.(${categories.join(',')})`);
          } else if (regions && regions.length > 0) {
            // Only regions
            conditions.push(`region.in.(${regions.join(',')})`);
          }
        }
        // Fall back to legacy fields
        else if (rule.category_id && rule.region) {
          conditions.push(`and(category_id.eq.${rule.category_id},region.eq.${rule.region})`);
        } else if (rule.category_id) {
          conditions.push(`category_id.eq.${rule.category_id}`);
        } else if (rule.region) {
          conditions.push(`region.eq.${rule.region}`);
        }
      }

      // Apply OR conditions if we have any
      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      }
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching suppliers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch suppliers', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      filtered: !isAdmin,
    }, { status: 200 });
  } catch (err) {
    console.error("api/suppliers GET error:", err);
    return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
  }
}
