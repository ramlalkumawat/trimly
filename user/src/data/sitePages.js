import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  CircleHelp,
  FileText,
  Gem,
  Globe,
  GraduationCap,
  Handshake,
  Headset,
  Instagram,
  Linkedin,
  Lock,
  MapPin,
  MessageSquare,
  PlayCircle,
  ShieldCheck,
  Star,
  TrendingUp,
  UserPlus,
  UsersRound,
  Youtube
} from 'lucide-react';

const appRoute = (section, slug) => `/${section}/${slug}`;

export const socialProfiles = {
  instagram: {
    label: 'Instagram',
    href: 'https://www.instagram.com/_ramlal__kumawat/'
  },
  youtube: {
    label: 'YouTube',
    href: 'https://www.youtube.com/'
  },
  linkedin: {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/ramlal-kumawat-b5a3161a0?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app'
  },
  community: {
    label: 'Community',
    href: 'https://www.facebook.com/ramlal.kumawat.798278?rdid=lJlssT07fXQXDT5K&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1Mr4xFMitk%2F#'
  }
};

const withPath = (section, items) =>
  items.map((item) => ({
    ...item,
    path: appRoute(section, item.slug)
  }));

export const footerSections = [
  {
    key: 'company',
    title: 'Company',
    items: withPath('company', [
      { label: 'About Trimly', slug: 'about-trimly' },
      { label: 'Careers', slug: 'careers' },
      { label: 'Terms and Conditions', slug: 'terms-and-conditions' },
      { label: 'Privacy Policy', slug: 'privacy-policy' }
    ])
  },
  {
    key: 'customers',
    title: 'For Customers',
    items: withPath('customers', [
      { label: 'Contact Us', slug: 'contact-us' },
      { label: 'Service Areas', slug: 'service-areas' },
      { label: 'FAQs', slug: 'faqs' },
      { label: 'Reviews', slug: 'reviews' }
    ])
  },
  {
    key: 'professionals',
    title: 'For Professionals',
    items: withPath('professionals', [
      { label: 'Join as a Stylist', slug: 'join-as-a-stylist' },
      { label: 'Partner With Us', slug: 'partner-with-us' },
      { label: 'Training Support', slug: 'training-support' },
      { label: 'Business Growth', slug: 'business-growth' }
    ])
  },
  {
    key: 'follow',
    title: 'Follow Us',
    items: withPath('follow', [
      { label: 'Instagram', slug: 'instagram' },
      { label: 'YouTube', slug: 'youtube' },
      { label: 'LinkedIn', slug: 'linkedin' },
      { label: 'Community', slug: 'community' }
    ])
  }
];

const testimonials = [
  {
    quote: 'The booking flow is fast and the service quality is consistently high.',
    name: 'Ritika Jain',
    role: 'Trimly Customer'
  },
  {
    quote: 'Trimly gave our team a clear process for onboarding and service delivery.',
    name: 'Harsh Vashisht',
    role: 'Operations Partner'
  }
];

const faqs = [
  {
    question: 'How quickly does Trimly respond to requests?',
    answer: 'Most requests receive an initial response within the same business day.'
  },
  {
    question: 'Can I ask account-specific questions?',
    answer: 'Yes. Submit your booking and contact details to receive personalized support.'
  },
  {
    question: 'Is support available for both customers and professionals?',
    answer: 'Yes. Dedicated support channels are available for customers, stylists, and partners.'
  }
];

