#!/usr/bin/env node
import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const DISABLE_DEBUG_ENDPOINTS = process.env.DISABLE_DEBUG_ENDPOINTS === 'true';

async function checkEndpoint(path, label) {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url);
    const status = res.status;
    let json = null;
    try {
      json = await res.json();
    } catch (e) {}
    return { status, json };
  } catch (e) {
    return { status: 0, json: null, error: e };
  }
}

(async () => {

  let fail = false;

  // 1. Health endpoint
  const health = await checkEndpoint('/api/framework-b/health', 'health');
  console.log(`Health: ${health.status}`, health.json ? JSON.stringify({
    node_env: health.json?.node_env,
    vercel_env: health.json?.vercel_env,
    git_commit_sha: health.json?.git_commit_sha
  }) : '');
  if (health.status !== 200) fail = true;

  // 2. Debug env endpoint
  const debug = await checkEndpoint('/api/debug/env', 'debug');

  const isLocal = BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1');
  const isProd = BASE_URL.includes('vercel.app');
  let debugNote = '';
  if (isLocal) {
    if (DISABLE_DEBUG_ENDPOINTS) {
      if (debug.status === 404) {
        debugNote = 'PASS (local kill-switch)';
      } else {
        debugNote = 'FAIL (local, expected 404 with kill-switch)';
        fail = true;
      }
    } else {
      if (debug.status === 200) {
        debugNote = 'PASS (local)';
      } else {
        debugNote = 'FAIL (local, expected 200)';
        fail = true;
      }
    }
  } else if (isProd) {
    if (debug.status === 404) {
      debugNote = 'PASS (prod kill-switch)';
    } else if (debug.status === 200) {
      debugNote = 'PASS (prod, debug enabled)';
    } else {
      debugNote = 'FAIL (prod, unexpected status)';
      fail = true;
    }
  } else {
    // fallback for other environments
    if (debug.status === 200) {
      debugNote = 'PASS (other env)';
    } else {
      debugNote = 'FAIL (other env, expected 200)';
      fail = true;
    }
  }
  console.log(`Debug: ${debug.status}`, debug.json ? JSON.stringify({
    node_env: debug.json?.node_env,
    vercel_env: debug.json?.vercel_env
  }) : '', debugNote);

  process.exit(fail ? 1 : 0);
})();
