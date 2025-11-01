import { createFileRoute } from '@tanstack/react-router';
import { PersonalPlan } from '../../features/home/pages';

export const Route = createFileRoute('/plans/personal')({
  component: PersonalPlan,
});