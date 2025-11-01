import React, { useState, useEffect } from 'react';
import { planEndpoint, Plan } from '../api/endpoints/plan.endpoint';

const PlanTester: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const fetchedPlans = await planEndpoint.getAllPlans();
        setPlans(fetchedPlans);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading) {
    return <div>Loading plans...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Plan API Test</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <div key={plan.id} className="border rounded-lg p-4">
            <h3 className="text-xl font-semibold">{plan.name}</h3>
            <p className="text-lg font-bold">{plan.price}</p>
            <p className="text-sm text-gray-600">{plan.description}</p>
            <ul className="mt-2 space-y-1">
              {plan.features.slice(0, 3).map((feature, index) => (
                <li key={index} className="text-sm">• {feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanTester;