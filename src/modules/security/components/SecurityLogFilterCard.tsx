"use client";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {Filter, Search} from "lucide-react";

type SecurityLogFilterCardProps = {
  actorRole: string;
  setActorRole: (val: string) => void;
  eventType: string;
  setEventType: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  dateFrom: string;
  setDateFrom: (val: string) => void;
  dateTo: string;
  setDateTo: (val: string) => void;
  actorOptions: readonly { value: string; label: string }[];
  eventOptions: readonly { value: string; label: string }[];
  statusOptions: readonly { value: string; label: string }[];
  onApply: () => void;
  onReset: () => void;
};

export function SecurityLogFilterCard({
                                        actorRole,
                                        setActorRole,
                                        eventType,
                                        setEventType,
                                        status,
                                        setStatus,
                                        dateFrom,
                                        setDateFrom,
                                        dateTo,
                                        setDateTo,
                                        actorOptions,
                                        eventOptions,
                                        statusOptions,
                                        onApply,
                                        onReset,
                                      }: SecurityLogFilterCardProps) {
  return (
    <Card className="border-muted-foreground/10 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="size-4"/>
          Filter & Pencarian
        </CardTitle>
        <CardDescription className="hidden sm:block">
          Saring log berdasarkan aktor, event, status, serta rentang tanggal.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-3 grid-cols-3 items-end">

            <Select value={actorRole} onValueChange={(val) => setActorRole(val ?? "all")}>
              <SelectTrigger id="sec-filter-actor" className="w-full" aria-label="Aktor">
                <SelectValue placeholder="Aktor"/>
              </SelectTrigger>
              <SelectContent>
                {actorOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={eventType} onValueChange={(val) => setEventType(val ?? "all")}>
              <SelectTrigger id="sec-filter-event" className="w-full" aria-label="Event">
                <SelectValue placeholder="Event"/>
              </SelectTrigger>
              <SelectContent>
                {eventOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(val) => setStatus(val ?? "all")}>
              <SelectTrigger id="sec-filter-status" className="w-full" aria-label="Status">
                <SelectValue placeholder="Status"/>
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sec-filter-date-from" className="text-[11px] font-medium text-muted-foreground">
                Dari tanggal
              </Label>
              <Input
                id="sec-filter-date-from"
                type="date"
                className="px-2 text-xs"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sec-filter-date-to" className="text-[11px] font-medium text-muted-foreground">
                Sampai tanggal
              </Label>
              <Input
                id="sec-filter-date-to"
                type="date"
                className="px-2 text-xs"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:justify-end">
            <Button type="button" className="gap-2 sm:w-auto" onClick={onApply}>
              <Search className="size-4"/>
              Terapkan
            </Button>
            <Button type="button" variant="outline" className="sm:w-auto" onClick={onReset}>
              Reset
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
