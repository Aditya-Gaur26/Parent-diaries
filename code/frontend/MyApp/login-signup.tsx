import React from 'react';

const SignUpScreen = () => {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900">
      <div className="w-80 rounded-3xl bg-white p-6 relative">
        {/* Header */}
        <div className="absolute top-4 left-4 text-blue-500 font-semibold"> Sign Up 1 </div>

        {/* Code Icon */}
        <div className="absolute top-4 right-4 text-gray-600">
          &lt;/&gt;
        </div>
        
        {/* Main Content */}
        <div className="mt-10 flex flex-col items-center">
          {/* Decorative Graphics */}
          <div className="bg-gray-100 w-48 h-48 rounded-3xl flex items-center justify-center mb-4">
            <svg width="120" height="120" viewBox="0 0 200 200" fill="none">
              <path d="M50 100C80 70 70 30 100 50C130 70 120 30 150 60C180 90 170 130 140 150C110 170 120 130 90 150C60 170 20 130 50 100Z" stroke="black" strokeWidth="2" fill="none"/>
              <path d="M30 80L40 70M160 40L170 30M130 170L140 180" stroke="black" strokeWidth="2"/>
            </svg>
          </div>
          
          {/* Text */}
          <h1 className="text-xl font-bold mb-1">Explore the app</h1>
          <p className="text-gray-500 text-center text-sm mb-6">
            Click on one of the options below to get started
          </p>
          
          {/* Sign Up Options */}
          <button className="w-full bg-white border border-gray-200 rounded-xl p-3 mb-3 flex items-center justify-center">
            <img src="google-icon.svg" alt="Google logo" className="w-5 h-5 mr-2" />
            <span>Continue with Google</span>
          </button>
          
          <button className="w-full bg-white border border-gray-200 rounded-xl p-3 mb-6 flex items-center justify-center">
            <div className="w-5 h-5 bg-black mr-2 flex items-center justify-center">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
                <path d="M20,4H4C2.9,4,2,4.9,2,6v12c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V6C22,4.9,21.1,4,20,4z M20,8l-8,5L4,8V6l8,5l8-5V8z" />
              </svg>
            </div>
            <span>Continue with Email</span>
          </button>
          
          {/* Login Link */}
          <p className="text-gray-500 text-sm">
            Already have an account? <a href="#" className="text-black font-medium">Log in</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpScreen;
