import type { SourceAdapter } from "@pe/shared";
import { confstechAdapter } from "./confstech.js";
import { eventbriteAdapter } from "./eventbrite.js";
import { tentimesAdapter } from "./tentimes.js";
import { lumaAdapter } from "./luma.js";
import { meetupAdapter } from "./meetup.js";
import { partifulAdapter } from "./partiful.js";

/** All registered adapters keyed by source key. Toggle on/off via the `sources` table. */
export const ADAPTERS: Record<string, SourceAdapter> = {
  confstech: confstechAdapter,
  eventbrite: eventbriteAdapter,
  tentimes: tentimesAdapter,
  luma: lumaAdapter,
  meetup: meetupAdapter,
  partiful: partifulAdapter,
};
