import { createFileRoute } from '@tanstack/react-router';
import { DemoPage } from '../features/demo';

export const Route = createFileRoute('/demo')({
  component: DemoPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      plan: (search.plan as string) || undefined,
    };
  },
});