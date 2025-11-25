export interface ProjectRecord {
  id?: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}
