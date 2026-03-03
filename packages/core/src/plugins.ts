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

export type DuplicateContributionPolicy = "reject" | "allow-namespaced-override";

export interface PluginRegistryOptions {
  duplicateContributionPolicy?: DuplicateContributionPolicy;
  namespaceDelimiter?: string;
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
  private readonly options: Required<PluginRegistryOptions>;

  private readonly plugins = new Map<string, RegisteredPlugin>();

  private readonly overlayElementTypes = new Map<string, OverlayElementTypeDefinition>();

  private readonly animationPresets = new Map<string, AnimationEasingPreset>();

  private readonly templatePacks = new Map<string, TemplatePack>();

  private readonly dataProviders = new Map<string, DataProvider>();

  private readonly overlayElementTypeOwners = new Map<string, string[]>();

  private readonly animationPresetOwners = new Map<string, string[]>();

  private readonly templatePackOwners = new Map<string, string[]>();

  private readonly dataProviderOwners = new Map<string, string[]>();

  private readonly overlayElementTypeHistory = new Map<string, OverlayElementTypeDefinition[]>();

  private readonly animationPresetHistory = new Map<string, AnimationEasingPreset[]>();

  private readonly templatePackHistory = new Map<string, TemplatePack[]>();

  private readonly dataProviderHistory = new Map<string, DataProvider[]>();

  private capabilities: PluginCapabilityFlags = cloneCapabilities(EMPTY_CAPABILITIES);

  private readonly context: PluginContext = {
    registry: this,
    now: () => new Date(),
  };

  constructor(options: PluginRegistryOptions = {}) {
    this.options = {
      duplicateContributionPolicy: options.duplicateContributionPolicy ?? "reject",
      namespaceDelimiter: options.namespaceDelimiter ?? ":",
    };
  }

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
      this.addContribution({
        plugin,
        contributionType: "overlay element type",
        id: entry.id,
        owners: this.overlayElementTypeOwners,
        values: this.overlayElementTypes,
        history: this.overlayElementTypeHistory,
        value: entry,
      });
      return entry.id;
    }) ?? [];

    const animationPresetIds = plugin.contributions?.animationPresets?.map((entry) => {
      this.addContribution({
        plugin,
        contributionType: "animation preset",
        id: entry.id,
        owners: this.animationPresetOwners,
        values: this.animationPresets,
        history: this.animationPresetHistory,
        value: entry,
      });
      return entry.id;
    }) ?? [];

    const templatePackIds = plugin.contributions?.templatePacks?.map((entry) => {
      this.addContribution({
        plugin,
        contributionType: "template pack",
        id: entry.id,
        owners: this.templatePackOwners,
        values: this.templatePacks,
        history: this.templatePackHistory,
        value: entry,
      });
      return entry.id;
    }) ?? [];

    const dataProviderIds = plugin.contributions?.dataProviders?.map((entry) => {
      this.addContribution({
        plugin,
        contributionType: "data provider",
        id: entry.id,
        owners: this.dataProviderOwners,
        values: this.dataProviders,
        history: this.dataProviderHistory,
        value: entry,
      });
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
    plugin.overlayElementTypeIds.forEach((id) => {
      this.removeContribution({
        pluginId: plugin.plugin.id,
        id,
        owners: this.overlayElementTypeOwners,
        values: this.overlayElementTypes,
        history: this.overlayElementTypeHistory,
      });
    });
    plugin.animationPresetIds.forEach((id) => {
      this.removeContribution({
        pluginId: plugin.plugin.id,
        id,
        owners: this.animationPresetOwners,
        values: this.animationPresets,
        history: this.animationPresetHistory,
      });
    });
    plugin.templatePackIds.forEach((id) => {
      this.removeContribution({
        pluginId: plugin.plugin.id,
        id,
        owners: this.templatePackOwners,
        values: this.templatePacks,
        history: this.templatePackHistory,
      });
    });
    plugin.dataProviderIds.forEach((id) => {
      this.removeContribution({
        pluginId: plugin.plugin.id,
        id,
        owners: this.dataProviderOwners,
        values: this.dataProviders,
        history: this.dataProviderHistory,
      });
    });
  }

  private addContribution<T>(params: {
    plugin: OsgPlugin;
    contributionType: string;
    id: string;
    owners: Map<string, string[]>;
    values: Map<string, T>;
    history: Map<string, T[]>;
    value: T;
  }): void {
    const { plugin, contributionType, id, owners, values, history, value } = params;
    const seenIds = owners.get(id) ?? [];
    const conflictingPluginId = seenIds.at(-1);

    if (conflictingPluginId) {
      if (conflictingPluginId === plugin.id) {
        throw new Error(
          `Plugin "${plugin.id}" cannot register ${contributionType} "${id}" more than once.`,
        );
      }

      if (
        this.options.duplicateContributionPolicy !== "allow-namespaced-override" ||
        !this.isNamespacedContributionId(plugin.id, id)
      ) {
        throw new Error(
          `Plugin "${plugin.id}" cannot register ${contributionType} "${id}" because it is already provided by plugin "${conflictingPluginId}".`,
        );
      }
    }

    owners.set(id, [...seenIds, plugin.id]);
    const valueHistory = history.get(id) ?? [];
    history.set(id, [...valueHistory, value]);
    values.set(id, value);
  }

  private removeContribution<T>(params: {
    pluginId: string;
    id: string;
    owners: Map<string, string[]>;
    values: Map<string, T>;
    history: Map<string, T[]>;
  }): void {
    const { pluginId, id, owners, values, history } = params;
    const seenIds = owners.get(id);
    if (!seenIds) {
      return;
    }

    const ownerIndex = seenIds.lastIndexOf(pluginId);
    if (ownerIndex < 0) {
      return;
    }

    const nextOwners = [...seenIds];
    nextOwners.splice(ownerIndex, 1);

    const valueHistory = history.get(id) ?? [];
    const nextValueHistory = [...valueHistory];
    nextValueHistory.splice(ownerIndex, 1);

    if (nextOwners.length === 0 || nextValueHistory.length === 0) {
      owners.delete(id);
      history.delete(id);
      values.delete(id);
      return;
    }

    owners.set(id, nextOwners);
    history.set(id, nextValueHistory);
    values.set(id, nextValueHistory.at(-1)!);
  }

  private isNamespacedContributionId(pluginId: string, id: string): boolean {
    return id.startsWith(`${pluginId}${this.options.namespaceDelimiter}`);
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
