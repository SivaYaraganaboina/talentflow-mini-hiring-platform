import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import toast from 'react-hot-toast';
import { Job } from '../types';
import { generateSlug, ensureUniqueSlug } from '../utils/jobUtils';

interface JobModalProps {
  isOpen: boolean;
  onClose: () => void;
  job?: Job | null;
  onSave?: (jobData: any) => void;
}

const JobModal: React.FC<JobModalProps> = ({ isOpen, onClose, job, onSave }) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [slugError, setSlugError] = useState('');

  // Update form when job changes
  useEffect(() => {
    if (job) {
      setTitle(job.title || '');
      setSlug(job.slug || '');
      setDescription(job.description || '');
      setLocation(job.location || '');
      setTags(job.tags?.join(', ') || '');
    } else {
      setTitle('');
      setSlug('');
      setDescription('');
      setLocation('');
      setTags('');
    }
    setSlugError('');
  }, [job, isOpen]);

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !job) {
      const generatedSlug = generateSlug(title);
      setSlug(generatedSlug);
    }
  }, [title, job]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Job title is required');
      return;
    }
    
    if (!slug.trim()) {
      toast.error('Job slug is required');
      return;
    }
    
    setLoading(true);
    setSlugError('');
    
    try {
      // Ensure slug is unique
      const uniqueSlug = await ensureUniqueSlug(slug.trim(), job?.id);
      
      const jobData = {
        title: title.trim(),
        slug: uniqueSlug,
        description: description.trim(),
        location: location.trim(),
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      if (job) {
        // Edit existing job
        const response = await fetch(`/api/jobs/${job.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(jobData)
        });
        
        if (!response.ok) throw new Error('Failed to update job');
        toast.success('Job updated successfully!');
      } else {
        // Create new job
        const response = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...jobData,
            status: 'active',
            order: Date.now(),
          })
        });
        
        if (!response.ok) throw new Error('Failed to create job');
        toast.success('Job created successfully!');
      }
      
      if (onSave) onSave(jobData);
      onClose();
    } catch (error) {
      toast.error(job ? 'Failed to update job' : 'Failed to create job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={job ? 'Edit Job' : 'Create Job'}
      size="lg"
    >
      <div className="space-y-6">
        <Input
          label="Job Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter job title"
          required
          fullWidth
        />
        
        <Input
          label="Job Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="job-slug-url"
          helperText="URL-friendly identifier (auto-generated from title)"
          error={slugError}
          required
          fullWidth
        />
        
        <Input
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter location"
          fullWidth
        />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter job description"
            rows={4}
            className="input-base"
          />
        </div>
        
        <Input
          label="Tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="React, TypeScript, Node.js"
          helperText="Separate tags with commas"
          fullWidth
        />
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} loading={loading}>
            {job ? 'Update Job' : 'Create Job'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default JobModal;