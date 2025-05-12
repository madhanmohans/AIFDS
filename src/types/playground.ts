// Property types for component configuration
export interface ComponentProperty {
  type: 'text' | 'number' | 'color' | 'select' | 'boolean';
  label: string;
  default: any;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
}

// Tech stack options
export type TechStack = 'react' | 'react-typescript' | 'vue' | 'angular';

// API call configuration
export interface ApiCallConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  payload?: string; // JSON string payload
  enabled?: boolean;
}

// Component configuration interface
export interface ComponentConfig {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: ComponentConfig[];
  apiConfig?: ApiCallConfig;
  contextData?: any; // Store API response or any data for context
  contextTransform?: string; // Optional code snippet for transforming data
}

// Drag and drop types
export type DropPosition = 'before' | 'after' | 'inside';

// State interface
export interface PlaygroundState {
  components: ComponentConfig[];
  selectedComponent: ComponentConfig | null;
  selectedAvailableComponent: string | null;
  dropTarget: { id: string; position: DropPosition } | null;
  lastUpdated: number; // Timestamp for tracking updates
  techStack: TechStack; // Selected tech stack for code generation
  previewMode: boolean; // Toggle between structure view and preview
}

// Action types
export type PlaygroundAction =
  | { type: 'ADD_COMPONENT'; payload: ComponentConfig }
  | { type: 'UPDATE_COMPONENT'; payload: { id: string; props: Record<string, any> } }
  | { type: 'DELETE_COMPONENT'; payload: string }
  | { type: 'SELECT_COMPONENT'; payload: ComponentConfig | null }
  | { type: 'SELECT_AVAILABLE_COMPONENT'; payload: string | null }
  | { type: 'SET_DROP_TARGET'; payload: { id: string; position: DropPosition } | null }
  | { type: 'MOVE_COMPONENT'; payload: { sourceId: string; targetId: string; position: DropPosition } }
  | { type: 'REORDER_COMPONENTS'; payload: ComponentConfig[] }
  | { type: 'SET_TECH_STACK'; payload: TechStack }
  | { type: 'TOGGLE_PREVIEW_MODE'; payload: boolean }
  | { type: 'ADD_CHILD_COMPONENT'; payload: { parentId: string; component: ComponentConfig } }
  | { type: 'UPDATE_API_CONFIG'; payload: { id: string; apiConfig: ApiCallConfig } }
  | { type: 'UPDATE_CONTEXT_DATA'; payload: { id: string; contextData: any } }
  | { type: 'UPDATE_CONTEXT_TRANSFORM'; payload: { id: string; contextTransform: string } }
  | { type: 'IMPORT_PLAYGROUND_DATA'; payload: { components: ComponentConfig[]; techStack?: TechStack } }; 