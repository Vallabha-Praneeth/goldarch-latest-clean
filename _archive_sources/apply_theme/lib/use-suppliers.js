'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './supabase';

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSuppliers = useCallback(async () => {
    const { data, error } = await supabase
      .from('suppliers')
      .select(`
        *,
        category:categories(id, name, slug, icon_name, icon_type, icon_color)
      `)
      .order('name');

    if (error) throw error;

    return data.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category?.name || 'Uncategorized',
      contactPerson: s.contact_person,
      phone: s.phone,
      email: s.email,
      website: s.website,
      address: s.address,
      city: s.city,
      products: s.products,
      catalogTitle: s.catalog_title,
      catalogUrl: s.catalog_url,
      comments: s.comments,
      price: s.price,
      moq: s.moq,
      exportNotes: s.export_notes,
      logoUrl: s.logo_url,
      verified: s.verified,
      featured: s.featured,
      ownerRating: s.owner_rating,
      ownerRatingNotes: s.owner_rating_notes,
      externalRating: s.external_rating,
    }));
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        console.log('[useSuppliers] Starting fetch...');
        console.log('[useSuppliers] Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET');
        console.log('[useSuppliers] Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

        const data = await fetchSuppliers();
        console.log('[useSuppliers] Fetched suppliers:', data.length);

        if (mounted) {
          setSuppliers(data);
          setError(null);
        }
      } catch (e) {
        console.error('[useSuppliers] Error fetching suppliers:', e);
        console.error('[useSuppliers] Error details:', {
          message: e.message,
          code: e.code,
          details: e.details,
          hint: e.hint
        });

        if (mounted) {
          setError(e.message || 'Failed to fetch suppliers');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [fetchSuppliers]);

  const categories = useMemo(() => {
    if (!suppliers.length) return [];

    const categoryMap = {};
    suppliers.forEach((supplier) => {
      const cat = (supplier.category || 'Uncategorized').trim();
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    return Object.entries(categoryMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [suppliers]);

  const getById = useCallback((id) => {
    return suppliers.find((s) => String(s.id) === String(id)) || null;
  }, [suppliers]);

  const getByCategory = useCallback((category) => {
    return suppliers.filter(
      (s) => s.category?.toLowerCase() === category.toLowerCase()
    );
  }, [suppliers]);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchSuppliers();
      setSuppliers(data);
    } catch (e) {
      setError(e.message);
    }
  }, [fetchSuppliers]);

  return {
    suppliers,
    categories,
    loading,
    error,
    getById,
    getByCategory,
    refresh,
  };
}
