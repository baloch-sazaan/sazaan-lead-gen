'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  niche: z.enum(['cafe', 'clinic'], {
    required_error: 'Please select a niche',
  }),
});

export function CreateCampaignDialog() {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const supabase = createClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const { error } = await supabase
      .from('campaigns')
      .insert({
        name: values.name,
        description: values.description,
        niche: values.niche,
        status: 'draft',
      });

    if (error) {
      toast.error('Failed to create campaign');
      console.error(error);
      return;
    }

    toast.success('Campaign created successfully');
    queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    setOpen(false);
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-accent-primary hover:bg-accent-glow text-white border-none gap-2 shadow-glow-sm">
          <Plus size={16} />
          Create Campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-white/10 bg-bg-surface/95 backdrop-blur-2xl text-text-primary sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-display font-bold">New Campaign</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">Campaign Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g. Austin Coffee Shops Q2" 
                      {...field} 
                      className="bg-white/5 border-white/10 focus:border-accent-primary/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="niche"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">Target Niche</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white/5 border-white/10 focus:border-accent-primary/50">
                        <SelectValue placeholder="Select a niche" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="glass border-white/10 bg-bg-surface text-text-primary">
                      <SelectItem value="cafe">Cafes</SelectItem>
                      <SelectItem value="clinic">Clinics</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-text-secondary">Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Goal of this campaign..." 
                      className="bg-white/5 border-white/10 focus:border-accent-primary/50 min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-accent-primary hover:bg-accent-glow text-white"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Creating...' : 'Create Campaign'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
