

export { ShareViewPage } from './ShareViewPage';

export default function SharePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Share & Collaborate</h1>
        <p className="text-lg text-gray-600 mb-8">
          Share your files securely with team members and external collaborators.
        </p>
        <p className="text-sm text-gray-500">
          Use the file manager to share individual files, or access shared files through direct links.
        </p>
      </div>
    </div>
  );
}
