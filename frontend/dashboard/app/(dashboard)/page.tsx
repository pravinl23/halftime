"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, MapPin, ArrowUp, ArrowDown } from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts"

const conversionData = [
  { date: "Dec 1", conversions: 124 },
  { date: "Dec 2", conversions: 152 },
  { date: "Dec 3", conversions: 189 },
  { date: "Dec 4", conversions: 221 },
  { date: "Dec 5", conversions: 284 },
  { date: "Dec 6", conversions: 312 },
  { date: "Dec 7", conversions: 367 },
]

const adClicksData = [
  { date: "Dec 1", clicks: 890 },
  { date: "Dec 2", clicks: 1120 },
  { date: "Dec 3", clicks: 1450 },
  { date: "Dec 4", clicks: 1680 },
  { date: "Dec 5", clicks: 2140 },
  { date: "Dec 6", clicks: 2580 },
  { date: "Dec 7", clicks: 3421 },
]

const adSpendData = [
  { date: "Dec 1", spend: 156.20 },
  { date: "Dec 2", spend: 189.45 },
  { date: "Dec 3", spend: 234.67 },
  { date: "Dec 4", spend: 278.90 },
  { date: "Dec 5", spend: 342.15 },
  { date: "Dec 6", spend: 398.75 },
  { date: "Dec 7", spend: 456.32 },
]

const ctrData = [
  { date: "Dec 1", ctr: 6.8 },
  { date: "Dec 2", ctr: 7.1 },
  { date: "Dec 3", ctr: 7.4 },
  { date: "Dec 4", ctr: 7.2 },
  { date: "Dec 5", ctr: 7.8 },
  { date: "Dec 6", ctr: 7.6 },
  { date: "Dec 7", ctr: 7.9 },
]

const impressionsData = [
  { date: "Dec 1", impressions: 13100 },
  { date: "Dec 2", impressions: 15800 },
  { date: "Dec 3", impressions: 19600 },
  { date: "Dec 4", impressions: 23300 },
  { date: "Dec 5", impressions: 27400 },
  { date: "Dec 6", impressions: 33900 },
  { date: "Dec 7", impressions: 43300 },
]

const campaignData = [
  { campaign: "Holiday Sale", impressions: 28400, clicks: 2580, ctr: 9.08, spend: 398.75 },
  { campaign: "New Product Launch", impressions: 18900, clicks: 2140, ctr: 11.32, spend: 342.15 },
  { campaign: "Brand Awareness", impressions: 22100, clicks: 1680, ctr: 7.60, spend: 278.90 },
  { campaign: "Retargeting", impressions: 15200, clicks: 1450, ctr: 9.54, spend: 234.67 },
]

const viewerUsers = [
  { name: "Ava Thompson", email: "ava@northwind.co", plan: "Enterprise", org: "Northwind Labs", created: "2024-11-08" },
  { name: "Liam Chen", email: "liam@acme.io", plan: "Growth", org: "Acme Studios", created: "2024-10-22" },
  { name: "Sofia Patel", email: "sofia@orbit.tv", plan: "Growth", org: "Orbit TV", created: "2024-09-14" },
  { name: "Noah Garcia", email: "noah@brightads.com", plan: "Starter", org: "Bright Ads", created: "2024-08-03" },
]

const adEngagement = [
  {
    adName: "Holiday Splash",
    videoId: "vid_4f9a",
    score: 86,
    metrics: [
      { label: "View Rate", value: 84 },
      { label: "Completion", value: 65 },
      { label: "Click Rate", value: 12 },
    ],
  },
  {
    adName: "Launch Teaser",
    videoId: "vid_b21c",
    score: 74,
    metrics: [
      { label: "View Rate", value: 71 },
      { label: "Completion", value: 45 },
      { label: "Click Rate", value: 8 },
    ],
  },
  {
    adName: "Retention Loop",
    videoId: "vid_d7f2",
    score: 42,
    metrics: [
      { label: "View Rate", value: 38 },
      { label: "Completion", value: 15 },
      { label: "Click Rate", value: 3 },
    ],
  },
]

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { TargetingForm } from "@/components/onboarding/targeting-form"
import { toast } from "sonner"

const placements_data = [
  { id: 1, title: "Breaking Bad", network: "AMC", viewers: "2.4M", category: "Drama" },
  { id: 2, title: "Stranger Things", network: "Netflix", viewers: "14.2M", category: "Sci-Fi" },
  { id: 3, title: "The Office", network: "Peacock", viewers: "8.1M", category: "Comedy" },
  { id: 4, title: "Game of Thrones", network: "HBO", viewers: "9.3M", category: "Fantasy" },
  { id: 5, title: "Succession", network: "HBO", viewers: "3.5M", category: "Drama" },
]

const availableShows = [
  { id: 6, title: "The Bear", network: "Hulu", viewers: "4.1M", category: "Drama" },
  { id: 7, title: "Ted Lasso", network: "Apple TV+", viewers: "5.2M", category: "Comedy" },
  { id: 8, title: "House of the Dragon", network: "HBO", viewers: "10.1M", category: "Fantasy" },
  { id: 9, title: "The Mandalorian", network: "Disney+", viewers: "7.8M", category: "Sci-Fi" },
]

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const view = searchParams.get("view") || "analytics"
  const [placements, setPlacements] = useState(placements_data)
  const [isAddOpen, setIsAddOpen] = useState(false)
  
  const [stats, setStats] = useState({
    totalImpressions: 0,
    totalClicks: 0,
    avgCTR: 0,
    costPerClick: 0,
    costPerConversion: 0,
    totalConversions: 0,
  })

  // State for viewers page
  const [selectedUser, setSelectedUser] = useState(viewerUsers[0])
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)
  const dropdownContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const totalClicks = 3421
    const totalConversions = 367
    const totalSpend = 456.32
    
    setStats({
      totalImpressions: 45234,
      totalClicks: totalClicks,
      avgCTR: 7.56,
      costPerClick: totalSpend / totalClicks,
      costPerConversion: totalSpend / totalConversions,
      totalConversions: totalConversions,
    })
  }, [])

  // Close user dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      const clickedButton = userButtonRef.current?.contains(target)
      const clickedDropdown = dropdownContainerRef.current?.contains(target)
      
      if (!clickedButton && !clickedDropdown) {
        setShowUserDropdown(false)
      }
    }

    if (showUserDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserDropdown])

  // Sort campaigns by clicks (descending)
  const sortedCampaigns = [...campaignData].sort((a, b) => b.clicks - a.clicks)

  // Analytics View
  if (view === "analytics") {
    return (
      <div className="space-y-8 max-w-[1600px] mx-auto px-8">
        {/* Key Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="glass-card p-6">
            <div className="space-y-1">
              <p className="text-white/60 text-sm font-medium">Cost Per Conversion</p>
              <h3 className="text-3xl font-bold text-white ">${stats.costPerConversion.toFixed(2)}</h3>
            </div>
          </Card>
          
          <Card className="glass-card p-6">
            <div className="space-y-1">
              <p className="text-white/60 text-sm font-medium">Cost Per Click</p>
              <h3 className="text-3xl font-bold text-white ">${stats.costPerClick.toFixed(2)}</h3>
            </div>
          </Card>
          
          <Card className="glass-card p-6">
            <div className="space-y-1">
              <p className="text-white/60 text-sm font-medium">Ad Clicks</p>
              <h3 className="text-3xl font-bold text-white ">{stats.totalClicks.toLocaleString()}</h3>
            </div>
          </Card>
          
          <Card className="glass-card p-6">
            <div className="space-y-1">
              <p className="text-white/60 text-sm font-medium">Total Ad Impressions</p>
              <h3 className="text-3xl font-bold text-white ">{stats.totalImpressions.toLocaleString()}</h3>
            </div>
          </Card>
          
          <Card className="glass-card p-6">
            <div className="space-y-1">
              <p className="text-white/60 text-sm font-medium">Ad CTR</p>
              <h3 className="text-3xl font-bold text-white ">{stats.avgCTR}%</h3>
            </div>
          </Card>
        </div>

        {/* Charts Grid - 2 per row */}
        <div className="flex flex-wrap justify-center gap-8">
          {/* Website Conversions */}
          <Card className="glass-card p-6 w-full lg:w-[calc(50%-1rem)]">
            <h3 className="text-lg font-medium text-white mb-4">Website Conversions</h3>
            <ChartContainer
              id="conversions-chart"
              config={{
                conversions: {
                  label: "Conversions",
                  color: "#ffffff",
                },
              }}
              className="h-[300px] w-full"
            >
              <AreaChart data={conversionData}>
                <defs>
                  <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#ffffff"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#ffffff" 
                  strokeWidth={2}
                  fill="url(#colorConversions)" 
                />
              </AreaChart>
            </ChartContainer>
          </Card>

          {/* Ad Clicks */}
          <Card className="glass-card p-6 w-full lg:w-[calc(50%-1rem)]">
            <h3 className="text-lg font-medium text-white mb-4">Ad Clicks Over Time</h3>
            <ChartContainer
              id="ad-clicks-chart"
              config={{
                clicks: {
                  label: "Clicks",
                  color: "#ffffff",
                },
              }}
              className="h-[300px] w-full"
            >
              <AreaChart data={adClicksData}>
                <defs>
                  <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#ffffff"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="clicks" 
                  stroke="#ffffff" 
                  strokeWidth={2}
                  fill="url(#colorClicks)" 
                />
              </AreaChart>
            </ChartContainer>
          </Card>

          {/* Ad Spend */}
          <Card className="glass-card p-6 w-full lg:w-[calc(50%-1rem)]">
            <h3 className="text-lg font-medium text-white mb-4">Ad Spend</h3>
            <ChartContainer
              id="ad-spend-chart"
              config={{
                spend: {
                  label: "Spend ($)",
                  color: "#ffffff",
                },
              }}
              className="h-[300px] w-full"
            >
              <BarChart data={adSpendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#ffffff"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                />
                <Bar 
                  dataKey="spend" 
                  fill="#ffffff" 
                  fillOpacity={0.6}
                  radius={[8, 8, 0, 0]} 
                />
              </BarChart>
            </ChartContainer>
          </Card>

          {/* CTR Over Time */}
          <Card className="glass-card p-6 w-full lg:w-[calc(50%-1rem)]">
            <h3 className="text-lg font-medium text-white mb-4">CTR Over Time</h3>
            <ChartContainer
              id="ctr-chart"
              config={{
                ctr: {
                  label: "CTR (%)",
                  color: "#ffffff",
                },
              }}
              className="h-[300px] w-full"
            >
              <LineChart data={ctrData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis 
                  dataKey="date" 
                  stroke="#ffffff"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#ffffff"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="ctr" 
                  stroke="#ffffff" 
                  strokeWidth={3}
                  dot={{ fill: "#ffffff", r: 4 }}
                />
              </LineChart>
            </ChartContainer>
          </Card>
        </div>

        {/* Top Campaigns Table */}
        <div className="grid grid-cols-1 gap-6">
          <Card className="glass-card p-6">
            <h3 className="text-lg font-medium text-white mb-4">Top Campaigns (by Clicks)</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-white font-medium text-sm pb-3">Campaign</th>
                    <th className="text-right text-white font-medium text-sm pb-3">Clicks</th>
                    <th className="text-right text-white font-medium text-sm pb-3">Impressions</th>
                    <th className="text-right text-white font-medium text-sm pb-3">CTR</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCampaigns.map((campaign, index) => (
                    <tr key={index} className="border-b border-white/5">
                      <td className="text-white font-medium py-3">{campaign.campaign}</td>
                      <td className="text-white text-right py-3 font-medium">{campaign.clicks.toLocaleString()}</td>
                      <td className="text-white text-right py-3">{campaign.impressions.toLocaleString()}</td>
                      <td className="text-white text-right py-3">{campaign.ctr.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Viewers View
  if (view === "viewers") {
    // Filter users based on search query
    const filteredUsers = viewerUsers.filter(user => 
      user.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.org.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearchQuery.toLowerCase())
    )

    return (
      <div className="flex flex-col h-[calc(100vh-5rem)] -mx-4 -my-4 lg:-mx-6 lg:-my-6">
        {/* Top Search Bar - Users Selector */}
        <div className="flex-shrink-0 h-[5.5rem] flex items-center px-6 bg-transparent">
          <div className="max-w-2xl mx-auto w-full" ref={userDropdownRef}>
            <button
              ref={userButtonRef}
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="glass-card w-full h-14 px-6 text-white text-left flex items-center justify-between hover:opacity-90 transition-all border-0"
            >
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-white/60" />
                <div>
                  <div className="font-medium text-sm">{selectedUser.name}</div>
                  <div className="text-white/50 text-xs">{selectedUser.org} • {selectedUser.plan}</div>
                </div>
              </div>
              <div className="text-white/40 text-xs">{viewerUsers.length} users</div>
            </button>
          </div>
        </div>
        
        {/* Dropdown Portal - Outside flex flow */}
        {showUserDropdown && userButtonRef.current && (
          <div 
            ref={dropdownContainerRef}
            className="fixed z-[100]"
            style={{
              top: `${userButtonRef.current.getBoundingClientRect().bottom + 16}px`,
              left: `${userButtonRef.current.getBoundingClientRect().left}px`,
              width: `${userButtonRef.current.offsetWidth}px`
            }}
          >
            <div className="glass-card overflow-hidden max-h-96 border-0">
              {/* Search Input */}
              <div className="p-4 border-b border-white/10">
                <Input
                  type="text"
                  placeholder="Search users..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="glass-card h-10 text-white placeholder:text-white/40 text-sm px-4 hover:opacity-90 focus:opacity-90 transition-all border-0"
                  autoFocus
                />
              </div>
              
              {/* Users List */}
              <div className="overflow-y-auto max-h-72">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedUser(user)
                        setShowUserDropdown(false)
                        setUserSearchQuery("")
                      }}
                      className={`w-full text-left px-6 py-4 border-b border-white/10 last:border-b-0 hover:bg-neutral-700 transition-colors ${
                        selectedUser.email === user.email ? 'bg-neutral-700' : ''
                      }`}
                    >
                      <div className="font-medium text-white text-sm">{user.name}</div>
                      <div className="text-white/50 text-xs mt-0.5">{user.org} • {user.plan}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-white/40 text-sm">
                    No users found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Area - Grid */}
        <div className="flex-1 overflow-y-auto p-6 bg-transparent pt-0">

          <div className="flex flex-wrap justify-center gap-4">
            {adEngagement.map((ad, adIndex) => (
              <div key={ad.videoId} className="flex flex-col group w-full md:w-[calc(50%-0.5rem)] xl:w-[calc(33.333%-0.67rem)] 2xl:w-[calc(25%-0.75rem)]">
                {/* Card Container */}
                <div className="glass-card flex overflow-hidden  transition-all border-0">
                  
                  {/* Thumbnail (Main Content) */}
                  <div className="relative flex-1 bg-black">
                     {/* Aspect Ratio spacer */}
                    <div className="pt-[56.25%]" />
                    <div className="absolute inset-0 flex flex-col justify-between p-3">
                        <div className="flex justify-between items-start">
                            <div className="bg-black/60  px-1.5 py-0.5 rounded text-[10px] text-white/80 font-mono">
                                {ad.videoId}
                            </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="bg-white/10 p-3   border border-white/20">
                                <div className="w-6 h-6 border-l-8 border-l-white border-y-4 border-y-transparent ml-1"></div>
                             </div>
                        </div>
                        <div className="mt-auto">
                           <h3 className="text-white font-medium text-sm leading-tight line-clamp-2 drop-shadow-md">
                             {ad.adName}
                           </h3>
                        </div>
                    </div>
                  </div>

                  {/* Analytics Strip (Right Side) */}
                  <div className="w-40 bg-black border-l border-white/10 flex flex-col p-4 pt-3 flex-shrink-0">
                    <div className="text-left mb-3 pb-2 border-b border-white/5 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-white tracking-tight">{ad.score}</span>
                        {ad.score >= 50 ? (
                          <ArrowUp className="h-5 w-5 text-white/60" strokeWidth={3} />
                        ) : (
                          <ArrowDown className="h-5 w-5 text-white/60" strokeWidth={3} />
                        )}
                      </div>
                      <div className="text-[10px] text-white/30 mt-0.5">Engagement Score</div>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-1">
                      {ad.metrics.map((metric) => (
                        <div key={metric.label} className="w-full">
                          <div className="flex justify-between items-end text-[10px] mb-1 font-medium gap-2">
                             <span className="text-white/40 truncate min-w-0" title={metric.label}>{metric.label}</span>
                             <span className="text-white/70 font-mono flex-shrink-0">{metric.value}%</span>
                          </div>
                          {/* Progress Bar */}
                          <div className="h-0.5 bg-white/5 w-full">
                            <div 
                              className="h-full bg-white/60"
                              style={{ width: `${metric.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            ))}
            
            {/* Random 2-3 additional ads per user */}
            {Array.from({ length: Math.floor(Math.random() * 2) + 2 }).map((_, i) => {
              const randomAd = adEngagement[Math.floor(Math.random() * adEngagement.length)]
              return (
               <div key={`additional-random-${i}`} className="flex flex-col group opacity-70 hover:opacity-100 transition-all w-full md:w-[calc(50%-0.5rem)] xl:w-[calc(33.333%-0.67rem)] 2xl:w-[calc(25%-0.75rem)]">
                <div className="glass-card flex overflow-hidden  transition-all border-0">
                  <div className="relative flex-1 bg-black">
                    <div className="pt-[56.25%]" />
                    <div className="absolute inset-0 flex flex-col justify-between p-3">
                        <div className="flex justify-between items-start">
                            <div className="bg-black/60  px-1.5 py-0.5 rounded text-[10px] text-white/80 font-mono">
                                {randomAd.videoId}_var{i}
                            </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="bg-white/10 p-3   border border-white/20">
                                <div className="w-6 h-6 border-l-8 border-l-white border-y-4 border-y-transparent ml-1"></div>
                             </div>
                        </div>
                        <div className="mt-auto">
                           <h3 className="text-white font-medium text-sm leading-tight line-clamp-2 drop-shadow-md">
                             {randomAd.adName} (Variant {i + 1})
                           </h3>
                        </div>
                    </div>
                  </div>
                  <div className="w-40 bg-black border-l border-white/10 flex flex-col p-4 pt-3 flex-shrink-0">
                    <div className="text-left mb-3 pb-2 border-b border-white/5 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-white tracking-tight">{Math.floor(Math.random() * 30) + 40}</span>
                        {Math.floor(Math.random() * 30) + 40 >= 50 ? (
                          <ArrowUp className="h-5 w-5 text-white/60" strokeWidth={3} />
                        ) : (
                          <ArrowDown className="h-5 w-5 text-white/60" strokeWidth={3} />
                        )}
                      </div>
                      <div className="text-[10px] text-white/30 mt-0.5">Engagement Score</div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1">
                      {randomAd.metrics.map((metric) => (
                        <div key={metric.label} className="w-full">
                          <div className="flex justify-between items-end text-[10px] mb-1 font-medium gap-2">
                             <span className="text-white/40 truncate min-w-0" title={metric.label}>{metric.label}</span>
                             <span className="text-white/70 font-mono flex-shrink-0">{Math.floor(Math.random() * 40) + 30}%</span>
                          </div>
                          <div className="h-0.5 bg-white/5 w-full">
                            <div 
                              className="h-full bg-white/60"
                              style={{ width: `${Math.floor(Math.random() * 40) + 30}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
               </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Placements View
  if (view === "placements") {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Placements</h2>
          <p className="text-white/60">Manage your show inventory</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 justify-center">
          {placements.map((show) => (
            <div key={show.id} className="group">
              <div className="glass-card relative overflow-hidden  transition-all p-0">
                <div className="aspect-video bg-black relative">
                  <div className="absolute inset-0 flex items-end p-4">
                    <div>
                      <h3 className="text-white font-medium text-sm leading-tight line-clamp-1 drop-shadow-lg">{show.title}</h3>
                      <p className="text-white/50 text-xs drop-shadow-lg">{show.network}</p>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setPlacements(placements.filter(p => p.id !== show.id))}
                  className="absolute top-2 right-2 p-1.5  glass-card hover:bg-red-500/20 text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Add New Button */}
          <div className="group cursor-pointer" onClick={() => setIsAddOpen(true)}>
            <div className="glass-card relative overflow-hidden  hover: transition-all p-0">
              <div className="aspect-video bg-black flex items-center justify-center relative">
                <Plus className="h-12 w-12 text-white drop-shadow-lg" strokeWidth={2.5} />
              </div>
            </div>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogContent className="bg-black border-white/10 text-white sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Shows</DialogTitle>
                <DialogDescription className="text-white/60">
                  Select shows to add to your placement inventory.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[400px] overflow-y-auto">
                {availableShows.map((show) => (
                  <div key={show.id} className="flex items-center justify-between p-3  border border-white/10 bg-neutral-800 hover:bg-neutral-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-16 rounded bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-[8px] text-white/30 font-mono">
                        16:9
                      </div>
                      <div>
                        <h4 className="font-medium text-white text-sm">{show.title}</h4>
                        <p className="text-white/50 text-xs">{show.network} • {show.category}</p>
                      </div>
                    </div>
                    <Button 
                      type="button"
                      size="sm" 
                      variant="secondary"
                      className="bg-neutral-800 text-white hover:bg-neutral-700 h-8"
                      onClick={() => {
                        setPlacements([...placements, show])
                        setIsAddOpen(false)
                      }}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    )
  }

  // Preferences View
  if (view === "preferences") {
    const handlePreferencesSave = async (data: any) => {
      // For now just show success toast - backend integration pending
      toast.success("Preferences saved successfully!")
      console.log("Preferences:", data)
    }

    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Preferences</h2>
          <p className="text-white/60">Manage your targeting and ad preferences</p>
        </div>
        
        <Card className="glass-card p-8">
          <TargetingForm onSubmit={handlePreferencesSave} isLoading={false} />
        </Card>
      </div>
    )
  }

  return null
}
