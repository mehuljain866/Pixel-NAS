'use strict';

const { getSystemState, setSystemState, writeEvent } = require('./database');

class StorageGuard {
  constructor({ db, warningGB, pauseGB, resumeBelowGB, webhookUrl, webhookMethod = 'GET', pauseOnUnknown = true, webhookTimeoutMs = 4000, retryMs = 30000, fetchImpl = fetch }) {
    this.db = db;
    this.warningGB = warningGB;
    this.pauseGB = pauseGB;
    this.resumeBelowGB = resumeBelowGB;
    this.webhookUrl = webhookUrl;
    this.webhookMethod = webhookMethod;
    this.pauseOnUnknown = pauseOnUnknown;
    this.webhookTimeoutMs = webhookTimeoutMs;
    this.retryMs = retryMs;
    this.fetchImpl = fetchImpl;
    this.latched = getSystemState(db, 'storage_pause_latched', 'false') === 'true';
    this.lastAttemptAt = getSystemState(db, 'storage_pause_attempt_at', '');
    this.lastResult = getSystemState(db, 'storage_pause_result', 'never_requested');
  }

  async evaluate(storage) {
    const base = {
      warningGB: this.warningGB,
      pauseGB: this.pauseGB,
      resumeBelowGB: this.resumeBelowGB,
      webhookConfigured: Boolean(this.webhookUrl),
      lastActionAt: this.lastAttemptAt || null,
      webhookAcknowledged: this.lastResult === 'webhook_acknowledged',
      requiresManualResume: this.latched,
    };
    const storageAvailable = Boolean(storage && storage.available === true && Number.isFinite(storage.usedGB));

    if (this.latched) {
      if (!storageAvailable) {
        return { ...base, state: 'pause_requested', details: 'A stop request was acknowledged previously, but storage telemetry is now unavailable. Keep Resilio stopped; manual resume is blocked until storage can be measured.' };
      }
      return {
        ...base,
        state: storage.usedGB < this.resumeBelowGB ? 'resume_required' : 'pause_requested',
        details: storage.usedGB < this.resumeBelowGB
          ? 'The stop request was acknowledged previously. Check the device, then manually restart Resilio and acknowledge here.'
          : 'A stop request was previously acknowledged. Resilio restart remains manual.',
      };
    }

    if (!storageAvailable) {
      if (!this.pauseOnUnknown) {
        return { ...base, state: 'unknown', details: 'Storage could not be measured. No automatic action was configured; check Termux storage access and filesystem telemetry.' };
      }
      return this.#requestStop(null, 'storage_telemetry_unavailable');
    }

    if (storage.usedGB < this.pauseGB) {
      return {
        ...base,
        state: storage.usedGB >= this.warningGB ? 'warning' : 'monitoring',
        details: storage.usedGB >= this.warningGB
          ? `Storage has reached the ${this.warningGB} GB warning threshold.`
          : 'Storage is below the warning threshold.',
      };
    }

    return this.#requestStop(storage.usedGB, 'storage_threshold_reached');
  }

  async #requestStop(usedGB, reason) {
    const base = {
      warningGB: this.warningGB,
      pauseGB: this.pauseGB,
      resumeBelowGB: this.resumeBelowGB,
      webhookConfigured: Boolean(this.webhookUrl),
      lastActionAt: this.lastAttemptAt || null,
      webhookAcknowledged: this.lastResult === 'webhook_acknowledged',
      requiresManualResume: this.latched,
    };
    if (!this.webhookUrl) {
      return { ...base, state: 'pause_not_configured', details: 'A stop condition was reached, but no stop webhook is configured.' };
    }

    const lastAttemptMs = Date.parse(this.lastAttemptAt);
    if (Number.isFinite(lastAttemptMs) && Date.now() - lastAttemptMs < this.retryMs && this.lastResult === 'request_failed') {
      return { ...base, state: 'pause_failed', details: 'The previous stop request failed; waiting for the configured retry interval.' };
    }

    const now = new Date().toISOString();
    this.lastAttemptAt = now;
    setSystemState(this.db, 'storage_pause_attempt_at', now);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.webhookTimeoutMs);

    try {
      const request = { method: this.webhookMethod, signal: controller.signal };
      if (this.webhookMethod === 'POST') {
        request.headers = { 'Content-Type': 'application/json' };
        request.body = JSON.stringify({ source: 'pixel-nas-dashboard', reason, usedGB, thresholdGB: this.pauseGB });
      }
      const response = await this.fetchImpl(this.webhookUrl, request);
      if (!response.ok) throw new Error(`Stop webhook returned HTTP ${response.status}.`);

      this.latched = true;
      this.lastResult = 'webhook_acknowledged';
      setSystemState(this.db, 'storage_pause_latched', 'true');
      setSystemState(this.db, 'storage_pause_result', this.lastResult);
      writeEvent(this.db, null, 'storage_pause_webhook_acknowledged', { usedGB, reason, thresholdGB: this.pauseGB });
      return {
        ...base,
        state: 'pause_requested',
        webhookAcknowledged: true,
        requiresManualResume: true,
        lastActionAt: now,
        details: reason === 'storage_telemetry_unavailable'
          ? 'Storage telemetry is unavailable, so a conservative stop request was sent. Verify Resilio stopped on the device; manual resume is blocked until storage can be measured.'
          : 'The stop webhook acknowledged the request. This does not independently prove Resilio has stopped; verify it on the device. Restart remains manual.',
      };
    } catch (error) {
      this.lastResult = 'request_failed';
      setSystemState(this.db, 'storage_pause_result', this.lastResult);
      writeEvent(this.db, null, 'storage_pause_webhook_failed', { message: error.message, usedGB, reason });
      return {
        ...base,
        state: 'pause_failed',
        lastActionAt: now,
        details: `CRITICAL: stop request failed (${error.message}). Resilio may still be receiving files.`,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  acknowledgeManualResume(storage, confirmation) {
    if (confirmation !== 'I restarted Resilio manually') {
      throw new Error('Explicit manual restart confirmation is required.');
    }
    if (!storage || storage.available !== true || !Number.isFinite(storage.usedGB) || storage.usedGB >= this.resumeBelowGB) {
      throw new Error(`Storage must be measurable and below ${this.resumeBelowGB} GB before acknowledging resume.`);
    }
    this.latched = false;
    this.lastResult = 'manual_resume_acknowledged';
    setSystemState(this.db, 'storage_pause_latched', 'false');
    setSystemState(this.db, 'storage_pause_result', this.lastResult);
    writeEvent(this.db, null, 'storage_manual_resume_acknowledged', { usedGB: storage.usedGB });
    return { state: 'monitoring', details: 'Manual restart acknowledged. The dashboard did not start Resilio.' };
  }
}

module.exports = { StorageGuard };