const sectionDefaults = {
  company: {
    cards: [
      {
        icon: ShieldCheck,
        title: 'Quality and trust',
        description: 'Verified professionals and service protocols keep customer outcomes reliable.'
      },
      {
        icon: Gem,
        title: 'Premium experience',
        description: 'Clear booking, transparent pricing, and professional etiquette at every touchpoint.'
      },
      {
        icon: TrendingUp,
        title: 'Scalable operations',
        description: 'City-by-city expansion backed by measurable quality benchmarks.'
      }
    ],
    bulletPoints: [
      'Customer-first product and operations strategy',
      'Standardized SOPs across services and locations',
      'Transparent communication on policy and support'
    ],
    formFields: ['fullName', 'email', 'phone', 'message']
  },
  customers: {
    cards: [
      {
        icon: Headset,
        title: 'Fast support',
        description: 'Booking, payment, and service queries are routed to specialized support desks.'
      },
      {
        icon: BadgeCheck,
        title: 'Reliable fulfillment',
        description: 'Zone-level operational controls improve punctuality and service consistency.'
      },
      {
        icon: Star,
        title: 'Feedback-driven improvement',
        description: 'Customer reviews are tracked and converted into quality improvements.'
      }
    ],
    bulletPoints: [
      'Clear booking and rescheduling flow',
      'Transparent cancellation and support process',
      'Continuous quality improvements from review insights'
    ],
    formFields: ['fullName', 'email', 'phone', 'bookingId', 'message']
  },
  professionals: {
    cards: [
      {
        icon: UserPlus,
        title: 'Structured onboarding',
        description: 'Trimly helps professionals join with clear eligibility and quality expectations.'
      },
      {
        icon: GraduationCap,
        title: 'Training support',
        description: 'Guided modules improve service consistency, communication, and hygiene standards.'
      },
      {
        icon: TrendingUp,
        title: 'Business growth',
        description: 'Demand insights and performance feedback support long-term earning potential.'
      }
    ],
    bulletPoints: [
      'Fair and data-informed assignment workflow',
      'Recurring training and quality assessments',
      'Dedicated help desk for professionals and partners'
    ],
    formFields: ['fullName', 'email', 'phone', 'city', 'experience', 'message']
  },
  follow: {
    cards: [
      {
        icon: MessageSquare,
        title: 'Community engagement',
        description: 'Stay updated with stories, tips, and real service journeys.'
      },
      {
        icon: PlayCircle,
        title: 'Educational content',
        description: 'Access tutorials and practical guidance for customers and professionals.'
      },
      {
        icon: Globe,
        title: 'Brand updates',
        description: 'Track launches, hiring updates, and operational milestones.'
      }
    ],
    bulletPoints: [
      'Follow verified Trimly updates',
      'Discover service and career opportunities',
      'Connect with a growing beauty-tech community'
    ],
    formFields: ['fullName', 'email', 'message']
  }
};

const makePage = (section, config) => {
  const base = sectionDefaults[section];
  return {
    cards: base.cards,
    bulletPoints: base.bulletPoints,
    faqs,
    testimonials,
    form: {
      title: config.formTitle || `${config.title} Inquiry`,
      description: config.formDescription || 'Share your details and our team will reach out shortly.',
      fields: config.formFields || base.formFields,
      submitLabel: config.formSubmitLabel || 'Submit Request',
      successMessage: config.successMessage || 'Thanks. Your request has been submitted successfully.'
    },
    ...config
  };
};

