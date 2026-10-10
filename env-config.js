// Default environment configuration for PC / Claude / CMD APK build
// In local PC, localhost, and APK environments, default is strictly 'local'.
if (typeof window !== 'undefined') {
  var _h = (window.location && window.location.hostname) || '';
  if (
    !_h ||
    _h === 'localhost' ||
    _h === '127.0.0.1' ||
    _h === '::1' ||
    _h === '0.0.0.0' ||
    _h.endsWith('.local')
  ) {
    window.__PET_TOWN_ASSET_MODE = 'local';
  } else if (typeof window.__PET_TOWN_ASSET_MODE === 'undefined') {
    window.__PET_TOWN_ASSET_MODE = 'local';
  }
}
