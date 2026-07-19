#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@sanity/client';

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
}

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET ?? 'production';
const token = process.env.SANITY_AUTH_TOKEN;
const apiVersion = '2025-01-01';

if (!projectId) {
  console.error('Missing PUBLIC_SANITY_PROJECT_ID.');
  process.exit(1);
}

if (!token) {
  console.error('Missing SANITY_AUTH_TOKEN with write access to the production dataset.');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false });

const products = await client.fetch(
  `*[_type == "product" && slug.current == "cupcakes"]{_id, _rev, name, price}`
);

if (products.length !== 1) {
  console.error(`Expected exactly one Cupcakes product, found ${products.length}.`);
  console.error(JSON.stringify(products, null, 2));
  process.exit(1);
}

const [cupcakes] = products;

if (cupcakes.price === 4) {
  console.log(`Cupcakes product ${cupcakes._id} already has base price $4.00.`);
} else {
  const result = await client.patch(cupcakes._id).ifRevisionId(cupcakes._rev).set({ price: 4 }).commit();
  console.log(`Updated Cupcakes product ${result._id} base price from $${cupcakes.price.toFixed(2)} to $4.00.`);
}

const verification = await client.fetch(
  `*[_type == "product"] | order(slug.current asc){slug, name, price, "modifiers": customOptions[].options[].priceModifier}`
);

console.log(JSON.stringify(verification, null, 2));
