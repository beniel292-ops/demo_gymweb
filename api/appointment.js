/**
 * POST /api/appointment
 * Serverless function (Vercel Node runtime).
 * Validates, throttles, logs. Set APPOINTMENT_WEBHOOK_URL in the project's Environment
 * Variables to forward every submission to Slack / Discord / Make.com.
 */
const hits = new Map();
const WINDOW_MS = 60_000, MAX_PER_WINDOW = 5;

function rateLimited(ip){
  const now = Date.now();
  const rec = hits.get(ip) || { count: 0, start: now };
  if (now - rec.start > WINDOW_MS) { rec.count = 0; rec.start = now; }
  rec.count += 1; hits.set(ip, rec);
  if (hits.size > 500) hits.clear();
  return rec.count > MAX_PER_WINDOW;
}
const clean = (v, max = 1000) => String(v == null ? '' : v).trim().slice(0, max);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow','POST');
    return res.status(405).json({ ok:false, error:'Method not allowed. Use POST.' });
  }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!body || typeof body !== 'object') body = {};

  if (clean(body.website)) return res.status(200).json({ ok:true });   // honeypot

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ ok:false, error:'Too many requests — please call us instead.' });

  const name = clean(body.name, 120), phone = clean(body.phone, 40);
  if (name.length < 2)  return res.status(400).json({ ok:false, error:'Please enter your name.' });
  const digits = phone.replace(/\D/g,'');
  if (digits.length < 10 || digits.length > 15)
    return res.status(400).json({ ok:false, error:'Please enter a phone number we can call back on.' });

  const payload = {
    name, phone,
    type: clean(body.type, 60),
    date: clean(body.date, 80),
    message: clean(body.message, 2000),
    receivedAt: new Date().toISOString(),
    ip, userAgent: clean(req.headers['user-agent'], 200)
  };
  console.log('[appointment]', JSON.stringify(payload));

  const hook = process.env.APPOINTMENT_WEBHOOK_URL;
  if (hook) {
    try {
      await fetch(hook, { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ text: `*[appointment]* \n${JSON.stringify(payload, null, 2)}`, payload }) });
    } catch (err) { console.error('webhook failed:', err && err.message); }
  }
  return res.status(200).json({ ok:true, message:'Received' });
};
