import os
import sys
import json
import logging

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__)))
sys.path.insert(0, ROOT)

from tradingview_scraper.symbols.stream import StreamHandler

def fetch_historical(exchange="OANDA", symbol="EURUSD", timeframe="15", limit=12000):
    ws_url = "wss://data.tradingview.com/socket.io/websocket?from=chart%2FVEPYsueI%2F&type=chart"
    handler = StreamHandler(websocket_url=ws_url, jwt_token="unauthorized_user_token")
    
    exchange_symbol = f"{exchange}:{symbol}"
    resolve_symbol = json.dumps({"adjustment": "splits", "symbol": exchange_symbol})
    handler.send_message("quote_add_symbols", [handler.quote_session, f"={resolve_symbol}"])
    handler.send_message("resolve_symbol", [handler.chart_session, "sds_sym_1", f"={resolve_symbol}"])
    handler.send_message("create_series", [handler.chart_session, "sds_1", "s1", "sds_sym_1", timeframe, 5000, ""])
    
    all_candles = []
    
    while True:
        try:
            res = handler.ws.recv()
            if "~m~~h~" in res:
                handler.ws.send(res)
                continue
                
            parts = [x for x in res.split("~m~") if x and not x.isdigit()]
            for p in parts:
                try:
                    data = json.loads(p)
                    if data.get("m") == "timescale_update":
                        series = data.get("p", [{}, {}])[1].get("sds_1", {}).get("s", [])
                        if series:
                            all_candles = series + all_candles 
                            print(f"Total candles so far: {len(all_candles)}")
                            
                            if len(all_candles) >= limit:
                                return all_candles
                                
                            handler.send_message("request_more_data", [handler.chart_session, "sds_1", 5000])
                        else:
                            print("No series found in timescale_update or end of data")
                            return all_candles
                except Exception as e:
                    pass
        except Exception as e:
            print("Error", e)
            break

if __name__ == "__main__":
    c = fetch_historical()
    print("Final total:", len(c))
