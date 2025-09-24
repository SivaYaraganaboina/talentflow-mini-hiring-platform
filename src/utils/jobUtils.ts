// Utility functions for job management
export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

export const validateSlugUniqueness = async (slug: string, excludeId?: string): Promise<boolean> => {
  const { db } = await import('../services/database');
  
  let query = db.jobs.where('slug').equals(slug);
  
  if (excludeId) {
    const jobs = await query.toArray();
    return !jobs.some(job => job.id !== excludeId);
  }
  
  const count = await query.count();
  return count === 0;
};

export const ensureUniqueSlug = async (baseSlug: string, excludeId?: string): Promise<string> => {
  let slug = baseSlug;
  let counter = 1;
  
  while (!(await validateSlugUniqueness(slug, excludeId))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};