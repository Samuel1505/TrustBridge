'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Link2, Send, Globe } from 'lucide-react';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const features = [
  {
    icon: ShieldCheck,
    title: 'Identity Verified NGOs',
    description: 'Every NGO founder verifies their identity using Self Protocol biometric verification. One passport = One NGO.',
    color: 'emerald',
  },
  {
    icon: Link2,
    title: 'Blockchain Transparency',
    description: 'All donations are recorded on Celo blockchain. Track every transaction with complete transparency.',
    color: 'blue',
  },
  {
    icon: Send,
    title: 'Direct Donations',
    description: 'Send cUSD directly to verified NGOs. No intermediaries, no hidden fees, just pure impact.',
    color: 'purple',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Support verified NGOs across Africa and beyond. See founder location and mission details.',
    color: 'orange',
  },
];

const colorClasses = {
  emerald: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    border: 'border-blue-200',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    border: 'border-purple-200',
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-600',
    border: 'border-orange-200',
  },
};

function FeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const Icon = feature.icon;
  const colors = colorClasses[feature.color as keyof typeof colorClasses];

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group"
    >
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 h-full">
        <div className={`w-14 h-14 ${colors.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-7 h-7 ${colors.text}`} strokeWidth={2} />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
        <p className="text-gray-600 leading-relaxed">{feature.description}</p>
      </div>
    </motion.div>
  );
}

export default function Features() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Choose TrustBridge?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built on trust, powered by blockchain, designed for impact
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}