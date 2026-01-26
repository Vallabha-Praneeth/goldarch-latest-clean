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
    node_env: health.json.node_env,
    vercel_env: health.json.vercel_env,
    git_commit_sha: health.json.git_commit_sha
  }) : '');
  if (health.status !== 200) fail = true;

  // 2. Debug env endpoint
  const debug = await checkEndpoint('/api/debug/env', 'debug');
  console.log(`Debug: ${debug.status}`, debug.json ? JSON.stringify({
    node_env: debug.json.node_env,
    vercel_env: debug.json.vercel_env
  }) : '');
  if (
    debug.status !== 200 &&
    !(DISABLE_DEBUG_ENDPOINTS && debug.status === 404)
  ) fail = true;

  process.exit(fail ? 1 : 0);
})();
