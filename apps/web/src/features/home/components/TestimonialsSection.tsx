import React from 'react';
import { Star } from 'lucide-react';
import { testimonials } from '../data/testimonials';

const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            What Our Users Say
          </h2>
          <p className="text-xl text-gray-600">
            Join thousands of satisfied customers who trust KingsShare
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="rounded-2xl p-8 transition-all duration-300 hover:scale-105 bg-white shadow-lg"
            >
              <div className="mb-4 flex">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="mb-6 italic text-gray-600">
                "{testimonial.content}"
              </p>
              <div>
                <div className="font-semibold">{testimonial.name}</div>
                <div className="text-sm text-gray-500">
                  {testimonial.role} at {testimonial.company}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;