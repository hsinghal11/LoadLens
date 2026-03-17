import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { planService } from '@/api/services';
import type { TestPlanResponse } from '@/api/services';
import { PlanTable } from '@/components/plans/PlanTable';
import { CreatePlanModal } from '@/components/plans/CreatePlanModal';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';

export default function PlansPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TestPlanResponse | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setIsModalOpen(true);
      searchParams.delete('new');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const { data: plans, isLoading, isError } = useQuery({
    queryKey: ['plans'],
    queryFn: planService.getAll,
  });

  const createMutation = useMutation({
    mutationFn: planService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success("Plan created successfully");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create plan");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => planService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan', variables.id] });
      toast.success("Plan updated successfully");
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update plan");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: planService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast.success("Plan deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete plan");
    }
  });

  const startRunMutation = useMutation({
    mutationFn: planService.startRun,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan', id] });
      toast.success("Run started");
      navigate(`/plans/${id}/run`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to start run");
    }
  });

  const abortRunMutation = useMutation({
    mutationFn: planService.abortRun,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['plan', id] });
      toast.success("Run aborted");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to abort run");
    }
  });

  const openNewModal = () => {
    setEditingPlan(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setEditingPlan(null), 200); // Wait for modal exit render transition
  };

  const handleModalSubmit = (data: any) => {
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, payload: data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (plan: TestPlanResponse) => {
    if (confirm(`Are you sure you want to delete "${plan.name}"?`)) {
      deleteMutation.mutate(plan.id);
    }
  };

  const handleRun = (plan: TestPlanResponse) => {
    startRunMutation.mutate(plan.id);
  };

  const handleAbort = (plan: TestPlanResponse) => {
    if (confirm(`Are you sure you want to abort the run for "${plan.name}"?`)) {
      abortRunMutation.mutate(plan.id);
    }
  };

  if (isLoading) return <LoadingState />;

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500">
        <p>Failed to load plans.</p>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['plans'] })} className="mt-4" variant="outline">Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Test Plans</h1>
        <Button onClick={openNewModal}>
          <Plus className="h-4 w-4 mr-2" />
          New Plan
        </Button>
      </div>

      {!plans || plans.length === 0 ? (
        <EmptyState 
          icon={<Plus className="w-8 h-8" />}
          title="No test plans yet"
          description="Create your first test plan to start load testing your APIs."
          actionLabel="Create Test Plan"
          onAction={openNewModal}
        />
      ) : (
        <PlanTable 
          plans={plans} 
          onRun={handleRun}
          onAbort={handleAbort}
          onEdit={(plan) => {
            setEditingPlan(plan);
            setIsModalOpen(true);
          }}
          onDelete={handleDelete}
        />
      )}

      <CreatePlanModal 
        isOpen={isModalOpen} 
        onClose={closeModal}
        initialData={editingPlan}
        onSubmit={handleModalSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}
