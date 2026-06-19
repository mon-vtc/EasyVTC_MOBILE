// __tests__/jest.setup.ts
// Configuration globale des tests Jest

// Réinitialise les mocks entre chaque test pour éviter les fuites d'état
beforeEach(() => {
  jest.clearAllMocks();
});

// Polyfill FormData pour l'environnement Node.js (si non disponible)
if (typeof FormData === 'undefined') {
  (global as any).FormData = class FormData {
    private data: Record<string, any> = {};
    append(key: string, value: any) { this.data[key] = value; }
    get(key: string) { return this.data[key]; }
    has(key: string) { return key in this.data; }
  };
}