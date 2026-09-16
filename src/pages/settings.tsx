import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollReveal } from "@/components/scroll-reveal";
import { services } from "@/lib/services";
import { toast } from "sonner";
import { Store, Users, Globe, Shield, User, RotateCcw, Bell, FileText } from "lucide-react";

export function SettingsPage() {
  const [storeName, setStoreName] = useState(services.getStoreName());
  const [storeEmail, setStoreEmail] = useState("demo@novastore.sa");
  const [defaultWindow, setDefaultWindow] = useState("14");
  const [autoApproveEligible, setAutoApproveEligible] = useState(false);
  const [requirePhoto, setRequirePhoto] = useState(false);
  const [notifyNewCase, setNotifyNewCase] = useState(true);
  const [notifyManualReview, setNotifyManualReview] = useState(true);
  const [notifyResolved, setNotifyResolved] = useState(false);
  const [notifyWeeklyDigest, setNotifyWeeklyDigest] = useState(true);

  const handleSaveStore = () => {
    services.setStoreName(storeName);
    toast.success("Store settings saved");
  };

  const handleSavePolicyDefaults = () => {
    toast.success("Return policy defaults saved");
  };

  const handleSaveNotifications = () => {
    toast.success("Notification preferences saved");
  };

  const handleReset = () => {
    services.resetDemo();
    toast.success("Demo data reset");
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div className="flex flex-col gap-6">
      <ScrollReveal>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your store and workspace configuration.</p>
        </div>
      </ScrollReveal>

      <ScrollReveal delay={100}>
        <div className="mb-1 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          <Shield className="size-3.5 text-primary" />
          <span>You're editing a simulated demo workspace. Changes stay in this browser.</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Store profile */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Store className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Store profile</CardTitle>
              </div>
              <CardDescription>Your store identity and contact details.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="store-name">Store name</Label>
                  <Input id="store-name" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="store-email">Contact email</Label>
                  <Input id="store-email" type="email" value={storeEmail} onChange={(e) => setStoreEmail(e.target.value)} />
                </div>
                <Button size="sm" onClick={handleSaveStore} className="self-start">Save changes</Button>
              </div>
            </CardContent>
          </Card>

          {/* Return policy defaults */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Return policy defaults</CardTitle>
              </div>
              <CardDescription>Default settings applied to new return requests.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="default-window">Default return window (days)</Label>
                  <Input id="default-window" type="number" value={defaultWindow} onChange={(e) => setDefaultWindow(e.target.value)} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Auto-approve eligible cases</div>
                    <div className="text-xs text-muted-foreground">Skip manual review for eligible returns</div>
                  </div>
                  <Switch checked={autoApproveEligible} onCheckedChange={setAutoApproveEligible} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Require customer photo</div>
                    <div className="text-xs text-muted-foreground">Ask for a photo on defective claims</div>
                  </div>
                  <Switch checked={requirePhoto} onCheckedChange={setRequirePhoto} />
                </div>
                <Button size="sm" onClick={handleSavePolicyDefaults} className="self-start">Save defaults</Button>
              </div>
            </CardContent>
          </Card>

          {/* Team access */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Team access</CardTitle>
              </div>
              <CardDescription>Manage team members and roles.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="text-sm font-medium text-foreground">demo@novastore.sa</div>
                    <div className="text-xs text-muted-foreground">Owner</div>
                  </div>
                  <span className="rounded-full bg-eligible-muted px-2 py-0.5 text-[11px] font-medium text-eligible">Active</span>
                </div>
                <p className="text-xs text-muted-foreground">Team invitations will be available in a future release.</p>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Notifications</CardTitle>
              </div>
              <CardDescription>Choose what you want to be notified about.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">New case created</div>
                    <div className="text-xs text-muted-foreground">When a customer submits a return</div>
                  </div>
                  <Switch checked={notifyNewCase} onCheckedChange={setNotifyNewCase} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Manual review needed</div>
                    <div className="text-xs text-muted-foreground">When a case needs your attention</div>
                  </div>
                  <Switch checked={notifyManualReview} onCheckedChange={setNotifyManualReview} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Case resolved</div>
                    <div className="text-xs text-muted-foreground">When a case reaches resolved status</div>
                  </div>
                  <Switch checked={notifyResolved} onCheckedChange={setNotifyResolved} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Weekly digest</div>
                    <div className="text-xs text-muted-foreground">Summary of returns activity each week</div>
                  </div>
                  <Switch checked={notifyWeeklyDigest} onCheckedChange={setNotifyWeeklyDigest} />
                </div>
                <Button size="sm" onClick={handleSaveNotifications} className="self-start">Save preferences</Button>
              </div>
            </CardContent>
          </Card>

          {/* Language */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Language</CardTitle>
              </div>
              <CardDescription>Display language for your workspace.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <Select defaultValue="en" disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar" disabled>Arabic (coming soon)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Arabic localization is planned for a future release.</p>
              </div>
            </CardContent>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Security</CardTitle>
              </div>
              <CardDescription>Authentication and access control.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Two-factor authentication</div>
                    <div className="text-xs text-muted-foreground">Available in production rollout</div>
                  </div>
                  <Switch disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">API rate limiting</div>
                    <div className="text-xs text-muted-foreground">Available in production rollout</div>
                  </div>
                  <Switch disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Account</CardTitle>
              </div>
              <CardDescription>Your account and demo data.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="text-sm text-muted-foreground">
                  You're using a demo workspace. All data is stored locally in your browser.
                </div>
                <Button variant="outline" size="sm" onClick={handleReset} className="self-start text-destructive hover:text-destructive">
                  <RotateCcw className="size-3.5" />
                  Reset demo data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollReveal>
    </div>
  );
}
