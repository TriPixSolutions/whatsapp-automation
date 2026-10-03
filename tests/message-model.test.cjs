const { test } = require('node:test');
const assert = require('node:assert/strict');
const load = require('./load-ts.cjs');

const model = load('src/lib/whatsapp/messageModel.ts', {
  '@/types': {},
  '@/types/automations': {},
});

test('canonical button message rejects duplicate IDs and provider length violations', () => {
  const message = model.canonicalizeOutboundMessage({
    kind: 'button',
    bodyText: 'Choose an option',
    buttons: [
      { id: 'choice', title: 'First' },
      { id: 'choice', title: 'This title is longer than twenty characters' },
    ],
  });
  const errors = model.validateOutboundMessage(message);
  assert.ok(errors.some((error) => error.includes('unique')));
  assert.ok(errors.some((error) => error.includes('20 characters')));
});

test('canonical list requires stable unique rows and respects WhatsApp limits', () => {
  const message = model.canonicalizeOutboundMessage({
    kind: 'list',
    bodyText: 'Choose',
    buttonText: 'Open',
    sections: [{
      title: 'Options',
      rows: Array.from({ length: 11 }, (_, index) => ({
        id: index < 2 ? 'duplicate' : `row_${index}`,
        title: `Option ${index}`,
      })),
    }],
  });
  const errors = model.validateOutboundMessage(message);
  assert.ok(errors.some((error) => error.includes('at most 10 rows')));
  assert.ok(errors.some((error) => error.includes('unique')));
});

test('media requires an uploaded media ID or HTTPS URL', () => {
  const missingMedia = model.validateOutboundMessage(model.canonicalizeOutboundMessage({ kind: 'image' }));
  assert.equal(missingMedia.length, 1);
  assert.equal(missingMedia[0], 'Upload a file or provide a media URL.');
  assert.ok(model.validateOutboundMessage(model.canonicalizeOutboundMessage({ kind: 'image', mediaUrl: 'http://example.test/image.png' }))[0].includes('HTTPS'));
  assert.equal(model.validateOutboundMessage(model.canonicalizeOutboundMessage({ kind: 'image', mediaId: 'meta-media-id' })).length, 0);
});

test('workflow preview and sender share the same normalized content and stable IDs', () => {
  const message = model.messageFromWorkflowNode({
    id: 'node-buttons',
    type: 'whatsapp_button',
    title: 'Welcome choices',
    config: {
      bodyText: 'How can we help?',
      footerText: 'Reply below',
      buttons: [{ id: 'browse_catalog', title: 'Browse Catalog' }],
    },
  });
  assert.ok(message);
  assert.equal(model.validateOutboundMessage(message).length, 0);
  assert.equal(JSON.stringify(model.toWhatsAppPreview(message)), JSON.stringify({
    kind: 'button',
    title: '',
    body: 'How can we help?',
    footer: 'Reply below',
    buttons: [{ id: 'browse_catalog', title: 'Browse Catalog' }],
    sections: [],
    cards: [],
  }));
});

test('carousel fails before provider dispatch without approved template and valid card count', () => {
  const message = model.canonicalizeOutboundMessage({
    kind: 'carousel',
    cards: [{ title: 'One', description: 'Only one card', buttons: [] }],
  });
  const errors = model.validateOutboundMessage(message);
  assert.ok(errors.some((error) => error.includes('approved carousel template')));
  assert.ok(errors.some((error) => error.includes('2 to 10 cards')));
});
