import React from 'react';
import { Stack } from 'expo-router';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCards } from '@/components/layout/StatCards';
import { QuickActions } from '@/components/layout/QuickActions';
import { RecentFiles } from '@/components/layout/RecentFiles';

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Refresh dashboard data
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
        }} 
      />
      <DashboardLayout
        refreshing={refreshing}
        onRefresh={onRefresh}
      >
        <StatCards />
        <QuickActions />
        <RecentFiles />
      </DashboardLayout>
    </>
  );
}


