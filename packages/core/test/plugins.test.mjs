import test from 'node:test';
import assert from 'node:assert/strict';
import { PluginRegistry } from '../dist/plugins.js';

const createPlugin = (pluginId, sharedId = 'shared') => ({
  id: pluginId,
  name: pluginId,
  version: '1.0.0',
  contributions: {
    overlayElementTypes: [{ id: sharedId, label: `${pluginId} overlay` }],
    animationPresets: [{ id: sharedId, label: `${pluginId} animation`, easing: 'linear' }],
    templatePacks: [{ id: sharedId, label: `${pluginId} templates`, templates: [] }],
    dataProviders: [{ id: sharedId, label: `${pluginId} provider` }],
  },
});

test('rejects duplicate contribution ids across plugins by default', async () => {
  const registry = new PluginRegistry();
  const pluginA = createPlugin('alpha-plugin', 'shared-id');
  const pluginB = createPlugin('beta-plugin', 'shared-id');

  await registry.register(pluginA);

  await assert.rejects(
    registry.register(pluginB),
    /Plugin "beta-plugin" cannot register overlay element type "shared-id" because it is already provided by plugin "alpha-plugin"\./,
  );
});

test('allows namespaced overrides when configured and restores previous owner on dispose', async () => {
  const registry = new PluginRegistry({ duplicateContributionPolicy: 'allow-namespaced-override' });

  await registry.register(createPlugin('third-party', 'owner:shared'));
  await registry.register(createPlugin('owner', 'owner:shared'));

  assert.equal(registry.listOverlayElementTypes()[0].label, 'owner overlay');
  assert.equal(registry.listAnimationPresets()[0].label, 'owner animation');
  assert.equal(registry.listTemplatePacks()[0].label, 'owner templates');
  assert.equal(registry.listDataProviders()[0].label, "owner provider");

  await registry.dispose('owner');

  assert.equal(registry.listOverlayElementTypes()[0].label, 'third-party overlay');
  assert.equal(registry.listAnimationPresets()[0].label, 'third-party animation');
  assert.equal(registry.listTemplatePacks()[0].label, 'third-party templates');
  assert.equal(registry.listDataProviders()[0].label, "third-party provider");
});

test('dispose removes all plugin contributions and capability flags return to false', async () => {
  const registry = new PluginRegistry();
  await registry.register(createPlugin('alpha-plugin', 'alpha:one'));

  assert.deepEqual(registry.getCapabilities(), {
    'overlay-elements': true,
    'animation-presets': true,
    'template-packs': true,
    'data-providers': true,
  });

  await registry.dispose('alpha-plugin');

  assert.equal(registry.listOverlayElementTypes().length, 0);
  assert.equal(registry.listAnimationPresets().length, 0);
  assert.equal(registry.listTemplatePacks().length, 0);
  assert.equal(registry.listDataProviders().length, 0);
  assert.deepEqual(registry.getCapabilities(), {
    'overlay-elements': false,
    'animation-presets': false,
    'template-packs': false,
    'data-providers': false,
  });
});
