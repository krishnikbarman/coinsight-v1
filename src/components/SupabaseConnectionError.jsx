import { useNavigate } from 'react-router-dom';

const SupabaseConnectionError = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-primary px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-dark-secondary/80 backdrop-blur-xl rounded-xl border border-red-500/30 p-8 shadow-2xl">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Supabase Connection Error
          </h2>

          {/* Description */}
          <p className="text-gray-400 text-center mb-6">
            Unable to connect to Supabase backend. Please check your configuration.
          </p>

          {/* Error Details */}
          <div className="bg-dark-tertiary/50 rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-start">
              <span className="text-red-400 mr-2">•</span>
              <div>
                <p className="text-sm text-gray-300 font-medium">Invalid Supabase URL</p>
                <p className="text-xs text-gray-500 mt-1">
                  Check your <code className="bg-dark-tertiary px-2 py-0.5 rounded">.env</code> file
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <span className="text-yellow-400 mr-2">•</span>
              <div>
                <p className="text-sm text-gray-300 font-medium">Project Not Found</p>
                <p className="text-xs text-gray-500 mt-1">
                  The Supabase project URL may be incorrect or the project doesn't exist
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <span className="text-blue-400 mr-2">•</span>
              <div>
                <p className="text-sm text-gray-300 font-medium">Network Issue</p>
                <p className="text-xs text-gray-500 mt-1">
                  Check your internet connection
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-neon-blue/10 border border-neon-blue/30 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-neon-blue mb-2">🔧 Quick Fix:</h3>
            <ol className="text-xs text-gray-400 space-y-2">
              <li>1. Open your <code className="bg-dark-tertiary px-1.5 py-0.5 rounded text-white">.env</code> file</li>
              <li>2. Get your Supabase URL from <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer" className="text-neon-blue hover:underline">app.supabase.com</a></li>
              <li>3. Update <code className="bg-dark-tertiary px-1.5 py-0.5 rounded text-white">VITE_SUPABASE_URL</code> with the correct URL</li>
              <li>4. Refresh this page</li>
            </ol>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-semibold py-3 rounded-lg hover:shadow-lg hover:shadow-neon-blue/50 transition-all duration-300"
            >
              Retry Connection
            </button>
            <button
              onClick={() => window.open('https://app.supabase.com', '_blank')}
              className="flex-1 bg-dark-tertiary text-white font-semibold py-3 rounded-lg hover:bg-dark-tertiary/80 transition-all duration-300"
            >
              Open Supabase
            </button>
          </div>

          {/* Documentation Link */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Need help? Check{' '}
              <button
                onClick={() => navigate('/setup')}
                className="text-neon-blue hover:underline"
              >
                setup documentation
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseConnectionError;
