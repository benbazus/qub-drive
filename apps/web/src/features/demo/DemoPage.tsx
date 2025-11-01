import React, { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import {
  ArrowLeft,
  Play,
  Calendar,
  Users,
  Shield,
  Zap,
  CheckCircle,
  Monitor,
  Video,
  Globe
} from 'lucide-react';
import Button from '../home/components/Button';
import { demoEndpoint, DemoRequestData } from '../../api/endpoints/demo.endpoint';


const DemoPage: React.FC = () => {
  const navigate = useNavigate();
  const search = useSearch({ from: '/demo' }) as { plan?: string };
  const planInterest = search.plan || 'Enterprise';

  const [formData, setFormData] = useState<DemoRequestData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    phone: '',
    companySize: '',
    useCase: '',
    preferredDate: '',
    preferredTime: '',
    demoType: 'live',
    message: '',
    planInterest
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const companySizes = [
    '1-10 employees',
    '11-50 employees',
    '51-200 employees',
    '201-500 employees',
    '501-1000 employees',
    '1000+ employees'
  ];

  const useCases = [
    'Document Management',
    'Team Collaboration',
    'File Sharing & Storage',
    'Compliance & Security',
    'Custom Integration',
    'Enterprise Migration',
    'Other'
  ];

  const timeSlots = [
    '9:00 AM - 10:00 AM',
    '10:00 AM - 11:00 AM',
    '11:00 AM - 12:00 PM',
    '1:00 PM - 2:00 PM',
    '2:00 PM - 3:00 PM',
    '3:00 PM - 4:00 PM',
    '4:00 PM - 5:00 PM'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await demoEndpoint.submitDemoRequest(formData);
      console.log('Demo request submitted successfully:', response);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting demo request:', error);
      alert('Failed to submit demo request. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const demoFeatures = [
    {
      icon: <Monitor className="h-6 w-6" />,
      title: 'Live Product Walkthrough',
      description: 'See our platform in action with a personalized demonstration'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Use Case Discussion',
      description: 'Discuss your specific needs and how we can address them'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Security & Compliance',
      description: 'Learn about our enterprise-grade security features'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Custom Integration',
      description: 'Explore integration possibilities with your existing systems'
    }
  ];

  const demoTypes = [
    {
      id: 'live',
      icon: <Video className="h-5 w-5" />,
      title: 'Live Demo',
      description: '30-minute personalized demo with our solution engineer',
      duration: '30 min'
    },
    {
      id: 'recorded',
      icon: <Play className="h-5 w-5" />,
      title: 'Recorded Demo',
      description: 'Watch a comprehensive product overview at your convenience',
      duration: '15 min'
    },
    {
      id: 'trial',
      icon: <Globe className="h-5 w-5" />,
      title: 'Free Trial',
      description: 'Get hands-on experience with a 14-day enterprise trial',
      duration: '14 days'
    }
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="max-w-lg mx-auto text-center bg-white rounded-2xl p-8 shadow-xl">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Demo Request Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your interest in our {planInterest} solution. We'll contact you within
            24 hours to schedule your {formData.demoType} demo.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Our solution engineer will contact you within 24 hours</li>
              <li>• We'll schedule your demo at your preferred time</li>
              <li>• You'll receive a calendar invite with demo details</li>
              <li>• We'll prepare a customized demo based on your use case</li>
            </ul>
          </div>
          <div className="space-y-3">
            <Button
              onClick={() => navigate({ to: '/contact', search: { plan: planInterest } })}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-white hover:shadow-lg"
            >
              Contact Sales Team
            </Button>
            <Button
              onClick={() => navigate({ to: '/' })}
              className="w-full rounded-xl border border-gray-300 bg-white py-3 text-gray-700 hover:bg-gray-50"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate({ to: '/' })}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </button>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          {/* Demo Information */}
          <div>
            <div className="mb-8">
              <div className="mb-4 flex items-center">
                <Play className="mr-3 h-8 w-8 text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-900">Request a Demo</h1>
              </div>
              <p className="text-xl text-gray-600">
                See how our {planInterest} solution can transform your organization's
                file management and collaboration workflows.
              </p>
            </div>

            {/* Demo Types */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Demo Experience</h2>
              <div className="space-y-4">
                {demoTypes.map((type) => (
                  <div key={type.id} className="rounded-xl bg-white p-6 shadow-lg">
                    <div className="flex items-start">
                      <div className="mr-4 rounded-lg bg-blue-100 p-3 text-blue-600">
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold">{type.title}</h3>
                          <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            {type.duration}
                          </span>
                        </div>
                        <p className="text-gray-600">{type.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Demo Features */}
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <h3 className="mb-4 text-xl font-semibold">What You'll See</h3>
              <div className="space-y-4">
                {demoFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <div className="mr-4 rounded-lg bg-blue-100 p-2 text-blue-600">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Demo Request Form */}
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Schedule Your Demo</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company *
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Size *
                  </label>
                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    <option value="">Select size</option>
                    {companySizes.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Use Case *
                </label>
                <select
                  name="useCase"
                  value={formData.useCase}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Select use case</option>
                  {useCases.map((useCase) => (
                    <option key={useCase} value={useCase}>{useCase}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Demo Type *
                </label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {demoTypes.map((type) => (
                    <label key={type.id} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="demoType"
                        value={type.id}
                        checked={formData.demoType === type.id}
                        onChange={handleInputChange}
                        className="text-blue-600"
                      />
                      <span className="text-sm">{type.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {formData.demoType === 'live' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Time (EST)
                    </label>
                    <select
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleInputChange}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    >
                      <option value="">Select time</option>
                      {timeSlots.map((time) => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Tell us about your specific needs, current challenges, or questions you'd like us to address during the demo..."
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-4 text-lg font-semibold text-white hover:shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Scheduling Demo...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule My Demo
                  </span>
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-500">
              We'll contact you within 24 hours to confirm your demo schedule.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;