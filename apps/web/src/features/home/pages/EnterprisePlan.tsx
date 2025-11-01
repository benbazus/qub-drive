import React from 'react';
import { Check, ArrowLeft, Star, Shield, Cloud, Building, Phone } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import Button from '../components/Button';

const EnterprisePlan: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Cloud className="h-6 w-6" />,
      title: 'Unlimited Storage',
      description: 'Scale without limits with our enterprise-grade storage infrastructure.'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Advanced Admin Controls',
      description: 'Complete control over user permissions, security policies, and compliance.'
    },
    {
      icon: <Building className="h-6 w-6" />,
      title: 'SSO Integration',
      description: 'Seamlessly integrate with your existing identity management systems.'
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: '24/7 Phone Support',
      description: 'Direct access to our enterprise support team whenever you need help.'
    }
  ];

  const benefits = [
    'Unlimited Storage',
    'Advanced Admin Controls',
    'SSO Integration',
    '24/7 Phone Support',
    'Custom Integrations',
    'Compliance Tools',
    'Dedicated Account Manager',
    'Advanced Analytics',
    'Custom SLA',
    'White-label Options',
    'On-premise Deployment',
    'Advanced Audit Logs'
  ];

  const enterpriseFeatures = [
    {
      title: 'Security & Compliance',
      items: ['SOC 2 Type II Compliance', 'GDPR Compliance', 'Advanced Encryption', 'Audit Logs']
    },
    {
      title: 'Integration & API',
      items: ['REST API Access', 'Webhooks', 'Custom Integrations', 'Third-party Connectors']
    },
    {
      title: 'Support & Success',
      items: ['Dedicated Account Manager', '24/7 Phone Support', 'Training Sessions', 'Custom Onboarding']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate({ to: '/' })}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </button>
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <Building className="h-12 w-12 text-blue-600" />
            </div>
            <h1 className="mb-4 text-5xl font-bold text-gray-900">Enterprise Plan</h1>
            <p className="text-xl text-gray-600">Complete solution for large organizations</p>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="mb-12 rounded-2xl bg-white p-8 shadow-xl ring-2 ring-blue-500">
          <div className="text-center">
            <div className="mb-2">
              <span className="text-6xl font-bold text-gray-900">$29.99</span>
              <span className="text-2xl text-gray-600">/month</span>
            </div>
            <p className="mb-2 text-sm text-gray-500">Per user • Billed annually</p>
            <div className="mb-6 inline-flex rounded-full bg-blue-100 px-4 py-1">
              <span className="text-sm font-semibold text-blue-600">Enterprise Grade</span>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => navigate({ to: '/contact', search: { plan: 'Enterprise' } })}
                className="w-full max-w-md rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 py-4 text-lg font-semibold text-white hover:shadow-lg"
              >
                Contact Sales
              </Button>
              <p className="text-sm text-gray-500">Custom pricing available for 500+ users</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">Enterprise Features</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div key={index} className="rounded-xl bg-white p-6 shadow-lg">
                <div className="mb-4 inline-flex rounded-lg bg-blue-100 p-3 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise Features */}
        <div className="mb-12">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">Enterprise Capabilities</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {enterpriseFeatures.map((category, index) => (
              <div key={index} className="rounded-xl bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-xl font-semibold text-blue-600">{category.title}</h3>
                <ul className="space-y-2">
                  {category.items.map((item, idx) => (
                    <li key={idx} className="flex items-center">
                      <Check className="mr-2 h-4 w-4 text-green-500" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits List */}
        <div className="mb-12 rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-center text-3xl font-bold text-gray-900">Complete Enterprise Solution</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center">
                <Check className="mr-3 h-5 w-5 text-green-500" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-12 rounded-2xl bg-gradient-to-r from-blue-100 to-cyan-100 p-8">
          <h2 className="mb-6 text-center text-3xl font-bold text-gray-900">Trusted by Enterprises</h2>
          <div className="grid gap-6 md:grid-cols-4">
            <div className="text-center">
              <div className="mb-4 text-4xl font-bold text-blue-600">99.9%</div>
              <p className="text-gray-700">Uptime SLA</p>
            </div>
            <div className="text-center">
              <div className="mb-4 text-4xl font-bold text-blue-600">500+</div>
              <p className="text-gray-700">Enterprise customers</p>
            </div>
            <div className="text-center">
              <div className="mb-4 text-4xl font-bold text-blue-600">10M+</div>
              <p className="text-gray-700">Files processed daily</p>
            </div>
            <div className="text-center">
              <div className="mb-4 text-4xl font-bold text-blue-600">24/7</div>
              <p className="text-gray-700">Support availability</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 p-8 text-white">
            <div className="mb-4 flex justify-center">
              <Star className="h-8 w-8" />
            </div>
            <h2 className="mb-4 text-3xl font-bold">Ready for Enterprise?</h2>
            <p className="mb-6 text-xl opacity-90">Let's discuss your organization's needs</p>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => navigate({ to: '/contact', search: { plan: 'Enterprise' } })}
                className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 hover:bg-gray-100"
              >
                Contact Sales
              </Button>
              <Button
                onClick={() => navigate({ to: '/demo', search: { plan: 'Enterprise' } })}
                className="rounded-xl border-2 border-white px-8 py-4 text-lg font-semibold text-white hover:bg-white hover:text-blue-600"
              >
                Request Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterprisePlan;