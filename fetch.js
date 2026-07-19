import { setTimeout as sleep } from 'node:timers/promises';

const DUFFEL_API_URL = 'https://api.duffel.com/air/offer_requests';
export const ORIGIN = 'MAD';
export const DESTINATION = 'MIA';
const TRIP_LENGTH_DAYS = 15; // length of stay for each round trip

// Departure dates to check — every date in this range gets its own search.
// Currently set to land in Miami for Christmas.
const SEARCH_START_DATE = '2026-12-18';
const SEARCH_END_DATE = '2026-12-24';

// Only keep offers whose outbound flight lands in Miami by this local
// date/time at the latest — i.e. the morning of Dec 24.
const LATEST_ARRIVAL = '2026-12-24T12:00:00';

function sampleDepartureDates() {
  const dates = [];
  const current = new Date(SEARCH_START_DATE);
  const end = new Date(SEARCH_END_DATE);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function requestOffers(departureDate, returnDate) {
  const body = {
    data: {
      slices: [
        { origin: ORIGIN, destination: DESTINATION, departure_date: departureDate },
        { origin: DESTINATION, destination: ORIGIN, departure_date: returnDate },
      ],
      passengers: [{ type: 'adult' }],
      cabin_class: 'economy',
    },
  };

  const res = await fetch(`${DUFFEL_API_URL}?return_offers=true`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.DUFFEL_API_KEY}`,
      'Duffel-Version': 'v2',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Duffel request failed for ${departureDate}: ${res.status} ${text}`);
  }

  const json = await res.json();
  return json.data?.offers ?? [];
}

function arrivesInTime(offer) {
  const outboundSlice = offer.slices[0];
  const lastSegment = outboundSlice.segments[outboundSlice.segments.length - 1];
  return lastSegment.arriving_at <= LATEST_ARRIVAL;
}

function lowestFare(offers) {
  if (offers.length === 0) return null;
  return offers.reduce(
    (lowest, offer) => {
      const amount = parseFloat(offer.total_amount);
      return amount < lowest.amount
        ? { amount, currency: offer.total_currency, airline: offer.owner?.name ?? 'unknown' }
        : lowest;
    },
    { amount: Infinity, currency: null, airline: null },
  );
}

export async function fetchFares() {
  if (!process.env.DUFFEL_API_KEY) {
    throw new Error('DUFFEL_API_KEY is not set');
  }

  const departureDates = sampleDepartureDates();
  const fares = [];

  for (const departureDate of departureDates) {
    const returnDate = addDays(departureDate, TRIP_LENGTH_DAYS);
    try {
      const offers = await requestOffers(departureDate, returnDate);
      const eligible = offers.filter(arrivesInTime);
      const cheapest = lowestFare(eligible);
      if (cheapest) {
        fares.push({ departureDate, returnDate, ...cheapest });
      } else if (offers.length > 0) {
        console.warn(`No offers for ${departureDate} arrive by ${LATEST_ARRIVAL}`);
      } else {
        console.warn(`No offers found for ${departureDate}`);
      }
    } catch (err) {
      console.error(err.message);
    }
    await sleep(300); // be polite to the API between requests
  }

  return fares;
}
