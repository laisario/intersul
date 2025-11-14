/**
 * Steps API endpoints
 */

import { axios, axiosForFiles } from '../client.js';
import type { Step } from '../types/service.types.js';

export interface UpdateStepDto {
  observation?: string;
  responsable_client?: string;
}

export const stepsApi = {
  /**
   * Get all steps assigned to current user
   */
  getMySteps: (filter?: 'created_today' | 'expires_today'): Promise<Step[]> => {
    const params = filter ? { filter } : {};
    return axios.get('/steps/my-steps', { params }).then(res => res.data);
  },

  /**
   * Get step by ID
   */
  getById: (id: number): Promise<Step> =>
    axios.get(`/steps/${id}`).then(res => res.data),

  /**
   * Update step
   */
  update: (id: number, data: UpdateStepDto): Promise<Step> =>
    axios.patch(`/steps/${id}`, data).then(res => res.data),

  /**
   * Start a step (change status from PENDING to IN_PROGRESS)
   */
  start: (id: number): Promise<Step> =>
    axios.patch(`/steps/${id}/start`).then(res => res.data),

  /**
   * Conclude a step (change status from IN_PROGRESS to CONCLUDED)
   */
  conclude: (id: number): Promise<Step> =>
    axios.patch(`/steps/${id}/conclude`).then(res => res.data),

  /**
   * Cancel a step (change status to CANCELLED)
   */
  cancel: (id: number, reason: string): Promise<Step> =>
    axios.patch(`/steps/${id}/cancel`, { reason }).then(res => res.data),

  /**
   * Upload an image for a step
   */
  uploadImage: (stepId: number, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('image', file);
    return axiosForFiles.post(`/steps/${stepId}/images`, formData).then(res => res.data);
  },

  /**
   * Get all images for a step
   */
  getImages: (stepId: number): Promise<any[]> =>
    axios.get(`/steps/${stepId}/images`).then(res => res.data),

  /**
   * Delete an image from a step
   */
  deleteImage: (stepId: number, imageId: number): Promise<void> =>
    axios.delete(`/steps/${stepId}/images/${imageId}`).then(res => res.data),
};

