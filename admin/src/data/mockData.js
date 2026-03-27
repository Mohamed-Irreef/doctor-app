// Mock data aligned with mobile MockData.ts
export const DOCTORS = [
  { id: 'd1', name: 'Dr. Ramesh Sharma',  specialization: 'Cardiologist',  experience: '12 Years', rating: 4.9, fee: 1500, hospital: 'Fortis Heart Institute, Delhi',          image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=80&q=80',  status: 'Active',   qualifications: 'MBBS, MD - Cardiology' },
  { id: 'd2', name: 'Dr. Anjali Desai',   specialization: 'Neurologist',   experience: '15 Years', rating: 4.8, fee: 2000, hospital: 'Apollo Neuroscience Center, Mumbai',      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=80&q=80',  status: 'Active',   qualifications: 'MBBS, DM - Neurology' },
  { id: 'd3', name: 'Dr. Priya Patel',    specialization: 'Dermatologist', experience: '8 Years',  rating: 4.7, fee: 800,  hospital: 'SkinCare Plus, Ahmedabad',               image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=80&q=80',  status: 'Active',   qualifications: 'MBBS, MD - Dermatology' },
  { id: 'd4', name: 'Dr. Suresh Kumar',   specialization: 'Pediatrician',  experience: '14 Years', rating: 4.9, fee: 1000, hospital: 'Little Stars Children Hospital, Chennai', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=80&q=80',  status: 'Inactive', qualifications: 'MBBS, MD - Pediatrics' },
  { id: 'd5', name: 'Dr. Vikram Singh',   specialization: 'Psychiatrist',  experience: '10 Years', rating: 4.8, fee: 1200, hospital: 'MindWell Wellness Center, Bengaluru',    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=80&q=80',  status: 'Active',   qualifications: 'MBBS, MD - Psychiatry' },
];

export const DOCTOR_REQUESTS = [
  { id: 'r1', name: 'Dr. Neha Gupta',   specialization: 'Gynecologist',  experience: '9 Years',  hospital: 'Motherhood Hospital, Hyderabad', qualifications: 'MBBS, MD - OBG', status: 'Pending', image: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=80&q=80' },
  { id: 'r2', name: 'Dr. Arun Menon',   specialization: 'Orthopedic',    experience: '11 Years', hospital: 'Bone & Joint Clinic, Kochi',      qualifications: 'MBBS, MS - Ortho', status: 'Pending', image: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&q=80' },
  { id: 'r3', name: 'Dr. Sita Reddy',   specialization: 'Ophthalmologist', experience: '7 Years', hospital: 'Clear Vision Eye Center, Pune', qualifications: 'MBBS, MS - Ophthalmology', status: 'Rejected', image: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=80&q=80' },
];

export const PATIENTS = [
  { id: 'p1', name: 'Mohamed Irreef S', email: 'irreef@gmail.com',      phone: '+91 9361757753', location: 'Chennai',   joinDate: 'Jan 12, 2026', status: 'Active' },
  { id: 'p2', name: 'Ravi Kumar',       email: 'ravi@gmail.com',        phone: '+91 9876543210', location: 'Mumbai',    joinDate: 'Feb 03, 2026', status: 'Active' },
  { id: 'p3', name: 'Priya Sharma',     email: 'priya@gmail.com',       phone: '+91 9443221100', location: 'Delhi',     joinDate: 'Mar 18, 2026', status: 'Active' },
  { id: 'p4', name: 'Arjun Mehta',      email: 'arjun@gmail.com',       phone: '+91 9087654321', location: 'Bengaluru', joinDate: 'Oct 01, 2026', status: 'Inactive' },
  { id: 'p5', name: 'Sunita Verma',     email: 'sunita@gmail.com',      phone: '+91 8000111222', location: 'Hyderabad', joinDate: 'Oct 10, 2026', status: 'Active' },
  { id: 'p6', name: 'Kiran Nair',       email: 'kiran@gmail.com',       phone: '+91 9123456789', location: 'Kochi',     joinDate: 'Oct 15, 2026', status: 'Active' },
];

export const APPOINTMENTS = [
  { id: 'a1', patient: 'Mohamed Irreef S', doctor: 'Dr. Ramesh Sharma', date: 'Oct 27, 2026', time: '10:30 AM', type: 'Video',    status: 'Upcoming',   amount: 1500 },
  { id: 'a2', patient: 'Ravi Kumar',       doctor: 'Dr. Anjali Desai',  date: 'Oct 27, 2026', time: '11:00 AM', type: 'In-person', status: 'Upcoming',  amount: 2000 },
  { id: 'a3', patient: 'Priya Sharma',     doctor: 'Dr. Priya Patel',   date: 'Oct 26, 2026', time: '02:00 PM', type: 'Chat',      status: 'Completed',  amount: 800 },
  { id: 'a4', patient: 'Arjun Mehta',      doctor: 'Dr. Suresh Kumar',  date: 'Oct 25, 2026', time: '09:30 AM', type: 'Video',    status: 'Cancelled',  amount: 1000 },
  { id: 'a5', patient: 'Sunita Verma',     doctor: 'Dr. Vikram Singh',  date: 'Oct 24, 2026', time: '03:00 PM', type: 'In-person', status: 'Completed',  amount: 1200 },
  { id: 'a6', patient: 'Kiran Nair',       doctor: 'Dr. Ramesh Sharma', date: 'Oct 28, 2026', time: '09:00 AM', type: 'Video',    status: 'Upcoming',   amount: 1500 },
];

export const LAB_TESTS = [
  { id: 'l1', name: 'Complete Blood Count', category: 'Hematology',   originalPrice: 600, price: 400, discount: '33%', turnaround: '24 hrs', popular: true },
  { id: 'l2', name: 'Thyroid Profile',      category: 'Endocrinology', originalPrice: 900, price: 650, discount: '28%', turnaround: '48 hrs', popular: true },
  { id: 'l3', name: 'Lipid Profile',        category: 'Biochemistry',  originalPrice: 500, price: 350, discount: '30%', turnaround: '24 hrs', popular: false },
  { id: 'l4', name: 'Diabetes Screening',   category: 'Endocrinology', originalPrice: 400, price: 250, discount: '38%', turnaround: '12 hrs', popular: true },
  { id: 'l5', name: 'Full Body Checkup',    category: 'Preventive',    originalPrice: 2000, price: 1499, discount: '25%', turnaround: '72 hrs', popular: true },
];

export const MEDICINES = [
  { id: 'm1', name: 'Paracetamol 500mg',  category: 'Pain Relief',  price: 50,  stock: 340, prescriptionRequired: false, inStock: true },
  { id: 'm2', name: 'Vitamin C 1000mg',   category: 'Vitamins',     price: 120, stock: 210, prescriptionRequired: false, inStock: true },
  { id: 'm3', name: 'Ibuprofen 400mg',    category: 'Pain Relief',  price: 85,  stock: 180, prescriptionRequired: false, inStock: true },
  { id: 'm4', name: 'Omega-3 Fish Oil',   category: 'Supplements',  price: 220, stock: 95,  prescriptionRequired: false, inStock: true },
  { id: 'm5', name: 'Cetirizine 10mg',    category: 'Allergy',      price: 60,  stock: 0,   prescriptionRequired: false, inStock: false },
  { id: 'm6', name: 'Metformin 500mg',    category: 'Diabetes',     price: 75,  stock: 120, prescriptionRequired: true,  inStock: true },
];

export const ORDERS = [
  { id: 'ORD-001', user: 'Mohamed Irreef S', items: 'Paracetamol × 2', amount: 100, date: 'Oct 26, 2026', status: 'Delivered' },
  { id: 'ORD-002', user: 'Ravi Kumar',       items: 'Vitamin C × 1',   amount: 120, date: 'Oct 26, 2026', status: 'Shipped' },
  { id: 'ORD-003', user: 'Priya Sharma',     items: 'Omega-3 × 1',     amount: 220, date: 'Oct 27, 2026', status: 'Ordered' },
  { id: 'ORD-004', user: 'Arjun Mehta',      items: 'Cetirizine × 3',  amount: 180, date: 'Oct 25, 2026', status: 'Delivered' },
  { id: 'ORD-005', user: 'Sunita Verma',     items: 'Ibuprofen × 2',   amount: 170, date: 'Oct 27, 2026', status: 'Ordered' },
];

export const PAYMENTS = [
  { id: 'PAY-001', user: 'Mohamed Irreef S', type: 'Consultation', amount: 1500, method: 'UPI',        status: 'Paid',    date: 'Oct 27, 2026' },
  { id: 'PAY-002', user: 'Ravi Kumar',       type: 'Lab Test',     amount: 400,  method: 'Card',       status: 'Paid',    date: 'Oct 26, 2026' },
  { id: 'PAY-003', user: 'Priya Sharma',     type: 'Consultation', amount: 800,  method: 'Net Banking', status: 'Pending', date: 'Oct 26, 2026' },
  { id: 'PAY-004', user: 'Arjun Mehta',      type: 'Pharmacy',     amount: 180,  method: 'UPI',        status: 'Paid',    date: 'Oct 25, 2026' },
  { id: 'PAY-005', user: 'Sunita Verma',     type: 'Consultation', amount: 1200, method: 'Card',       status: 'Failed',  date: 'Oct 24, 2026' },
];

export const REVIEWS = [
  { id: 'rv1', doctor: 'Dr. Ramesh Sharma', patient: 'Mohamed Irreef S', rating: 5, comment: 'Excellent doctor! Very thorough and empathetic.', date: 'Oct 20, 2026' },
  { id: 'rv2', doctor: 'Dr. Anjali Desai',  patient: 'Ravi Kumar',       rating: 4, comment: 'Great experience. Explained everything clearly.', date: 'Oct 18, 2026' },
  { id: 'rv3', doctor: 'Dr. Priya Patel',   patient: 'Priya Sharma',     rating: 5, comment: 'My skin improved noticeably after the treatment.', date: 'Oct 15, 2026' },
  { id: 'rv4', doctor: 'Dr. Suresh Kumar',  patient: 'Arjun Mehta',      rating: 3, comment: 'Good doctor but long wait times at the clinic.', date: 'Oct 10, 2026' },
];

export const NOTIFICATIONS = [
  { id: 'n1', title: 'New Doctor Registration', message: 'Dr. Neha Gupta has applied for approval.', type: 'Doctor',       time: '2 hrs ago',  read: false },
  { id: 'n2', title: 'Payment Failed',           message: 'Sunita Verma\'s payment for ₹1,200 failed.', type: 'Payment',   time: '5 hrs ago',  read: false },
  { id: 'n3', title: 'Appointment Cancelled',    message: 'Arjun Mehta cancelled appointment #A4.',   type: 'Appointment', time: '1 day ago',  read: true },
  { id: 'n4', title: 'New Review',               message: 'Dr. Ramesh Sharma received a 5-star review.', type: 'Review',   time: '2 days ago', read: true },
];

export const WEEKLY_BOOKINGS = [
  { day: 'Mon', bookings: 12 }, { day: 'Tue', bookings: 18 }, { day: 'Wed', bookings: 14 },
  { day: 'Thu', bookings: 22 }, { day: 'Fri', bookings: 19 }, { day: 'Sat', bookings: 27 }, { day: 'Sun', bookings: 8 },
];

export const REVENUE_TREND = [
  { month: 'Jun', revenue: 42000 }, { month: 'Jul', revenue: 58000 }, { month: 'Aug', revenue: 51000 },
  { month: 'Sep', revenue: 67000 }, { month: 'Oct', revenue: 74000 }, { month: 'Nov', revenue: 89000 },
];
