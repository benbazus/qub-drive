import React, { MouseEvent } from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { Plan, plans } from '../data/plans';
import Button from './Button';
import { useNavigate } from '@tanstack/react-router';

const PricingSection: React.FC = () => {
  const navigate = useNavigate();

  const handleSignup = (
    event: MouseEvent<HTMLButtonElement>,
    planName: string
  ): void => {
    event.preventDefault();
    navigate({ to: '/sign-in', search: { plan: planName } });
  };

  const handleViewPlan = (
    event: MouseEvent<HTMLButtonElement>,
    planId: string
  ): void => {
    event.preventDefault();
    const planRoutes = {
      personal: '/plans/personal',
      pro: '/plans/pro',
      enterprise: '/plans/enterprise'
    };
    navigate({ to: planRoutes[planId as keyof typeof planRoutes] || '/' });
  };

  return (
    <section id="pricing" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600">
            Choose the perfect plan for your needs. Upgrade or downgrade at any
            time.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {plans.map((plan: Plan, index: number) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 transition-all duration-300 hover:scale-105 ${plan.popular
                ? 'border-2 border-blue-500 bg-gradient-to-b from-blue-500/10 to-purple-600/5 shadow-2xl'
                : 'border border-gray-200 bg-white shadow-lg'
                }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-8 text-center">
                <h3 className="mb-2 text-2xl font-bold">{plan.name}</h3>
                <div className="mb-2 text-4xl font-bold">{plan.price}</div>
                <div className="text-sm text-gray-500">{plan.storage} Storage</div>
                <p className="mt-4 text-sm text-gray-600">{plan.description}</p>
              </div>
              <ul className="mb-8 space-y-4">
                {plan.features.slice(0, 5).map((feature: string, idx: number) => (
                  <li key={idx} className="flex items-center">
                    <Check className="mr-3 h-5 w-5 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-3">
                <Button
                  onClick={(e: MouseEvent<HTMLButtonElement>) =>
                    handleSignup(e, plan.name)
                  }
                  className={`w-full rounded-xl py-3 font-semibold transition-all duration-300 ${plan.popular
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                >
                  {plan.buttonText}
                </Button>
                <Button
                  onClick={(e: MouseEvent<HTMLButtonElement>) =>
                    handleViewPlan(e, plan.id)
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white py-3 font-semibold text-gray-700 transition-all duration-300 hover:bg-gray-50 hover:border-gray-400"
                >
                  <span className="flex items-center justify-center">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;