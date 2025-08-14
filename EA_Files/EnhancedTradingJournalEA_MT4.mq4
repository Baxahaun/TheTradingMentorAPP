//+------------------------------------------------------------------+
//| EnhancedTradingJournalEA_MT4.mq4                                 |
//| Enhanced Trading Journal Integration EA for MT4                  |
//| Features: Robust trade detection + Automatic screenshots         |
//+------------------------------------------------------------------+

#property copyright "Zella Trade Scribe"
#property link      "https://your-domain.com"
#property version   "2.00"
#property description "Enhanced EA with robust trade detection and automatic screenshots"
#property strict

//+------------------------------------------------------------------+
//| Input Parameters                                                 |
//+------------------------------------------------------------------+
// API Configuration
extern string API_URL = "https://us-central1-your-project-id.cloudfunctions.net/receiveEATrade";
extern string API_KEY = "";                    // Your generated API key
extern string USER_ID = "";                    // Your user ID (optional)

// Trade Detection Settings
extern bool   ENABLE_LOGGING = true;           // Enable detailed logging
extern int    MAX_RETRIES = 3;                 // Maximum retry attempts
extern bool   MONITOR_MANUAL_TRADES = true;    // Monitor trades without magic numbers
extern bool   MONITOR_EA_TRADES = true;        // Monitor trades with magic numbers
extern double MIN_LOT_SIZE = 0.01;             // Minimum lot size to track
extern int    DETECTION_SENSITIVITY = 1;       // 1=High, 2=Medium, 3=Low sensitivity

// Screenshot Settings
extern bool   ENABLE_SCREENSHOTS = true;       // Enable automatic screenshots
extern bool   SCREENSHOT_ON_OPEN = false;      // Screenshot when trade opens
extern bool   SCREENSHOT_ON_CLOSE = true;      // Screenshot when trade closes
extern int    SCREENSHOT_WIDTH = 1024;         // Screenshot width in pixels
extern int    SCREENSHOT_HEIGHT = 768;         // Screenshot height in pixels
extern string SCREENSHOT_TIMEFRAMES = "CURRENT,H1,H4"; // Timeframes to capture (comma-separated)
extern bool   UPLOAD_SCREENSHOTS = true;       // Upload screenshots to cloud storage

// Advanced Settings
extern int    POSITION_TRACK_LIMIT = 1000;     // Maximum positions to track
extern int    CLEANUP_INTERVAL = 3600;         // Cleanup old data every hour (seconds)
extern bool   ENABLE_OFFLINE_QUEUE = true;     // Queue trades when offline
extern int    HEARTBEAT_INTERVAL = 300;        // Send heartbeat every 5 minutes

//+------------------------------------------------------------------+
//| Global Variables                                                 |
//+------------------------------------------------------------------+
bool g_initialized = false;
string g_account_number;
datetime g_last_heartbeat = 0;

// Position tracking structures
struct PositionInfo {
    int ticket;
    string symbol;
    int type;
    double lots;
    double open_price;
    datetime open_time;
    int magic;
    string comment;
    bool sent_open;
    bool sent_close;
    datetime last_update;
};

PositionInfo g_tracked_positions[];
int g_position_count = 0;

// Screenshot tracking
struct ScreenshotTask {
    string symbol;
    int ticket;
    string event_type; // "OPEN" or "CLOSE"
    datetime timestamp;
    bool completed;
};

ScreenshotTask g_screenshot_queue[];
int g_screenshot_count = 0;

// Offline queue for when API is unavailable
struct QueuedTrade {
    string json_data;
    datetime timestamp;
    int retry_count;
};

