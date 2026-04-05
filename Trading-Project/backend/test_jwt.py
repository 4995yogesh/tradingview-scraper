import re
with open('tv_html.txt', 'r', encoding='utf-8') as f:
    text = f.read()

# TradingView stores user data inside window.user
idx = text.find('window.user')
if idx != -1:
    print('window.user surrounding text:', text[idx-50:idx+300])

# TradingView might also have __TV_INIT_PARAMS__
idx2 = text.find('__TV_INIT_PARAMS__')
if idx2 != -1:
    print('__TV_INIT_PARAMS__ found!')