const companyPages = {
  'about-trimly': makePage('company', {
    seoTitle: 'About Trimly | Premium Salon At Home',
    badge: 'Company',
    title: 'About Trimly',
    subtitle: 'Trimly delivers premium salon-at-home services through verified professionals, transparent pricing, and high service standards.',
    metrics: [
      { icon: BadgeCheck, value: '10K+', label: 'bookings completed' },
      { icon: ShieldCheck, value: '500+', label: 'verified professionals' },
      { icon: Star, value: '4.8/5', label: 'average customer rating' }
    ],
    narrativeHeading: 'The mission behind Trimly',
    narrative: [
      'We built Trimly to help customers access consistent and hygienic salon experiences without travel friction.',
      'Our model combines operational rigor and service quality so every booking feels reliable and premium.'
    ],
    ctaPanel: {
      title: 'Ready to experience Trimly?',
      text: 'Book your next service or connect with us for enterprise and partnership discussions.',
      primary: { label: 'Book Services', to: '/services' },
      secondary: { label: 'Contact Us', to: '/customers/contact-us' }
    }
  }),
  careers: makePage('company', {
    seoTitle: 'Careers At Trimly',
    badge: 'Company',
    title: 'Careers',
    subtitle: 'Join a high-ownership team building trusted beauty-tech operations across multiple cities.',
    metrics: [
      { icon: BriefcaseBusiness, value: '20+', label: 'open opportunities' },
      { icon: UsersRound, value: '3', label: 'core departments' },
      { icon: TrendingUp, value: '2x', label: 'growth trajectory' }
    ],
    narrativeHeading: 'Work where impact is visible',
    narrative: [
      'Trimly teams work across product, operations, support, and growth with direct ownership.',
      'You get real responsibility, clear goals, and meaningful cross-functional collaboration from day one.'
    ],
    ctaPanel: {
      title: 'Apply to the Trimly team',
      text: 'Share your profile and preferred role to start your application journey.',
      primary: { label: 'Submit Application', to: '/company/careers' },
      secondary: { label: 'View About Trimly', to: '/company/about-trimly' }
    },
    formFields: ['fullName', 'email', 'phone', 'city', 'experience', 'message']
  }),
  'terms-and-conditions': makePage('company', {
    seoTitle: 'Trimly Terms and Conditions',
    badge: 'Policy',
    title: 'Terms and Conditions',
    subtitle: 'Review the legal terms that govern bookings, payments, cancellations, and platform usage on Trimly.',
    metrics: [
      { icon: FileText, value: '12', label: 'key policy clauses' },
      { icon: ShieldCheck, value: 'Clear', label: 'service obligations' },
      { icon: Headset, value: '24/7', label: 'support for clarifications' }
    ],
    narrativeHeading: 'Policy designed for transparency',
    narrative: [
      'These terms define customer and platform responsibilities so service execution remains clear and fair.',
      'If terms are updated, users are informed and can request clarification from our support team.'
    ],
    ctaPanel: {
      title: 'Need policy clarification?',
      text: 'Submit your query and we will respond with clause-specific guidance.',
      primary: { label: 'Ask Policy Team', to: '/company/terms-and-conditions' },
      secondary: { label: 'Read Privacy Policy', to: '/company/privacy-policy' }
    },
    formFields: ['fullName', 'email', 'bookingId', 'message']
  }),
  'privacy-policy': makePage('company', {
    seoTitle: 'Trimly Privacy Policy',
    badge: 'Policy',
    title: 'Privacy Policy',
    subtitle: 'Understand how Trimly collects, protects, and uses data during account, booking, and support workflows.',
    metrics: [
      { icon: Lock, value: 'Encrypted', label: 'data transport' },
      { icon: ShieldCheck, value: 'Role-based', label: 'data access' },
      { icon: Globe, value: 'Unified', label: 'privacy framework' }
    ],
    narrativeHeading: 'Privacy by design',
    narrative: [
      'Trimly collects only what is required for service execution, support, and compliance.',
      'We do not sell user data and maintain strict controls for operational access.'
    ],
    ctaPanel: {
      title: 'Privacy questions?',
      text: 'Raise a request for data access, correction, consent, or deletion support.',
      primary: { label: 'Raise Privacy Request', to: '/company/privacy-policy' },
      secondary: { label: 'Read Terms', to: '/company/terms-and-conditions' }
    }
  })
};

