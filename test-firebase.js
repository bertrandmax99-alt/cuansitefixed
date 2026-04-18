try {
  require('./firebase.js');
  console.log('firebase.js loaded successfully');
} catch (e) {
  console.error('Error loading firebase.js:', e);
}
