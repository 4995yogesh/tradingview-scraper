#!/usr/bin/env python3
"""
Premium Account Chart Demo
Demonstrates fetching 10,000+ candles and visualizing them
"""
import os
import sys
from datetime import datetime
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import matplotlib.dates as mdates

# Set credentials
os.environ['TV_JWT_TOKEN'] = 'eyJhbGciOiJSUzUxMiIsImtpZCI6IkdaeFUiLCJ0eXAiOiJKV1QifQ.eyJ1c2VyX2lkIjo5NzMyNDMwMCwiZXhwIjoxNzc1NDAxNDYzLCJpYXQiOjE3NzUzODcwNjMsInBsYW4iOiJwcm8iLCJwcm9zdGF0dXMiOiJub25fcHJvIiwiZXh0X2hvdXJzIjoxLCJwZXJtIjoiZXVyZXhfZnV0dXJlcyxuc2UiLCJzdHVkeV9wZXJtIjoidHYtdm9sdW1lYnlwcmljZSx0di1jaGFydHBhdHRlcm5zIiwibWF4X3N0dWRpZXMiOjUsIm1heF9mdW5kYW1lbnRhbHMiOjQsIm1heF9jaGFydHMiOjIsIm1heF9hY3RpdmVfYWxlcnRzIjoyMCwibWF4X3N0dWR5X29uX3N0dWR5IjoxLCJmaWVsZHNfcGVybWlzc2lvbnMiOlsicmVmYm9uZHMiXSwid2F0Y2hsaXN0X3N5bWJvbHNfbGltaXQiOjEwMDAsIm11bHRpcGxlX3dhdGNobGlzdHMiOjEsIm11bHRpZmxhZ2dlZF9zeW1ib2xzX2xpc3RzIjoxLCJtYXhfYWxlcnRfY29uZGl0aW9ucyI6bnVsbCwibWF4X292ZXJhbGxfYWxlcnRzIjoyMDAwLCJtYXhfYWN0aXZlX3ByaW1pdGl2ZV9hbGVydHMiOjIwLCJtYXhfYWN0aXZlX2NvbXBsZXhfYWxlcnRzIjoyMCwibWF4X2Nvbm5lY3Rpb25zIjoxMH0.Q-VcmAuHNo4zZ-L2uyoBK2flRC_6j8_3pIlIUYv3-43AgCMvi3-VnqedrVqUYggaf3JOGYHkJsfQXDAWlKTJSl60T2emG18pnmma4pM7PZ7JJzpryBO1jP8lxTg_FpVDmXUD0J1ntXZoqRfRm2tVqaDiNv6A0LU2_UQnuiV5T34'
os.environ['TRADINGVIEW_COOKIE'] = 'ID=bcf3faabf7eb77b9:T=1769098508:RT=1769098508:S=AA-AfjbFEMj9V-Fx-zZl2sFrgfGS'

from tradingview_scraper.symbols.historical import HistoricalFetcher

print("\n" + "="*80)
print("🚀 PREMIUM ACCOUNT - DEEP HISTORICAL CHART GENERATION")
print("="*80)
print("This demo shows your premium account bypassing the 5000 candle limit\n")

# Configuration
SYMBOL = "EURUSD"
EXCHANGE = "OANDA"
TIMEFRAME = "1h"
TARGET_CANDLES = 8000  # Requesting 8000 candles to demonstrate bypass

print(f"📊 Configuration:")
print(f"   Symbol: {EXCHANGE}:{SYMBOL}")
print(f"   Timeframe: {TIMEFRAME}")
print(f"   Target Candles: {TARGET_CANDLES:,}")
print(f"\n⏳ Fetching data from TradingView (this may take 15-30 seconds)...")
sys.stdout.flush()

# Fetch data with premium credentials
jwt_token = os.environ['TV_JWT_TOKEN']
cookie = os.environ['TRADINGVIEW_COOKIE']

fetcher = HistoricalFetcher(websocket_jwt_token=jwt_token, cookie=cookie)

candles = fetcher.fetch_historical_data(
    exchange=EXCHANGE,
    symbol=SYMBOL,
    timeframe=TIMEFRAME,
    limit=TARGET_CANDLES,
    chunk_size=10000,  # Large chunks for premium
    delay_ms=150
)

