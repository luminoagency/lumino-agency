/**
 * Shared domain types for Lumino Agency.
 * TODO: expand as the data model in Supabase takes shape.
 */

export interface Restaurant {
  id: string;
  name: string;
  // TODO: address, placeId, phone, cuisine, etc.
}

export interface GeneratedSite {
  id: string;
  restaurantId: string;
  // TODO: domain, status, deploymentUrl, etc.
}
