import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { Button } from "../ui/button";
import { X } from "lucide-react";
import type { TestPlanResponse } from "@/api/services";

const toNum = (val: unknown) => (val === '' || val === undefined ? undefined : Number(val));

const planSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  targetUrl: z.string().url("Must be a valid URL starting with http:// or https://"),
  virtualUsers: z.preprocess(toNum, z.number().min(1).max(500)),
  durationSeconds: z.preprocess(toNum, z.number().min(5).max(300)),
  rampUpSeconds: z.preprocess(toNum, z.number().min(0).max(150)),
}).refine(data => (data.rampUpSeconds as number) <= (data.durationSeconds as number) / 2, {
  message: "Ramp-up must be at most half of the total duration",
  path: ["rampUpSeconds"]
});

type PlanFormValues = z.infer<typeof planSchema>;

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PlanFormValues) => void;
  initialData?: TestPlanResponse | null;
  isLoading?: boolean;
}

export function CreatePlanModal({ isOpen, onClose, onSubmit, initialData, isLoading }: CreatePlanModalProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PlanFormValues, unknown, PlanFormValues>({
    resolver: zodResolver(planSchema) as any,
    defaultValues: {
      name: "",
      targetUrl: "",
      virtualUsers: 100,
      durationSeconds: 60,
      rampUpSeconds: 15,
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          targetUrl: initialData.targetUrl,
          virtualUsers: initialData.virtualUsers,
          durationSeconds: initialData.durationSeconds,
          rampUpSeconds: initialData.rampUpSeconds,
        });
      } else {
        reset({
          name: "",
          targetUrl: "",
          virtualUsers: 100,
          durationSeconds: 60,
          rampUpSeconds: 15,
        });
      }
    }
  }, [isOpen, initialData, reset]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-lg border rounded-xl shadow-lg relative flex flex-col max-h-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{initialData ? "Edit Plan" : "New Test Plan"}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Plan Name</label>
            <input
              {...register("name")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="e.g. Auth API Stress Test"
            />
            {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Target URL</label>
            <input
              {...register("targetUrl")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="https://example.com/api"
            />
            {errors.targetUrl && <span className="text-xs text-red-500">{errors.targetUrl.message}</span>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Virtual Users</label>
              <input
                type="number"
                {...register("virtualUsers")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              {errors.virtualUsers && <span className="text-xs text-red-500">{errors.virtualUsers.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Duration (s)</label>
              <input
                type="number"
                {...register("durationSeconds")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              {errors.durationSeconds && <span className="text-xs text-red-500">{errors.durationSeconds.message}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Ramp-up (s)</label>
              <input
                type="number"
                {...register("rampUpSeconds")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
              {errors.rampUpSeconds && <span className="text-xs text-red-500">{errors.rampUpSeconds.message}</span>}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : initialData ? "Save Changes" : "Create Plan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
