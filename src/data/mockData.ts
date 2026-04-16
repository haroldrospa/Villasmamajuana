import villa1 from '@/assets/villa-1.jpg';
import villa2 from '@/assets/villa-2.jpg';
import villa3 from '@/assets/villa-3.jpg';

export interface Villa {
  id: string;
  name: string;
  price: number;
  image: string;
  capacity: number;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    googleMapsUrl: string;
  };
  videoUrl?: string;
  amenities: string[];
  gallery?: string[];
  price_10h?: number;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  discountPercent: number;
  villaId?: string; // null = applies to all
  validFrom: string;
  validTo: string;
  badge: string;
  active: boolean;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  active: boolean;
  validTo: string;
  description: string;
}

export type ReservationStatus = 'pendiente_pago' | 'pago_parcial' | 'confirmada' | 'cancelada' | 'bloqueada';

export interface Reservation {
  id: string;
  villaId: string;
  villaName: string;
  clientName: string;
  clientPhone: string;
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  paymentMethod?: 'transferencia' | 'pago_movil' | 'efectivo';
  receiptImage?: string;
  paymentNote?: string;
  createdAt: string;
  appliedPromotion?: string;
  appliedCoupon?: string;
  originalAmount?: number;
  stay_type?: '10h' | '24h';
}

export type IncomeType = 'Reserva (50%)' | 'Pago restante' | 'Extras' | 'Manual';

export interface Income {
  id: string;
  date: string;
  concept: string;
  amount: number;
  paymentMethod: string;
  client?: string;
  villaId?: string;
  incomeType?: IncomeType;
}

export interface Expense {
  id: string;
  date: string;
  category: 'Limpieza' | 'Mantenimiento' | 'Servicios' | 'Otros';
  description: string;
  amount: number;
  villaId?: string;
}

export const villas: Villa[] = [
  {
    id: 'villa-1',
    name: 'Villa Ceiba',
    price: 250,
    image: villa1,
    capacity: 6,
    description: 'Cabaña de montaña con deck privado y vistas panorámicas.',
    location: {
      lat: 19.0544,
      lng: -70.5261,
      address: 'Jarabacoa, La Vega, República Dominicana',
      googleMapsUrl: 'https://maps.google.com/?q=19.0544,-70.5261',
    },
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    amenities: ['Wi-Fi', 'Cocina', 'Deck privado', 'Vista panorámica', 'BBQ'],
  },
  {
    id: 'villa-2',
    name: 'Villa Canopy',
    price: 320,
    image: villa2,
    capacity: 4,
    description: 'Casa del árbol de lujo rodeada de naturaleza.',
    location: {
      lat: 19.0610,
      lng: -70.5320,
      address: 'Jarabacoa, La Vega, República Dominicana',
      googleMapsUrl: 'https://maps.google.com/?q=19.0610,-70.5320',
    },
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    amenities: ['Wi-Fi', 'Jacuzzi', 'Terraza elevada', 'Hamacas', 'Fogata'],
  },
  {
    id: 'villa-3',
    name: 'Villa Piedra',
    price: 280,
    image: villa3,
    capacity: 8,
    description: 'Villa rústica con terraza privada y comedor al aire libre.',
    location: {
      lat: 19.0480,
      lng: -70.5190,
      address: 'Jarabacoa, La Vega, República Dominicana',
      googleMapsUrl: 'https://maps.google.com/?q=19.0480,-70.5190',
    },
    amenities: ['Wi-Fi', 'Cocina completa', 'Comedor al aire libre', 'Piscina', 'Estacionamiento'],
  },
];

export const promotions: Promotion[] = [
  {
    id: 'promo-1',
    title: '🔥 Oferta de Fin de Semana',
    description: '20% de descuento en todas las villas este fin de semana',
    discountPercent: 20,
    validFrom: '2026-03-13',
    validTo: '2026-03-31',
    badge: '-20%',
    active: true,
  },
  {
    id: 'promo-2',
    title: '🌿 Temporada Verde',
    description: '15% de descuento en Villa Canopy durante marzo',
    discountPercent: 15,
    villaId: 'villa-2',
    validFrom: '2026-03-01',
    validTo: '2026-03-31',
    badge: '-15%',
    active: true,
  },
  {
    id: 'promo-3',
    title: '✨ Estadía Extendida',
    description: '10% de descuento en reservas de 4+ noches',
    discountPercent: 10,
    validFrom: '2026-03-01',
    validTo: '2026-06-30',
    badge: '-10%',
    active: true,
  },
];

export const coupons: Coupon[] = [
  { code: 'MAMAJUANA10', discountPercent: 10, active: true, validTo: '2026-12-31', description: '10% de descuento' },
  { code: 'BIENVENIDO15', discountPercent: 15, active: true, validTo: '2026-06-30', description: '15% de descuento para nuevos clientes' },
  { code: 'VERANO20', discountPercent: 20, active: true, validTo: '2026-08-31', description: '20% de descuento de verano' },
];

export const sampleReservations: Reservation[] = [
  {
    id: 'r1',
    villaId: 'villa-1',
    villaName: 'Villa Ceiba',
    clientName: 'María García',
    clientPhone: '+1 809-555-0101',
    checkIn: '2026-03-20',
    checkOut: '2026-03-23',
    status: 'confirmada',
    totalAmount: 750,
    depositAmount: 375,
    remainingAmount: 0,
    paymentMethod: 'transferencia',
    createdAt: '2026-03-10',
  },
  {
    id: 'r2',
    villaId: 'villa-2',
    villaName: 'Villa Canopy',
    clientName: 'Carlos Méndez',
    clientPhone: '+1 809-555-0202',
    checkIn: '2026-03-25',
    checkOut: '2026-03-28',
    status: 'pago_parcial',
    totalAmount: 960,
    depositAmount: 480,
    remainingAmount: 480,
    paymentMethod: 'pago_movil',
    createdAt: '2026-03-12',
  },
  {
    id: 'r3',
    villaId: 'villa-3',
    villaName: 'Villa Piedra',
    clientName: 'Ana Rodríguez',
    clientPhone: '+1 809-555-0303',
    checkIn: '2026-04-01',
    checkOut: '2026-04-05',
    status: 'pendiente_pago',
    totalAmount: 1120,
    depositAmount: 560,
    remainingAmount: 1120,
    createdAt: '2026-03-15',
  },
];

export const sampleIncomes: Income[] = [
  { id: 'i1', date: '2026-03-10', concept: 'Depósito 50% - Villa Ceiba', amount: 375, paymentMethod: 'Transferencia', client: 'María García', villaId: 'villa-1', incomeType: 'Reserva (50%)' },
  { id: 'i1b', date: '2026-03-18', concept: 'Pago restante - Villa Ceiba', amount: 375, paymentMethod: 'Transferencia', client: 'María García', villaId: 'villa-1', incomeType: 'Pago restante' },
  { id: 'i2', date: '2026-03-12', concept: 'Depósito 50% - Villa Canopy', amount: 480, paymentMethod: 'Pago Móvil', client: 'Carlos Méndez', villaId: 'villa-2', incomeType: 'Reserva (50%)' },
];

export const sampleExpenses: Expense[] = [
  { id: 'e1', date: '2026-03-05', category: 'Limpieza', description: 'Limpieza profunda Villa Ceiba', amount: 80, villaId: 'villa-1' },
  { id: 'e2', date: '2026-03-08', category: 'Mantenimiento', description: 'Reparación deck Villa Piedra', amount: 200, villaId: 'villa-3' },
  { id: 'e3', date: '2026-03-12', category: 'Servicios', description: 'Electricidad mes de marzo', amount: 150 },
];
