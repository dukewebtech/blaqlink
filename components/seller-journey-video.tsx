import dynamic from 'next/dynamic'

// Note: This is a wrapper component. For production use with Remotion,
// you'll need to set up Remotion rendering infrastructure or use a video service
export function SellerJourneyVideo() {
  return (
    <div className="w-full bg-gradient-to-b from-blue-50 to-white py-12">
      <div className="mx-auto max-w-4xl px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">See How It Works</h2>
          <p className="text-xl text-gray-600">Start selling, get paid, and grow your business with Blaqora</p>
        </div>

        {/* Video Player Placeholder - In production, this would render the Remotion video */}
        <div className="rounded-2xl overflow-hidden shadow-2xl bg-blue-600 aspect-video flex items-center justify-center">
          <div className="text-center text-white">
            <div className="mb-4 text-5xl">🎬</div>
            <p className="text-lg font-semibold mb-2">Seller Journey Animation</p>
            <p className="text-sm opacity-80">Login → Add Service → Get Orders → Deliver → Earn</p>
            <button className="mt-6 bg-yellow-300 text-blue-900 px-8 py-3 rounded-lg font-bold hover:bg-yellow-400 transition-colors">
              ▶ Watch Video
            </button>
          </div>
        </div>

        {/* Journey Steps - Fallback Display */}
        <div className="grid md:grid-cols-5 gap-4 mt-12">
          {[
            { step: 1, title: 'Login', icon: '👤' },
            { step: 2, title: 'Add Service', icon: '➕' },
            { step: 3, title: 'Receive Order', icon: '📦' },
            { step: 4, title: 'Get Paid', icon: '💰' },
            { step: 5, title: 'Grow', icon: '📈' },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-4xl mb-3 mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                {item.icon}
              </div>
              <h3 className="font-semibold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600 mt-1">Step {item.step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
