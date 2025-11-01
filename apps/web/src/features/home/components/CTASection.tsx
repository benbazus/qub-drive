import React, { MouseEvent } from 'react';
import { useNavigate } from '@tanstack/react-router';
import Button from './Button';

const CTASection: React.FC = () => {
  const navigate = useNavigate();

  const handleStartTrial = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    navigate({ to: '/sign-up', search: { plan: 'trial' } });
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="mb-6 text-4xl font-bold md:text-5xl">
          Ready to Transform Your Workflow?
        </h2>
        <p className="mb-8 text-xl text-gray-600">
          Join over 2 million users who trust KingsShare for their file storage
          and collaboration needs.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            onClick={handleStartTrial}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            Start Your Free Trial
          </Button>
          <p className="text-sm text-gray-500">
            No credit card required • 30-day free trial
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;