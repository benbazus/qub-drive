import React from 'react';
import { features } from '../data/features';

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need for modern file management and collaboration
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature: Feature, index: number) => (
            <div
              key={index}
              className="group rounded-2xl p-8 transition-all duration-300 hover:scale-105 bg-white hover:shadow-xl"
            >
              <div
                className={`mb-4 w-fit rounded-xl bg-gradient-to-r ${feature.color} p-3 text-white transition-transform group-hover:scale-110`}
              >
                {feature.icon}
              </div>
              <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;