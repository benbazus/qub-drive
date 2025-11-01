
import { Settings } from 'lucide-react'

interface ContentSectionProps {
  title: string
  desc: string
  children: React.JSX.Element
  icon?: React.ReactNode
}

export default function ContentSection({
  title,
  desc,
  children,
  icon,
}: ContentSectionProps) {
  return (
    <div className='flex flex-1 flex-col'>
      {/* Enhanced Header with Gradient Background */}
      <div className='flex-none bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6 mb-6 border border-gray-200 dark:border-gray-700'>
        <div className='flex items-center space-x-3'>
          <div className='p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex-shrink-0'>
            {icon || <Settings className='h-6 w-6 text-white' />}
          </div>
          <div>
            <h3 className='text-xl font-semibold text-gray-900 dark:text-gray-100'>{title}</h3>
            <p className='text-gray-600 dark:text-gray-300 text-sm mt-1'>{desc}</p>
          </div>
        </div>
      </div>

      {/* Enhanced Content Area */}
      <div className='faded-bottom h-full w-full overflow-y-auto scroll-smooth pr-4 pb-12'>
        <div className='space-y-6'>
          {children}
        </div>
      </div>
    </div>
  )
}
