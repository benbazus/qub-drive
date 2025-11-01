import React, { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { 
  ArrowLeft, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send,
  CheckCircle,
  Users,
  Shield,
  Zap
} from 'lucide-react';
import Button from '../home/components/Button';
import { contactEndpoint, ContactFormData } from '../../api/endpoints/contact.endpoint';


const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  const search = useSearch({ from: '/contact' }) as { plan?: string };
  const planInterest = search.plan || 'General';

  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    jobTitle: '',
    phone: '',
    companySize: '',
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await contactEndpoint.submitContactForm(formData);
      console.log('Contact form submitted successfully:', response);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      // You could show an error message to the user here
      alert('Failed to submit form. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const enterpriseFeatures = [
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Dedicated Support Team',
      description: '24/7 phone and email support with dedicated account manager'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Enterprise Security',
      description: 'SOC 2 compliance, SSO, advanced encryption, and audit logs'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Custom Implementation',
      description: 'Tailored onboarding, training, and custom integrations'
    }
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl p-8 shadow-xl">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Thank You!</h2>
          <p className="text-gray-600 mb-6">
            We've received your message and will get back to you within 24 hours. 
            A member of our enterprise team will contact you soon.
          </p>
          <Button
            onClick={() => navigate({ to: '/' })}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-white hover:shadow-lg"
          >
            Return to Home
          </Button>
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
          {/* Contact Information */}
          <div>
            <div className="mb-8">
              <div className="mb-4 flex items-center">
                <Building className="mr-3 h-8 w-8 text-blue-600" />
                <h1 className="text-4xl font-bold text-gray-900">Contact Sales</h1>
              </div>
              <p className="text-xl text-gray-600">
                Ready to transform your organization with our enterprise solution? 
                Let's discuss your specific needs.
              </p>
            </div>

            {/* Contact Details */}
            <div className="mb-8 space-y-6">
              <div className="flex items-center">
                <Phone className="mr-4 h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-semibold">Phone</p>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                </div>
              </div>
              <div className="flex items-center">
                <Mail className="mr-4 h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-semibold">Email</p>
                  <p className="text-gray-600">enterprise@loveworld.com</p>
                </div>
              </div>
              <div className="flex items-center">
                <MapPin className="mr-4 h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-semibold">Address</p>
                  <p className="text-gray-600">123 Business Ave, Suite 100<br />City, State 12345</p>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="mr-4 h-6 w-6 text-blue-600" />
                <div>
                  <p className="font-semibold">Business Hours</p>
                  <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM EST</p>
                </div>
              </div>
            </div>

            {/* Enterprise Features */}
            {planInterest === 'Enterprise' && (
              <div className="rounded-2xl bg-white p-6 shadow-lg">
                <h3 className="mb-4 text-xl font-semibold">Why Choose Enterprise?</h3>
                <div className="space-y-4">
                  {enterpriseFeatures.map((feature, index) => (
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
            )}
          </div>

          {/* Contact Form */}
          <div className="rounded-2xl bg-white p-8 shadow-xl">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Get in Touch</h2>
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
                    Company Size
                  </label>
                  <select
                    name="companySize"
                    value={formData.companySize}
                    onChange={handleInputChange}
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
                  Plan Interest
                </label>
                <select
                  name="planInterest"
                  value={formData.planInterest}
                  onChange={handleInputChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="Enterprise">Enterprise</option>
                  <option value="Pro">Pro</option>
                  <option value="General">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  placeholder="Tell us about your needs, timeline, and any specific requirements..."
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
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <Send className="mr-2 h-4 w-4" />
                    Send Message
                  </span>
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-500">
              We'll respond within 24 hours. For urgent matters, please call us directly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;