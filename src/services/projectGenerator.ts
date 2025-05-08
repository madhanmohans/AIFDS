import archiver from 'archiver';
import fs from 'fs-extra';
import path from 'path';
import type { ProjectConfig } from '../types';

export class ProjectGenerator {
  private async createProjectStructure(config: ProjectConfig, outputPath: string) {
    const { name, techStack } = config;
    const projectPath = path.join(outputPath, name);

    // Create project directory
    await fs.ensureDir(projectPath);

    // Create package.json
    const packageJson = {
      name,
      version: '0.1.0',
      private: true,
      dependencies: techStack.dependencies,
      devDependencies: techStack.devDependencies,
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
      },
    };

    await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });

    // Create tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
      },
      include: ['src'],
      references: [{ path: './tsconfig.node.json' }],
    };

    await fs.writeJson(path.join(projectPath, 'tsconfig.json'), tsConfig, { spaces: 2 });

    // Create basic project structure
    const dirs = ['src', 'src/components', 'src/assets', 'public'];
    for (const dir of dirs) {
      await fs.ensureDir(path.join(projectPath, dir));
    }

    // Create index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

    await fs.writeFile(path.join(projectPath, 'index.html'), indexHtml);

    // Create main.tsx
    const mainTsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;

    await fs.writeFile(path.join(projectPath, 'src/main.tsx'), mainTsx);

    // Create App.tsx
    const appTsx = `import { useState } from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <h1>Welcome to ${name}</h1>
    </div>
  )
}

export default App`;

    await fs.writeFile(path.join(projectPath, 'src/App.tsx'), appTsx);

    return projectPath;
  }

  public async generateProject(config: ProjectConfig): Promise<string> {
    const tempDir = path.join(process.cwd(), 'temp');
    await fs.ensureDir(tempDir);

    const projectPath = await this.createProjectStructure(config, tempDir);
    const zipPath = path.join(tempDir, `${config.name}.zip`);

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    archive.pipe(output);
    archive.directory(projectPath, false);
    await archive.finalize();

    return zipPath;
  }
} 