QueuedTrade g_offline_queue[];
int g_queue_count = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
    // Validate required parameters
    if(StringLen(API_URL) == 0) {
        Alert("Enhanced Trading Journal EA: API_URL parameter is required!");
        return(INIT_PARAMETERS_INCORRECT);
    }
    
    if(StringLen(API_KEY) == 0) {
        Alert("Enhanced Trading Journal EA: API_KEY parameter is required!");
        return(INIT_PARAMETERS_INCORRECT);
    }
    
    // Initialize arrays
    ArrayResize(g_tracked_positions, POSITION_TRACK_LIMIT);
    ArrayResize(g_screenshot_queue, POSITION_TRACK_LIMIT);
    ArrayResize(g_offline_queue, POSITION_TRACK_LIMIT * 2);
    
    // Get account information
    g_account_number = IntegerToString(AccountNumber());
    
    // Perform initial scan of existing positions
    ScanExistingPositions();
    
    // Send initialization heartbeat
    g_last_heartbeat = TimeCurrent();
    
    if(ENABLE_LOGGING) {
        Print("=== Enhanced Trading Journal EA Initialized ===");
        Print("Account: ", g_account_number);
        Print("API URL: ", API_URL);
        Print("Screenshot enabled: ", ENABLE_SCREENSHOTS);
        Print("Monitoring manual trades: ", MONITOR_MANUAL_TRADES);
        Print("Monitoring EA trades: ", MONITOR_EA_TRADES);
        Print("Tracked positions: ", g_position_count);
        Print("==============================================");
    }
    
    g_initialized = true;
    return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
    if(ENABLE_LOGGING) {
        Print("Enhanced Trading Journal EA deinitialized. Reason: ", reason);
        Print("Final stats - Tracked positions: ", g_position_count);
        Print("Queued screenshots: ", g_screenshot_count);
        Print("Offline queue: ", g_queue_count);
    }
    
    // Process any remaining offline queue items
    ProcessOfflineQueue();
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
    if(!g_initialized) return;
    
    // High-frequency trade detection
    static datetime last_scan = 0;
    if(TimeCurrent() - last_scan >= DETECTION_SENSITIVITY) {
        ScanForTradeChanges();
        last_scan = TimeCurrent();
    }
    
    // Process screenshot queue
    ProcessScreenshotQueue();
    
    // Process offline queue
    if(g_queue_count > 0) {
        ProcessOfflineQueue();
    }
    
    // Periodic maintenance
    static datetime last_cleanup = 0;
    if(TimeCurrent() - last_cleanup >= CLEANUP_INTERVAL) {
        CleanupOldData();
        last_cleanup = TimeCurrent();
    }
    
    // Send heartbeat
    if(TimeCurrent() - g_last_heartbeat >= HEARTBEAT_INTERVAL) {
        SendHeartbeat();
        g_last_heartbeat = TimeCurrent();
    }
}

//+------------------------------------------------------------------+
//| Scan existing positions on startup                              |
//+------------------------------------------------------------------+
void ScanExistingPositions()
{
    g_position_count = 0;
    
    for(int i = 0; i < OrdersTotal(); i++) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
            if(ShouldTrackOrder()) {
                AddTrackedPosition(OrderTicket(), false, false);
            }
        }
    }
    
    if(ENABLE_LOGGING) {
        Print("Initial scan completed. Found ", g_position_count, " existing positions");
    }
}

//+------------------------------------------------------------------+
//| Scan for trade changes                                           |
//+------------------------------------------------------------------+
void ScanForTradeChanges()
{
    // Check for new positions
    for(int i = 0; i < OrdersTotal(); i++) {
        if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) {
            if(ShouldTrackOrder()) {
                int ticket = OrderTicket();
                if(!IsPositionTracked(ticket)) {
                    // New position found
                    AddTrackedPosition(ticket, true, false);
                    if(ENABLE_LOGGING) {
                        Print("New position detected: ", ticket, " ", OrderSymbol());
                    }
                }
            }
        }
    }
    
    // Check for closed positions
    CheckForClosedPositions();
    
    // Update existing positions for modifications
    UpdateTrackedPositions();
}

//+------------------------------------------------------------------+
//| Check if order should be tracked                                 |
//+------------------------------------------------------------------+
bool ShouldTrackOrder()
{
    if(OrderType() != OP_BUY && OrderType() != OP_SELL) return false;
    if(OrderLots() < MIN_LOT_SIZE) return false;
    
    int magic = OrderMagicNumber();
    if(magic == 0 && !MONITOR_MANUAL_TRADES) return false;
    if(magic != 0 && !MONITOR_EA_TRADES) return false;
    
    return true;
}

