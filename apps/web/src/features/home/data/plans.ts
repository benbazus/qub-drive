

export interface Plan {
  id: string
  name: 'Personal' | 'Pro' | 'Enterprise'
  price: string
  monthlyPrice: number
  storage: string
  features: string[]
  popular?: boolean
  description: string
  buttonText: string
}

export interface Feature {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}

export interface Testimonial {
  name: string
  role: string
  company: string
  content: string
  rating: number
}

export const plans: Plan[] = [
  {
    id: 'personal',
    name: 'Personal',
    price: 'Free',
    monthlyPrice: 0,
    storage: '5 GB',
    description: 'Perfect for personal use and small projects',
    buttonText: 'Get Started',
    features: [
      '5 GB Storage',
      'Basic File Sharing',
      'Mobile & Web Access',
      'Email Support',
      'Basic Version History',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99/mo',
    monthlyPrice: 9.99,
    storage: '1 TB',
    description: 'Ideal for professionals and growing teams',
    buttonText: 'Start Free Trial',
    popular: true,
    features: [
      '1 TB Storage',
      'Advanced Sharing Controls',
      'Full Version History',
      'Priority Support',
      'Team Collaboration',
      'Advanced Security',
      'Custom Branding',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$29.99/mo',
    monthlyPrice: 29.99,
    storage: 'Unlimited',
    description: 'Complete solution for large organizations',
    buttonText: 'Contact Sales',
    features: [
      'Unlimited Storage',
      'Advanced Admin Controls',
      'SSO Integration',
      '24/7 Phone Support',
      'Custom Integrations',
      'Compliance Tools',
      'Dedicated Account Manager',
      'Advanced Analytics',
    ],
  },
]
