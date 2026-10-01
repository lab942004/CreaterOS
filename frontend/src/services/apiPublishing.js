import { apiRequest } from './apiCore';

export const publishingApi = {
  getCalendarEvents: () => apiRequest('/publishing/calendar'),
  rescheduleEvent: (data) => apiRequest('/publishing/calendar/reschedule', { method: 'POST', body: JSON.stringify(data) }),
  composePost: (data) => apiRequest('/publishing/compose', { method: 'POST', body: JSON.stringify(data) }),
  getSmartScheduler: () => apiRequest('/publishing/smart-scheduler'),
  getPublishingQueue: () => apiRequest('/publishing/queue'),

  getVideos: () => apiRequest('/videos'),
  getVideoDetail: (id) => apiRequest(`/videos/${id}`),
  uploadVideo: (data) => apiRequest('/videos/upload', { method: 'POST', body: JSON.stringify(data) }),
  getVideoTranscript: (id) => apiRequest(`/videos/${id}/transcript`),
  updateVideoTranscript: (id, text) => apiRequest(`/videos/${id}/transcript`, { method: 'PUT', body: JSON.stringify({ text }) }),
  getVideoClips: (id) => apiRequest(`/videos/${id}/clips`),
  generateClip: (id) => apiRequest(`/videos/${id}/clips/generate`, { method: 'POST' }),
  repurposeVideo: (id, data) => apiRequest(`/videos/${id}/repurpose`, { method: 'POST', body: JSON.stringify(data) }),
  getThumbnails: () => apiRequest('/thumbnails'),
  generateThumbnail: (data) => apiRequest('/thumbnails/generate', { method: 'POST', body: JSON.stringify(data) })
};

