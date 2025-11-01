import { createFileRoute } from '@tanstack/react-router';
import { ProPlan } from '../../features/home/pages';

export const Route = createFileRoute('/plans/pro')({
  component: ProPlan,
});