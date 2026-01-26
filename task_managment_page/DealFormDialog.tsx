import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: any;
}

const stageOptions = [
  { value: 'inquiry', label: 'Inquiry' },
  { value: 'quote_requested', label: 'Quote Requested' },
  { value: 'quote_received', label: 'Quote Received' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'po_sent', label: 'PO Sent' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_production', label: 'In Production' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'lost', label: 'Lost' },
];

const DealFormDialog = ({ open, onOpenChange, deal }: DealFormDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: deal?.title || '',
    description: deal?.description || '',
    supplier_id: deal?.supplier_id || '',
    project_id: deal?.project_id || '',
    stage: deal?.stage || 'inquiry',
    estimated_value: deal?.estimated_value?.toString() || '',
    probability: deal?.probability?.toString() || '',
    expected_close_date: deal?.expected_close_date || '',
  });

  useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title || '',
        description: deal.description || '',
        supplier_id: deal.supplier_id || '',
        project_id: deal.project_id || '',
        stage: deal.stage || 'inquiry',
        estimated_value: deal.estimated_value?.toString() || '',
        probability: deal.probability?.toString() || '',
        expected_close_date: deal.expected_close_date || '',
      });
    }
  }, [deal]);

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-dropdown'],
    queryFn: async () => {
      const { data } = await supabase
        .from('suppliers')
        .select('id, name')
        .order('name');
      return data || [];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-dropdown'],
    queryFn: async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, name')
        .order('name');
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.supplier_id) {
      toast.error('Please select a supplier');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        supplier_id: formData.supplier_id,
        project_id: formData.project_id || null,
        stage: formData.stage as any,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : null,
        probability: formData.probability ? parseInt(formData.probability) : null,
        expected_close_date: formData.expected_close_date || null,
      };

      if (deal) {
        const { error } = await supabase
          .from('deals')
          .update(payload)
          .eq('id', deal.id);

        if (error) throw error;
        toast.success('Deal updated successfully');
      } else {
        const { error } = await supabase.from('deals').insert({
          ...payload,
          owner_id: user.id,
        });

        if (error) throw error;
        toast.success('Deal created successfully');
      }

      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['recent-deals'] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{deal ? 'Edit Deal' : 'New Deal'}</DialogTitle>
          <DialogDescription>
            {deal ? 'Update deal details' : 'Create a new procurement deal'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Deal Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier *</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers?.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => setFormData({ ...formData, project_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData({ ...formData, stage: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stageOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_value">Estimated Value</Label>
              <Input
                id="estimated_value"
                type="number"
                value={formData.estimated_value}
                onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="probability">Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expected_close_date">Expected Close</Label>
              <Input
                id="expected_close_date"
                type="date"
                value={formData.expected_close_date}
                onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {deal ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DealFormDialog;
