import { format } from 'date-fns';

export interface AvailabilityResult {
  isAvailable: boolean;
  hasConflict: boolean;
  isFullyOccupied: boolean;
  statusText: string;
  conflictingVillas: string[];
  conflictingReservations: any[];
}

/**
 * Normalizes a date string or Date object to strict YYYY-MM-DD string
 */
export const toCleanDateStr = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string') {
    return dateInput.split('T')[0].trim();
  }
  try {
    return format(dateInput, 'yyyy-MM-dd');
  } catch (e) {
    return '';
  }
};

/**
 * Checks if a requested date range conflicts with existing reservations.
 * 
 * @param reservations - Array of reservations from Supabase
 * @param selectedVillaIdOrName - Villa ID or Villa Name or 'todas'
 * @param checkInStr - Requested check-in date (YYYY-MM-DD)
 * @param checkOutStr - Requested check-out date (YYYY-MM-DD)
 * @param allVillas - List of all registered villas
 */
export function checkRangeAvailability(
  reservations: any[] | undefined | null,
  selectedVillaIdOrName: string | null | undefined,
  checkInStr: string,
  checkOutStr: string,
  allVillas: any[] = []
): AvailabilityResult {
  if (!checkInStr) {
    return {
      isAvailable: true,
      hasConflict: false,
      isFullyOccupied: false,
      statusText: '',
      conflictingVillas: [],
      conflictingReservations: []
    };
  }

  const reqIn = toCleanDateStr(checkInStr);
  const reqOut = checkOutStr ? toCleanDateStr(checkOutStr) : reqIn;

  if (!reqIn) {
    return {
      isAvailable: true,
      hasConflict: false,
      isFullyOccupied: false,
      statusText: '',
      conflictingVillas: [],
      conflictingReservations: []
    };
  }

  if (!reservations || reservations.length === 0) {
    return {
      isAvailable: true,
      hasConflict: false,
      isFullyOccupied: false,
      statusText: '¡Fechas disponibles!',
      conflictingVillas: [],
      conflictingReservations: []
    };
  }

  // Filter out cancelled reservations (cancelled reservations freed up the villa)
  const activeReservations = reservations.filter(r => r.status !== 'cancelada');

  const conflictingReservations: any[] = [];
  const conflictingVillasMap = new Map<string, string>(); // villa_id -> villa_name

  for (const res of activeReservations) {
    if (!res.check_in) continue;
    
    const resIn = toCleanDateStr(res.check_in);
    const resOut = res.check_out ? toCleanDateStr(res.check_out) : resIn;
    
    const resVillaId = res.villa_id || '';
    const resVillaName = res.villa_name || 'Villa';

    // If user selected a specific villa (not 'todas')
    if (selectedVillaIdOrName && selectedVillaIdOrName !== 'todas') {
      const matchId = resVillaId && resVillaId === selectedVillaIdOrName;
      const matchName = resVillaName && resVillaName.toLowerCase().includes(selectedVillaIdOrName.toLowerCase());
      const matchVillaNameInId = selectedVillaIdOrName && selectedVillaIdOrName.toLowerCase().includes(resVillaName.toLowerCase());

      if (!matchId && !matchName && !matchVillaNameInId) {
        continue;
      }
    }

    // Determine date overlap
    let overlap = false;

    if (reqIn === reqOut && resIn === resOut) {
      overlap = (reqIn === resIn);
    } else if (reqIn === reqOut) {
      overlap = (reqIn >= resIn && reqIn < resOut);
    } else if (resIn === resOut) {
      overlap = (resIn >= reqIn && resIn < reqOut);
    } else {
      // Standard range overlap: reqIn < resOut AND reqOut > resIn
      overlap = (reqIn < resOut && reqOut > resIn);
    }

    if (overlap) {
      conflictingReservations.push(res);
      conflictingVillasMap.set(resVillaId || resVillaName, resVillaName);
    }
  }

  const conflictingVillas = Array.from(conflictingVillasMap.values());
  const hasConflict = conflictingVillas.length > 0;

  // Determine if ALL villas are occupied when 'todas' is selected
  let isFullyOccupied = hasConflict;
  if (selectedVillaIdOrName === 'todas' && allVillas.length > 0) {
    const occupiedVillaIdsOrNames = new Set<string>();
    conflictingReservations.forEach(r => {
      if (r.villa_id) occupiedVillaIdsOrNames.add(r.villa_id);
      if (r.villa_name) occupiedVillaIdsOrNames.add(r.villa_name);
    });

    isFullyOccupied = allVillas.every(v => 
      occupiedVillaIdsOrNames.has(v.id) || occupiedVillaIdsOrNames.has(v.name)
    );
  }

  let statusText = '';
  if (isFullyOccupied) {
    if (selectedVillaIdOrName && selectedVillaIdOrName !== 'todas') {
      statusText = `Sin disponibilidad para ${conflictingVillas[0] || 'esta villa'}`;
    } else {
      statusText = 'Sin disponibilidad en ninguna villa para estas fechas';
    }
  } else if (hasConflict) {
    statusText = `Ocupada: ${conflictingVillas.join(', ')}`;
  } else {
    statusText = '¡Fechas disponibles!';
  }

  return {
    isAvailable: !isFullyOccupied,
    hasConflict,
    isFullyOccupied,
    statusText,
    conflictingVillas,
    conflictingReservations
  };
}