//+------------------------------------------------------------------+
//| Check if position is already tracked                            |
//+------------------------------------------------------------------+
bool IsPositionTracked(int ticket)
{
    for(int i = 0; i < g_position_count; i++) {
        if(g_tracked_positions[i].ticket == ticket) {
            return true;
        }
    }
    return false;
}

//+------------------------------------------------------------------+
//| Add position to tracking array                                  |
//+------------------------------------------------------------------+
void AddTrackedPosition(int ticket, bool is_new, bool is_closing)
{
    if(g_position_count >= POSITION_TRACK_LIMIT) {
        Print("WARNING: Position tracking limit reached!");
        return;
    }
    
    if(!OrderSelect(ticket, SELECT_BY_TICKET)) return;
    
    int index = g_position_count;
    g_tracked_positions[index].ticket = ticket;
    g_tracked_positions[index].symbol = OrderSymbol();
    g_tracked_positions[index].type = OrderType();
    g_tracked_positions[index].lots = OrderLots();
    g_tracked_positions[index].open_price = OrderOpenPrice();
    g_tracked_positions[index].open_time = OrderOpenTime();
    g_tracked_positions[index].magic = OrderMagicNumber();
    g_tracked_positions[index].comment = OrderComment();
    g_tracked_positions[index].sent_open = !is_new;
    g_tracked_positions[index].sent_close = is_closing;
    g_tracked_positions[index].last_update = TimeCurrent();
    
    g_position_count++;
    
    if(is_new) {
        // Send opening trade data
        SendTradeData(ticket, true, false);
        
        // Queue screenshot if enabled
        if(ENABLE_SCREENSHOTS && SCREENSHOT_ON_OPEN) {
            QueueScreenshot(OrderSymbol(), ticket, "OPEN");
        }
    }
}

//+------------------------------------------------------------------+
//| Check for closed positions                                       |
//+------------------------------------------------------------------+
void CheckForClosedPositions()
{
    for(int i = g_position_count - 1; i >= 0; i--) {
        int ticket = g_tracked_positions[i].ticket;
        
        // Check if position still exists in open orders
        bool found = false;
        for(int j = 0; j < OrdersTotal(); j++) {
            if(OrderSelect(j, SELECT_BY_POS, MODE_TRADES)) {
                if(OrderTicket() == ticket) {
                    found = true;
                    break;
                }
            }
        }
        
        if(!found && !g_tracked_positions[i].sent_close) {
            // Position was closed
            if(OrderSelect(ticket, SELECT_BY_TICKET, MODE_HISTORY)) {
                SendTradeData(ticket, false, true);
                g_tracked_positions[i].sent_close = true;
                
                // Queue screenshot if enabled
                if(ENABLE_SCREENSHOTS && SCREENSHOT_ON_CLOSE) {
                    QueueScreenshot(OrderSymbol(), ticket, "CLOSE");
                }
                
                if(ENABLE_LOGGING) {
                    Print("Position closed: ", ticket, " ", OrderSymbol(), " P&L: ", OrderProfit());
                }
            }
            
            // Remove from tracking array
            RemoveTrackedPosition(i);
        }
    }
}

//+------------------------------------------------------------------+
//| Update tracked positions for modifications                       |
//+------------------------------------------------------------------+
void UpdateTrackedPositions()
{
    for(int i = 0; i < g_position_count; i++) {
        int ticket = g_tracked_positions[i].ticket;
        if(OrderSelect(ticket, SELECT_BY_TICKET)) {
            // Check for modifications (SL/TP changes, partial closes, etc.)
            if(TimeCurrent() - g_tracked_positions[i].last_update > 60) {
                // Send update if position was modified
                g_tracked_positions[i].last_update = TimeCurrent();
                // Note: Could add specific modification detection here
            }
        }
    }
}

