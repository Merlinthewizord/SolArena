"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Activity, ExternalLink, RefreshCw } from "lucide-react"
import { Connection } from "@solana/web3.js"
import { getPoolState, type PoolState } from "@/lib/meteora/dbc-pool-data"

interface TokenChartProps {
  poolAddress: string
  bondingCurveAddress: string
  tokenSymbol: string
  tokenName: string
}

export function TokenChart({ poolAddress, bondingCurveAddress, tokenSymbol, tokenName }: TokenChartProps) {
  const [poolState, setPoolState] = useState<PoolState | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [buyAmount, setBuyAmount] = useState("")
  const [sellAmount, setSellAmount] = useState("")
  const [error, setError] = useState<string | null>(null)

  const fetchPoolData = async () => {
    try {
      setRefreshing(true)
      setError(null)
      const rpcUrl = "https://mainnet.helius-rpc.com/?api-key=e45878a7-25fb-4b1a-9f3f-3ed1d643b319"
      const connection = new Connection(rpcUrl, "confirmed")
      const state = await getPoolState(connection, poolAddress)
      setPoolState(state)
    } catch (error) {
      console.error("[Token Chart] Error fetching pool data:", error)
      if (error instanceof Error) {
        setError(error.message)
      } else {
        setError("Unable to fetch pool data. The token may not have been launched yet.")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchPoolData()
    const interval = setInterval(fetchPoolData, 30000)
    return () => clearInterval(interval)
  }, [poolAddress])

  if (loading) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading chart data...</div>
      </Card>
    )
  }

  if (error || !poolState) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">{error || "Unable to load chart data"}</div>
          <p className="text-sm text-muted-foreground">
            {!poolState && !error && "The token pool has not been created yet. Launch your token to see trading data."}
          </p>
          {error && (
            <Button size="sm" variant="outline" onClick={fetchPoolData} className="mt-4 bg-transparent">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          )}
        </div>
      </Card>
    )
  }

  const priceChange = 0
  const isPositive = priceChange >= 0

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-card/80 to-primary/5 backdrop-blur border-2 border-primary/20">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-2xl font-bold mb-1">
              {tokenName} <span className="text-muted-foreground text-lg">${tokenSymbol}</span>
            </h3>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold">{poolState.price.toFixed(6)} SOL</div>
              <Badge variant={isPositive ? "default" : "destructive"} className="gap-1">
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(priceChange).toFixed(2)}%
              </Badge>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={fetchPoolData} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Liquidity (SOL)</div>
            <div className="text-lg font-semibold">{poolState.quoteReserve.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Token Reserve</div>
            <div className="text-lg font-semibold">{poolState.tokenReserve.toFixed(0)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Market Cap</div>
            <div className="text-lg font-semibold">{(poolState.price * poolState.totalSupply).toFixed(2)} SOL</div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">Bonding Curve Progress</h4>
          <span className="text-sm text-muted-foreground">{poolState.progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary to-primary/60 h-full transition-all duration-500"
            style={{ width: `${Math.min(poolState.progress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {poolState.progress >= 100
            ? "Ready for migration to AMM"
            : `${(poolState.migrationThreshold - poolState.quoteReserve).toFixed(2)} SOL to migration`}
        </p>
      </Card>

      <Card className="p-6">
        <Tabs defaultValue="buy">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="buy">Buy {tokenSymbol}</TabsTrigger>
            <TabsTrigger value="sell">Sell {tokenSymbol}</TabsTrigger>
          </TabsList>

          <TabsContent value="buy" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (SOL)</label>
              <Input
                type="number"
                placeholder="0.0"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>
            {buyAmount && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">You will receive</span>
                  <span className="font-semibold">
                    ≈ {(Number(buyAmount) / poolState.price).toFixed(2)} {tokenSymbol}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price impact</span>
                  <span className="text-xs text-muted-foreground">~0.1%</span>
                </div>
              </div>
            )}
            <Button className="w-full" size="lg" disabled>
              <Activity className="w-4 h-4 mr-2" />
              Buy on Jupiter
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Trading will be enabled soon. Use{" "}
              <a
                href={`https://jup.ag/swap/SOL-${poolAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Jupiter
              </a>{" "}
              to trade now.
            </p>
          </TabsContent>

          <TabsContent value="sell" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount ({tokenSymbol})</label>
              <Input
                type="number"
                placeholder="0.0"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                step="0.01"
                min="0"
              />
            </div>
            {sellAmount && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">You will receive</span>
                  <span className="font-semibold">≈ {(Number(sellAmount) * poolState.price).toFixed(4)} SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Price impact</span>
                  <span className="text-xs text-muted-foreground">~0.1%</span>
                </div>
              </div>
            )}
            <Button className="w-full" size="lg" variant="destructive" disabled>
              <Activity className="w-4 h-4 mr-2" />
              Sell on Jupiter
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Trading will be enabled soon. Use{" "}
              <a
                href={`https://jup.ag/swap/${poolAddress}-SOL`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Jupiter
              </a>{" "}
              to trade now.
            </p>
          </TabsContent>
        </Tabs>
      </Card>

      <Card className="p-4 bg-muted/30">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`https://solscan.io/account/${poolAddress}`, "_blank")}
            className="gap-2"
          >
            <ExternalLink className="w-3 h-3" />
            View Pool
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`https://jup.ag/swap/SOL-${poolAddress}`, "_blank")}
            className="gap-2"
          >
            <ExternalLink className="w-3 h-3" />
            Trade on Jupiter
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`https://www.geckoterminal.com/solana/pools/${bondingCurveAddress}`, "_blank")}
            className="gap-2"
          >
            <ExternalLink className="w-3 h-3" />
            GeckoTerminal
          </Button>
        </div>
      </Card>
    </div>
  )
}
