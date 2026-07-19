import { setTimeout as sleep } from 'node:timers/promises';

const DUFFEL_API_URL = 'https://api.duffel.com/air/offer_requests';
export const ORIGIN = 'MAD';
export const DESTINATION = 'MIA';
const TRIP_LENGTH_DAYS = 7; // length of stay assumed for each round trip
const SAMPLE_COUNT = 10; // number of departure dates to check per run
const SAMPLE_WINDOW_DAYS = 90; // spread samples across the next ~3 months

function sampleDepartureDates() {
  const dates = [];
  const stepDays = Math.floor(SAMPLE_WINDOW_DAYS / SAMPLE_COUNT);
  const today = new Date();
  for (let i = 1; i <= SAMPLE_COUNT; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i * stepDays);
    dates.push(d.toISOString().slice(0, 10));
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
      const cheapest = lowestFare(offers);
      if (cheapest) {
        fares.push({ departureDate, returnDate, ...cheapest });
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