//+------------------------------------------------------------------+
//| Remove position from tracking array                             |
//+------------------------------------------------------------------+
void RemoveTrackedPosition(int index)
{
    if(index < 0 || index >= g_position_count) return;
    
    // Shift array elements
    for(int i = index; i < g_position_count - 1; i++) {
        g_tracked_positions[i] = g_tracked_positions[i + 1];
    }
    g_position_count--;
}

//+------------------------------------------------------------------+
//| Send trade data to API                                          |
//+------------------------------------------------------------------+
void SendTradeData(int ticket, bool is_opening, bool is_closing)
{
    if(!OrderSelect(ticket, SELECT_BY_TICKET, is_closing ? MODE_HISTORY : MODE_TRADES)) {
        Print("ERROR: Could not select order ", ticket);
        return;
    }
    
    // Extract order information
    string symbol = OrderSymbol();
    int order_type = OrderType();
    double volume = OrderLots();
    double open_price = OrderOpenPrice();
    double close_price = OrderClosePrice();
    datetime open_time = OrderOpenTime();
    datetime close_time = OrderCloseTime();
    double profit = OrderProfit();
    double swap = OrderSwap();
    double commission = OrderCommission();
    string comment = OrderComment();
    int magic = OrderMagicNumber();
    double stop_loss = OrderStopLoss();
    double take_profit = OrderTakeProfit();
    
    // Create JSON data
    string json_data = CreateTradeJSON(symbol, order_type, volume, open_price, close_price,
                                     open_time, close_time, profit, swap, commission,
                                     comment, ticket, magic, stop_loss, take_profit,
                                     is_opening, is_closing);
    
    // Try to send immediately
    if(!SendToAPI(json_data)) {
        // Add to offline queue if enabled
        if(ENABLE_OFFLINE_QUEUE) {
            AddToOfflineQueue(json_data);
        }
    }
}

//+------------------------------------------------------------------+
//| Send JSON data to API with retry logic                          |
//+------------------------------------------------------------------+
bool SendToAPI(string json_data)
{
    if(ENABLE_LOGGING) {
        Print("Sending trade data: ", StringSubstr(json_data, 0, 200), "...");
    }
    
    // Prepare HTTP headers
    string headers = "Content-Type: application/json\r\n";
    headers += "Authorization: Bearer " + API_KEY + "\r\n";
    headers += "User-Agent: EnhancedMT4-EA/2.0\r\n";
    
    char post_data[];
    StringToCharArray(json_data, post_data, 0, StringLen(json_data));
    
    char result_data[];
    string result_headers;
    
    // Attempt to send with retries
    for(int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        int response_code = WebRequest("POST", API_URL, headers, 5000, post_data, result_data, result_headers);
        
        if(response_code == 200 || response_code == 201) {
            string response = CharArrayToString(result_data);
            if(ENABLE_LOGGING) {
                Print("Trade data sent successfully. Response: ", response);
            }
            return true;
        } else {
            if(ENABLE_LOGGING) {
                Print("Failed to send trade data. Attempt ", attempt, "/", MAX_RETRIES, 
                      ". Response code: ", response_code);
                if(ArraySize(result_data) > 0) {
                    string error_response = CharArrayToString(result_data);
                    Print("Error response: ", StringSubstr(error_response, 0, 200));
                }
            }
            
            if(attempt < MAX_RETRIES) {
                Sleep(1000 * attempt); // Progressive delay
            }
        }
    }
    
    Print("ERROR: Failed to send trade data after ", MAX_RETRIES, " attempts");
    return false;
}

//+------------------------------------------------------------------+
//| Add trade to offline queue                                       |
//+------------------------------------------------------------------+
void AddToOfflineQueue(string json_data)
{
    if(g_queue_count >= ArraySize(g_offline_queue)) {
        Print("WARNING: Offline queue is full!");
        return;
    }
    
    g_offline_queue[g_queue_count].json_data = json_data;
    g_offline_queue[g_queue_count].timestamp = TimeCurrent();
    g_offline_queue[g_queue_count].retry_count = 0;
    g_queue_count++;
    
    if(ENABLE_LOGGING) {
        Print("Trade added to offline queue. Queue size: ", g_queue_count);
    }
}

