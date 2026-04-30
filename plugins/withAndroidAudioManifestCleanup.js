const { withAndroidManifest } = require('expo/config-plugins');

const AUDIO_SERVICES_TO_REMOVE = [
  'expo.modules.audio.service.AudioControlsService',
  'expo.modules.audio.service.AudioRecordingService',
];

const AUDIO_PERMISSIONS_TO_REMOVE = [
  'android.permission.RECORD_AUDIO',
  'android.permission.FOREGROUND_SERVICE',
  'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
  'android.permission.FOREGROUND_SERVICE_MICROPHONE',
];

function ensureArray(parent, key) {
  if (!Array.isArray(parent[key])) {
    parent[key] = [];
  }
  return parent[key];
}

function upsertRemovalEntry(entries, androidName) {
  const existing = entries.find((entry) => entry?.$?.['android:name'] === androidName);

  if (existing) {
    existing.$['tools:node'] = 'remove';
    return;
  }

  entries.push({
    $: {
      'android:name': androidName,
      'tools:node': 'remove',
    },
  });
}

module.exports = function withAndroidAudioManifestCleanup(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.$ = manifest.$ || {};
    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] || 'http://schemas.android.com/tools';

    const permissions = ensureArray(manifest, 'uses-permission');
    for (const permission of AUDIO_PERMISSIONS_TO_REMOVE) {
      upsertRemovalEntry(permissions, permission);
    }

    const application = ensureArray(manifest, 'application')[0];
    if (application) {
      const services = ensureArray(application, 'service');
      for (const service of AUDIO_SERVICES_TO_REMOVE) {
        upsertRemovalEntry(services, service);
      }
    }

    return config;
  });
};
