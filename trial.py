import json
import plotly.graph_objects as go
from tradingview_scraper.symbols.technicals import Indicators

def main():
    print("Fetching the latest Daily EUR/USD Technical Indicators...")
    indicators_scraper = Indicators()
    
    # Scrape the exact current RSI value for EUR/USD
    resp = indicators_scraper.scrape(
        exchange="OANDA",
        symbol="EURUSD",
        timeframe="1d",
        indicators=["RSI"]
    )
    
    # Parse out the actual numeric value of the RSI
    rsi_value = resp.get("data", {}).get("RSI", 50)
    print(f"Current Daily RSI for EUR/USD is: {rsi_value:.2f}")
    
    # Build a visual Speedometer / Gauge Chart
    print("\nDrawing the visual chart... Check your web browser!")
    
    fig = go.Figure(go.Indicator(
        mode = "gauge+number",
        value = rsi_value,
        domain = {'x': [0, 1], 'y': [0, 1]},
        title = {'text': "EUR/USD Daily RSI (Relative Strength Index)", 'font': {'size': 24}},
        gauge = {
            'axis': {'range': [0, 100], 'tickwidth': 1, 'tickcolor': "darkblue"},
            'bar': {'color': "black"},
            'bgcolor': "white",
            'borderwidth': 2,
            'bordercolor': "gray",
            'steps': [
                {'range': [0, 30], 'color': "green"},       # Oversold (Buy territory)
                {'range': [30, 70], 'color': "lightgray"},  # Neutral
                {'range': [70, 100], 'color': "red"}        # Overbought (Sell territory)
            ],
            'threshold': {
                'line': {'color': "black", 'width': 4},
                'thickness': 0.75,
                'value': rsi_value
            }
        }
    ))

    # This will automatically open a visual, interactive chart in your browser
    fig.show()

if __name__ == "__main__":
    main()
