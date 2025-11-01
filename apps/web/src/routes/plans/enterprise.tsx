import { createFileRoute } from '@tanstack/react-router';
import { EnterprisePlan } from '../../features/home/pages';

export const Route = createFileRoute('/plans/enterprise')({
  component: EnterprisePlan,
});