//+------------------------------------------------------------------+
//| Process offline queue                                            |
//+------------------------------------------------------------------+
void ProcessOfflineQueue()
{
    if(g_queue_count == 0) return;
    
    static datetime last_process = 0;
    if(TimeCurrent() - last_process < 30) return; // Process every 30 seconds
    last_process = TimeCurrent();
    
    for(int i = g_queue_count - 1; i >= 0; i--) {
        g_offline_queue[i].retry_count++;
        
        if(SendToAPI(g_offline_queue[i].json_data)) {
            // Successfully sent, remove from queue
            RemoveFromOfflineQueue(i);
        } else if(g_offline_queue[i].retry_count >= MAX_RETRIES * 2) {
            // Too many retries, remove from queue
            Print("WARNING: Removing trade from offline queue after ", g_offline_queue[i].retry_count, " retries");
            RemoveFromOfflineQueue(i);
        }
    }
}

//+------------------------------------------------------------------+
//| Remove item from offline queue                                   |
//+------------------------------------------------------------------+
void RemoveFromOfflineQueue(int index)
{
    if(index < 0 || index >= g_queue_count) return;
    
    for(int i = index; i < g_queue_count - 1; i++) {
        g_offline_queue[i] = g_offline_queue[i + 1];
    }
    g_queue_count--;
}

//+------------------------------------------------------------------+
//| Queue screenshot task                                            |
//+------------------------------------------------------------------+
void QueueScreenshot(string symbol, int ticket, string event_type)
{
    if(g_screenshot_count >= ArraySize(g_screenshot_queue)) {
        Print("WARNING: Screenshot queue is full!");
        return;
    }
    
    g_screenshot_queue[g_screenshot_count].symbol = symbol;
    g_screenshot_queue[g_screenshot_count].ticket = ticket;
    g_screenshot_queue[g_screenshot_count].event_type = event_type;
    g_screenshot_queue[g_screenshot_count].timestamp = TimeCurrent();
    g_screenshot_queue[g_screenshot_count].completed = false;
    g_screenshot_count++;
    
    if(ENABLE_LOGGING) {
        Print("Screenshot queued: ", symbol, " ", ticket, " ", event_type);
    }
}

//+------------------------------------------------------------------+
//| Process screenshot queue                                         |
//+------------------------------------------------------------------+
void ProcessScreenshotQueue()
{
    if(g_screenshot_count == 0) return;
    
    static datetime last_screenshot = 0;
    if(TimeCurrent() - last_screenshot < 5) return; // Limit to one screenshot every 5 seconds
    
    for(int i = 0; i < g_screenshot_count; i++) {
        if(!g_screenshot_queue[i].completed) {
            if(TakeTradeScreenshot(g_screenshot_queue[i].symbol, 
                                 g_screenshot_queue[i].ticket,
                                 g_screenshot_queue[i].event_type,
                                 g_screenshot_queue[i].timestamp)) {
                g_screenshot_queue[i].completed = true;
                last_screenshot = TimeCurrent();
                break; // Process one at a time
            }
        }
    }
    
    // Clean up completed screenshots
    CleanupScreenshotQueue();
}

