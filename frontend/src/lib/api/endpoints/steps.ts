/**
 * Steps API endpoints
 */

import { axios, axiosForFiles } from '../client.js';
import type { Step, StepChecklist } from '../types/service.types.js';

export interface UpdateStepDto {
  observation?: string;
  responsableClient?: string;
  responsableId?: number | null;
}

export interface CreateChecklistDto {
  description: string;
  completed?: boolean;
}

export const stepsApi = {
  getMySteps: (filter?: 'created_today' | 'expires_today' | 'expired'): Promise<Step[]> => {
    const params = filter ? { filter } : {};
    return axios.get('/steps/my-steps', { params }).then(res => res.data);
  },

  getStepsByUserId: (userId: number, filter?: 'created_today' | 'expires_today' | 'expired'): Promise<Step[]> => {
    const params = filter ? { filter } : {};
    return axios.get(`/steps/user/${userId}`, { params }).then(res => res.data);
  },

  getById: (id: number): Promise<Step> =>
    axios.get(`/steps/${id}`).then(res => res.data),

  update: (id: number, data: UpdateStepDto): Promise<Step> =>
    axios.patch(`/steps/${id}`, data).then(res => res.data),

  start: (id: number): Promise<Step> =>
    axios.patch(`/steps/${id}/start`).then(res => res.data),

  conclude: (id: number): Promise<Step> =>
    axios.patch(`/steps/${id}/conclude`).then(res => res.data),

  cancel: (id: number, reason: string): Promise<Step> =>
    axios.patch(`/steps/${id}/cancel`, { reason }).then(res => res.data),

  uploadImage: (stepId: number, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('image', file);
    return axiosForFiles.post(`/steps/${stepId}/images`, formData).then(res => res.data);
  },

  getImages: (stepId: number): Promise<any[]> =>
    axios.get(`/steps/${stepId}/images`).then(res => res.data),

  deleteImage: (stepId: number, imageId: number): Promise<void> =>
    axios.delete(`/steps/${stepId}/images/${imageId}`).then(res => res.data),

  // Checklist endpoints
  getChecklists: (stepId: number): Promise<StepChecklist[]> =>
    axios.get(`/steps/${stepId}/checklists`).then(res => res.data),

  createChecklist: (stepId: number, data: CreateChecklistDto): Promise<StepChecklist> =>
    axios.post(`/steps/${stepId}/checklists`, data).then(res => res.data),

  createChecklistsBulk: (stepId: number, descriptions: string[]): Promise<StepChecklist[]> =>
    axios.post(`/steps/${stepId}/checklists/bulk`, { descriptions }).then(res => res.data),

  updateChecklist: (checklistId: number, data: Partial<CreateChecklistDto>): Promise<StepChecklist> =>
    axios.patch(`/steps/checklists/${checklistId}`, data).then(res => res.data),

  toggleChecklist: (checklistId: number): Promise<StepChecklist> =>
    axios.patch(`/steps/checklists/${checklistId}/toggle`).then(res => res.data),

  deleteChecklist: (checklistId: number): Promise<void> =>
    axios.delete(`/steps/checklists/${checklistId}`).then(res => res.data),

  deleteAllChecklists: (stepId: number): Promise<void> =>
    axios.delete(`/steps/${stepId}/checklists`).then(res => res.data),
};

