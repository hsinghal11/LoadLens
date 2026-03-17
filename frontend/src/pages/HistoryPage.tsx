import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { GitCompare, Filter, Calendar } from 'lucide-react';

import { planService, runService } from '@/api/services';
import { RunTable } from '@/components/runs/RunTable';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/LoadingState';

export default function HistoryPage() {
  const navigate = useNavigate();

  const [selectedRunIds, setSelectedRunIds] = useState<number[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: plans, isLoading: isPlansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: planService.getAll,
  });

  const planIds = plans?.map(p => p.id) || [];

  const { data: runs, isLoading: isRunsLoading } = useQuery({
    queryKey: ['runs', planIds],
    queryFn: () => runService.getAllAcrossPlans(planIds),
    enabled: planIds.length > 0,
  });

  const filteredRuns = useMemo(() => {
    if (!runs) return [];
    return runs.filter(run => {
      // Plan Filter
      if (selectedPlanId !== 'all' && run.planId?.toString() !== selectedPlanId) return false;
      // Date Filter
      if (startDate) {
        const runDate = new Date(run.startedAt).toISOString().split('T')[0];
        if (runDate < startDate) return false;
      }
      return true;
    }).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }, [runs, selectedPlanId, startDate]);

  const totalPages = Math.ceil(filteredRuns.length / itemsPerPage);
  const paginatedRuns = filteredRuns.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleCompare = () => {
    if (selectedRunIds.length === 2) {
      navigate(`/compare?run1=${selectedRunIds[0]}&run2=${selectedRunIds[1]}`);
    }
  };

  if (isPlansLoading || (planIds.length > 0 && isRunsLoading)) {
    return <LoadingState message="Loading run history..." />;
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Run History</h1>
        
        <div className="h-10 flex items-center transition-all">
          {selectedRunIds.length > 0 && (
            <Button 
              variant={selectedRunIds.length === 2 ? "default" : "outline"}
              disabled={selectedRunIds.length !== 2}
              onClick={handleCompare}
              className="animate-in fade-in slide-in-from-right-4 bg-primary text-primary-foreground"
            >
              <GitCompare className="w-4 h-4 mr-2" />
              {selectedRunIds.length === 2 ? "Compare Selected" : `Select 2 runs (${selectedRunIds.length} selected)`}
            </Button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border rounded-xl shadow-sm items-end sm:items-center">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            Filter by Plan
          </label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedPlanId}
            onChange={(e) => {
              setSelectedPlanId(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Plans</option>
            {plans?.map(plan => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
          <label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            From Date
          </label>
          <input 
            type="date"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <RunTable 
        runs={paginatedRuns.map(r => ({
          ...r,
          planName: plans?.find(p => p.id === r.planId)?.name
        }))} 
        showPlanName={true}
        onSelectionChange={setSelectedRunIds}
        onRowClick={(id) => navigate(`/plans/${runs?.find(r => r.id === id)?.planId}`)}
      />

      {/* Basic Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(page * itemsPerPage, filteredRuns.length)}</span> of <span className="font-medium">{filteredRuns.length}</span> results
          </p>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <div className="text-sm font-medium mx-2 flex gap-1 items-center">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button 
                  key={i} 
                  className={`h-8 w-8 flex justify-center items-center rounded-md ${page === i + 1 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
