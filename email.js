import { Resend } from 'resend';
import { ORIGIN, DESTINATION } from './fetch.js';

const BRAND_BLUE = '#3043aa';
const CARD_BG = '#f2f2f7';
const TEXT_GRAY = '#4b4b4b';
const FONT_STACK = "'Helvetica Neue', Helvetica, Arial, sans-serif";

const LOGO_URL = 'https://raw.githubusercontent.com/velask2/honey/main/assets/logo.png';

const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£' };

function formatPrice(deal) {
  const symbol = CURRENCY_SYMBOLS[deal.currency] ?? `${deal.currency} `;
  return `${deal.amount.toFixed(2)} ${symbol}`;
}

function googleFlightsUrl(deal) {
  const query = `Flights from ${ORIGIN} to ${DESTINATION} on ${deal.departureDate} through ${deal.returnDate}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`;
}

function formatDeal(deal) {
  return `
  <tr>
    <td style="padding:0 0 24px 0;">
      <a href="${googleFlightsUrl(deal)}" style="display:block;text-decoration:none;color:inherit;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CARD_BG};border-radius:24px;">
          <tr>
            <td style="padding:32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-family:${FONT_STACK};font-size:16px;color:#000000;padding-bottom:12px;">
                    ${deal.departureDate} &nbsp;&rarr;&nbsp; ${deal.returnDate}
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:12px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-family:${FONT_STACK};font-size:32px;font-weight:700;color:#000000;">
                          ${deal.airline}
                        </td>
                        <td style="font-family:${FONT_STACK};font-size:32px;font-weight:700;color:#000000;text-align:right;white-space:nowrap;">
                          ${formatPrice(deal)}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="font-family:${FONT_STACK};font-size:16px;color:${TEXT_GRAY};">
                    ${deal.reason}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </a>
    </td>
  </tr>`;
}

export function buildHtml(deals) {
  const header = `
  <tr>
    <td style="text-align:center;padding:0 0 32px 0;">
      <img src="${LOGO_URL}" width="200" alt="Honey" style="display:block;margin:0 auto 8px auto;" />
      <div style="font-family:${FONT_STACK};font-size:32px;font-weight:700;color:${BRAND_BLUE};">
        ${ORIGIN} &rarr; ${DESTINATION}
      </div>
    </td>
  </tr>`;

  const body =
    deals.length > 0
      ? deals.map(formatDeal).join('')
      : `
  <tr>
    <td style="padding:32px;background:${CARD_BG};border-radius:24px;text-align:center;font-family:${FONT_STACK};font-size:16px;color:${TEXT_GRAY};">
      No standout deals today for ${ORIGIN} &rarr; ${DESTINATION}.
    </td>
  </tr>`;

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          ${header}
          ${body}
        </table>
      </td>
    </tr>
  </table>`;
}

export async function sendDealsEmail(deals) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set');
  }
  if (!process.env.TO_EMAIL) {
    throw new Error('TO_EMAIL is not set');
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: 'honey <onboarding@resend.dev>',
    to: process.env.TO_EMAIL,
    subject:
      deals.length > 0
        ? `${ORIGIN}→${DESTINATION}: ${deals.length} deal${deals.length > 1 ? 's' : ''} worth a look`
        : `${ORIGIN}→${DESTINATION}: nothing special today`,
    html: buildHtml(deals),
  });
}
