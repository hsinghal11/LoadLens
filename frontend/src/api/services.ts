import api from './axios';

export interface TestPlanResponse {
  id: number;
  name: string;
  targetUrl: string;
  virtualUsers: number;
  durationSeconds: number;
  rampUpSeconds: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface RunResultResponse {
  id: number;
  planId?: number; // Added to help frontend identify parent
  planName?: string;
  startedAt: string;
  completedAt: string;
  totalRequests: number;
  errorCount: number;
  p50Latency: number;
  p95Latency: number;
  avgRps: number;
  errorRate: number;
  durationSeconds: number;
  status?: string; // Appended from History if needed
}

/**
 * Unwrap either a plain array OR a Spring Page/paginated object { content: [...] }.
 * Handles any shape the backend might return.
 */
function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'content' in data && Array.isArray((data as { content: unknown }).content)) {
    return (data as { content: T[] }).content;
  }
  console.warn('[services] Unexpected response shape (not an array or Page):', data);
  return [];
}

export const planService = {
  getAll: async (): Promise<TestPlanResponse[]> => {
    const { data } = await api.get('/api/plans');
    return toArray<TestPlanResponse>(data);
  },
  getOne: async (id: number): Promise<TestPlanResponse> => {
    const { data } = await api.get(`/api/plans/${id}`);
    return data;
  },
  create: async (payload: Omit<TestPlanResponse, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const { data } = await api.post('/api/plans', payload);
    return data;
  },
  update: async (id: number, payload: Omit<TestPlanResponse, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const { data } = await api.put(`/api/plans/${id}`, payload);
    return data;
  },
  delete: async (id: number) => {
    await api.delete(`/api/plans/${id}`);
  },
  startRun: async (id: number) => {
    const { data } = await api.post(`/api/plans/${id}/run`);
    return data;
  },
  abortRun: async (id: number) => {
    const { data } = await api.delete(`/api/plans/${id}/run`);
    return data;
  }
};

export const runService = {
  getByPlan: async (planId: number): Promise<RunResultResponse[]> => {
    const { data } = await api.get(`/api/runs/plan/${planId}`);
    return toArray<RunResultResponse>(data).map((r) => ({ ...r, planId }));
  },
  getOne: async (runId: number): Promise<RunResultResponse> => {
    const { data } = await api.get(`/api/runs/${runId}`);
    return data;
  },
  compare: async (run1Id: number, run2Id: number) => {
    const { data } = await api.get(`/api/runs/compare?run1=${run1Id}&run2=${run2Id}`);
    return data;
  },
  getAllAcrossPlans: async (planIds: number[]): Promise<(RunResultResponse & { planName: string })[]> => {
    if (!planIds.length) return [];
    
    // As confirmed, /api/runs does not exist. We fetch per plan.
    const responses = await Promise.all(
      planIds.map(id => api.get(`/api/runs/plan/${id}`).then(res =>
        toArray<RunResultResponse>(res.data).map((r) => ({ ...r, planId: id } as RunResultResponse & { planName: string }))
      ))
    );
    return responses.flat();
  }
};
