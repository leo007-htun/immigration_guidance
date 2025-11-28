import { Scale, MessageSquare, Shield, Clock, ArrowRight, CheckCircle } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export function LandingPage({ onGetStarted, onSignIn }: LandingPageProps) {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="backdrop-blur-md bg-white/5 border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#0D9488]/20 to-[#0F9D58]/20 border border-white/20">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <span className="text-white">Immigration AI</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-white/80 hover:text-white transition-colors">How It Works</a>
              <a href="#about" className="text-white/80 hover:text-white transition-colors">About</a>
              <button
                onClick={onSignIn}
                className="px-4 py-2 rounded-lg backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
              >
                Sign In
              </button>
              <button
                onClick={onGetStarted}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#0D9488] to-[#0F9D58] text-white hover:from-[#0F766E] hover:to-[#0C8E4F] transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-[#0D9488]/20 to-[#0F9D58]/20 border border-white/20 mb-8">
              <Scale className="w-16 h-16 text-white" />
            </div>
            <h1 className="text-white mb-6 text-5xl lg:text-6xl">
              Your AI-Powered UK Immigration Assistant
            </h1>
            <p className="text-white/70 text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
              Need clarity on UK immigration law? Tired of slow advice and unclear answers?<br />
              Our AI gives you crystal-clear guidance in seconds.<br />
              Navigate the complex immigration process with confidence and clarity.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={onGetStarted}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0F9D58] text-white hover:from-[#0F766E] hover:to-[#0C8E4F] transition-all shadow-lg flex items-center gap-2 group"
              >
                Start Free Chat
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 rounded-xl backdrop-blur-md bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-white mb-4 text-4xl">Why Choose Immigration AI?</h2>
            <p className="text-white/60 text-lg">Powerful features to help you navigate your immigration journey</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8 hover:bg-white/15 transition-all">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#0D9488]/20 to-[#0F9D58]/20 border border-white/20 inline-flex mb-4">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white mb-3">Instant Answers</h3>
              <p className="text-white/70">
                Get immediate responses to your immigration questions 24/7. Our AI is trained on the latest immigration policies and procedures.
              </p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8 hover:bg-white/15 transition-all">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#0D9488]/20 to-[#0F9D58]/20 border border-white/20 inline-flex mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white mb-3">Secure & Private</h3>
              <p className="text-white/70">
                Your conversations are encrypted and private. We prioritize your data security and confidentiality at every step.
              </p>
            </div>
            <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8 hover:bg-white/15 transition-all">
              <div className="p-3 rounded-xl bg-gradient-to-br from-[#0D9488]/20 to-[#0F9D58]/20 border border-white/20 inline-flex mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white mb-3">Save Time & Money</h3>
              <p className="text-white/70">
                Get quick guidance before consulting with an attorney. Understand your options and prepare better for your immigration journey.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-white mb-4 text-4xl">How It Works</h2>
            <p className="text-white/60 text-lg">Simple steps to get the immigration help you need</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Account', description: 'Sign up for free in seconds. No credit card required.' },
              { step: '02', title: 'Ask Questions', description: 'Chat with our AI assistant about your immigration concerns.' },
              { step: '03', title: 'Get Guidance', description: 'Receive instant, informed answers to help you move forward.' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-8 mb-4">
                  <div className="text-6xl text-white/20 mb-4">{item.step}</div>
                  <h3 className="text-white mb-3">{item.title}</h3>
                  <p className="text-white/70">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-12">
            <h2 className="text-white mb-6 text-4xl text-center">About Immigration AI</h2>
            <div className="space-y-4 text-white/70 text-lg">
              <p>
                Immigration AI Assistant is designed to provide general immigration information and guidance to help you understand your options and navigate the complex immigration process.
              </p>
              <p>
                Our AI is trained on immigration laws, policies, and procedures, but please note that the information provided does not constitute legal advice. For specific legal matters, we recommend consulting with a licensed immigration attorney.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  'Available 24/7 for your convenience',
                  'Updated with latest immigration policies',
                  'Free general information and guidance',
                  'Multilingual support coming soon',
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-[#0D9488]" />
                    <span className="text-white/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="backdrop-blur-xl bg-gradient-to-r from-[#0D9488]/20 to-[#0F9D58]/20 rounded-3xl border border-white/20 p-12">
            <h2 className="text-white mb-4 text-4xl">Ready to Get Started?</h2>
            <p className="text-white/70 text-lg mb-8">
              Join thousands of users who trust Immigration AI for their immigration questions.
            </p>
            <button
              onClick={onGetStarted}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#0F9D58] text-white hover:from-[#0F766E] hover:to-[#0C8E4F] transition-all shadow-lg inline-flex items-center gap-2 group"
            >
              Start Your Free Chat Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="backdrop-blur-md bg-white/5 border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white/60 text-sm">
            <p>© 2024 Immigration AI Assistant. All rights reserved.</p>
            <p className="mt-2">This service provides general information only and does not constitute legal advice.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
