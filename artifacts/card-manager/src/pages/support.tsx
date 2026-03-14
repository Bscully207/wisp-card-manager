import { useState } from "react";
import { useGetSupportTickets, useCreateSupportTicket, getGetSupportTicketsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LifeBuoy, Plus, Clock, CheckCircle2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const ticketSchema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.enum(["billing", "card", "account", "technical", "other"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function Support() {
  const { data: tickets = [], isLoading } = useGetSupportTickets();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { subject: "", category: "general" as any, message: "" },
  });

  const createMutation = useCreateSupportTicket({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSupportTicketsQueryKey() });
        toast({ title: "Support ticket created" });
        setOpen(false);
        form.reset();
      }
    }
  });

  const onSubmit = (values: z.infer<typeof ticketSchema>) => {
    createMutation.mutate({ data: values as any });
  };

  if (isLoading) {
    return <div className="animate-spin w-8 h-8 border-2 border-primary rounded-full border-t-transparent mx-auto mt-20"></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Support Center</h1>
          <p className="text-muted-foreground mt-1">We're here to help with your account and cards.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg hover-elevate">
              <Plus className="w-4 h-4 mr-2" /> New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-xl bg-card border-border/50">
            <DialogHeader>
              <DialogTitle>Submit a Request</DialogTitle>
              <DialogDescription>Describe your issue and our team will get back to you.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief summary of the issue" className="bg-black/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-black/20">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="card">Card Issue</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="account">Account Access</SelectItem>
                          <SelectItem value="technical">Technical Bug</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide details about your problem..." 
                          className="bg-black/20 min-h-[120px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full mt-4" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Submitting..." : "Submit Ticket"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {tickets.length > 0 ? tickets.map((ticket) => (
          <Card key={ticket.id} className="bg-card/40 border-border/50 hover:bg-card/60 transition-colors">
            <CardContent className="p-6 flex flex-col md:flex-row gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                  ticket.status === "resolved" || ticket.status === "closed" 
                    ? "bg-emerald-500/20 text-emerald-400" 
                    : "bg-blue-500/20 text-blue-400"
                )}>
                  {ticket.status === "resolved" || ticket.status === "closed" 
                    ? <CheckCircle2 className="w-6 h-6" />
                    : <MessageSquare className="w-6 h-6" />
                  }
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{ticket.subject}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="uppercase tracking-wider text-xs font-medium text-foreground border border-border/50 px-2 py-0.5 rounded-full bg-black/20">
                      {ticket.category}
                    </span>
                    <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {format(new Date(ticket.createdAt), "MMM d, yyyy")}</span>
                    <span>Ticket #{ticket.id.toString().padStart(4, '0')}</span>
                  </div>
                  <p className="mt-4 text-muted-foreground whitespace-pre-wrap">{ticket.message}</p>
                </div>
              </div>
              <div className="md:w-48 flex md:justify-end items-start border-t md:border-t-0 border-border/50 pt-4 md:pt-0">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                  ticket.status === 'open' ? "bg-primary/20 text-primary border border-primary/30" :
                  ticket.status === 'in_progress' ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                  "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                )}>
                  {ticket.status.replace("_", " ")}
                </span>
              </div>
            </CardContent>
          </Card>
        )) : (
          <div className="text-center py-16 bg-card/20 rounded-2xl border border-dashed border-border/50">
            <LifeBuoy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No support tickets</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2">You haven't submitted any support requests. If you need help, feel free to create a new ticket.</p>
          </div>
        )}
      </div>
    </div>
  );
}
