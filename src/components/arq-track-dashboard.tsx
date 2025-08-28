"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Progress } from "~/components/ui/progress";
import { Badge } from "~/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/hooks/use-toast";
import { useMiniAppSdk } from "~/hooks/use-miniapp-sdk";
import { useAccount, useBalance, useSendTransaction, useChainId, useSwitchChain } from "wagmi";
import { parseEther } from "viem";
import { base, celo, arbitrum } from "viem/chains";

interface Contribution {
  id: string;
  researcher: string;
  description: string;
  timestamp: Date;
  easAttestation?: string;
  payoutStatus: "pending" | "processed" | "failed";
  amount: number;
}

interface Metrics {
  contributionsLogged: number;
  payoutsProcessed: number;
  tvfUnlocked: number;
  activeResearchers: number;
  weeklyPayouts: number;
}

export function ArqTrackDashboard() {
  const { toast } = useToast();
  const { isSDKLoaded } = useMiniAppSdk();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { sendTransaction } = useSendTransaction();
  
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    contributionsLogged: 0,
    payoutsProcessed: 0,
    tvfUnlocked: 0,
    activeResearchers: 0,
    weeklyPayouts: 0
  });
  
  const [contributionText, setContributionText] = useState("");
  const [researcherAddress, setResearcherAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedChain, setSelectedChain] = useState<number>(base.id);

  const supportedChains = [
    { id: base.id, name: "Base", symbol: "ETH" },
    { id: celo.id, name: "Celo", symbol: "CELO" }, 
    { id: arbitrum.id, name: "Arbitrum", symbol: "ETH" }
  ];

  // Load data from localStorage
  useEffect(() => {
    const savedContributions = localStorage.getItem("arq-contributions");
    const savedMetrics = localStorage.getItem("arq-metrics");
    
    if (savedContributions) {
      const parsed = JSON.parse(savedContributions);
      setContributions(parsed.map((c: any) => ({ ...c, timestamp: new Date(c.timestamp) })));
    }
    
    if (savedMetrics) {
      setMetrics(JSON.parse(savedMetrics));
    }
  }, []);

  // Update metrics when contributions change
  useEffect(() => {
    const newMetrics = {
      contributionsLogged: contributions.length,
      payoutsProcessed: contributions.filter(c => c.payoutStatus === "processed").length,
      tvfUnlocked: contributions.filter(c => c.payoutStatus === "processed").length * 0.08,
      activeResearchers: new Set(contributions.map(c => c.researcher)).size,
      weeklyPayouts: contributions.filter(c => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return c.timestamp > weekAgo && c.payoutStatus === "processed";
      }).length
    };
    
    setMetrics(newMetrics);
    localStorage.setItem("arq-metrics", JSON.stringify(newMetrics));
  }, [contributions]);

  const handleSubmitContribution = async () => {
    if (!contributionText.trim() || !researcherAddress.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both contribution details and researcher address.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create mock EAS attestation ID (in real app, would call EAS SDK)
      const easAttestation = `0x${Math.random().toString(16).slice(2, 66)}`;
      
      const newContribution: Contribution = {
        id: Date.now().toString(),
        researcher: researcherAddress,
        description: contributionText,
        timestamp: new Date(),
        easAttestation,
        payoutStatus: "pending",
        amount: 0.08
      };

      const updatedContributions = [...contributions, newContribution];
      setContributions(updatedContributions);
      localStorage.setItem("arq-contributions", JSON.stringify(updatedContributions));

      // Clear form
      setContributionText("");
      setResearcherAddress("");

      toast({
        title: "Contribution Logged",
        description: `EAS attestation created: ${easAttestation.slice(0, 10)}...`
      });

      // Auto-trigger payout after 2 seconds (simulate automation)
      setTimeout(() => {
        handleAutoPayout(newContribution.id);
      }, 2000);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log contribution. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAutoPayout = async (contributionId: string) => {
    try {
      const contribution = contributions.find(c => c.id === contributionId);
      if (!contribution) return;

      // Switch chain if needed
      if (chainId !== selectedChain) {
        await switchChain({ chainId: selectedChain });
      }

      // In real implementation, would send actual transaction
      // For demo, we'll simulate the payout
      const updatedContributions = contributions.map(c =>
        c.id === contributionId 
          ? { ...c, payoutStatus: "processed" as const }
          : c
      );
      
      setContributions(updatedContributions);
      localStorage.setItem("arq-contributions", JSON.stringify(updatedContributions));

      toast({
        title: "Payout Processed",
        description: `0.08 ETH sent to ${contribution.researcher.slice(0, 6)}...${contribution.researcher.slice(-4)}`
      });

    } catch (error) {
      // Mark payout as failed
      const updatedContributions = contributions.map(c =>
        c.id === contributionId 
          ? { ...c, payoutStatus: "failed" as const }
          : c
      );
      
      setContributions(updatedContributions);
      localStorage.setItem("arq-contributions", JSON.stringify(updatedContributions));

      toast({
        title: "Payout Failed",
        description: "Failed to process payout. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSwitchChain = (newChainId: number) => {
    setSelectedChain(newChainId);
    if (isConnected && chainId !== newChainId) {
      switchChain({ chainId: newChainId });
    }
  };

  if (!isSDKLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ARQ Track...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">ARQ Track</h1>
        <p className="text-gray-600">Automated Contribution Tracking & Payouts for Cookie Jar Raid OS</p>
      </div>

      {/* Chain Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Multi-Chain Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {supportedChains.map((chain) => (
              <Button
                key={chain.id}
                variant={selectedChain === chain.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleSwitchChain(chain.id)}
                className="flex items-center gap-2"
              >
                <div className={`w-2 h-2 rounded-full ${
                  chain.id === base.id ? "bg-blue-500" :
                  chain.id === celo.id ? "bg-green-500" : "bg-purple-500"
                }`} />
                {chain.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="contribute">Log Contribution</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Contributions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{metrics.contributionsLogged}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Payouts Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.payoutsProcessed}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">TVF Unlocked (ETH)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{metrics.tvfUnlocked.toFixed(2)}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Active Researchers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{metrics.activeResearchers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Weekly Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics.weeklyPayouts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Efficiency Gain</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">10×</div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Tracker */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Contributions Target</span>
                  <span>{metrics.contributionsLogged}/20</span>
                </div>
                <Progress value={(metrics.contributionsLogged / 20) * 100} className="h-2" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Payout Target</span>
                  <span>{metrics.payoutsProcessed}/15</span>
                </div>
                <Progress value={(metrics.payoutsProcessed / 15) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contribute Tab */}
        <TabsContent value="contribute" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Log New Contribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="researcher">Researcher Address</Label>
                <Input
                  id="researcher"
                  placeholder="0x..."
                  value={researcherAddress}
                  onChange={(e) => setResearcherAddress(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contribution">Contribution Details</Label>
                <Textarea
                  id="contribution"
                  placeholder="Describe the research contribution, findings, or work completed..."
                  value={contributionText}
                  onChange={(e) => setContributionText(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-gray-600">
                  Automatic payout: 0.08 ETH
                </div>
                <Button 
                  onClick={handleSubmitContribution}
                  disabled={isSubmitting || !contributionText.trim() || !researcherAddress.trim()}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? "Processing..." : "Submit & Pay"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contribution History</CardTitle>
            </CardHeader>
            <CardContent>
              {contributions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No contributions logged yet</p>
              ) : (
                <div className="space-y-4">
                  {contributions.slice().reverse().map((contribution) => (
                    <div key={contribution.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            contribution.payoutStatus === "processed" ? "default" :
                            contribution.payoutStatus === "pending" ? "secondary" : "destructive"
                          }>
                            {contribution.payoutStatus}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {contribution.timestamp.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-sm font-medium">
                          {contribution.amount} ETH
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <strong>Researcher:</strong> {contribution.researcher.slice(0, 6)}...{contribution.researcher.slice(-4)}
                      </div>
                      
                      <p className="text-sm text-gray-700">{contribution.description}</p>
                      
                      {contribution.easAttestation && (
                        <div className="text-xs text-gray-500">
                          EAS Attestation: {contribution.easAttestation.slice(0, 10)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}