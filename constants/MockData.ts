// Static Mock Data — Rich & Comprehensive, Localized to India
import type { Article, Doctor, LabTest, Medicine } from '../types';

export const CATEGORIES = [
  { id: '1', name: 'Cardiologist', icon: 'heart', color: '#FEE2E2', iconColor: '#EF4444' },
  { id: '2', name: 'Dentist', icon: 'smile', color: '#E0F2FE', iconColor: '#0EA5E9' },
  { id: '3', name: 'Dermatologist', icon: 'sun', color: '#FEF3C7', iconColor: '#F59E0B' },
  { id: '4', name: 'Neurologist', icon: 'activity', color: '#F3E8FF', iconColor: '#A855F7' },
  { id: '5', name: 'Pediatrics', icon: 'users', color: '#DCFCE7', iconColor: '#16A34A' },
  { id: '6', name: 'Orthopedic', icon: 'zap', color: '#FEF9C3', iconColor: '#CA8A04' },
  { id: '7', name: 'Eye Care', icon: 'eye', color: '#CFFAFE', iconColor: '#0891B2' },
  { id: '8', name: 'Psychiatry', icon: 'brain', color: '#FCE7F3', iconColor: '#DB2777' },
];

export const DOCTORS: Doctor[] = [
  {
    id: 'd1',
    name: 'Dr. Ramesh Sharma',
    specialization: 'Cardiologist',
    experience: '12 Years',
    rating: 4.9,
    reviews: 124,
    fee: 1500,
    hospital: 'Fortis Heart Institute, Delhi',
    about: 'Dr. Ramesh Sharma is a leading cardiologist with over a decade of experience. He has completed 500+ successful cardiac procedures and is known for his patient-first approach.',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    availableSlots: ['09:00 AM', '10:30 AM', '01:00 PM', '03:30 PM', '05:00 PM'],
    qualifications: ['MBBS', 'MD - Cardiology', 'DM'],
  },
  {
    id: 'd2',
    name: 'Dr. Anjali Desai',
    specialization: 'Neurologist',
    experience: '15 Years',
    rating: 4.8,
    reviews: 89,
    fee: 2000,
    hospital: 'Apollo Neuroscience Center, Mumbai',
    about: 'Dr. Desai is a highly regarded neurologist specializing in movement disorders and epilepsy. Her research has been published in top medical journals worldwide.',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    availableSlots: ['08:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'],
    qualifications: ['MBBS', 'DM - Neurology'],
  },
  {
    id: 'd3',
    name: 'Dr. Priya Patel',
    specialization: 'Dermatologist',
    experience: '8 Years',
    rating: 4.7,
    reviews: 210,
    fee: 800,
    hospital: 'SkinCare Plus, Ahmedabad',
    about: 'Dr. Patel is passionate about skincare and treats a wide array of skin conditions with the latest techniques including laser therapy and advanced cosmetic procedures.',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    availableSlots: ['10:00 AM', '12:00 PM', '02:00 PM', '05:00 PM'],
    qualifications: ['MBBS', 'MD - Dermatology'],
  },
  {
    id: 'd4',
    name: 'Dr. Suresh Kumar',
    specialization: 'Pediatrician',
    experience: '14 Years',
    rating: 4.9,
    reviews: 316,
    fee: 1000,
    hospital: 'Little Stars Children Hospital, Chennai',
    about: 'Dr. Kumar is a beloved pediatrician known for his gentle approach with children. He specializes in newborn care and childhood immunization programs.',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    availableSlots: ['09:30 AM', '11:00 AM', '01:30 PM', '04:00 PM'],
    qualifications: ['MBBS', 'MD - Pediatrics'],
  },
  {
    id: 'd5',
    name: 'Dr. Vikram Singh',
    specialization: 'Psychiatrist',
    experience: '10 Years',
    rating: 4.8,
    reviews: 178,
    fee: 1200,
    hospital: 'MindWell Wellness Center, Bengaluru',
    about: 'Dr. Singh specializes in anxiety, depression, and trauma-informed care. He uses a holistic, evidence-based approach to mental wellness therapy.',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    availableSlots: ['10:00 AM', '01:00 PM', '03:00 PM'],
    qualifications: ['MBBS', 'MD - Psychiatry'],
  },
];

export const ARTICLES: Article[] = [
  {
    id: 'a1',
    title: '5 Tips for Heart Health',
    description: 'Protect your heart with these simple daily habits, from eating right to moving more.',
    image: 'https://picsum.photos/seed/article1/400/400',
    readTime: '5 min read',
  },
  {
    id: 'a2',
    title: 'Managing Stress at Work',
    description: 'Learn how to keep stress levels low even during the most challenging work days.',
    image: 'https://picsum.photos/seed/article2/400/400',
    readTime: '4 min read',
  },
  {
    id: 'a3',
    title: 'The Importance of Sleep',
    description: 'Why 8 hours of quality sleep is crucial for your immune system and mental focus.',
    image: 'https://picsum.photos/seed/article3/400/400',
    readTime: '6 min read',
  },
];

