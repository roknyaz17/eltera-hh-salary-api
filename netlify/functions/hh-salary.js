const AREA_MAP = {
  'москва': '1',
  'санкт-петербург': '2',
  'спб': '2',
  'екатеринбург': '3',
  'новосибирск': '4',
  'казань': '88',
  'ульяновск': '98',
  'россия': '113'
};

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(body)
  };
}

function normalizeSalary(salary) {
  if (!salary || salary.currency !== 'RUR') return null;

  const from = salary.from || 0;
  const to = salary.to || 0;

  let value = null;
  if (from && to) value = Math.round((from + to) / 2);
  else if (from) value = from;
  else if (to) value = to;

  if (!value) return null;

  return salary.gross ? Math.round(value * 0.87) : value;
}

function median(values) {
  if (!values.length) return null;

  const sorted = values.sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

module.exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const vacancyName = body.vacancyName;
    const region = body.region;

    if (!vacancyName || !region) {
      return json(400, { error: 'vacancyName and region are required' });
    }

    const area = AREA_MAP[String(region).trim().toLowerCase()] || '113';

    const url = new URL('https://api.hh.ru/vacancies');
    url.searchParams.set('text', vacancyName);
    url.searchParams.set('area', area);
    url.searchParams.set('only_with_salary', 'true');
    url.searchParams.set('currency', 'RUR');
    url.searchParams.set('per_page', '50');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Eltera salary calculator / knyazev.eltera@gmail.com'
      }
    });

    if (!response.ok) {
      return json(502, {
        error: 'HH API error',
        status: response.status
      });
    }

    const data = await response.json();

    const salaries = (data.items || [])
      .map(item => normalizeSalary(item.salary))
      .filter(Boolean);

    return json(200, {
      averageSalary: median(salaries),
      source: 'hh.ru',
      vacancyName,
      region,
      vacanciesUsed: salaries.length
    });
  } catch (error) {
    return json(500, {
      error: 'Internal server error'
    });
  }
};
