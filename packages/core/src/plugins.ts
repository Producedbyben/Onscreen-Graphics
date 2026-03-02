import type { TemplateDefinition } from "./types";

export type PluginCapability =
  | "overlay-elements"
  | "animation-presets"
  | "template-packs"
  | "data-providers";

export type PluginCapabilityFlags = Readonly<Record<PluginCapability, boolean>>;

export interface PluginContext {
  readonly registry: PluginRegistry;
  readonly now: () => Date;
}

export interface OverlayElementTypeDefinition {
  id: string;
  label: string;
  description?: string;
  defaultStyle?: Record<string, string | number | boolean>;
  defaultProps?: Record<string, unknown>;
}

export interface AnimationEasingPreset {
  id: string;
  label: string;
  description?: string;
  easing: string;
}

export interface TemplatePack {
  id: string;
  label: string;
  description?: string;
  templates: TemplateDefinition[];
}

export interface DataProvider {
  id: string;
  label: string;
  description?: string;
  connect?: () => Promise<void> | void;
  fetch?: <T = unknown>(query?: unknown) => Promise<T> | T;
  disconnect?: () => Promise<void> | void;
}

export interface PluginLifecycleHooks {
  onRegister?: (context: PluginContext) => Promise<void> | void;
  onActivate?: (context: PluginContext) => Promise<void> | void;
  onDeactivate?: (context: PluginContext) => Promise<void> | void;
  onDispose?: (context: PluginContext) => Promise<void> | void;
}

export interface PluginContributions {
  overlayElementTypes?: OverlayElementTypeDefinition[];
  animationPresets?: AnimationEasingPreset[];
  templatePacks?: TemplatePack[];
  dataProviders?: DataProvider[];
}

export interface OsgPlugin extends PluginLifecycleHooks {
  id: string;
  name: string;
  version: string;
  description?: string;
  contributions?: PluginContributions;
}

interface RegisteredPlugin {
  plugin: OsgPlugin;
  overlayElementTypeIds: string[];
  animationPresetIds: string[];
  templatePackIds: string[];
  dataProviderIds: string[];
}

const EMPTY_CAPABILITIES: PluginCapabilityFlags = {
  "overlay-elements": false,
  "animation-presets": false,
  "template-packs": false,
  "data-providers": false,
};

const cloneCapabilities = (capabilities: PluginCapabilityFlags): PluginCapabilityFlags => ({
  "overlay-elements": capabilities["overlay-elements"],
  "animation-presets": capabilities["animation-presets"],
  "template-packs": capabilities["template-packs"],
  "data-providers": capabilities["data-providers"],
});

export class PluginRegistry {
  private readonly plugins = new Map<string, RegisteredPlugin>();

  private readonly overlayElementTypes = new Map<string, OverlayElementTypeDefinition>();

  private readonly animationPresets = new Map<string, AnimationEasingPreset>();

  private readonly templatePacks = new Map<string, TemplatePack>();

  private readonly dataProviders = new Map<string, DataProvider>();

  private capabilities: PluginCapabilityFlags = cloneCapabilities(EMPTY_CAPABILITIES);

  private readonly context: PluginContext = {
    registry: this,
    now: () => new Date(),
  };

  async register(plugin: OsgPlugin): Promise<void> {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin \"${plugin.id}\" is already registered.`);
    }

    const registeredPlugin = this.addContributions(plugin);
    this.plugins.set(plugin.id, registeredPlugin);
    this.recalculateCapabilities();

    await plugin.onRegister?.(this.context);
  }

  async activate(pluginId: string): Promise<void> {
    const registeredPlugin = this.plugins.get(pluginId);
    if (!registeredPlugin) {
      throw new Error(`Plugin \"${pluginId}\" is not registered.`);
    }

    await registeredPlugin.plugin.onActivate?.(this.context);
  }

  async deactivate(pluginId: string): Promise<void> {
    const registeredPlugin = this.plugins.get(pluginId);
    if (!registeredPlugin) {
      throw new Error(`Plugin \"${pluginId}\" is not registered.`);
    }

    await registeredPlugin.plugin.onDeactivate?.(this.context);
  }

  async dispose(pluginId: string): Promise<void> {
    const registeredPlugin = this.plugins.get(pluginId);
    if (!registeredPlugin) {
      throw new Error(`Plugin \"${pluginId}\" is not registered.`);
    }

    await registeredPlugin.plugin.onDispose?.(this.context);
    this.removeContributions(registeredPlugin);
    this.plugins.delete(pluginId);
    this.recalculateCapabilities();
  }

  getCapabilities(): PluginCapabilityFlags {
    return cloneCapabilities(this.capabilities);
  }

  listPlugins(): OsgPlugin[] {
    return [...this.plugins.values()].map((entry) => entry.plugin);
  }

  listOverlayElementTypes(): OverlayElementTypeDefinition[] {
    return [...this.overlayElementTypes.values()];
  }

  listAnimationPresets(): AnimationEasingPreset[] {
    return [...this.animationPresets.values()];
  }

  listTemplatePacks(): TemplatePack[] {
    return [...this.templatePacks.values()];
  }

  listDataProviders(): DataProvider[] {
    return [...this.dataProviders.values()];
  }

  private addContributions(plugin: OsgPlugin): RegisteredPlugin {
    const overlayElementTypeIds = plugin.contributions?.overlayElementTypes?.map((entry) => {
      this.overlayElementTypes.set(entry.id, entry);
      return entry.id;
    }) ?? [];

    const animationPresetIds = plugin.contributions?.animationPresets?.map((entry) => {
      this.animationPresets.set(entry.id, entry);
      return entry.id;
    }) ?? [];

    const templatePackIds = plugin.contributions?.templatePacks?.map((entry) => {
      this.templatePacks.set(entry.id, entry);
      return entry.id;
    }) ?? [];

    const dataProviderIds = plugin.contributions?.dataProviders?.map((entry) => {
      this.dataProviders.set(entry.id, entry);
      return entry.id;
    }) ?? [];

    return {
      plugin,
      overlayElementTypeIds,
      animationPresetIds,
      templatePackIds,
      dataProviderIds,
    };
  }

  private removeContributions(plugin: RegisteredPlugin): void {
    plugin.overlayElementTypeIds.forEach((id) => this.overlayElementTypes.delete(id));
    plugin.animationPresetIds.forEach((id) => this.animationPresets.delete(id));
    plugin.templatePackIds.forEach((id) => this.templatePacks.delete(id));
    plugin.dataProviderIds.forEach((id) => this.dataProviders.delete(id));
  }

  private recalculateCapabilities(): void {
    this.capabilities = {
      "overlay-elements": this.overlayElementTypes.size > 0,
      "animation-presets": this.animationPresets.size > 0,
      "template-packs": this.templatePacks.size > 0,
      "data-providers": this.dataProviders.size > 0,
    };
  }
}
