import { differenceInDays, parseISO } from 'date-fns';
import { InvoiceData } from '@/components/ReservationInvoice';

export const mapReservationToInvoice = (reservation: any, villas: any[]): InvoiceData => {
  const villa = villas.find(v => v.id === reservation.villa_id);
  
  // Calculate nights
  const start = parseISO(reservation.check_in);
  const end = parseISO(reservation.check_out);
  // For 10h pass day, nights might be 0 but we want to show it carefully
  const nights = reservation.stay_type === '10h' ? 0 : Math.max(1, differenceInDays(end, start));
  
  // Calculate price per unit (night or day)
  const pricePerUnit = reservation.stay_type === '10h' 
    ? (villa?.price_10h || reservation.total_amount)
    : (villa?.price || Math.round(reservation.total_amount / nights));

  return {
    reservationId: reservation.id.toString().split('-')[0].toUpperCase(),
    issueDate: new Date(reservation.created_at || Date.now()).toISOString().split('T')[0],
    clientName: reservation.client_name,
    clientPhone: reservation.client_phone,
    villaName: reservation.villa_name || villa?.name || 'Villa',
    checkIn: reservation.check_in,
    checkOut: reservation.check_out,
    nights: nights,
    pricePerNight: pricePerUnit,
    totalAmount: reservation.total_amount,
    depositAmount: reservation.deposit_amount || (reservation.total_amount * 0.5),
    remainingAmount: reservation.remaining_amount || (reservation.total_amount * 0.5),
    paymentMethod: reservation.payment_method || 'efectivo',
    status: reservation.status,
    appliedPromotion: reservation.applied_promotion,
    appliedCoupon: reservation.applied_coupon,
    originalAmount: reservation.original_amount,
    stayType: reservation.stay_type || '24h'
  };
};