const customerPages = {
  'contact-us': makePage('customers', {
    seoTitle: 'Contact Trimly Support',
    badge: 'Customers',
    title: 'Contact Us',
    subtitle: 'Reach Trimly support for booking help, account issues, payment clarifications, and service feedback.',
    metrics: [
      { icon: Headset, value: '<15 min', label: 'first response target' },
      { icon: BadgeCheck, value: '98%', label: 'ticket resolution rate' },
      { icon: MessageSquare, value: '24/7', label: 'support channels' }
    ],
    narrativeHeading: 'Support that stays accountable',
    narrative: [
      'Every request is routed to the right team with traceable ownership until closure.',
      'Urgent booking incidents are prioritized to protect same-day service continuity.'
    ],
    ctaPanel: {
      title: 'Need quick help?',
      text: 'Submit your query and our support desk will follow up shortly.',
      primary: { label: 'Create Support Ticket', to: '/customers/contact-us' },
      secondary: { label: 'Read FAQs', to: '/customers/faqs' }
    }
  }),
  'service-areas': makePage('customers', {
    seoTitle: 'Trimly Service Areas',
    badge: 'Customers',
    title: 'Service Areas',
    subtitle: 'Explore active Trimly coverage zones and request expansion in your city or locality.',
    metrics: [
      { icon: MapPin, value: '25+', label: 'active micro-zones' },
      { icon: Globe, value: '8', label: 'city clusters' },
      { icon: TrendingUp, value: 'Weekly', label: 'coverage updates' }
    ],
    narrativeHeading: 'Coverage built for quality',
    narrative: [
      'Trimly activates zones only when fulfillment quality and ETA reliability can be sustained.',
      'New zone requests help our operations team prioritize expansion in high-demand localities.'
    ],
    ctaPanel: {
      title: 'Want Trimly in your area?',
      text: 'Submit your locality and we will notify you as soon as service activation goes live.',
      primary: { label: 'Request Area Activation', to: '/customers/service-areas' },
      secondary: { label: 'Browse Services', to: '/services' }
    },
    formFields: ['fullName', 'email', 'phone', 'city', 'message']
  }),
  faqs: makePage('customers', {
    seoTitle: 'Trimly FAQs',
    badge: 'Customers',
    title: 'FAQs',
    subtitle: 'Find quick answers for slots, services, payments, cancellations, and service expectations.',
    metrics: [
      { icon: CircleHelp, value: '40+', label: 'customer questions answered' },
      { icon: BadgeCheck, value: 'Updated', label: 'monthly' },
      { icon: Headset, value: 'Self-serve', label: 'guidance center' }
    ],
    narrativeHeading: 'Clear answers before booking',
    narrative: [
      'The FAQ library helps customers make confident decisions before they confirm appointments.',
      'If your query is not listed, submit it and our team will provide account-specific guidance.'
    ],
    ctaPanel: {
      title: 'Need a custom answer?',
      text: 'Send your booking details and we will guide you with exact next steps.',
      primary: { label: 'Ask A Question', to: '/customers/faqs' },
      secondary: { label: 'Contact Support', to: '/customers/contact-us' }
    },
    formFields: ['fullName', 'email', 'bookingId', 'message']
  }),
  reviews: makePage('customers', {
    seoTitle: 'Trimly Reviews',
    badge: 'Customers',
    title: 'Reviews',
    subtitle: 'See how customers rate Trimly for punctuality, quality, hygiene, and overall service experience.',
    metrics: [
      { icon: Star, value: '4.8/5', label: 'average rating' },
      { icon: BadgeCheck, value: '7K+', label: 'verified reviews' },
      { icon: TrendingUp, value: '95%', label: 'repeat intent' }
    ],
    narrativeHeading: 'Trust built through real feedback',
    narrative: [
      'Reviews are captured from completed bookings so future customers can rely on authentic service signals.',
      'Quality teams review low-rated sessions to improve operations and training.'
    ],
    ctaPanel: {
      title: 'Share your experience',
      text: 'Your feedback helps us improve and helps other customers book confidently.',
      primary: { label: 'Submit Feedback', to: '/customers/reviews' },
      secondary: { label: 'Book Services', to: '/services' }
    },
    formFields: ['fullName', 'email', 'bookingId', 'rating', 'message']
  })
};

