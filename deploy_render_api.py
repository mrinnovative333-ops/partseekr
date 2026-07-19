#!/usr/bin/env python3
"""Deploy PartSeekr using GitHub API and Render API. Reads env vars."""
import os, json, subprocess, sys, time, urllib.request, urllib.error

GH_USER = os.environ.get('GITHUB_USER')
GH_TOKEN = os.environ.get('GITHUB_TOKEN')
RENDER_KEY = os.environ.get('RENDER_API_KEY')
PROJECT = r'C:\Users\bidbu\projects\partseekr'
REPO = 'partseekr'


def load_stripe():
    with open(os.path.join(PROJECT, '.env')) as f:
        for line in f:
            if line.startswith('STRIPE_RESTRICTED_KEY'):
                return line.split('=', 1)[1].strip()
    raise RuntimeError('STRIPE_RESTRICTED_KEY not in .env')


def github_api(path, method='GET', data=None):
    url = 'https://api.github.com' + path
    headers = {
        'Authorization': 'token ' + GH_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
    }
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        print('GitHub API error', e.code, e.read().decode())
        raise


def render_api(path, method='GET', data=None):
    url = 'https://api.render.com/v1' + path
    headers = {
        'Authorization': 'Bearer ' + RENDER_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        print('Render API error', e.code, e.read().decode())
        raise


def ensure_repo():
    print('Ensuring GitHub repo exists...')
    try:
        status, repo = github_api(f'/repos/{GH_USER}/{REPO}')
        print('Repo exists:', repo['html_url'])
        return repo['clone_url']
    except urllib.error.HTTPError as e:
        if e.code == 404:
            status, repo = github_api('/user/repos', 'POST', {
                'name': REPO,
                'description': 'PartSeekr auto parts marketplace',
                'private': False,
                'auto_init': False,
            })
            print('Created repo:', repo['html_url'])
            return repo['clone_url']
        raise


def push_code():
    print('Pushing code...')
    auth_url = f'https://{GH_TOKEN}@github.com/{GH_USER}/{REPO}.git'
    subprocess.run('git remote remove origin || true', cwd=PROJECT, shell=True, check=False)
    subprocess.run(['git', 'remote', 'add', 'origin', auth_url], cwd=PROJECT, check=True)
    subprocess.run(['git', 'branch', '-M', 'main'], cwd=PROJECT, check=True)
    subprocess.run(['git', 'push', '-u', 'origin', 'main', '--force'], cwd=PROJECT, check=True)
    print('Pushed.')


def get_render_owner():
    status, owners = render_api('/owners')
    for owner in owners:
        o = owner.get('owner', owner)
        if not o.get('suspended', False):
            return o['id']
    raise RuntimeError('No owner found')


def find_service():
    owner_id = get_render_owner()
    status, svcs = render_api(f'/services?ownerId={owner_id}&limit=100')
    for s in svcs:
        svc = s.get('service', s)
        if svc.get('name') == REPO or svc.get('slug') == REPO:
            return svc
    return None


def create_service(owner_id, stripe_key):
    print('Creating Render service...')
    status, svc = render_api('/services', 'POST', {
        'type': 'web_service',
        'name': REPO,
        'ownerId': owner_id,
        'repo': f'https://github.com/{GH_USER}/{REPO}',
        'branch': 'main',
        'runtime': 'node',
        'plan': 'starter',
        'region': 'oregon',
        'buildFilter': None,
        'envVars': [
            {'key': 'STRIPE_RESTRICTED_KEY', 'value': stripe_key},
            {'key': 'SITE_URL', 'value': 'https://www.partseekr.online'},
        ],
        'serviceDetails': {
            'buildCommand': '',
            'startCommand': 'node server.js',
            'publishPath': '.',
        },
    })
    return svc


def update_env_vars(service_id, stripe_key):
    print('Updating env vars...')
    status, svc = render_api(f'/services/{service_id}', 'GET')
    env_vars = svc.get('service', svc).get('envVars', [])
    # Merge
    keys = {e['key']: e['value'] for e in env_vars}
    keys['STRIPE_RESTRICTED_KEY'] = stripe_key
    keys['SITE_URL'] = 'https://www.partseekr.online'
    new_env_vars = [{'key': k, 'value': v} for k, v in keys.items()]
    status, updated = render_api(f'/services/{service_id}', 'PATCH', {'envVars': new_env_vars})
    print('Env vars updated.')
    return updated


def deploy(service_id):
    print('Triggering deploy...')
    status, result = render_api(f'/services/{service_id}/deploys', 'POST', {'clearCache': True})
    print('Deploy triggered:', result.get('id', result.get('deploy', {}).get('id', 'unknown')))


def main():
    if not all([GH_USER, GH_TOKEN, RENDER_KEY]):
        print('Missing env vars. Set GITHUB_USER, GITHUB_TOKEN, RENDER_API_KEY')
        sys.exit(1)
    stripe_key = load_stripe()
    ensure_repo()
    push_code()
    owner_id = get_render_owner()
    svc = find_service()
    if not svc:
        svc = create_service(owner_id, stripe_key)
    else:
        print('Service exists:', svc.get('id'))
        update_env_vars(svc['id'], stripe_key)
    deploy(svc['id'])
    print('\nDone. Wait 2-3 minutes, then test:')
    print('https://partseekr.onrender.com')
    print('https://www.partseekr.online')


if __name__ == '__main__':
    main()
