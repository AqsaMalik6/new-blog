export interface Blog {
  id: string;
  brand_id: string;
  title: string;
  content: string;
  meta_description: string;
  image_url: string | null;
  source_url: string | null;
  keyword_targets: string[];
  word_count: number;
  created_at: string;
}

export interface BlogListItem {
  id: string;
  title: string;
  meta_description: string;
  image_url: string | null;
  word_count: number;
  created_at: string;
}

export interface BlogListResponse {
  blogs: BlogListItem[];
  total: number;
}

export interface GenerateRequest {
  query: string;
  source_url?: string;
}
