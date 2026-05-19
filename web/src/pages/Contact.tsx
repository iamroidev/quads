import React, { useState } from 'react';
import {
  MessageSquare,
  Info,
  X,
  Mail,
  Smartphone,
  MapPin,
  Clock,
  Send,
  AlertCircle,
  ShieldAlert,
  Phone,
} from 'lucide-react';
import { BulletinLayout, BulletinSection, BulletinCard } from '../components/layout/BulletinLayout';
import toast from 'react-hot-toast';
import api from '../services/api';

const ContactPage: React.FC = () => {
  const [ticketForm, setTicketForm] = useState({ subject: '', category: 'technical', message: '', email: '' });
  const [sending, setSending] = useState(false);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/support/ticket', ticketForm);
      toast.success('Support ticket submitted! We will contact you via email.');
      setTicketForm({ subject: '', category: 'technical', message: '', email: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSending(false);
    }
  };

  return (
    <BulletinLayout title="Contact Us" subtitle="Direct Assistance" section="09">
      <div className="border-b-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] px-6 py-12 relative overflow-hidden">
        <div className="absolute top-0 right-10 h-full w-32 bg-[var(--bulletin-bg)] opacity-5 rotate-[15deg]" />
        <div className="max-w-[1400px] mx-auto relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[var(--bulletin-text)] opacity-40 mb-3">Support Operations</p>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[var(--bulletin-text)]">Communication Protocol</h1>
        </div>
      </div>

      {/* Campus Emergency Contacts */}
      <div className="border-b-4 border-[var(--bulletin-border)] bg-[#ff6b6b]/10 px-6 py-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <ShieldAlert className="h-6 w-6 text-[#ff6b6b]" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#ff6b6b]">Campus Emergency Contacts</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'UMaT Security', value: '+233 (0) 312 023 551', icon: <ShieldAlert className="h-5 w-5" /> },
              { label: 'Campus Police Post', value: 'Near Main Gate', icon: <MapPin className="h-5 w-5" /> },
              { label: 'Student Affairs', value: '+233 (0) 312 023 559', icon: <Phone className="h-5 w-5" /> },
              { label: 'Emergency Hotline', value: '191 (Ghana Police)', icon: <AlertCircle className="h-5 w-5" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="border-4 border-[#ff6b6b] bg-[var(--bulletin-card)] p-4 shadow-[4px_4px_0_0_#ff6b6b] flex items-start gap-3">
                <div className="text-[#ff6b6b] mt-0.5">{icon}</div>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-widest opacity-60 text-[var(--bulletin-text)] mb-1">{label}</div>
                  <div className="text-[12px] font-black text-[var(--bulletin-text)]">{value}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] font-bold opacity-50 uppercase tracking-widest text-[var(--bulletin-text)]">
            For safety during marketplace transactions, always meet at public campus spots during daylight.
          </p>
        </div>
      </div>

      <BulletinSection bgColor="bg-[var(--bulletin-bg)]">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Info Side */}
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 leading-none text-[var(--bulletin-text)]">
              How can we <br /><span className="bg-[#ff6b6b] text-black px-2 mt-2 inline-block shadow-[4px_4px_0_0_var(--bulletin-shadow)] rotate-[-1deg]">help you?</span>
            </h2>
            <p className="text-[14px] font-bold opacity-70 mb-12 max-w-md text-[var(--bulletin-text)] leading-relaxed">
              Whether you have a technical glitch, a payment dispute, or just need clarification on our policies, our campus support team is here to assist.
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 shadow-[8px_8px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(-1deg)' }}>
                <Mail className="h-8 w-8 mb-4 opacity-40 text-[var(--bulletin-text)]" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-[var(--bulletin-text)]">Email Support</div>
                <div className="font-black text-[12px] text-[var(--bulletin-text)]">support@quadsmarket.tech</div>
              </div>

              <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 shadow-[8px_8px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(1deg)' }}>
                <Clock className="h-8 w-8 mb-4 opacity-40 text-[var(--bulletin-text)]" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-[var(--bulletin-text)]">Operating Hours</div>
                <div className="font-black text-[12px] text-[var(--bulletin-text)]">Mon - Fri, 8AM - 6PM</div>
              </div>

              <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-6 shadow-[8px_8px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(0.5deg)' }}>
                <MapPin className="h-8 w-8 mb-4 opacity-40 text-[var(--bulletin-text)]" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-[var(--bulletin-text)]">Physical Desk</div>
                <div className="font-black text-[12px] text-[var(--bulletin-text)]">Tovet Hostel</div>
              </div>

              <div 
                onClick={() => (window as any).toggleLiveChat?.()}
                className="border-4 border-[var(--bulletin-border)] bg-[#e0f2f7] dark:bg-sky-900/40 p-6 shadow-[8px_8px_0_0_var(--bulletin-shadow)] cursor-pointer hover:-translate-y-1 transition-transform" 
                style={{ transform: 'rotate(-0.5deg)' }}
              >
                <MessageSquare className="h-8 w-8 mb-4 opacity-40 text-black dark:text-sky-200" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 text-black dark:text-sky-200">Live Chat</div>
                <div className="font-black text-[12px] text-sky-700 dark:text-sky-300">Active Now</div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="relative">
            <div className="absolute -top-3 left-10 h-8 w-40 bg-[#ffd700]/50 rotate-[-2deg] z-10" />
            <div className="border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-card)] p-8 md:p-12 shadow-[12px_12px_0_0_var(--bulletin-shadow)]" style={{ transform: 'rotate(0.5deg)' }}>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4 text-[var(--bulletin-text)]">
                <Send className="h-6 w-6" /> Open Support Ticket
              </h2>
              
              <form onSubmit={handleTicketSubmit} className="space-y-8">
                <div className="grid gap-8 sm:grid-cols-2">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 block mb-3 text-[var(--bulletin-text)]">Institutional Email</label>
                    <input 
                      type="email" 
                      required 
                      value={ticketForm.email} 
                      onChange={e => setTicketForm({...ticketForm, email: e.target.value})} 
                      className="w-full border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-4 text-[12px] font-black focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] text-[var(--bulletin-text)] placeholder:text-[var(--bulletin-text)] placeholder:opacity-30" 
                      placeholder="name@umat.edu.gh" 
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 block mb-3 text-[var(--bulletin-text)]">Category</label>
                    <select 
                      value={ticketForm.category}
                      onChange={e => setTicketForm({...ticketForm, category: e.target.value})}
                      className="w-full border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-4 text-[12px] font-black focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] text-[var(--bulletin-text)]"
                    >
                      <option value="technical">Technical Issue</option>
                      <option value="payment">Payment / Escrow</option>
                      <option value="safety">Safety / Reporting</option>
                      <option value="account">Account Access</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 block mb-3 text-[var(--bulletin-text)]">Subject</label>
                  <input 
                    type="text" 
                    required 
                    value={ticketForm.subject} 
                    onChange={e => setTicketForm({...ticketForm, subject: e.target.value})} 
                    className="w-full border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-4 text-[12px] font-black focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] text-[var(--bulletin-text)] placeholder:text-[var(--bulletin-text)] placeholder:opacity-30" 
                    placeholder="Brief summary of your issue" 
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] opacity-40 block mb-3 text-[var(--bulletin-text)]">Message</label>
                  <textarea 
                    required 
                    rows={5} 
                    value={ticketForm.message} 
                    onChange={e => setTicketForm({...ticketForm, message: e.target.value})} 
                    className="w-full border-2 border-[var(--bulletin-border)] bg-[var(--bulletin-bg)] p-4 text-[12px] font-black focus:outline-none focus:ring-2 focus:ring-[var(--bulletin-text)] text-[var(--bulletin-text)] placeholder:text-[var(--bulletin-text)] placeholder:opacity-30 resize-none" 
                    placeholder="Please describe what happened in detail..." 
                  />
                </div>

                <button 
                  disabled={sending}
                  type="submit" 
                  className="w-full border-4 border-[var(--bulletin-border)] bg-[var(--bulletin-text)] py-5 text-[14px] font-black uppercase tracking-widest text-[var(--bulletin-bg)] hover:bg-[#fffacd] dark:hover:bg-yellow-900/40 hover:text-black dark:hover:text-white transition-all hover:-translate-y-1 shadow-[6px_6px_0_0_var(--bulletin-shadow)] hover:shadow-[8px_8px_0_0_var(--bulletin-shadow)] disabled:opacity-50"
                >
                  {sending ? 'Submitting Request...' : 'Submit Official Ticket'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </BulletinSection>

      {/* Safety Banner */}
      <BulletinSection bgColor="bg-red-600 dark:bg-red-900">
        <div className="flex items-center justify-center gap-6 py-6 border-4 border-red-800 dark:border-red-400 border-dashed">
          <AlertCircle className="h-8 w-8 text-white dark:text-red-200" />
          <p className="text-[12px] font-black uppercase tracking-widest text-white dark:text-red-200 leading-relaxed">
            For emergencies involving theft or physical safety, <br className="sm:hidden" />contact Campus Security immediately.
          </p>
        </div>
      </BulletinSection>
    </BulletinLayout>
  );
};

export default ContactPage;