#!/usr/bin/env python3
"""
Deploy PartSeekr to Render automatically.
Requires environment variables:
  GITHUB_TOKEN      - GitHub personal access token with repo scope
  RENDER_API_KEY    - Render API key
  STRIPE_RESTRICTED_KEY - Stripe restricted key
"""

import os
import subprocess
import sys
import json
import urllib.request
import urllib.error

REPO_NAME = 'partseekr'
GITHUB_USER = os.environ.get('GITHUB_USER')
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
RENDER_API_KEY = os.environ.get('RENDER_API_KEY')
STRIPE_KEY = os.environ.get('STRIPE_RESTRICTED_KEY')
DOMAIN = 'www.partseekr.online'
RENDER_SERVICE_NAME = 'partseekr'


def github_api(path, method='GET', data=None):
    url = 'https://api.github.com' + path
    headers = {
        'Authorization': 'token ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
    }
    payload = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print('GitHub API error:', e.code, body)
        raise


def render_api(path, method='GET', data=None):
    url = 'https://api.render.com/v1' + path
    headers = {
        'Authorization': 'Bearer ' + RENDER_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    }
    payload = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print('Render API error:', e.code, body)
        raise


def ensure_repo():
    print('Checking GitHub repo ' + GITHUB_USER + '/' + REPO_NAME + '...')
    try:
        status, repo = github_api('/repos/' + GITHUB_USER + '/' + REPO_NAME)
        print('Repo exists:', repo['html_url'])
        return repo['clone_url']
    except urllib.error.HTTPError as e:
        if e.code == 404:
            print('Creating repo...')
            status, repo = github_api('/user/repos', 'POST', {
                'name': REPO_NAME,
                'description': 'Local auto parts marketplace with Stripe checkout',
                'private': False,
                'auto_init': False,
            })
            print('Created repo:', repo['html_url'])
            return repo['clone_url']
        raise


def push_to_github(clone_url):
    print('Pushing local repo to GitHub...')
    auth_url = clone_url.replace('https://', 'https://' + GITHUB_TOKEN + '@')
    try:
        subprocess.run(['git', 'remote', 'get-url', 'origin'], check=True, capture_output=True)
    except subprocess.CalledProcessError:
        subprocess.run(['git', 'remote', 'add', 'origin', auth_url], check=True)
    subprocess.run(['git', 'branch', '-M', 'main'], check=True)
    subprocess.run(['git', 'push', '-u', 'origin', 'main', '--force'], check=True)
    print('Pushed.')


def get_render_owner_id():
    print('Getting Render owner ID...')
    status, data = render_api('/owners')
    for owner in data:
        o = owner.get('owner', owner)
        if not o.get('suspended', False):
            print('Owner:', o['name'], '(' + o['id'] + ')')
            return o['id']
    raise RuntimeError('No active Render owner found')


def create_render_service(owner_id):
    print('Creating Render web service...')
    status, svc = render_api('/services', 'POST', {
        'type': 'web_service',
        'name': RENDER_SERVICE_NAME,
        'ownerId': owner_id,
        'repo': 'https://github.com/' + GITHUB_USER + '/' + REPO_NAME,
        'branch': 'main',
        'runtime': 'node',
        'plan': 'starter',
        'region': 'oregon',
        'buildFilter': None,
        'envVars': [
            {'key': 'STRIPE_RESTRICTED_KEY', 'value': STRIPE_KEY},
            {'key': 'SITE_URL', 'value': 'https://' + DOMAIN},
        ],
        'serviceDetails': {
            'buildCommand': '',
            'startCommand': 'node server.js',
            'publishPath': '.',
        },
    })
    print('Service created:', svc.get('service', {}).get('id', svc.get('id')))
    return svc


def main():
    if not GITHUB_USER:
        print('Set GITHUB_USER env var')
        sys.exit(1)
    if not GITHUB_TOKEN:
        print('Set GITHUB_TOKEN env var with repo scope')
        sys.exit(1)
    if not RENDER_API_KEY:
        print('Set RENDER_API_KEY env var')
        sys.exit(1)
    if not STRIPE_KEY:
        print('Set STRIPE_RESTRICTED_KEY env var')
        sys.exit(1)

    project_dir = r'C:\Users\bidbu\projects\partseekr'
    os.chdir(project_dir)

    clone_url = ensure_repo()
    push_to_github(clone_url)
    owner_id = get_render_owner_id()
    svc = create_render_service(owner_id)
    print('\nDeploy initiated. Check Render dashboard for build status.')
    print('Once DNS propagates, visit https://' + DOMAIN)


if __name__ == '__main__':
    main()
