import {
  Zap,
  Shield,
  Users,
  Smartphone,
  Globe,
  BarChart3,
  Clock,
  Lock,
  Award,
} from 'lucide-react'
import { Feature } from './plans'


export const features: Feature[] = [
  {
    icon: <Zap className='h-8 w-8' />,
    title: 'Lightning Fast',
    description:
      'Experience blazing-fast upload speeds with our globally distributed CDN and optimized infrastructure.',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    icon: <Shield className='h-8 w-8' />,
    title: 'Bank-Grade Security',
    description:
      'Your files are protected with AES-256 encryption, two-factor authentication, and regular security audits.',
    color: 'from-green-400 to-emerald-500',
  },
  {
    icon: <Users className='h-8 w-8' />,
    title: 'Seamless Collaboration',
    description:
      'Work together in real-time with advanced sharing, commenting, and approval workflows.',
    color: 'from-blue-400 to-indigo-500',
  },
  {
    icon: <Smartphone className='h-8 w-8' />,
    title: 'Mobile First',
    description:
      'Access your files anywhere with our native mobile apps and responsive web interface.',
    color: 'from-purple-400 to-pink-500',
  },
  {
    icon: <Globe className='h-8 w-8' />,
    title: 'Global Access',
    description:
      'Files sync instantly across all your devices with our worldwide server network.',
    color: 'from-cyan-400 to-blue-500',
  },
  {
    icon: <BarChart3 className='h-8 w-8' />,
    title: 'Smart Analytics',
    description:
      'Get insights into your storage usage, team activity, and file performance.',
    color: 'from-red-400 to-rose-500',
  },
  {
    icon: <Clock className='h-8 w-8' />,
    title: 'Version Control',
    description:
      'Never lose work with automatic versioning and the ability to restore any previous version.',
    color: 'from-teal-400 to-cyan-500',
  },
  {
    icon: <Lock className='h-8 w-8' />,
    title: 'Advanced Permissions',
    description:
      'Granular access controls with expiring links, password protection, and download restrictions.',
    color: 'from-indigo-400 to-purple-500',
  },
  {
    icon: <Award className='h-8 w-8' />,
    title: 'Compliance Ready',
    description:
      'Meet industry standards with GDPR, HIPAA, and SOC 2 compliance features.',
    color: 'from-orange-400 to-red-500',
  },
]
