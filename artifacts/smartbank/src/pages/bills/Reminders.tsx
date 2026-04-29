import { useState } from "react";
import { useGsapPage } from "@/hooks/useGsapPage";
import { ArrowLeft, BellRing, Settings2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Reminders() {
  useGsapPage();

  return (
    <div className="container py-8 max-w-2xl mx-auto pb-24">
      <div className="flex items-center gap-4 mb-8" data-anim>
        <Link to="/bills" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-500">
            <BellRing className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-display font-bold">Reminders & Autopay</h1>
        </div>
      </div>

      <div className="space-y-6" data-anim>
        <Card className="glass-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Smart Notifications</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Upcoming Bill Alerts</Label>
                  <p className="text-sm text-muted-foreground mt-1">Get notified 3 days before a bill is due</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Subscription Renewals</Label>
                  <p className="text-sm text-muted-foreground mt-1">Alert me when a subscription is about to renew</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Payment Failure Alerts</Label>
                  <p className="text-sm text-muted-foreground mt-1">Notify immediately if autopay fails</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-lg">Global Autopay Settings</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Configure safety limits for all automated payments. Individual biller limits override these settings.
            </p>
            
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Maximum transaction limit (₹)</Label>
                <Input type="number" defaultValue="5000" className="bg-secondary/30 h-12 rounded-xl max-w-xs" />
              </div>
              <Button className="rounded-xl">Save Limits</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}