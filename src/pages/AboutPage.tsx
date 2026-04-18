import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Target, Users, Award, Heart, Truck, Globe, Zap, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const AboutPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const values = [
    { icon: Target, title: 'Customer First', description: "Every feature we build starts with understanding our customers' real challenges and needs." },
    { icon: Zap, title: 'Innovation', description: "We continuously push the boundaries of what's possible in logistics technology." },
    { icon: Shield, title: 'Reliability', description: 'Our platform is built for mission-critical operations with 99.9% uptime guaranteed.' },
    { icon: Heart, title: 'Partnership', description: 'We succeed when our customers succeed. Your growth is our growth.' },
  ];

  const milestones = [
    { year: 'July 2024', title: 'Founded', description: 'Started with a vision to transform logistics operations with modern technology.' },
    { year: 'January 2025', title: 'First 50 Customers', description: 'Reached our first milestone of 50 active customers.' },
    { year: '2026', title: 'Enhanced Suite of AI Products & Tools', description: 'Launched an enhanced suite of AI-powered products and tools to streamline supply chain operations.' },
  ];

  return (
    <div className={`pt-20 ${isDark ? 'bg-dark' : 'bg-white'}`}>
      {/* Hero Section */}
      <section className="section">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Building the Future of <span className="text-gradient-primary">Logistics</span>
            </h1>
            <p className={`text-lg ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              We're a team of logistics professionals and technology experts on a mission to transform how the freight industry operates.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className={`section ${isDark ? 'bg-dark-50' : 'bg-gray-50'}`}>
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left — text */}
            <div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${isDark ? 'bg-primary-600/20 border border-primary-600/30' : 'bg-primary-50 border border-primary-200'}`}>
                <Target className="w-4 h-4 text-primary-500" />
                <span className={`text-sm ${isDark ? 'text-primary-400' : 'text-primary-600'}`}>Our Mission</span>
              </div>

              <h2 className={`text-3xl md:text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Built for the people who keep the world{' '}
                <span className="text-gradient-primary">moving.</span>
              </h2>

              <div className={`border-l-2 border-primary-600 pl-5 my-6`}>
                <p className={`text-base font-medium leading-relaxed ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                  "Every feature we build is grounded in a single purpose: helping our customers move more freight, more efficiently — with less friction and less stress."
                </p>
              </div>

              <p className={`mb-5 leading-relaxed ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                The logistics industry is the backbone of global commerce — and yet, the freight brokers, fleet owners, and dispatchers driving it forward have long been underserved by technology that either costs too much, does too little, or wasn't built with their reality in mind.
              </p>
              <p className={`leading-relaxed ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
                At Integrated Supply Chain Solutions, we're changing that. We build a Transportation Management System designed from the ground up to give businesses of every size access to the enterprise-grade tools they need to compete, grow, and thrive in an increasingly demanding market.
              </p>
            </div>

            {/* Right — stats */}
            <div className="relative">
              <div className={`absolute inset-0 rounded-3xl blur-2xl ${isDark ? 'bg-gradient-to-tr from-primary-600/20 to-transparent' : 'bg-gradient-to-tr from-primary-600/10 to-transparent'}`} />
              <div className="relative grid grid-cols-2 gap-4">
                {[
                  { icon: Truck,  value: '100K+', label: 'Loads Managed' },
                  { icon: Users,  value: '250+',  label: 'Customers' },
                  { icon: Globe,  value: 'All',   label: 'US States & Canadian Provinces' },
                  { icon: Award,  value: '4.9',   label: 'Customer Rating' },
                ].map((stat, idx) => (
                  <div key={idx} className={`rounded-2xl p-6 border text-center ${idx % 2 === 1 ? 'mt-8' : ''} ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200 shadow-sm'}`}>
                    <stat.icon className="w-8 h-8 text-primary-500 mx-auto mb-3" />
                    <div className={`text-3xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
                    <div className={`text-xs leading-snug ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className={`section ${isDark ? '' : 'bg-white'}`}>
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Our Values</h2>
            <p className={`max-w-2xl mx-auto ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>Making smart AI systems accessible to all thereby uplifting North American transportation industry.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div key={index} className="card text-center hover:border-primary-600/50 transition-all">
                <div className="w-14 h-14 rounded-xl bg-primary-600/20 flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-7 h-7 text-primary-500" />
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value.title}</h3>
                <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className={`section ${isDark ? 'bg-dark-50' : 'bg-gray-50'}`}>
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Our Journey</h2>
            <p className={`max-w-2xl mx-auto ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>From a small startup to a trusted partner for hundreds of logistics companies.</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline Line */}
              <div className={`absolute left-8 top-0 bottom-0 w-px ${isDark ? 'bg-white/10' : 'bg-gray-300'}`} />
              {/* Milestones */}
              <div className="space-y-12">
                {milestones.map((milestone, index) => (
                  <div key={index} className="relative pl-20">
                    {/* Year Dot */}
                    <div className="absolute left-0 w-16 text-right pr-4">
                      <span className="text-sm font-bold text-primary-500">{milestone.year}</span>
                    </div>
                    {/* Dot */}
                    <div className={`absolute left-[29px] w-3 h-3 rounded-full bg-primary-600 border-4 ${isDark ? 'border-dark-50' : 'border-gray-50'}`} />
                    {/* Content */}
                    <div className="card">
                      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{milestone.title}</h3>
                      <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`section ${isDark ? 'bg-dark-50' : 'bg-gray-50'}`}>
        <div className="container-custom">
          <div className="text-center">
            <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Join Our Journey</h2>
            <p className={`max-w-xl mx-auto mb-8 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              Whether you're looking to transform your logistics operations or join our team, we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact" className="btn-primary inline-flex items-center gap-2" data-testid="about-demo-btn">Request a Demo <ArrowRight className="w-5 h-5" /></Link>
              <a href="mailto:careers@integratedsct.com" className="btn-secondary">View Careers</a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
