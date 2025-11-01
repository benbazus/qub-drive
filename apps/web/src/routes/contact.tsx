import { createFileRoute } from '@tanstack/react-router';
import { ContactPage } from '../features/contact';

export const Route = createFileRoute('/contact')({
  component: ContactPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      plan: (search.plan as string) || undefined,
    };
  },
});