export const LAB_TESTS: LabTest[] = [
  { id: 'l1', name: 'Complete Blood Count', originalPrice: 600, price: 400, popular: true, turnaround: '24 hrs', image: 'https://picsum.photos/seed/lab1/400/400' },
  { id: 'l2', name: 'Thyroid Profile', originalPrice: 900, price: 650, popular: true, turnaround: '48 hrs', image: 'https://picsum.photos/seed/lab2/400/400' },
  { id: 'l3', name: 'Lipid Profile', originalPrice: 500, price: 350, popular: false, turnaround: '24 hrs', image: 'https://picsum.photos/seed/lab3/400/400' },
  { id: 'l4', name: 'Diabetes Screening', originalPrice: 400, price: 250, popular: true, turnaround: '12 hrs', image: 'https://picsum.photos/seed/lab4/400/400' },
  { id: 'l5', name: 'Full Body Checkup', originalPrice: 2000, price: 1499, popular: true, turnaround: '72 hrs', image: 'https://picsum.photos/seed/lab5/400/400' },
];

export const MEDICINES: Medicine[] = [
  { id: 'm1', name: 'Paracetamol 500mg', price: 50.00, image: 'https://picsum.photos/seed/med1/400/400', category: 'Pain Relief', inStock: true },
  { id: 'm2', name: 'Vitamin C 1000mg', price: 120.00, image: 'https://picsum.photos/seed/med2/400/400', category: 'Vitamins', inStock: true },
  { id: 'm3', name: 'Ibuprofen 400mg', price: 85.00, image: 'https://picsum.photos/seed/med3/400/400', category: 'Pain Relief', inStock: true },
  { id: 'm4', name: 'Omega-3 Fish Oil', price: 220.00, image: 'https://picsum.photos/seed/med4/400/400', category: 'Supplements', inStock: true },
  { id: 'm5', name: 'Cetirizine 10mg', price: 60.00, image: 'https://picsum.photos/seed/med5/400/400', category: 'Allergy', inStock: false },
];

export const UPCOMING_APPOINTMENTS = [
  {
    id: 'appt1',
    doctor: DOCTORS[0],
    date: 'Oct 24, 2026',
    time: '10:30 AM',
    status: 'Upcoming' as const,
    type: 'Video' as const,
  },
  {
    id: 'appt2',
    doctor: DOCTORS[1],
    date: 'Oct 28, 2026',
    time: '11:00 AM',
    status: 'Pending' as const,
    type: 'In-person' as const,
  },
];

export const COMPLETED_APPOINTMENTS = [
  {
    id: 'appt3',
    doctor: DOCTORS[2],
    date: 'Sep 10, 2026',
    time: '02:00 PM',
    status: 'Completed' as const,
    type: 'Chat' as const,
  },
];

export const AD_BANNERS = [
  {
    id: 'ad1',
    title: 'MediCare Plus',
    subtitle: 'Comprehensive health insurance from ₹2900/mo',
    image: 'https://picsum.photos/seed/ad1/800/400',
    badge: 'Insurance',
  },
  {
    id: 'ad2',
    title: 'Apollo Hospital',
    subtitle: 'World-class cardiac care. Free OPD this weekend.',
    image: 'https://picsum.photos/seed/ad2/800/400',
    badge: 'Hospital',
  },
];

export const TRUST_HIGHLIGHTS = [
  { id: '1', value: '1000+', label: 'Verified Doctors', icon: 'shield-check', color: '#DBEAFE', iconColor: '#2563EB' },
  { id: '2', value: '24/7', label: 'Support Available', icon: 'headphones', color: '#DCFCE7', iconColor: '#16A34A' },
  { id: '3', value: '50K+', label: 'Happy Patients', icon: 'smile', color: '#FEF3C7', iconColor: '#D97706' },
];

export const HEALTH_REMINDERS = [
  { id: 'r1', title: 'Take Vitamin C', time: '08:00 AM', done: false },
  { id: 'r2', title: 'Annual Checkup Due', time: 'Nov 5, 2026', done: false },
];

export const RECENT_ACTIVITY = [
  { id: 'ra1', title: 'Consultation with Dr. Priya Patel', subtitle: 'Sep 10, 2026 · Prescription issued', icon: 'stethoscope' },
  { id: 'ra2', title: 'Blood Test Report Uploaded', subtitle: 'Sep 08, 2026 · PDF · 1.2 MB', icon: 'file-text' },
];
