

export const EmptyState = () => (
    <div className='flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16 text-center animate-in fade-in duration-500'>
        <div className="relative">
            <img 
                alt='No content' 
                width={200} 
                height={200} 
                src='/empty.svg' 
                className="w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 xl:w-72 xl:h-72"
            />
        </div>
        <h3 className='mt-4 sm:mt-6 text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300'>
            No Items Found!
        </h3>
        <p className='mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-sm'>
            Upload files or create folders to get started
        </p>
    </div>
)