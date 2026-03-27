import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface FormData {
  firstName: string; lastName: string; email: string; company: string; phone: string; role: string; fleetSize: string; message: string;
}

const ContactPage: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [formData, setFormData] = useState<FormData>({ firstName: '', lastName: '', email: '', company: '', phone: '', role: '', fleetSize: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://api.staging.integratedtech.ca';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      const response = await fetch(`${BACKEND_URL}/api/marketing/demo-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: formData.firstName, last_name: formData.lastName, email: formData.email, company: formData.company, phone: formData.phone, role: formData.role, fleet_size: formData.fleetSize, message: formData.message }),
      });
      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ firstName: '', lastName: '', email: '', company: '', phone: '', role: '', fleetSize: '', message: '' });
      } else {
        const contentType = response.headers.get('content-type') || '';
        const errorData = contentType.includes('application/json') ? await response.json() : {};
        setSubmitStatus('error');
        setErrorMessage(errorData.detail || 'Failed to submit. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles = ['Freight Broker', 'Fleet Owner', 'Independent Dispatcher', 'Operations Manager', 'Other'];
  const fleetSizes = ['1-10 trucks', '11-50 trucks', '51-100 trucks', '100+ trucks', 'Not applicable'];

  const inputClass = `w-full px-4 py-3 rounded-lg transition-colors focus:outline-none focus:border-primary-600 ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder-zinc-500' : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400'}`;
  const selectClass = `w-full px-4 py-3 rounded-lg transition-colors focus:outline-none focus:border-primary-600 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-50 border border-gray-300 text-gray-900'}`;

  return (
    <div className={`pt-20 ${isDark ? 'bg-dark' : 'bg-white'}`}>
      <section className="section">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Let's <span className="text-gradient-primary">Connect</span>
            </h1>
            <p className={`text-lg ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
              Book a demo to learn how we can automate 90% of your tasks while your Humans can focus on Customer Experience and Service Delivery.
            </p>
          </div>
        </div>
      </section>

      <section className={`section pt-0 ${isDark ? 'bg-dark-50' : 'bg-gray-50'}`}>
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-1">
              <div className="sticky top-32">
                <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Get in Touch</h2>
                <p className={`mb-8 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>Have questions? Our team is here to help you find the right solution.</p>
                <div className="space-y-6">
                  {/* Email */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Email</h3>
                      <a href="mailto:demo@integratedtech.ca" className={`block transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`} data-testid="contact-email-demo">demo@integratedtech.ca</a>
                      <a href="mailto:feedback@integratedtech.ca" className={`block transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`} data-testid="contact-email-feedback">feedback@integratedtech.ca</a>
                    </div>
                  </div>
                  {/* Phone */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Phone</h3>
                      <a href="tel:+16477844618" className={`transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`} data-testid="contact-phone-number">647-784-4618</a>
                    </div>
                  </div>
                  {/* Office */}
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary-500" />
                    </div>
                    <div>
                      <h3 className={`font-medium mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Office</h3>
                      <p className={isDark ? 'text-zinc-400' : 'text-gray-600'}>King Street<br />Toronto, ON</p>
                    </div>
                  </div>
                </div>
                <div className={`mt-12 p-6 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
                  <h3 className={`font-medium mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Human Support</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-zinc-400' : 'text-gray-600'}>Monday</span>
                      <span className={isDark ? 'text-zinc-300' : 'text-gray-900'}>9am - 5pm EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-zinc-400' : 'text-gray-600'}>Tuesday</span>
                      <span className={isDark ? 'text-zinc-300' : 'text-gray-900'}>9am - 5pm EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-zinc-400' : 'text-gray-600'}>Wednesday</span>
                      <span className={isDark ? 'text-zinc-300' : 'text-gray-900'}>9am - 5pm EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-zinc-400' : 'text-gray-600'}>Thursday</span>
                      <span className={isDark ? 'text-zinc-300' : 'text-gray-900'}>9am - 5pm EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-zinc-400' : 'text-gray-600'}>Friday</span>
                      <span className={isDark ? 'text-zinc-300' : 'text-gray-900'}>9am - 5pm EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-zinc-400' : 'text-gray-600'}>Saturday</span>
                      <span className={isDark ? 'text-zinc-300' : 'text-gray-900'}>10am - 2pm EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-zinc-400' : 'text-gray-600'}>Sunday</span>
                      <span className={isDark ? 'text-zinc-300' : 'text-gray-900'}>OFF</span>
                    </div>
                  </div>
                  <h3 className={`font-medium mb-2 mt-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>AI Support</h3>
                  <div className="text-sm">
                    <span className={isDark ? 'text-zinc-300' : 'text-gray-900'}>24/7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="card-highlight">
                <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Request a Demo</h2>
                <p className={`mb-8 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>Fill out the form below and we'll get back to you within 24 hours.</p>

                {submitStatus === 'success' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Thank You!</h3>
                    <p className={`mb-6 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>We've received your request and will be in touch within 24 hours.</p>
                    <button onClick={() => setSubmitStatus('idle')} className="text-primary-500 hover:text-primary-400 font-medium">Submit another request</button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {submitStatus === 'error' && (
                      <div className={`flex items-center gap-3 p-4 rounded-lg ${isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'}`}>
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-red-400 text-sm">{errorMessage}</p>
                      </div>
                    )}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="firstName" className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>First Name *</label>
                        <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required className={inputClass} placeholder="John" data-testid="contact-first-name" />
                      </div>
                      <div>
                        <label htmlFor="lastName" className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>Last Name *</label>
                        <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required className={inputClass} placeholder="Doe" data-testid="contact-last-name" />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="email" className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>Work Email *</label>
                        <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} placeholder="john@company.com" data-testid="contact-email" />
                      </div>
                      <div>
                        <label htmlFor="phone" className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>Phone Number</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="(555) 123-4567" data-testid="contact-phone" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="company" className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>Company Name *</label>
                      <input type="text" id="company" name="company" value={formData.company} onChange={handleChange} required className={inputClass} placeholder="Acme Logistics" data-testid="contact-company" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="role" className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>Your Role</label>
                        <select id="role" name="role" value={formData.role} onChange={handleChange} className={selectClass} data-testid="contact-role">
                          <option value="" className={isDark ? 'bg-dark' : 'bg-white'}>Select your role</option>
                          {roles.map((role) => (<option key={role} value={role} className={isDark ? 'bg-dark' : 'bg-white'}>{role}</option>))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="fleetSize" className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>Fleet Size</label>
                        <select id="fleetSize" name="fleetSize" value={formData.fleetSize} onChange={handleChange} className={selectClass} data-testid="contact-fleet-size">
                          <option value="" className={isDark ? 'bg-dark' : 'bg-white'}>Select fleet size</option>
                          {fleetSizes.map((size) => (<option key={size} value={size} className={isDark ? 'bg-dark' : 'bg-white'}>{size}</option>))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="message" className={`block text-sm font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>How can we help?</label>
                      <textarea id="message" name="message" value={formData.message} onChange={handleChange} rows={4} className={`${inputClass} resize-none`} placeholder="Tell us about your current challenges..." data-testid="contact-message" />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="btn-primary w-full justify-center disabled:opacity-50" data-testid="contact-submit-btn">
                      {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin mr-2" />Submitting...</>) : (<><Send className="w-5 h-5 mr-2" />Request Demo</>)}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