//+------------------------------------------------------------------+
//| Take screenshot for trade                                        |
//+------------------------------------------------------------------+
bool TakeTradeScreenshot(string symbol, int ticket, string event_type, datetime trade_time)
{
    // Switch to the symbol's chart if it exists
    long chart_id = ChartFirst();
    bool found_chart = false;
    
    while(chart_id != -1) {
        if(ChartSymbol(chart_id) == symbol) {
            found_chart = true;
            break;
        }
        chart_id = ChartNext(chart_id);
    }
    
    if(!found_chart) {
        // Could open a new chart here, but for now just use current chart
        chart_id = ChartID();
        if(ENABLE_LOGGING) {
            Print("WARNING: Chart for ", symbol, " not found, using current chart");
        }
    }
    
    // Parse timeframes to capture
    string timeframes[];
    int tf_count = StringSplit(SCREENSHOT_TIMEFRAMES, ',', timeframes);
    
    bool success = false;
    for(int i = 0; i < tf_count; i++) {
        string tf = StringTrim(timeframes[i]);
        int timeframe = StringToTimeframe(tf);
        
        if(timeframe > 0) {
            string filename = CreateScreenshotFilename(symbol, ticket, event_type, trade_time, tf);
            
            // Change timeframe if needed
            if(tf != "CURRENT") {
                ChartSetInteger(chart_id, CHART_MODE, timeframe);
                Sleep(1000); // Wait for chart to update
            }
            
            // Take screenshot
            if(WindowScreenShot(filename, SCREENSHOT_WIDTH, SCREENSHOT_HEIGHT)) {
                if(ENABLE_LOGGING) {
                    Print("Screenshot saved: ", filename);
                }
                success = true;
                
                // TODO: Upload to cloud storage if enabled
                if(UPLOAD_SCREENSHOTS) {
                    // UploadScreenshotToCloud(filename, symbol, ticket, event_type);
                }
            } else {
                Print("ERROR: Failed to save screenshot: ", filename);
            }
        }
    }
    
    return success;
}

//+------------------------------------------------------------------+
//| Convert string to timeframe constant                            |
//+------------------------------------------------------------------+
int StringToTimeframe(string tf_str)
{
    if(tf_str == "CURRENT") return Period();
    if(tf_str == "M1") return PERIOD_M1;
    if(tf_str == "M5") return PERIOD_M5;
    if(tf_str == "M15") return PERIOD_M15;
    if(tf_str == "M30") return PERIOD_M30;
    if(tf_str == "H1") return PERIOD_H1;
    if(tf_str == "H4") return PERIOD_H4;
    if(tf_str == "D1") return PERIOD_D1;
    if(tf_str == "W1") return PERIOD_W1;
    if(tf_str == "MN1") return PERIOD_MN1;
    return 0;
}

//+------------------------------------------------------------------+
//| Create screenshot filename                                       |
//+------------------------------------------------------------------+
string CreateScreenshotFilename(string symbol, int ticket, string event_type, datetime trade_time, string timeframe)
{
    string date_str = TimeToStr(trade_time, TIME_DATE);
    string time_str = TimeToStr(trade_time, TIME_MINUTES);
    StringReplace(date_str, ".", "-");
    StringReplace(time_str, ":", "-");
    
    string filename = StringFormat("%s_%s_%d_%s_%s_%s.png",
                                 symbol, event_type, ticket, date_str, time_str, timeframe);
    
    return filename;
}

//+------------------------------------------------------------------+
//| Clean up completed screenshots from queue                       |
//+------------------------------------------------------------------+
void CleanupScreenshotQueue()
{
    for(int i = g_screenshot_count - 1; i >= 0; i--) {
        if(g_screenshot_queue[i].completed || 
           TimeCurrent() - g_screenshot_queue[i].timestamp > 300) { // Remove after 5 minutes
            
            // Shift array elements
            for(int j = i; j < g_screenshot_count - 1; j++) {
                g_screenshot_queue[j] = g_screenshot_queue[j + 1];
            }
            g_screenshot_count--;
        }
    }
}

//+------------------------------------------------------------------+
//| Clean up old data periodically                                  |
//+------------------------------------------------------------------+
void CleanupOldData()
{
    // Remove old tracked positions that are no longer relevant
    for(int i = g_position_count - 1; i >= 0; i--) {
        if(g_tracked_positions[i].sent_close && 
           TimeCurrent() - g_tracked_positions[i].last_update > 3600) { // 1 hour
            RemoveTrackedPosition(i);
        }
    }
    
    // Clean up old offline queue items
    for(int i = g_queue_count - 1; i >= 0; i--) {
        if(TimeCurrent() - g_offline_queue[i].timestamp > 86400) { // 24 hours
            RemoveFromOfflineQueue(i);
        }
    }
    
    if(ENABLE_LOGGING) {
        Print("Cleanup completed. Positions: ", g_position_count, ", Queue: ", g_queue_count, ", Screenshots: ", g_screenshot_count);
    }
}

