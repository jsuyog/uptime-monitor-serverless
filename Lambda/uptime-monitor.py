import json
import time
import os
import ssl
import socket
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timezone

# CORS headers added to every response
CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
}

def make_response(status_code, body: dict):
    return {
        'statusCode': status_code,
        'headers': CORS_HEADERS,
        'body': json.dumps(body)
    }

def check_ssl(hostname, port=443):
    """
    Check SSL certificate validity and expiry for a given hostname.
    Returns a dict with: valid, days_left, expires, issuer, expired, error
    """
    ctx = ssl.create_default_context()
    try:
        conn = socket.create_connection((hostname, port), timeout=8)
        with ctx.wrap_socket(conn, server_hostname=hostname) as s:
            cert = s.getpeercert()
            exp_str  = cert['notAfter']   # e.g. 'Jun  5 12:00:00 2026 GMT'
            exp_dt   = datetime.strptime(exp_str, '%b %d %H:%M:%S %Y %Z').replace(tzinfo=timezone.utc)
            days_left = (exp_dt - datetime.now(timezone.utc)).days
            issuer   = dict(x[0] for x in cert.get('issuer', []))
            subject  = dict(x[0] for x in cert.get('subject', []))
            return {
                'valid':     True,
                'days_left': days_left,
                'expires':   exp_dt.strftime('%Y-%m-%d'),
                'issuer':    issuer.get('organizationName', 'Unknown'),
                'domain':    subject.get('commonName', hostname),
                'expired':   days_left < 0,
                'error':     None
            }
    except ssl.SSLCertVerificationError as e:
        return {'valid': False, 'days_left': None, 'expires': None,
                'issuer': None, 'domain': hostname, 'expired': None,
                'error': f'Certificate verification failed: {str(e)}'}
    except ssl.SSLError as e:
        return {'valid': False, 'days_left': None, 'expires': None,
                'issuer': None, 'domain': hostname, 'expired': None,
                'error': f'SSL error: {str(e)}'}
    except socket.timeout:
        return {'valid': False, 'days_left': None, 'expires': None,
                'issuer': None, 'domain': hostname, 'expired': None,
                'error': 'SSL check timed out'}
    except Exception as e:
        return {'valid': False, 'days_left': None, 'expires': None,
                'issuer': None, 'domain': hostname, 'expired': None,
                'error': str(e)}

def lambda_handler(event, context):
    # Handle CORS preflight
    if event.get('httpMethod') == 'OPTIONS':
        return make_response(200, {})

    params = event.get('queryStringParameters') or {}
    url    = params.get('url', '').strip()
    location = params.get('location', 'default')

    if not url:
        return make_response(400, {'error': 'Missing URL parameter'})

    # Normalize URL
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url

    # Extract hostname for SSL check
    parsed   = urllib.parse.urlparse(url)
    hostname = parsed.hostname or ''

    # ----------------------------------------------------------------
    # ScrapingBee proxy for geo-located pings
    # Store key in Lambda env vars: SCRAPINGBEE_API_KEY
    # ----------------------------------------------------------------
    SCRAPINGBEE_API_KEY = os.environ.get('SCRAPINGBEE_API_KEY', '')
    country_map = {
        'us-east':       'us',
        'us-west':       'us',
        'eu-west':       'gb',
        'eu-central':    'de',
        'asia-south':    'in',
        'asia-east':     'sg',
        'south-america': 'br',
        'australia':     'au'
    }
    use_proxy = location != 'default' and bool(SCRAPINGBEE_API_KEY)
    country   = country_map.get(location, 'in')

    start = time.time()

    # ── HTTP reachability check ──────────────────────────────────────
    try:
        if use_proxy:
            qs = urllib.parse.urlencode({
                'api_key':      SCRAPINGBEE_API_KEY,
                'url':          url,
                'country_code': country,
                'render_js':    'false',
            })
            req = urllib.request.Request(
                f'https://app.scrapingbee.com/api/v1/?{qs}',
                headers={'User-Agent': 'UptimeMonitor/1.0'}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                status_code = resp.status
        else:
            req = urllib.request.Request(
                url,
                method='HEAD',
                headers={'User-Agent': 'UptimeMonitor/1.0'}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                status_code = resp.status

        latency_ms  = round((time.time() - start) * 1000, 2)
        http_status = 'Success' if status_code < 400 else 'Failure'

    except urllib.error.HTTPError as e:
        latency_ms  = round((time.time() - start) * 1000, 2)
        status_code = e.code
        http_status = 'Failure' if e.code >= 400 else 'Success'

    except urllib.error.URLError as e:
        latency_ms  = None
        status_code = None
        http_status = 'Failure'

    except Exception as e:
        latency_ms  = None
        status_code = None
        http_status = 'Failure'

    # ── SSL check (only for https:// URLs) ──────────────────────────
    ssl_info = None
    if parsed.scheme == 'https' and hostname:
        ssl_info = check_ssl(hostname)

    return make_response(200, {
        'status':     http_status,
        'code':       status_code,
        'latency_ms': latency_ms,
        'location':   location,
        'url':        url,
        'ssl':        ssl_info      # null for http:// sites
    })