const professionalPages = {
  'join-as-a-stylist': makePage('professionals', {
    seoTitle: 'Join As A Stylist | Trimly',
    badge: 'Professionals',
    title: 'Join as a Stylist',
    subtitle: 'Grow your career with reliable customer demand, structured training, and transparent payout workflows.',
    metrics: [
      { icon: UserPlus, value: '500+', label: 'active professionals' },
      { icon: TrendingUp, value: '30%', label: 'repeat demand trend' },
      { icon: BadgeCheck, value: 'Weekly', label: 'onboarding batches' }
    ],
    narrativeHeading: 'A stronger independent career path',
    narrative: [
      'Trimly helps professionals focus on service excellence while we support booking flow and demand visibility.',
      'Onboarding includes quality checks, workflow training, and city-level operational guidance.'
    ],
    ctaPanel: {
      title: 'Start stylist onboarding',
      text: 'Submit your profile and specialization to begin verification.',
      primary: { label: 'Apply As Stylist', to: '/professionals/join-as-a-stylist' },
      secondary: { label: 'View Training Support', to: '/professionals/training-support' }
    }
  }),
  'partner-with-us': makePage('professionals', {
    seoTitle: 'Partner With Trimly',
    badge: 'Professionals',
    title: 'Partner With Us',
    subtitle: 'Collaborate with Trimly as a salon brand, academy, or service operations partner.',
    metrics: [
      { icon: Handshake, value: '40+', label: 'active partner network' },
      { icon: Globe, value: '8', label: 'cities with partnerships' },
      { icon: TrendingUp, value: '60%', label: 'average partner uplift' }
    ],
    narrativeHeading: 'Partnerships with measurable outcomes',
    narrative: [
      'Trimly partnerships are built on service quality, transparent operations, and shared growth goals.',
      'Partners receive SOP playbooks, onboarding support, and recurring performance reviews.'
    ],
    ctaPanel: {
      title: 'Discuss partnership fit',
      text: 'Share your profile and we will recommend the right collaboration model.',
      primary: { label: 'Send Partnership Request', to: '/professionals/partner-with-us' },
      secondary: { label: 'Explore Business Growth', to: '/professionals/business-growth' }
    },
    formFields: ['fullName', 'company', 'email', 'phone', 'city', 'message']
  }),
  'training-support': makePage('professionals', {
    seoTitle: 'Training Support | Trimly',
    badge: 'Professionals',
    title: 'Training Support',
    subtitle: 'Access recurring training on technical service delivery, hygiene, and client communication standards.',
    metrics: [
      { icon: GraduationCap, value: '120+', label: 'training modules' },
      { icon: BadgeCheck, value: 'Monthly', label: 'skill assessments' },
      { icon: TrendingUp, value: '35%', label: 'quality score uplift' }
    ],
    narrativeHeading: 'Continuous learning, better outcomes',
    narrative: [
      'Training support includes guided tracks for both new and experienced professionals.',
      'Performance and customer feedback are used to personalize coaching recommendations.'
    ],
    ctaPanel: {
      title: 'Upgrade your service standards',
      text: 'Tell us your focus area and we will suggest the right learning track.',
      primary: { label: 'Request Training Plan', to: '/professionals/training-support' },
      secondary: { label: 'Join As Stylist', to: '/professionals/join-as-a-stylist' }
    }
  }),
  'business-growth': makePage('professionals', {
    seoTitle: 'Business Growth | Trimly',
    badge: 'Professionals',
    title: 'Business Growth',
    subtitle: 'Scale your service business using Trimly demand analytics, SOP frameworks, and growth support.',
    metrics: [
      { icon: TrendingUp, value: '2.5x', label: 'growth potential' },
      { icon: BadgeCheck, value: '90%', label: 'quality benchmark' },
      { icon: Globe, value: '8', label: 'growth corridors' }
    ],
    narrativeHeading: 'Scale with data and process clarity',
    narrative: [
      'Trimly helps partners grow sustainably through demand visibility and quality-driven operations.',
      'From solo professionals to multi-zone operators, growth plans are built on practical metrics.'
    ],
    ctaPanel: {
      title: 'Plan your next growth phase',
      text: 'Connect with our growth desk for a practical roadmap.',
      primary: { label: 'Request Growth Consultation', to: '/professionals/business-growth' },
      secondary: { label: 'Partner With Us', to: '/professionals/partner-with-us' }
    },
    formFields: ['fullName', 'company', 'email', 'phone', 'city', 'message']
  })
};