//+------------------------------------------------------------------+
//| Send heartbeat to server                                         |
//+------------------------------------------------------------------+
void SendHeartbeat()
{
    string json_data = StringFormat("{\"accountNumber\":\"%s\",\"type\":\"heartbeat\",\"timestamp\":\"%s\",\"positions\":%d,\"queue\":%d}",
                                   g_account_number,
                                   TimeToStr(TimeCurrent(), TIME_DATE | TIME_MINUTES),
                                   g_position_count,
                                   g_queue_count);
    
    // Send heartbeat (non-critical, don't retry on failure)
    string headers = "Content-Type: application/json\r\n";
    headers += "Authorization: Bearer " + API_KEY + "\r\n";
    headers += "User-Agent: EnhancedMT4-EA/2.0\r\n";
    
    char post_data[];
    StringToCharArray(json_data, post_data, 0, StringLen(json_data));
    
    char result_data[];
    string result_headers;
    
    WebRequest("POST", API_URL, headers, 3000, post_data, result_data, result_headers);
}

//+------------------------------------------------------------------+
//| Create JSON string for trade data                               |
//+------------------------------------------------------------------+
string CreateTradeJSON(string symbol, int order_type, double volume,
                       double open_price, double close_price,
                       datetime open_time, datetime close_time,
                       double profit, double swap, double commission,
                       string comment, int ticket, int magic,
                       double stop_loss, double take_profit,
                       bool is_opening, bool is_closing)
{
    string trade_type = (order_type == OP_BUY) ? "buy" : "sell";
    string open_time_str = TimeToStr(open_time, TIME_DATE | TIME_MINUTES);
    string close_time_str = "";
    
    if(is_closing && close_time > 0) {
        close_time_str = TimeToStr(close_time, TIME_DATE | TIME_MINUTES);
    }
    
    string json = "{";
    json += "\"accountNumber\": \"" + g_account_number + "\",";
    json += "\"symbol\": \"" + symbol + "\",";
    json += "\"type\": \"" + trade_type + "\",";
    json += "\"volume\": " + DoubleToStr(volume, 2) + ",";
    json += "\"openPrice\": " + DoubleToStr(open_price, Digits) + ",";
    
    if(is_closing) {
        json += "\"closePrice\": " + DoubleToStr(close_price, Digits) + ",";
        json += "\"closeTime\": \"" + close_time_str + "\",";
    }
    
    json += "\"openTime\": \"" + open_time_str + "\",";
    json += "\"profit\": " + DoubleToStr(profit, 2) + ",";
    json += "\"swap\": " + DoubleToStr(swap, 2) + ",";
    json += "\"commission\": " + DoubleToStr(commission, 2) + ",";
    json += "\"comment\": \"" + comment + "\",";
    json += "\"positionId\": \"" + IntegerToString(ticket) + "\",";
    json += "\"isOpen\": " + (is_opening ? "true" : "false") + ",";
    json += "\"magicNumber\": " + IntegerToString(magic) + ",";
    json += "\"stopLoss\": " + DoubleToStr(stop_loss, Digits) + ",";
    json += "\"takeProfit\": " + DoubleToStr(take_profit, Digits) + ",";
    json += "\"eaVersion\": \"Enhanced-2.0\"";
    json += "}";
    
    return json;
}

//+------------------------------------------------------------------+
//| Utility function to trim whitespace                             |
//+------------------------------------------------------------------+
string StringTrim(string str)
{
    int start = 0;
    int end = StringLen(str) - 1;
    
    while(start <= end && StringGetChar(str, start) == ' ') start++;
    while(end >= start && StringGetChar(str, end) == ' ') end--;
    
    if(start > end) return "";
    return StringSubstr(str, start, end - start + 1);
}
