import { useState } from "react";
import { useLocation } from "wouter";
import { useGetCards, useCreateCard, getGetCardsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { CreditCard } from "@/components/credit-card";
import { Plus, CreditCard as CardIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const createCardSchema = z.object({
  label: z.string().min(1, "Label is required"),
  currency: z.string().default("EUR"),
  color: z.string().default("blue"),
});

export default function Cards() {
  const [_, setLocation] = useLocation();
  const { data: cards = [], isLoading } = useGetCards();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof createCardSchema>>({
    resolver: zodResolver(createCardSchema),
    defaultValues: { label: "", currency: "EUR", color: "blue" },
  });

  const createMutation = useCreateCard({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCardsQueryKey() });
        toast({ title: "Card created successfully" });
        setOpen(false);
        form.reset();
      },
      onError: (err: any) => {
        toast({ title: "Failed to create card", description: err.message, variant: "destructive" });
      }
    }
  });

  const onSubmit = (values: z.infer<typeof createCardSchema>) => {
    createMutation.mutate({ data: values });
  };

  if (isLoading) {
    return <div className="animate-spin w-8 h-8 border-2 border-primary rounded-full border-t-transparent mx-auto mt-20"></div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">My Cards</h1>
          <p className="text-muted-foreground mt-1">Manage your virtual and physical cards.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl shadow-lg hover-elevate">
              <Plus className="w-4 h-4 mr-2" /> Create Card
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border/50 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl">Create New Card</DialogTitle>
              <DialogDescription>
                Configure the details for your new virtual debit card.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Card Label</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Groceries, Travel" className="bg-black/20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-black/20">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="EUR">EUR (€)</SelectItem>
                            <SelectItem value="USD">USD ($)</SelectItem>
                            <SelectItem value="GBP">GBP (£)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Design</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-black/20">
                              <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="blue">Electric Blue</SelectItem>
                            <SelectItem value="black">Obsidian Black</SelectItem>
                            <SelectItem value="silver">Titanium Silver</SelectItem>
                            <SelectItem value="purple">Neon Purple</SelectItem>
                            <SelectItem value="green">Emerald Green</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button type="submit" className="w-full mt-6 rounded-xl hover-elevate" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Issue Card"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {cards.length === 0 ? (
        <div className="border border-dashed border-border p-12 rounded-2xl flex flex-col items-center justify-center text-center bg-card/20">
          <CardIcon className="w-16 h-16 text-muted-foreground mb-4 opacity-40" />
          <h2 className="text-xl font-semibold mb-2">No cards active</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">You haven't created any cards yet. Create your first virtual card to start transacting.</p>
          <Button onClick={() => setOpen(true)} variant="outline">Create a Card Now</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <CreditCard 
                card={card} 
                onClick={() => setLocation(`/cards/${card.id}`)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