const followPages = {
  instagram: makePage('follow', {
    seoTitle: 'Follow Trimly On Instagram',
    badge: 'Follow Us',
    title: 'Instagram',
    subtitle: 'Discover service highlights, quick tips, and community stories on Trimly Instagram.',
    metrics: [
      { icon: Instagram, value: 'Daily', label: 'stories and reels' },
      { icon: Star, value: 'Top', label: 'service highlights' },
      { icon: UsersRound, value: 'Growing', label: 'beauty community' }
    ],
    narrativeHeading: 'Visual updates from the Trimly ecosystem',
    narrative: [
      'Follow Instagram for short-form content around service outcomes, trends, and customer stories.',
      'The channel is ideal for discovery and inspiration before booking.'
    ],
    ctaPanel: {
      title: 'Join us on Instagram',
      text: 'Follow Trimly for beauty content and real service journeys.',
      primary: { label: 'Open Instagram', to: socialProfiles.instagram.href, external: true },
      secondary: { label: 'Explore YouTube', to: '/follow/youtube' }
    },
    formFields: ['fullName', 'email', 'company', 'message']
  }),
  youtube: makePage('follow', {
    seoTitle: 'Follow Trimly On YouTube',
    badge: 'Follow Us',
    title: 'YouTube',
    subtitle: 'Watch tutorials, explainers, and long-form service guides on the Trimly YouTube channel.',
    metrics: [
      { icon: Youtube, value: 'Weekly', label: 'new videos' },
      { icon: PlayCircle, value: 'In-depth', label: 'service walkthroughs' },
      { icon: GraduationCap, value: 'Learning', label: 'for customers and pros' }
    ],
    narrativeHeading: 'Learn before you book',
    narrative: [
      'YouTube content explains service process, expected outcomes, and expert recommendations.',
      'Professionals can also use the channel for practical improvement tips.'
    ],
    ctaPanel: {
      title: 'Subscribe to Trimly YouTube',
      text: 'Stay updated with expert-led beauty and grooming guidance.',
      primary: { label: 'Open YouTube', to: socialProfiles.youtube.href, external: true },
      secondary: { label: 'View LinkedIn', to: '/follow/linkedin' }
    }
  }),
  linkedin: makePage('follow', {
    seoTitle: 'Follow Trimly On LinkedIn',
    badge: 'Follow Us',
    title: 'LinkedIn',
    subtitle: 'Track Trimly hiring, partnerships, and business growth updates on LinkedIn.',
    metrics: [
      { icon: Linkedin, value: 'Weekly', label: 'company updates' },
      { icon: BriefcaseBusiness, value: 'Careers', label: 'hiring announcements' },
      { icon: TrendingUp, value: 'B2B', label: 'growth insights' }
    ],
    narrativeHeading: 'Professional updates in one place',
    narrative: [
      'LinkedIn is our primary channel for team updates, partner announcements, and expansion stories.',
      'Follow for structured updates relevant to professionals and collaborators.'
    ],
    ctaPanel: {
      title: 'Connect with us on LinkedIn',
      text: 'Follow Trimly to stay informed about jobs, partnerships, and growth.',
      primary: { label: 'Open LinkedIn', to: socialProfiles.linkedin.href, external: true },
      secondary: { label: 'View Careers', to: '/company/careers' }
    }
  }),
  community: makePage('follow', {
    seoTitle: 'Trimly Community',
    badge: 'Follow Us',
    title: 'Community',
    subtitle: 'Be part of Trimly community conversations around grooming, service quality, and beauty careers.',
    metrics: [
      { icon: UsersRound, value: 'Active', label: 'member discussions' },
      { icon: MessageSquare, value: 'Daily', label: 'engagement' },
      { icon: BadgeCheck, value: 'Moderated', label: 'safe environment' }
    ],
    narrativeHeading: 'A community built around better service experiences',
    narrative: [
      'Community spaces help customers and professionals share experiences and learn from each other.',
      'Join official channels to participate in events, Q&A sessions, and support conversations.'
    ],
    ctaPanel: {
      title: 'Join the Trimly community',
      text: 'Connect with fellow members through our official community channel.',
      primary: { label: 'Open Community', to: socialProfiles.community.href, external: true },
      secondary: { label: 'Contact Team', to: '/customers/contact-us' }
    },
    formFields: ['fullName', 'email', 'city', 'message']
  })
};

export const sitePages = {
  company: companyPages,
  customers: customerPages,
  professionals: professionalPages,
  follow: followPages
};

export const sectionMeta = {
  company: { title: 'Company', icon: BriefcaseBusiness },
  customers: { title: 'For Customers', icon: Headset },
  professionals: { title: 'For Professionals', icon: TrendingUp },
  follow: { title: 'Follow Us', icon: ArrowUpRight }
};

export const fieldDefinitions = {
  fullName: { label: 'Full Name', type: 'text', placeholder: 'Enter your full name' },
  company: { label: 'Company / Salon Name', type: 'text', placeholder: 'Enter company or salon name' },
  city: { label: 'City / Locality', type: 'text', placeholder: 'Enter your city or locality' },
  email: { label: 'Email', type: 'email', placeholder: 'Enter your email address' },
  phone: { label: 'Phone Number', type: 'tel', placeholder: 'Enter your phone number' },
  bookingId: { label: 'Booking ID (Optional)', type: 'text', placeholder: 'Example: TRM-2026-001' },
  experience: { label: 'Experience', type: 'text', placeholder: 'Example: 4 years in beauty services' },
  rating: { label: 'Rating (1-5)', type: 'number', placeholder: 'Give a rating between 1 and 5', min: 1, max: 5 },
  message: { label: 'Message', type: 'textarea', placeholder: 'Describe your requirement in detail' }
};

export function resolveSitePage(section, slug) {
  return sitePages[section]?.[slug] || null;
}
