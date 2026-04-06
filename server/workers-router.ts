import { D1Store } from './d1-store.js';
import { Env } from './workers-entry.js';

export interface RouteContext {
  store: D1Store;
  env: Env;
  params: Record<string, string>;
}

export type RouteHandler = (request: Request, context: RouteContext) => Promise<Response>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

export class Router {
  private routes: Route[] = [];
  private env: Env;
  private store: D1Store;

  constructor(env: Env, store: D1Store) {
    this.env = env;
    this.store = store;
  }

  private addRoute(method: string, path: string, handler: RouteHandler): void {
    // Convert path pattern to regex
    const paramNames: string[] = [];
    let pattern = path
      .replace(/:([^/]+)/g, (match, name) => {
        paramNames.push(name);
        return '([^/]+)';
      })
      .replace(/\*/g, '.*');
    
    this.routes.push({
      method: method.toUpperCase(),
      pattern: new RegExp(`^${pattern}$`),
      paramNames,
      handler
    });
  }

  get(path: string, handler: RouteHandler): void {
    this.addRoute('GET', path, handler);
  }

  post(path: string, handler: RouteHandler): void {
    this.addRoute('POST', path, handler);
  }

  put(path: string, handler: RouteHandler): void {
    this.addRoute('PUT', path, handler);
  }

  patch(path: string, handler: RouteHandler): void {
    this.addRoute('PATCH', path, handler);
  }

  delete(path: string, handler: RouteHandler): void {
    this.addRoute('DELETE', path, handler);
  }

  async handle(request: Request, url: URL): Promise<Response> {
    const pathname = url.pathname;
    const method = request.method.toUpperCase();

    // Find matching route
    for (const route of this.routes) {
      if (route.method !== method && method !== 'OPTIONS') {
        continue;
      }

      const match = pathname.match(route.pattern);
      if (match) {
        // Extract params
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        const context: RouteContext = {
          store: this.store,
          env: this.env,
          params
        };

        try {
          return await route.handler(request, context);
        } catch (error) {
          console.error('Route handler error:', error);
          return new Response(
            JSON.stringify({
              success: false,
              message: error instanceof Error ? error.message : 'Internal server error',
              error: 'Internal server error'
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      }
    }

    // No route matched
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Endpoint not found.'
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
