try {
  require('./src/app');
  console.log('Server OK');
} catch (e) {
  console.error('ERROR:', e.message);
  console.error(e.stack);
}
