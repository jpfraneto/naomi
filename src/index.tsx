/** @jsxImportSource frog/jsx */
import dotenv from 'dotenv';
import { Frog } from "frog";
import { serve } from "@hono/node-server";
import { serveStatic } from "frog/serve-static";
import { SECRET,  AIRSTACK_API_KEY} from '../env/server-env';
import { Logger } from '../utils/Logger';
import { devtools } from "frog/dev";
import { getPublicUrl } from '../utils/url';
import { cors } from "hono/cors"


// **** ROUTE IMPORTS ****
import { Redis } from 'ioredis';

dotenv.config();

// **** ROUTE IMPORTS ****
import { higherFrame } from './routes/higher-frame';


const origin = getPublicUrl();
console.log({ origin });

export const app = new Frog({
  hub: {
    apiUrl: "https://hubs.airstack.xyz",
    fetchOptions: {
      headers: {
        "x-airstack-hubs": AIRSTACK_API_KEY,
      }
    }
  },
  assetsPath: '/',
  basePath: '/',
  origin,
  secret: process.env.NODE_ENV === 'production' ? SECRET : undefined,
});

app.use('*', cors({
  origin: ['http://localhost:3000', 'https://poiesis.anky.bot'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization', "x-api-key"],
  exposeHeaders: ['Content-Length', 'X-Requested-With'],
  credentials: true,
  maxAge: 600,
}))

app.use(async (c, next) => {
  const fullUrl = c.req.url;
  const [baseUrl, queryString] = fullUrl.split('?');
  
  Logger.info(`[${c.req.method}] ${baseUrl}`);

  await next();
});

app.route('/higher', higherFrame)


// API ROUTES 


/// LIVESTREAMS ROUTE


app.get("/aloja", (c) => {
  return c.json({
    134: 124,
  });
});

app.use("/*", serveStatic({ root: "./public" }));
devtools(app, { serveStatic });

const port = process.env.PORT || 3000;
console.log("the port is: ", port)

serve({
  fetch: app.fetch,
  port: Number(port),
})


console.log(`Server is running on port ${port}`)

