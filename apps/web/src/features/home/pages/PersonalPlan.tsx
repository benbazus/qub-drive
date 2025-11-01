import React from 'react';
import { Check, ArrowLeft, Star, Users, Shield, Cloud } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import Button from '../components/Button';

const PersonalPlan: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Cloud className="h-6 w-6" />,
      title: '5 GB Storage',
      description: 'Store your personal files, documents, and photos safely in the cloud.'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Basic File Sharing',
      description: 'Share files with friends and family using secure links.'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Basic Security',
      description: 'Your files are protected with industry-standard encryption.'
    }
  ];

  const benefits = [
    'Mobile & Web Access',
    'Email Support',
    'Basic Version History',
    'File Preview',
    'Offline Access'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
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
            <h1 className="mb-4 text-5xl font-bold text-gray-900">Personal Plan</h1>
            <p className="text-xl text-gray-600">Perfect for personal use and small projects</p>
          </div>
        </div>

        {/* Pricing Card */}
        <div className="mb-12 rounded-2xl bg-white p-8 shadow-xl">
          <div className="text-center">
            <div className="mb-4">
              <span className="text-6xl font-bold text-gray-900">Free</span>
            </div>
            <p className="mb-6 text-gray-600">No credit card required</p>
            <Button
              onClick={() => navigate({ to: '/sign-up', search: { plan: 'Personal' } })}
              className="w-full max-w-md rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-4 text-lg font-semibold text-white hover:shadow-lg"
            >
              Get Started Free
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="mb-8 text-center text-3xl font-bold text-gray-900">Key Features</h2>
          <div className="grid gap-8 md:grid-cols-3">
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

        {/* Benefits List */}
        <div className="mb-12 rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-center text-3xl font-bold text-gray-900">What's Included</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center">
                <Check className="mr-3 h-5 w-5 text-green-500" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="mb-4 flex justify-center">
              <Star className="h-8 w-8" />
            </div>
            <h2 className="mb-4 text-3xl font-bold">Ready to get started?</h2>
            <p className="mb-6 text-xl opacity-90">Join thousands of users who trust us with their files</p>
            <Button
              onClick={() => navigate({ to: '/sign-up', search: { plan: 'Personal' } })}
              className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 hover:bg-gray-100"
            >
              Start Your Free Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalPlan;