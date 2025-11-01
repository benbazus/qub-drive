import React, { MouseEvent } from 'react';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import Button from './Button';
import CloudStorageIllustration from './CloudStorageIllustration';

const HeroSection: React.FC = () => {
  const navigate = useNavigate();


  const handleStartTrial = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    navigate({ to: '/sign-up', search: { plan: 'trial' } });
  };

  const handleWatchDemo = (event: MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    navigate({ to: '/sign-up' });
  };

  return (
    <section className="px-4 pt-32 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10 blur-3xl"></div>
              <h1 className="relative mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-5xl font-bold text-transparent md:text-7xl">
                Store. Share. Sync.
              </h1>
            </div>
            <p className="mb-8 max-w-2xl text-xl md:text-2xl text-gray-600">
              Experience the future of cloud storage with lightning-fast uploads,
              seamless collaboration, and enterprise-grade security that scales
              with your business.
            </p>
            <div className="flex flex-col items-start gap-4 sm:flex-row">
              <Button
                onClick={handleStartTrial}
                className="group rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                Start Free Trial
                <ArrowRight className="ml-2 inline h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
              <Button
                variant="outline"
                onClick={handleWatchDemo}
                className="flex items-center rounded-xl border-2 px-8 py-4 text-lg font-semibold border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-blue-500">2M+</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-500">99.9%</div>
                <div className="text-sm text-gray-600">Uptime</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-500">500PB</div>
                <div className="text-sm text-gray-600">Data Stored</div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-600/20 blur-3xl"></div>
              <div className="relative h-96 w-96">
                <CloudStorageIllustration />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;