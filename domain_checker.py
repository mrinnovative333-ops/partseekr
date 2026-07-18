#!/usr/bin/env python3
"""
Domain availability checker for PartSeekr.
Checks WHOIS and DNS to guess availability.
"""

import whois
import dns.resolver
import sys
import json
from datetime import datetime
from whois.exceptions import WhoisDomainNotFoundError

TLDS = ['.com', '.net', '.org', '.co', '.io', '.shop', '.store', '.online']

NAMES = [
    'partseekr',
    'seekparts',
    'partfindr',
    'localparts',
    'okparts',
    'cheapautoparts',
    'autopartlocal',
    'partnearme',
]

PRICING = {
    '.com': {'namecheap': 10.98, 'porkbun': 9.73, 'cloudflare': 9.15},
    '.net': {'namecheap': 12.98, 'porkbun': 11.48, 'cloudflare': 11.06},
    '.org': {'namecheap': 8.98, 'porkbun': 9.73, 'cloudflare': 9.93},
    '.co': {'namecheap': 9.48, 'porkbun': 8.55, 'cloudflare': None},
    '.io': {'namecheap': 34.98, 'porkbun': 34.15, 'cloudflare': 34.15},
    '.shop': {'namecheap': 2.98, 'porkbun': 4.04, 'cloudflare': None},
    '.store': {'namecheap': 2.98, 'porkbun': 3.04, 'cloudflare': None},
    '.online': {'namecheap': 1.98, 'porkbun': 4.04, 'cloudflare': None},
}


def dns_available(domain):
    try:
        dns.resolver.resolve(domain, 'A')
        return False
    except Exception:
        try:
            dns.resolver.resolve(domain, 'NS')
            return False
        except Exception:
            return True


def whois_available(domain):
    try:
        w = whois.whois(domain)
        if w.domain_name is None:
            return True
        if isinstance(w.domain_name, list):
            return False
        return False
    except WhoisDomainNotFoundError:
        return True
    except Exception as e:
        # If WHOIS fails, fall back to DNS
        return dns_available(domain)


def check_all():
    results = []
    for name in NAMES:
        for tld in TLDS:
            domain = name + tld
            available = whois_available(domain)
            pricing = PRICING.get(tld, {})
            cheapest = min([p for p in pricing.values() if p], default=None)
            results.append({
                'domain': domain,
                'available': available,
                'pricing': pricing,
                'cheapest': cheapest,
            })
    return results


def print_report(results):
    print('\nDomain availability for PartSeekr\n')
    print(f"{'Domain':<30} {'Available':<12} {'Cheapest':<10} Registrar")
    print('-' * 70)
    for r in sorted(results, key=lambda x: (not x['available'], x['cheapest'] or 999)):
        status = 'AVAILABLE' if r['available'] else 'TAKEN'
        price = f"${r['cheapest']:.2f}" if r['cheapest'] else 'N/A'
        cheapest_reg = min(r['pricing'], key=lambda k: r['pricing'][k] or 999) if r['cheapest'] else '-'
        print(f"{r['domain']:<30} {status:<12} {price:<10} {cheapest_reg}")

    available = [r for r in results if r['available']]
    print(f"\n{len(available)} available domains found.")


if __name__ == '__main__':
    results = check_all()
    print_report(results)
    with open('domain_report.json', 'w') as f:
        json.dump(results, f, indent=2)
    print('\nSaved full report to domain_report.json')
