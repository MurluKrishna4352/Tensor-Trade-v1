'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-orange-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white border-b-4 border-black z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <span className="text-3xl font-black tracking-tighter uppercase">
                Tensor<span className="text-orange-600">Trade</span>
              </span>
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-lg font-bold uppercase hover:bg-orange-600 hover:text-white px-2 py-1 transition-colors">Features</a>
              <a href="#offerings" className="text-lg font-bold uppercase hover:bg-orange-600 hover:text-white px-2 py-1 transition-colors">Products</a>
              <Link href="/auth/login">
                <button className="text-lg font-bold uppercase border-2 border-black px-6 py-2 hover:bg-black hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  Login
                </button>
              </Link>
              <Link href="/auth/signup">
                <button className="text-lg font-bold uppercase bg-orange-600 text-white border-2 border-black px-6 py-2 hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  Get Started
                </button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 border-2 border-black"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <div className="w-6 h-0.5 bg-black mb-1"></div>
              <div className="w-6 h-0.5 bg-black mb-1"></div>
              <div className="w-6 h-0.5 bg-black"></div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b-4 border-black p-4 space-y-4">
            <a href="#features" className="block text-xl font-bold uppercase">Features</a>
            <a href="#offerings" className="block text-xl font-bold uppercase">Products</a>
            <Link href="/auth/login" className="block">
              <button className="w-full text-lg font-bold uppercase border-2 border-black px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Login</button>
            </Link>
            <Link href="/auth/signup" className="block">
              <button className="w-full text-lg font-bold uppercase bg-orange-600 text-white border-2 border-black px-6 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">Get Started</button>
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 border-b-4 border-black">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl md:text-9xl font-black mb-8 uppercase leading-none">
            AI Powered<br/>
            <span className="bg-orange-600 text-white px-4">Trading</span>
          </h1>
          <p className="text-xl md:text-2xl font-bold mb-12 max-w-3xl mx-auto uppercase tracking-wide border-l-4 border-black pl-6 text-left md:text-center md:border-none md:pl-0">
            Self-improving multi-agent system. Analyzes markets. Manages portfolios. Zero emotions. Pure logic.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/auth/signup">
              <button className="text-xl font-black uppercase bg-black text-white border-4 border-black px-12 py-4 hover:bg-white hover:text-black transition-all shadow-[8px_8px_0px_0px_#FF5722] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#FF5722]">
                Start Trading Now
              </button>
            </Link>
            <Link href="#offerings">
              <button className="text-xl font-black uppercase bg-white text-black border-4 border-black px-12 py-4 hover:bg-orange-600 hover:text-white transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                Explore Products
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 border-t-4 border-black pt-12">
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-black mb-2 text-orange-600">$2.5B+</div>
              <div className="text-sm font-bold uppercase tracking-widest">Assets Managed</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-black mb-2 text-orange-600">50K+</div>
              <div className="text-sm font-bold uppercase tracking-widest">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-black mb-2 text-orange-600">99.9%</div>
              <div className="text-sm font-bold uppercase tracking-widest">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-black mb-2 text-orange-600">24/7</div>
              <div className="text-sm font-bold uppercase tracking-widest">AI Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 border-b-4 border-black bg-orange-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black text-center mb-16 uppercase">
            Powerful Features
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Portfolio Management", desc: "AI optimization. Real-time insights. Risk management." },
              { title: "Shariah Compliant", desc: "Islamic finance principles. Fully compliant options." },
              { title: "AI Calling Agent", desc: "Automated updates. Personalized insights via calls." },
              { title: "Live Trading", desc: "Real-time execution. IPO listings. Market analysis." },
              { title: "Multi-Agent System", desc: "Self-improving agents. Learn from every move." },
              { title: "MCP Server", desc: "Model Context Protocol. Advanced AI integration." }
            ].map((feature, index) => (
              <div key={index} className="border-4 border-black p-8 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all">
                <h3 className="text-2xl font-black mb-4 uppercase">{feature.title}</h3>
                <p className="text-lg font-bold text-gray-800">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offerings */}
      <section id="offerings" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black text-center mb-16 uppercase">
            Choose Your Path
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Dashboard",
                desc: "Complete trading platform.",
                cta: "Get Started",
                highlight: true,
                link: "/auth/login"
              },
              {
                title: "API Service",
                desc: "Enterprise-grade market analysis.",
                cta: "View Docs",
                highlight: false,
                link: "/api-docs"
              },
              {
                title: "MCP Server",
                desc: "Advanced AI integration server.",
                cta: "Learn More",
                highlight: false,
                link: "/mcp"
              }
            ].map((offering, index) => (
              <div
                key={index} 
                className={`border-4 border-black p-8 flex flex-col justify-between ${offering.highlight ? 'bg-orange-600 text-white' : 'bg-white text-black'} shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}
              >
                <div>
                  <h3 className={`text-3xl font-black mb-6 uppercase ${offering.highlight ? 'text-white' : 'text-black'}`}>{offering.title}</h3>
                  <p className={`text-xl font-bold mb-8 ${offering.highlight ? 'text-white' : 'text-gray-800'}`}>{offering.desc}</p>
                </div>
                
                <Link href={offering.link}>
                  <button className={`w-full text-xl font-black uppercase border-4 border-black py-4 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${offering.highlight ? 'bg-white text-black hover:bg-black hover:text-white' : 'bg-orange-600 text-white hover:bg-black'}`}>
                    {offering.cta}
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 border-t-4 border-black bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-black mb-8 uppercase">
            Ready to <span className="text-orange-600">Transform?</span>
          </h2>
          <Link href="/auth/signup">
            <button className="text-xl font-black uppercase bg-orange-600 text-white border-4 border-white px-12 py-6 hover:bg-white hover:text-black transition-all shadow-[8px_8px_0px_0px_#FFFFFF] hover:translate-x-[4px] hover:translate-y-[4px] hover:shadow-[4px_4px_0px_0px_#FFFFFF]">
              Get Started Free
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-4 border-black py-12 px-4 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xl font-black uppercase">&copy; 2026 TensorTrade.</p>
        </div>
      </footer>
    </div>
  );
}
