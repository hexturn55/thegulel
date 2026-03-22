import sharp from 'sharp';

await sharp('public/logo-option1.png')
  .negate({ alpha: false })
  .toFile('public/logo.png');

console.log('Done - logo.png updated with white version of logo-option1');
