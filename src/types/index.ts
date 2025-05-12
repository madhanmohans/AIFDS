// Tech Stack Types
export type TechStack = {
  name: string;
  template: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

// Project Configuration Types
export type ProjectConfig = {
  name: string;
  techStack: TechStack;
  features: string[];
  components: string[];
};

// Template Types
export type Template = {
  id: string;
  name: string;
  description: string;
  techStack: TechStack;
  structure: Record<string, string>;
};

// Playground Component Types
export interface PlaygroundComponent {
  id: string;
  type: string;
  props: Record<string, any>;
  children?: PlaygroundComponent[];
}

// Re-export all types from playground.ts
export * from './playground'; 