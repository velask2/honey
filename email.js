import { Resend } from 'resend';

function formatDeal(deal) {
  return `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;">
        <strong>${deal.departureDate} &rarr; ${deal.returnDate}</strong><br/>
        <span style="color:#555;">${deal.airline}</span>
      </td>
      <td style="padding:12px 16px;border-bottom:1px solid #eee;text-align:right;">
        <strong>${deal.amount} ${deal.currency}</strong>
      </td>
    </tr>
    <tr>
      <td colspan="2" style="padding:0 16px 12px 16px;border-bottom:1px solid #eee;color:#777;font-size:14px;">
        ${deal.reason}
      </td>
    </tr>`;
}

function buildHtml(deals) {
  if (deals.length === 0) {
    return '<p>No standout deals today for MAD &rarr; MIA.</p>';
  }
  return `
  <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
    <h2>MAD &rarr; MIA — today's best deals</h2>
    <table style="width:100%;border-collapse:collapse;">
      ${deals.map(formatDeal).join('')}
    </table>
  </div>`;
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
        ? `MAD→MIA: ${deals.length} deal${deals.length > 1 ? 's' : ''} worth a look`
        : 'MAD→MIA: nothing special today',
    html: buildHtml(deals),
  });
}
