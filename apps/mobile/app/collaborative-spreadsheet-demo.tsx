import React from 'react';
import { Stack } from 'expo-router';
import { CollaborativeSpreadsheetDemo } from '@/components/spreadsheet/CollaborativeSpreadsheetDemo';

export default function CollaborativeSpreadsheetDemoScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Collaborative Spreadsheet',
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <CollaborativeSpreadsheetDemo />
    </>
  );
}