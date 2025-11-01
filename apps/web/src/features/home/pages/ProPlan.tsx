import React from 'react';
import { Check, ArrowLeft, Star, Users, Shield, Cloud, Zap, Crown } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import Button from '../components/Button';

const ProPlan: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Cloud className="h-6 w-6" />,
      title: '1 TB Storage',
      description: 'Massive storage capacity for all your professional files and projects.'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Team Collaboration',
      description: 'Work together with your team in real-time with advanced sharing controls.'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Advanced Security',
      description: 'Enterprise-grade security with advanced encryption and access controls.'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Priority Support',
      description: 'Get help when you need it with our priority customer support.'
    }
  ];

  const benefits = [
    '1 TB Storage',
    'Advanced Sharing Controls',
    'Full Version History',
    'Priority Support',
    'Team Collaboration',
    'Advanced Security',
    'Custom Branding',
    'File Analytics',
    'API Access',
    'Integration Support'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate({ to: '/' })}
            className="mb-4 flex items-center text-purple-600 hover:text-purple-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </button>
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <Crown className="h-12 w-12 text-purple-600" />
            </div>
            <h1 className="mb-4 text-5xl font-bold text-gray-900">Pro Plan</h1>
            <p className="text-xl text-gray-600">Ideal for professionals and growing teams</p>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="mb-12 rounded-2xl bg-white p-8 shadow-xl ring-2 ring-purple-500">
          <div className="text-center">
            <div className="mb-2">
              <span className="text-6xl font-bold text-gray-900">$9.99</span>
              <span className="text-2xl text-gray-600">/month</span>
            </div>
            <p className="mb-2 text-sm text-gray-500">Billed monthly</p>
            <div className="mb-6 inline-flex rounded-full bg-purple-100 px-4 py-1">
              <span className="text-sm font-semibold text-purple-600">Most Popular</span>
            </div>
            <div className="space-y-3">
              <Button
                onClick={() => navigate({ to: '/sign-up', search: { plan: 'Pro' } })}
                className="w-full max-w-md rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-4 text-lg font-semibold text-white hover:shadow-lg"
              >
                Start Free Trial
              </Button>
              <p className="text-sm text-gray-500">14-day free trial • No credit card required</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">Professional Features</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div key={index} className="rounded-xl bg-white p-6 shadow-lg">
                <div className="mb-4 inline-flex rounded-lg bg-purple-100 p-3 text-purple-600">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits List */}
        <div className="mb-12 rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-center text-3xl font-bold text-gray-900">Everything You Need</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center">
                <Check className="mr-3 h-5 w-5 text-green-500" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison */}
        <div className="mb-12 rounded-2xl bg-gradient-to-r from-purple-100 to-pink-100 p-8">
          <h2 className="mb-6 text-center text-3xl font-bold text-gray-900">Why Choose Pro?</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-4 text-4xl font-bold text-purple-600">200x</div>
              <p className="text-gray-700">More storage than Personal plan</p>
            </div>
            <div className="text-center">
              <div className="mb-4 text-4xl font-bold text-purple-600">24/7</div>
              <p className="text-gray-700">Priority support available</p>
            </div>
            <div className="text-center">
              <div className="mb-4 text-4xl font-bold text-purple-600">∞</div>
              <p className="text-gray-700">Unlimited collaborators</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 p-8 text-white">
            <div className="mb-4 flex justify-center">
              <Star className="h-8 w-8" />
            </div>
            <h2 className="mb-4 text-3xl font-bold">Ready to go Pro?</h2>
            <p className="mb-6 text-xl opacity-90">Join thousands of professionals who trust us</p>
            <Button
              onClick={() => navigate({ to: '/sign-up', search: { plan: 'Pro' } })}
              className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-purple-600 hover:bg-gray-100"
            >
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProPlan;