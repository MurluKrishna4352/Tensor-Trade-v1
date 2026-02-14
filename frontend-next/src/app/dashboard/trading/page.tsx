'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';

export default function TradingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('stocks');
  const [searchQuery, setSearchQuery] = useState('');

  const goToAnalyze = (symbol: string) => {
    router.push(`/dashboard/analyze?asset=${symbol}`);
  };

  const stocks = [
    { symbol: 'AAPL', name: 'Apple Inc.', price: 175.43, change: 2.3, volume: '54.2M', marketCap: '2.7T', shariah: true },
    { symbol: 'MSFT', name: 'Microsoft Corp.', price: 378.91, change: 1.8, volume: '22.1M', marketCap: '2.8T', shariah: true },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, change: -0.5, volume: '18.3M', marketCap: '1.8T', shariah: false },
    { symbol: 'TSLA', name: 'Tesla Inc.', price: 248.50, change: 3.2, volume: '95.4M', marketCap: '789B', shariah: true },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.28, change: 5.1, volume: '41.2M', marketCap: '2.2T', shariah: true },
    { symbol: 'META', name: 'Meta Platforms', price: 485.20, change: 1.4, volume: '15.8M', marketCap: '1.2T', shariah: false },
  ];

  const upcomingIPOs = [
    {
      company: 'TechVision AI',
      symbol: 'TVAI',
      priceRange: '$18-$22',
      date: '2026-02-20',
      shares: '15M',
      valuation: '$3.5B',
      description: 'Leading AI infrastructure company'
    },
    {
      company: 'GreenPower Solutions',
      symbol: 'GRPW',
      priceRange: '$25-$30',
      date: '2026-02-25',
      shares: '20M',
      valuation: '$5.2B',
      description: 'Renewable energy technology'
    },
    {
      company: 'BioMed Innovations',
      symbol: 'BIOM',
      priceRange: '$32-$38',
      date: '2026-03-01',
      shares: '12M',
      valuation: '$4.8B',
      description: 'Biotech research and development'
    },
  ];

  const watchlist = [
    { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 178.25, change: 2.1 },
    { symbol: 'JPM', name: 'JPMorgan Chase', price: 189.40, change: -0.8 },
    { symbol: 'V', name: 'Visa Inc.', price: 278.90, change: 1.5 },
  ];

  return (
    <div className="space-y-6">
        {/* Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH STOCKS..."
            className="flex-1 px-4 py-3 border-4 border-black font-bold text-sm uppercase placeholder-gray-500 focus:outline-none"
          />
          <Button variant="outline">
            FILTERS
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b-4 border-black">
          {['stocks', 'ipos', 'watchlist'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-bold uppercase text-sm border-r-4 border-black ${
                activeTab === tab
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-black hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Stocks Tab */}
        {activeTab === 'stocks' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold uppercase mb-6 border-b-4 border-black pb-3">Live Market</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-4 border-black">
                    <th className="text-left font-bold uppercase text-xs py-3 px-4">Symbol</th>
                    <th className="text-left font-bold uppercase text-xs py-3 px-4">Name</th>
                    <th className="text-right font-bold uppercase text-xs py-3 px-4">Price</th>
                    <th className="text-right font-bold uppercase text-xs py-3 px-4">Change</th>
                    <th className="text-right font-bold uppercase text-xs py-3 px-4">Volume</th>
                    <th className="text-right font-bold uppercase text-xs py-3 px-4">Market Cap</th>
                    <th className="text-center font-bold uppercase text-xs py-3 px-4">Shariah</th>
                    <th className="text-right font-bold uppercase text-xs py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((stock, index) => (
                    <tr key={index} className="border-b-2 border-black hover:bg-black hover:text-white">
                      <td className="py-4 px-4 font-bold">{stock.symbol}</td>
                      <td className="py-4 px-4">{stock.name}</td>
                      <td className="py-4 px-4 text-right font-bold">${stock.price.toFixed(2)}</td>
                      <td className="py-4 px-4 text-right font-bold">
                        {stock.change > 0 ? '+' : ''}{stock.change}%
                      </td>
                      <td className="py-4 px-4 text-right">{stock.volume}</td>
                      <td className="py-4 px-4 text-right">{stock.marketCap}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-3 py-1 font-bold text-xs border-2 border-black ${stock.shariah ? 'bg-black text-white' : 'bg-white text-black'}`}>
                          {stock.shariah ? 'YES' : 'NO'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" onClick={() => goToAnalyze(stock.symbol)}>ANALYZE</Button>
                          <Button size="sm" variant="outline">TRADE</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* IPOs Tab */}
        {activeTab === 'ipos' && (
          <div className="space-y-6">
            <Card className="p-6 border-8 border-black">
              <h3 className="text-xl font-bold uppercase mb-2">Upcoming IPOs</h3>
              <p className="text-sm">AI-POWERED IPO ANALYSIS</p>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {upcomingIPOs.map((ipo, index) => (
                <Card key={index} className="p-6">
                  <div className="space-y-4">
                    <div className="border-b-4 border-black pb-3">
                      <div className="text-xs font-bold uppercase mb-1">{ipo.symbol}</div>
                      <div className="text-xl font-bold">{ipo.company}</div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-bold">PRICE RANGE</span>
                        <span>{ipo.priceRange}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">DATE</span>
                        <span>{ipo.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">SHARES</span>
                        <span>{ipo.shares}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">VALUATION</span>
                        <span className="font-bold">{ipo.valuation}</span>
                      </div>
                    </div>

                    <div className="border-t-4 border-black pt-3">
                      <p className="text-sm">{ipo.description}</p>
                    </div>

                    <Button className="w-full">INDICATE INTEREST</Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold uppercase mb-6 border-b-4 border-black pb-3">Your Watchlist</h2>
            <div className="space-y-4">
              {watchlist.map((stock, index) => (
                <div key={index} className="flex items-center justify-between border-4 border-black p-4">
                  <div>
                    <div className="font-bold">{stock.symbol}</div>
                    <div className="text-sm">{stock.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${stock.price.toFixed(2)}</div>
                    <div className="text-sm font-bold">
                      {stock.change > 0 ? '+' : ''}{stock.change}%
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => goToAnalyze(stock.symbol)}>ANALYZE</Button>
                    <Button size="sm" variant="outline">TRADE</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
  );
}
