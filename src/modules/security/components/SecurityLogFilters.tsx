"use client";

import { Filter, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type FilterOption = { value: string; label: string };

type SecurityLogFiltersProps = {
  actorRole: string;
  eventType: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  actorOptions: readonly FilterOption[];
  eventOptions: readonly FilterOption[];
  statusOptions: readonly FilterOption[];
  onActorRoleChange: (value: string) => void;
  onEventTypeChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
};

export function SecurityLogFilters({ actorRole, eventType, status, dateFrom, dateTo, actorOptions, eventOptions, statusOptions, onActorRoleChange, onEventTypeChange, onStatusChange, onDateFromChange, onDateToChange, onApply, onReset }: SecurityLogFiltersProps) {
  return (
      <Card className="border-muted-foreground/10 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="size-4" />
            Filter & Pencarian
          </CardTitle>
          <CardDescription>Saring berdasarkan aktor, event, status, dan rentang tanggal.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-[minmax(150px,0.9fr)_minmax(190px,1.1fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)_auto] lg:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="actor-role">Aktor</Label>
              <Select value={actorRole} onValueChange={(value) => onActorRoleChange(value ?? "all")}>
                <SelectTrigger id="actor-role" className="w-full">
                  <SelectValue placeholder="Semua aktor" />
                </SelectTrigger>
                <SelectContent>
                  {actorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="event-type">Event</Label>
              <Select value={eventType} onValueChange={(value) => onEventTypeChange(value ?? "all")}>
                <SelectTrigger id="event-type" className="w-full">
                  <SelectValue placeholder="Semua event" />
                </SelectTrigger>
                <SelectContent>
                  {eventOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="security-status">Status</Label>
              <Select value={status} onValueChange={(value) => onStatusChange(value ?? "all")}>
                <SelectTrigger id="security-status" className="w-full">
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date-from">Dari tanggal</Label>
              <Input id="date-from" type="date" value={dateFrom} onChange={(event) => onDateFromChange(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date-to">Sampai tanggal</Label>
              <Input id="date-to" type="date" value={dateTo} onChange={(event) => onDateToChange(event.target.value)} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
              <Button type="button" className="gap-2" onClick={onApply}>
                <Search className="size-4" />
                Terapkan
              </Button>
              <Button type="button" variant="outline" onClick={onReset}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
  );
}