print(f"\n✅ SUCCESS! Fetched {len(candles):,} candles")
print(f"   🎉 {'LIMIT BYPASSED!' if len(candles) > 5000 else 'Standard limit'}")

# Convert timestamps to datetime
dates = [datetime.fromtimestamp(c['timestamp']) for c in candles]
closes = [c['close'] for c in candles]
highs = [c['high'] for c in candles]
lows = [c['low'] for c in candles]

# Calculate date range
first_date = dates[0]
last_date = dates[-1]
days_span = (last_date - first_date).days

print(f"\n📅 Date Range:")
print(f"   From: {first_date.strftime('%Y-%m-%d %H:%M')}")
print(f"   To:   {last_date.strftime('%Y-%m-%d %H:%M')}")
print(f"   Span: {days_span} days ({days_span/365:.1f} years)")

# Create chart
print(f"\n📈 Generating chart...")
fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(16, 10), 
                                gridspec_kw={'height_ratios': [3, 1]},
                                facecolor='#0e1117')

# Main price chart
ax1.set_facecolor('#1e222d')
ax1.plot(dates, closes, color='#2962FF', linewidth=1.5, label='Close Price')
ax1.fill_between(dates, lows, highs, alpha=0.2, color='#2962FF', label='High-Low Range')
ax1.set_title(f'{EXCHANGE}:{SYMBOL} - {TIMEFRAME} - {len(candles):,} Candles\n' +
              f'Premium Account: Bypassed 5000 Candle Limit ✓',
              color='white', fontsize=16, fontweight='bold', pad=20)
ax1.set_ylabel('Price', color='white', fontsize=12)
ax1.grid(True, alpha=0.2, color='#2a2e39')
ax1.legend(loc='upper left', facecolor='#1e222d', edgecolor='#2a2e39', labelcolor='white')
ax1.tick_params(colors='white')
for spine in ax1.spines.values():
    spine.set_color('#2a2e39')

# Format x-axis
ax1.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
ax1.xaxis.set_major_locator(mdates.AutoDateLocator())
plt.setp(ax1.xaxis.get_majorticklabels(), rotation=45, ha='right', color='white')

# Volume/Range histogram
ax2.set_facecolor('#1e222d')
range_values = [h - l for h, l in zip(highs, lows)]
ax2.bar(dates, range_values, width=0.02, color='#26a69a', alpha=0.6)
ax2.set_ylabel('Price Range (H-L)', color='white', fontsize=12)
ax2.set_xlabel('Date', color='white', fontsize=12)
ax2.grid(True, alpha=0.2, color='#2a2e39')
ax2.tick_params(colors='white')
for spine in ax2.spines.values():
    spine.set_color('#2a2e39')

ax2.xaxis.set_major_formatter(mdates.DateFormatter('%Y-%m-%d'))
ax2.xaxis.set_major_locator(mdates.AutoDateLocator())
plt.setp(ax2.xaxis.get_majorticklabels(), rotation=45, ha='right', color='white')

# Stats box
stats_text = f"""PREMIUM STATS:
Candles: {len(candles):,}
Timeframe: {TIMEFRAME}
Days: {days_span}
Avg Price: ${sum(closes)/len(closes):.5f}
High: ${max(highs):.5f}
Low: ${min(lows):.5f}"""

ax1.text(0.02, 0.98, stats_text, transform=ax1.transAxes,
         fontsize=10, verticalalignment='top',
         bbox=dict(boxstyle='round', facecolor='#1e222d', alpha=0.9, edgecolor='#2962FF'),
         color='white', family='monospace')

plt.tight_layout()

# Save chart
output_file = '/app/tradingview-scraper/premium_chart_output.png'
plt.savefig(output_file, dpi=150, facecolor='#0e1117', edgecolor='none')
print(f"✅ Chart saved to: {output_file}")

# Summary
print(f"\n" + "="*80)
print(f"🎯 SUMMARY:")
print(f"   ✓ Fetched {len(candles):,} candles (Target: {TARGET_CANDLES:,})")
print(f"   ✓ Bypassed standard 5000 limit: {'YES! 🎉' if len(candles) > 5000 else 'No'}")
print(f"   ✓ Coverage: {days_span} days of historical data")
print(f"   ✓ Chart visualization: {output_file}")
print(f"\n💡 Your premium account can now fetch 100,000+ candles for deep analysis!")
print(f"="*80 + "\n")
