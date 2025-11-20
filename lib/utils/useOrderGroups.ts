// lib/hooks/useOrderGroups.ts

import { useState, useEffect } from 'react';
import { fetchWithAuth, getUserIdFromCookies } from '@/lib/utils/auth';
import { OrderGroupWithDetails } from '@/lib/db/services/order-group';

interface Stats {
  totalPurchases: number;
  totalSpent: number;
  avgRating: string;
}

export interface UseOrderGroupsResult {
  orderGroups: OrderGroupWithDetails[];
  stats: Stats;
  loading: boolean;
  error: string | null;
  userId: string | null;
  refetch: () => Promise<void>;
}

export function useOrderGroups(): UseOrderGroupsResult {
  const [orderGroups, setOrderGroups] = useState<OrderGroupWithDetails[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPurchases: 0,
    totalSpent: 0,
    avgRating: '0',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Extract userId from cookies on mount
  useEffect(() => {
    const id = getUserIdFromCookies();
    setUserId(id);
  }, []);

  const fetchOrderGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const id = getUserIdFromCookies();

      if (!id) {
        setError('You must be logged in to view order history');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching order groups for userId:', id);

      // ✅ Use fetchWithAuth - automatically adds x-user-id header
      const response = await fetchWithAuth(
        `/api/order-groups/user/${id}`,
        {
          method: 'GET',
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required. Please log in again.');
        } else if (response.status === 403) {
          setError('You do not have permission to view this data.');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to fetch order history');
        }
        setLoading(false);
        return;
      }

      const { data } = await response.json();
      setOrderGroups(data.orderGroups);
      setStats(data.stats);
      console.log('✅ Order history loaded:', data.orderGroups.length, 'orders');
    } catch (err) {
      console.error('❌ Error fetching order groups:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to load order history';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    if (userId) {
      fetchOrderGroups();
    }
  }, [userId]);

  return {
    orderGroups,
    stats,
    loading,
    error,
    userId,
    refetch: fetchOrderGroups,
  };
}