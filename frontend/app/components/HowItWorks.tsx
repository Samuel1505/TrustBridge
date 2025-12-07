'use client';

import { motion } from 'framer-motion';
import { Smartphone, CheckCircle, Wallet, Heart } from 'lucide-react';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

const steps = [
  {
    icon: Smartphone,
    title: 'Verify Identity',
    description: 'NGO founders scan their biometric passport using Self Protocol mobile app',
    number: '01',
  },
  {
    icon: CheckCircle,
    title: 'Get Verified',
    description: 'Smart contract validates identity proof and approves NGO registration',
    number: '02',
  },
  {
    icon: Wallet,
    title: 'Create Profile',
    description: 'Build your NGO profile with mission, photos, and contact information',
    number: '03',
  },
  {
    icon: Heart,
    title: 'Receive Donations',
    description: 'Donors send cUSD directly to your wallet with full transparency',
    number: '04',
  },
];

function StepCard({ step, index }: { step: typeof steps[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const Icon = step.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="relative"
    >
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Icon className="w-8 h-8 text-white" strokeWidth={2} />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-xs font-bold text-emerald-600 shadow-md">
              {step.number}
            </div>
          </div>
        </div>
        <div className="flex-1 pt-2">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{step.title}</h3>
          <p className="text-gray-600 leading-relaxed">{step.description}</p>
        </div>
      </div>

      {index < steps.length - 1 && (
        <motion.div
          initial={{ scaleY: 0 }}
          animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
          transition={{ duration: 0.5, delay: index * 0.15 + 0.3 }}
          className="absolute left-8 top-20 w-0.5 h-16 bg-gradient-to-b from-emerald-300 to-transparent origin-top"
        />
      )}
    </motion.div>
  );
}

export default function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Simple, secure, and transparent donation process
          </p>
        </motion.div>

        <div className="space-y-12">
          {steps.map((step, index) => (
            <StepCard key={index} step={step} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}