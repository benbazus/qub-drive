import React from 'react';
import { CheckCircle } from 'lucide-react';
import SecurityIllustration from './SecurityIllustration';
import CollaborationIllustration from './CollaborationIllustration';

const VisualFeaturesSection: React.FC = () => {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="flex flex-col justify-center">
            <h3 className="mb-6 text-3xl font-bold md:text-4xl">
              Enterprise-Grade Security
            </h3>
            <p className="mb-8 text-lg text-gray-600">
              Your data is protected by military-grade encryption, multi-factor
              authentication, and compliance with industry standards including
              GDPR, HIPAA, and SOC 2.
            </p>
            <ul className="space-y-4">
              {[
                'AES-256 Encryption',
                'Zero-Knowledge Architecture',
                'Multi-Factor Authentication',
                'Regular Security Audits',
              ].map((item, idx) => (
                <li key={idx} className="flex items-center">
                  <CheckCircle className="mr-3 h-5 w-5 text-green-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-center">
            <div className="h-64 w-64">
              <SecurityIllustration />
            </div>
          </div>
        </div>
        <div className="mt-24 grid gap-16 lg:grid-cols-2 lg:gap-24">
          <div className="flex items-center justify-center lg:order-1">
            <div className="h-64 w-80">
              <CollaborationIllustration />
            </div>
          </div>
          <div className="flex flex-col justify-center lg:order-2">
            <h3 className="mb-6 text-3xl font-bold md:text-4xl">
              Seamless Team Collaboration
            </h3>
            <p className="mb-8 text-lg text-gray-600">
              Work together effortlessly with real-time collaboration, advanced
              sharing controls, and integrated communication tools that keep
              your team in sync.
            </p>
            <ul className="space-y-4">
              {[
                'Real-time Collaboration',
                'Advanced Sharing Controls',
                'Team Workspaces',
                'Integrated Comments',
              ].map((item, idx) => (
                <li key={idx} className="flex items-center">
                  <CheckCircle className="mr-3 h-5 w-5 text-blue-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default VisualFeaturesSection;