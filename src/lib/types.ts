export type Space={id:string;slug:string;name:string;description:string;accent:'forest'|'ocean'|'plum'|'terracotta';created_at:string;updated_at:string};
export type Category = { id: string; name: string; slug: string; description: string; sort_order: number };
export type Tag = { id: string; name: string; slug: string };
export type Post = {
  id: string; space_id: string; space?: Space; title: string; slug: string; content: string; summary: string;
  status: 'public' | 'private'; category_id: string | null; cover_asset_id: string | null;
  seo_title: string; seo_description: string; author: string;
  created_at: string; updated_at: string; published_at: string | null; deleted_at: string | null;
  version: number; topics?: string[]; category?: Category | null; tags?: Tag[];
};
export type Asset = { id: string; post_id: string; space_id?: string; storage_key?: string; name: string; mime: string; size: number; ready: boolean };

export type PostPreview=Pick<Post,"id"|"space_id"|"space"|"title"|"slug"|"summary"|"status"|"author"|"created_at"|"updated_at"|"published_at"|"cover_asset_id"|"category_id"|"category"> & {content?:string;reading_minutes?:number};
