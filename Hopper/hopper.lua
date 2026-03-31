-- Simple PS Hopper v1.5
-- v1.4.x: standalone Termux hopper with menu, cookie inject, PS management
-- v1.5:   Web backend integration — register, poll commands, report status
-- ============================================

local HOPPER_LOG     = "/sdcard/hopper_log.txt"
local PS_FILE        = "/sdcard/private_servers.txt"
local PKG_FILE       = "/sdcard/.hopper_pkg"
local COOKIE_FILE    = "/sdcard/.hopper_cookie"
local STOP_FILE      = "/sdcard/.hopper_stop"
local ACCOUNT_FILE   = "/sdcard/.hopper_account"
local HOP_FILE       = "/sdcard/.hopper_hop"
local PTR_FILE       = "/sdcard/.hopper_ptr"
local DEVICE_ID_FILE = "/sdcard/.hopper_device_id"
local SERVER_FILE    = "/sdcard/.hopper_server"
local CONFIG_CACHE   = "/sdcard/.hopper_config_cache"  -- Cache for offline mode

local RONIX_KEY_DIR  = "/storage/emulated/0/RonixExploit/internal/"
local RONIX_KEY_PATH = RONIX_KEY_DIR .. "_key.txt"
local RONIX_KEY_VAL  = "LzuYkZDBBIkVTMHEBAJGxZwqycRUimlL"
local RONIX_AE_DIR   = "/storage/emulated/0/RonixExploit/autoexec/"
local RONIX_AE_PATH  = RONIX_AE_DIR .. "Accept.lua"
local RONIX_AE_SCRIPT = [[loadstring(game:HttpGet("https://raw.githubusercontent.com/Fluxyyy333/Auto-Rebirth-speed/refs/heads/main/jgndiambilbg"))()
getgenv().scriptkey="HsMgJbFoUwmvfzGxLESxMiUFuYpyqfFA"
loadstring(game:HttpGet("https://zekehub.com/scripts/AdoptMe/Utility.lua"))()]]

local RONIX_TRACK_PATH   = RONIX_AE_DIR .. "Trackstat.lua"
local RONIX_TRACK_SCRIPT = '_G.Config={UserID="37825915-c3be-41bc-987f-661da09d9b3c",discord_id="757533465213141053",Note="Pc"}local s;for i=1,5 do s=pcall(function()loadstring(game:HttpGet("https://cdn.yummydata.click/scripts/adoptmee"))()end)if s then break end wait(5)end'

local PKG       = ""
local HOP_MIN   = 0
local DEVICE_ID = ""
local SERVER    = ""

-- ============================================
-- HELPERS
-- ============================================
local function sleep(s)
    if s and s > 0 then os.execute("sleep " .. tostring(s)) end
end

-- Returns true if interrupted by Ctrl+C
-- Compatible with Lua 5.1 (returns number) and 5.3+ (returns bool, string, code)
local function isleep(s)
    if not s or s <= 0 then return false end
    local r1, r2 = os.execute("sleep " .. tostring(s))
    -- Lua 5.3+: r2 is "exit" or "signal"
    if r2 == "signal" then return true end
    -- Lua 5.1: r1 is exit status number, r2 is nil; non-zero = interrupted
    if r2 == nil and type(r1) == "number" and r1 ~= 0 then return true end
    return false
end

local function su_exec(cmd)
    os.execute("su -c '" .. cmd:gsub("'","'\\''") .. "' >/dev/null 2>&1")
end

local function log(msg)
    local f = io.open(HOPPER_LOG, "a")
    if f then f:write(os.date("[%H:%M:%S] ") .. msg .. "\n"); f:close() end
end

local function out(text)
    io.write((text or "") .. "\r\n")
    io.flush()
end

local function cls()
    io.write("\27[2J\27[3J\27[H\27[0m"); io.flush()
end

local function ask(prompt)
    io.write(prompt .. " > "); io.flush()
    local tty = io.open("/dev/tty", "r")
    local r
    if tty then r = tty:read("*l"); tty:close()
    else r = io.read("*l") end
    return r and r:gsub("^%s+",""):gsub("%s+$","") or ""
end

local function file_exists(path)
    local f = io.open(path, "r")
    if f then f:close(); return true end
    return false
end

local function save_file(path, content)
    local f = io.open(path, "w")
    if f then f:write(content); f:close() end
end

local function read_file(path)
    local f = io.open(path, "r")
    if not f then return "" end
    local c = f:read("*a") or ""; f:close()
    return c:gsub("%c",""):gsub("^%s+",""):gsub("%s+$","")
end

local function load_ps()
    local f = io.open(PS_FILE, "r")
    if not f then return {} end
    local list = {}
    for line in f:lines() do
        local l = line:gsub("%c",""):gsub("^%s+",""):gsub("%s+$","")
        if l ~= "" and not l:match("^#")
            and l:match("^https?://")
            and l:lower():match("code=") then
            table.insert(list, l)
        end
    end
    f:close()
    return list
end

local function tail_log(n)
    local lines = {}
    local f = io.open(HOPPER_LOG, "r")
    if not f then return {} end
    for line in f:lines() do table.insert(lines, line) end
    f:close()
    local result = {}
    local s = math.max(1, #lines - n + 1)
    for i = s, #lines do table.insert(result, lines[i]) end
    return result
end

local function json_field(json_str, field)
    local pat_str = '"' .. field .. '"%s*:%s*"([^"]*)"'
    local val = json_str:match(pat_str)
    if val then return val end
    local pat_num = '"' .. field .. '"%s*:%s*(%d+)'
    return json_str:match(pat_num)
end

local function fetch_account_info(cookie)
    local tmp = "/sdcard/.hopper_acct.tmp"
    os.execute('curl -s --connect-timeout 5 '
        .. '-H "Cookie: .ROBLOSECURITY=' .. cookie .. '" '
        .. '"https://users.roblox.com/v1/users/authenticated" '
        .. '> "' .. tmp .. '" 2>/dev/null')
    local f = io.open(tmp, "r")
    if not f then return nil, nil end
    local body = f:read("*a") or ""
    f:close()
    os.remove(tmp)
    local name = json_field(body, "name")
    local id   = json_field(body, "id")
    return name, id
end

-- ============================================
-- OFFLINE MODE CONFIG CACHE
-- ============================================
local function cache_config(hop_int, endpoint_ps, endpoint_int)
    local cache = {
        hop_interval = hop_int or HOP_MIN,
        endpoint_ps = endpoint_ps or "",
        endpoint_interval = endpoint_int or 30,
        cached_at = os.time()
    }
    local json = '{"hop_interval":' .. cache.hop_interval
              .. ',"endpoint_ps":"' .. (cache.endpoint_ps or ""):gsub('"','\"') .. '"'
              .. ',"endpoint_interval":' .. cache.endpoint_interval .. '}'
    save_file(CONFIG_CACHE, json)
    log("CONFIG CACHE: saved hop=" .. cache.hop_interval
        .. ", endpoint_int=" .. cache.endpoint_interval)
end

local function load_cached_config()
    local json = read_file(CONFIG_CACHE)
    if json == "" then return nil end
    local hop = json_field(json, "hop_interval")
    local endpoint_ps = json_field(json, "endpoint_ps")
    local endpoint_int = json_field(json, "endpoint_interval")
    return {
        hop_interval = tonumber(hop) or 50,
        endpoint_ps = endpoint_ps or "",
        endpoint_interval = tonumber(endpoint_int) or 30
    }
end

-- ============================================
-- WEB BACKEND API
-- ============================================
local function http_get(url)
    local tmp = "/sdcard/.hopper_http.tmp"
    os.execute('curl -s --connect-timeout 5 "' .. url .. '" > "' .. tmp .. '" 2>/dev/null')
    local f = io.open(tmp, "r")
    if not f then return "" end
    local body = f:read("*a") or ""
    f:close()
    os.remove(tmp)
    return body
end

local function http_post(url, json_body)
    local tmp = "/sdcard/.hopper_http.tmp"
    local data_tmp = "/sdcard/.hopper_post.tmp"
    local df = io.open(data_tmp, "w")
    if df then df:write(json_body); df:close() end
    os.execute('curl -s --connect-timeout 5 -X POST '
        .. '-H "Content-Type: application/json" '
        .. '-d @"' .. data_tmp .. '" '
        .. '"' .. url .. '" > "' .. tmp .. '" 2>/dev/null')
    os.remove(data_tmp)
    local f = io.open(tmp, "r")
    if not f then return "" end
    local body = f:read("*a") or ""
    f:close()
    os.remove(tmp)
    return body
end

local function api_enabled()
    return SERVER ~= "" and DEVICE_ID ~= ""
end

local function api_register()
    if not api_enabled() then return false end
    local name = DEVICE_ID
    local acct = read_file(ACCOUNT_FILE)
    if acct ~= "" then
        local aname = acct:match("^(.+):%d+$")
        if aname then name = DEVICE_ID .. " (" .. aname .. ")" end
    end
    local body = '{"id":"' .. DEVICE_ID .. '","name":"' .. name .. '","pkg_name":"' .. PKG .. '"}'
    local result = http_post(SERVER .. "/api/devices/register", body)
    if result ~= "" then
        log("API: registered as " .. DEVICE_ID)
        cache_config(HOP_MIN, "", 30)  -- Cache basic config
        return true
    end
    return false
end

local function api_poll()
    if not api_enabled() then return nil, nil, true end  -- (cmd, body, is_offline)
    local body = http_get(SERVER .. "/api/devices/" .. DEVICE_ID .. "/command")
    if body == "" then return nil, nil, true end  -- Backend down
    local cmd = json_field(body, "command")
    return cmd, body, false
end

local function api_status(status)
    if not api_enabled() then return false end
    local body = '{"status":"' .. status .. '","hop_min":' .. HOP_MIN .. ',"pkg_name":"' .. PKG .. '"}'
    local result = http_post(SERVER .. "/api/devices/" .. DEVICE_ID .. "/status", body)
    return result ~= ""  -- true if successful
end

local function handle_remote_command(cmd, body)
    if not cmd or cmd == "none" then return false end
    log("API cmd: " .. cmd)

    if cmd == "stop" then
        save_file(STOP_FILE, "stop")
    elseif cmd == "start" then
        -- Will be handled by menu loop if idle; no-op if already running
        return true
    elseif cmd == "inject_cookie" then
        local cookie = json_field(body, "cookie")
        if cookie and cookie ~= "" then
            save_file(COOKIE_FILE, cookie)
            os.execute("chmod 600 '" .. COOKIE_FILE .. "'")
        end
        inject_cookie()
    elseif cmd == "inject_all" then
        inject_cookie()
        inject_key()
        inject_autoexec()
        inject_trackstat()
    elseif cmd == "set_mode" then
        local mode = json_field(body, "mode")
        if mode then log("Mode set: " .. mode) end
    end

    return false
end

-- ============================================
-- CORE
-- ============================================
local function is_running()
    if PKG == "" then return false end
    local tmp = "/sdcard/.hopper_pid.tmp"
    os.execute("su -c 'pidof " .. PKG .. "' > '" .. tmp .. "' 2>/dev/null")
    local pid = read_file(tmp)
    os.remove(tmp)
    return pid:match("%d+") ~= nil
end

local function inject_cookie()
    local cookie = read_file(COOKIE_FILE)
    if cookie == "" or PKG == "" then return end
    local dir    = "/data/data/" .. PKG .. "/shared_prefs"
    local target = dir .. "/RobloxSharedPreferences.xml"
    local tmp    = "/sdcard/.hcookie_tmp.xml"

    local xml_tmp = "/sdcard/.hopper_xmlread.tmp"
    os.execute("su -c 'cat \"" .. target .. "\"' > '" .. xml_tmp .. "' 2>/dev/null")
    local xf = io.open(xml_tmp, "r")
    local existing = xf and xf:read("*a") or ""
    if xf then xf:close() end
    os.remove(xml_tmp)

    local xml_content
    if existing ~= "" and existing:find("ROBLOSECURITY") then
        local cookie_safe = cookie:gsub("%%", "%%%%")
        xml_content = existing:gsub(
            '(<string%s+name="%.ROBLOSECURITY">)[^<]*(</string>)',
            '%1' .. cookie_safe .. '%2'
        )
        log("Cookie: replace di XML existing")
    else
        xml_content = "<?xml version='1.0' encoding='utf-8' standalone='yes' ?>\n"
                   .. "<map>\n"
                   .. '    <string name=".ROBLOSECURITY">' .. cookie .. "</string>\n"
                   .. "</map>\n"
        log("Cookie: tulis XML minimal (fresh)")
    end

    local f = io.open(tmp, "w")
    if not f then log("ERR: gagal tulis cookie tmp"); return end
    f:write(xml_content)
    f:close()

    -- Update WebView cookie store via sqlite3
    local cookie_db = "/data/data/" .. PKG .. "/app_webview/Default/Cookies"
    local sql_tmp   = "/sdcard/.hopper_wv.sql"
    local safe      = cookie:gsub("'", "''")
    local sf = io.open(sql_tmp, "w")
    if sf then
        sf:write("UPDATE cookies SET value='" .. safe .. "' WHERE name='.ROBLOSECURITY';\n")
        sf:close()
        su_exec("/data/data/com.termux/files/usr/bin/sqlite3 '" .. cookie_db .. "' < '" .. sql_tmp .. "'")
        os.remove(sql_tmp)
        log("WebView cookie updated")
    else
        log("WARN: gagal tulis sql tmp")
    end

    su_exec("mkdir -p '" .. dir .. "'")
    su_exec("cp '" .. tmp .. "' '" .. target .. "'")

    local uid_tmp = "/sdcard/.hopper_uid.tmp"
    os.execute("su -c 'stat -c %u /data/data/" .. PKG .. "' > '" .. uid_tmp .. "' 2>/dev/null")
    local uid = read_file(uid_tmp)
    os.remove(uid_tmp)
    if uid ~= "" then
        su_exec("chown " .. uid .. ":" .. uid .. " '" .. target .. "'")
    end
    su_exec("chmod 660 '" .. target .. "'")
    su_exec("restorecon '" .. target .. "'")
    os.remove(tmp)
    log("Cookie injected (uid=" .. uid .. ")")
end

local function inject_key()
    su_exec("mkdir -p '" .. RONIX_KEY_DIR .. "'")
    local f = io.open(RONIX_KEY_PATH, "w")
    if f then f:write(RONIX_KEY_VAL); f:close() end
    log("Key injected")
end

local function inject_autoexec()
    su_exec("mkdir -p '" .. RONIX_AE_DIR .. "'")
    local f = io.open(RONIX_AE_PATH, "w")
    if f then f:write(RONIX_AE_SCRIPT); f:close() end
    log("Autoexec injected")
end

local function inject_trackstat()
    su_exec("mkdir -p '" .. RONIX_AE_DIR .. "'")
    local f = io.open(RONIX_TRACK_PATH, "w")
    if f then f:write(RONIX_TRACK_SCRIPT); f:close() end
    log("Trackstat injected")
end

local function inject_all_verbose()
    out("[1/4] Injecting cookie...")
    inject_cookie()
    out("[2/4] Injecting Ronix key...")
    inject_key()
    out("[3/4] Injecting autoexec...")
    inject_autoexec()
    out("[4/4] Injecting trackstat...")
    inject_trackstat()
    out("[+] All injected.")
end

local function launch(ps_link, ps_idx, ps_total)
    log(string.format("Launching PS %d/%d", ps_idx, ps_total))
    out(string.format("[*] Stopping %s...", PKG))
    su_exec("am force-stop " .. PKG)
    sleep(2)

    out("[*] Clearing cache...")
    su_exec("rm -rf /data/data/" .. PKG .. "/cache/*")
    su_exec("rm -rf /data/data/" .. PKG .. "/code_cache/*")
    su_exec("rm -rf /sdcard/Android/data/" .. PKG .. "/cache/*")
    log("Cache cleared")

    local dp = ps_link:match("^intent://(.-)#Intent")
           or ps_link:gsub("^https?://","")
    local intent = "intent://" .. dp
        .. "#Intent;scheme=https;package=" .. PKG
        .. ";action=android.intent.action.VIEW;end"

    out("[*] Launching intent...")
    su_exec('am start --user 0 "' .. intent .. '"')
    out(string.format("[+] Launched PS %d/%d", ps_idx, ps_total))
    log(string.format("Launched PS %d/%d", ps_idx, ps_total))
end

-- ============================================
-- MONITOR DISPLAY
-- ============================================
local function show_status(cur_ps, ps_total, crash_count,
                            runtime_m, hop_elapsed_m, status_str)
    cls()
    out("========================")
    out("  HOPPER MONITOR v1.6 ")
    out("========================")
    out("")
    out("Pkg    : " .. PKG)
    out(string.format("PS     : %d / %d", cur_ps, ps_total))
    out("Status : " .. status_str)
    out("Crash  : " .. crash_count)
    out(string.format("Runtime: %dm", runtime_m))
    if HOP_MIN > 0 then
        out(string.format("Hop    : %dm / %dm", hop_elapsed_m, HOP_MIN))
    else
        out("Hop    : OFF")
    end
    out("")
    out("--- Log ---")
    for _, line in ipairs(tail_log(4)) do
        out(line)
    end
    out("")
    out("========================")
    out("[Ctrl+C] = STOP")
    out("OFFLINE MODE: Hopper continues with")
    out("cached settings when backend down")
    out("========================")
end

-- ============================================
-- HOPPER LOOP
-- ============================================
local function run_hopper()
    local ps_list = load_ps()
    if #ps_list == 0 then
        out("[!] Tidak ada PS link!"); sleep(2); return
    end
    if PKG == "" then
        out("[!] Package belum diset!"); sleep(2); return
    end

    os.remove(STOP_FILE)
    os.execute("rm -f " .. HOPPER_LOG .. " 2>/dev/null")

    log("=== Hopper Started ===")
    log("Pkg: " .. PKG .. " | PS: " .. #ps_list .. " | Hop: " .. HOP_MIN .. "m")

    -- Resume PS position
    local ptr = 1
    local saved_ptr = tonumber(read_file(PTR_FILE))
    if saved_ptr and saved_ptr >= 1 and saved_ptr <= #ps_list then
        ptr = saved_ptr
        out("[*] Resuming from PS " .. ptr)
        log("Resumed from PS " .. ptr)
    else
        out("[*] Starting from PS 1")
    end
    os.remove(PTR_FILE)

    local cur_ps       = ptr
    local crash_count  = 0
    local hop_sec      = HOP_MIN * 60
    local start_time   = os.time()
    local hop_time     = os.time()
    local last_display = 0
    local last_poll    = 0
    local last_retry   = 0
    local is_offline   = false
    local offline_mode_hop_sec = HOP_MIN * 60  -- Default offline hop interval

    out("")
    inject_all_verbose()
    out("")

    launch(ps_list[ptr], ptr, #ps_list)
    cur_ps = ptr
    ptr = ptr + 1
    if ptr > #ps_list then ptr = 1 end

    api_status("running")

    out("")
    out("[*] Hopper running... Ctrl+C to stop")
    sleep(3)

    local ok, err = pcall(function()
        while true do
            if isleep(5) then
                log("Ctrl+C detected")
                return
            end

            if file_exists(STOP_FILE) then
                log("Stop file detected")
                return
            end

            local now           = os.time()
            local runtime_m     = math.floor((now - start_time) / 60)
            local hop_elapsed_s = now - hop_time
            local hop_elapsed_m = math.floor(hop_elapsed_s / 60)
            local running       = is_running()
            local status_str    = running and "RUNNING" or "NOT RUNNING"
            local did_action    = false

            -- Poll backend every 60 seconds (or every 30s when offline for faster reconnect)
            local poll_interval = is_offline and 30 or 60
            if now - last_poll >= poll_interval then
                local cmd, body, offline = api_poll()

                if offline and not is_offline then
                    -- Backend went down
                    is_offline = true
                    log("⚠️  OFFLINE MODE: Backend unreachable")
                    local cached = load_cached_config()
                    if cached then
                        offline_mode_hop_sec = cached.hop_interval * 60
                        log("OFFLINE: Using cached config (hop=" .. cached.hop_interval .. "m)")
                    end
                elseif not offline and is_offline then
                    -- Backend came back online
                    is_offline = false
                    log("✓ ONLINE MODE: Backend reconnected")
                    api_status(status_str == "RUNNING" and "running" or "idle")
                elseif not offline then
                    -- Normal online mode
                    handle_remote_command(cmd, body)
                end

                last_poll = now
            end

            -- Hop timer — use offline_mode_hop_sec when offline, hop_sec when online
            local effective_hop_sec = is_offline and offline_mode_hop_sec or hop_sec
            if HOP_MIN > 0 and hop_elapsed_s >= effective_hop_sec then
                log("Hop -> PS " .. ptr .. (is_offline and " [OFFLINE]" or ""))
                launch(ps_list[ptr], ptr, #ps_list)
                cur_ps = ptr; ptr = ptr + 1
                if ptr > #ps_list then ptr = 1 end
                hop_time = os.time(); hop_elapsed_m = 0; did_action = true
            end

            -- Crash watchdog — does NOT reset hop_time
            if not running and not did_action then
                crash_count = crash_count + 1
                log("Crash #" .. crash_count .. " relaunch PS " .. cur_ps .. (is_offline and " [OFFLINE]" or ""))
                launch(ps_list[cur_ps], cur_ps, #ps_list)
            end

            -- Update display every 15 seconds
            if now - last_display >= 15 then
                local mode_str = is_offline and "OFFLINE" or "ONLINE"
                show_status(cur_ps, #ps_list, crash_count,
                            runtime_m, hop_elapsed_m, status_str .. " [" .. mode_str .. "]")
                -- Also report status to backend (only if online)
                if not is_offline then
                    api_status(status_str == "RUNNING" and "running" or "idle")
                end
                last_display = now
            end
        end
    end)

    if not ok then
        log("Stopped: " .. tostring(err))
    end

    -- Save PS pointer for resume
    save_file(PTR_FILE, tostring(cur_ps))
    log("Saved PS pointer: " .. cur_ps)

    os.remove(STOP_FILE)
    if not is_offline then
        api_status("idle")
    end
    log("=== Hopper Stopped ===")

    cls()
    out("========================")
    out("   HOPPER STOPPED")
    out("========================")
    out("")
    out("Last PS : " .. cur_ps .. " / " .. #ps_list)
    out("Crashes : " .. crash_count)
    out("Resume  : will start from PS " .. cur_ps)
    if is_offline then
        out("[!] Stopped in OFFLINE mode")
    end
    out("")
end

-- ============================================
-- MENU HANDLERS
-- ============================================
local function menu_set_package()
    cls()
    out("=== SET PACKAGE ===")
    out("")
    local saved = read_file(PKG_FILE)
    if saved ~= "" then out("Tersimpan: " .. saved); out("") end

    local pkg_tmp = "/sdcard/.hopper_pkglist.tmp"
    os.execute("pm list packages > '" .. pkg_tmp .. "' 2>/dev/null")
    local pkgs = {}
    local pf = io.open(pkg_tmp, "r")
    if pf then
        local r = pf:read("*a") or ""; pf:close()
        for line in r:gmatch("[^\r\n]+") do
            local p = line:match("package:(.+)")
            if p then
                p = p:gsub("%c",""):gsub("^%s+",""):gsub("%s+$","")
                if p ~= "" then table.insert(pkgs, p) end
            end
        end
        table.sort(pkgs)
    end
    os.remove(pkg_tmp)

    if #pkgs > 0 then
        out("Package tersedia:")
        for i, p in ipairs(pkgs) do
            out(string.format("  %d. %s", i, p))
        end
        out("")
    end

    local inp = ask("Nomor / nama (kosong=batal)")
    if inp == "" then return end
    local n = tonumber(inp)
    local new_pkg = (n and pkgs[n]) or inp
    if new_pkg and new_pkg ~= "" then
        PKG = new_pkg
        save_file(PKG_FILE, PKG)
        out("[+] Package: " .. PKG)
    else
        out("[!] Tidak valid")
    end
    sleep(1)
end

local function menu_set_cookie()
    cls()
    out("=== SET COOKIE ===")
    out("")
    local saved = read_file(COOKIE_FILE)
    if saved ~= "" then
        out("Tersimpan: " .. saved:sub(1,20) .. "...")
        out("")
        local ch = ask("Ganti? (y/n)")
        if ch:lower() ~= "y" then return end
    end
    out("Paste .ROBLOSECURITY (kosong=batal):")
    out("")
    local raw = ask("")
    if raw == "" then out("Batal."); sleep(1); return end
    local ck = raw:match("(_|WARNING.+)$") or raw
    save_file(COOKIE_FILE, ck)
    os.execute("chmod 600 '" .. COOKIE_FILE .. "'")
    out("[+] Cookie disimpan.")

    -- Inject immediately if package set
    if PKG ~= "" then
        out("[*] Injecting cookie...")
        inject_cookie()
        out("[+] Cookie injected.")
    end

    -- Fetch account info via Roblox API
    out("[*] Fetching account info...")
    local name, id = fetch_account_info(ck)
    if name and id then
        save_file(ACCOUNT_FILE, name .. ":" .. id)
        out("[+] Account: " .. name .. " (" .. id .. ")")
    else
        save_file(ACCOUNT_FILE, "")
        out("[!] Gagal fetch account info (cookie invalid?)")
    end
    sleep(2)
end

local function menu_set_ps()
    while true do
        cls()
        out("=== PS LINKS ===")
        out("")
        local ps = load_ps()
        if #ps == 0 then
            out("  (kosong)")
        else
            for i, l in ipairs(ps) do
                local d = #l > 42
                    and (l:sub(1,25) .. "..." .. l:sub(-12))
                    or l
                out(string.format("  [%d] %s", i, d))
            end
        end
        out("")
        out("1=Tambah  2=Hapus  3=Clear  0=Kembali")
        out("")
        local opt = ask("")
        if opt == "0" or opt == "" then break

        elseif opt == "1" then
            out("Paste link (kosong=selesai):")
            local wf = io.open(PS_FILE, "a")
            local added = 0
            while true do
                local line = ask("")
                if line == "" then break end
                if line:match("^https?://") and line:lower():match("code=") then
                    if wf then wf:write(line .. "\n") end
                    added = added + 1
                    out("  [+] " .. added)
                else
                    out("  [!] Tidak valid")
                end
            end
            if wf then wf:close() end
            out(added .. " ditambahkan."); sleep(1)

        elseif opt == "2" then
            local ps2 = load_ps()
            if #ps2 == 0 then out("Kosong."); sleep(1)
            else
                local n = tonumber(ask("Hapus nomor"))
                if n and ps2[n] then
                    table.remove(ps2, n)
                    local wf = io.open(PS_FILE, "w")
                    if wf then
                        for _, l in ipairs(ps2) do wf:write(l.."\n") end
                        wf:close()
                    end
                    out("[+] Dihapus."); sleep(1)
                else out("[!] Tidak valid"); sleep(1) end
            end

        elseif opt == "3" then
            if ask("Ketik 'hapus'") == "hapus" then
                save_file(PS_FILE, "")
                out("[+] Semua dihapus."); sleep(1)
            end
        end
    end
end

local function menu_set_hop()
    cls()
    out("=== SET HOP INTERVAL ===")
    out("")
    out("Saat ini: " .. (HOP_MIN == 0 and "OFF" or HOP_MIN .. "m"))
    out("")
    local inp = ask("Hop tiap berapa menit? (0=OFF)")
    local v = tonumber(inp)
    if v and v >= 0 then
        HOP_MIN = v
        save_file(HOP_FILE, tostring(HOP_MIN))
        out("[+] Hop: " .. (HOP_MIN == 0 and "OFF" or HOP_MIN .. "m"))
    else
        out("[!] Tidak valid")
    end
    sleep(1)
end

local function menu_set_ip()
    cls()
    out("=== SET PC IP ADDRESS ===")
    out("")
    out("Cari IP PC di Windows:")
    out("  1. Buka CMD")
    out("  2. Ketik: ipconfig")
    out("  3. Lihat IPv4 Address (misal: 192.168.1.100)")
    out("")
    if SERVER ~= "" then
        local ip_only = SERVER:match("//(.+):") or SERVER
        out("IP saat ini: " .. ip_only)
        out("")
    end
    local inp = ask("IP address (contoh: 192.168.1.100)")
    if inp == "" then return end

    -- Validate basic IP format
    if not inp:match("%d+%.%d+%.%d+%.%d+") then
        out("[!] Format IP tidak valid")
        sleep(1)
        return
    end

    SERVER = "http://" .. inp .. ":3000"
    save_file(SERVER_FILE, SERVER)
    out("[+] Server URL: " .. SERVER)
    sleep(1)
end

local function menu_set_server()
    cls()
    out("=== SET SERVER URL ===")
    out("")
    if SERVER ~= "" then out("Saat ini: " .. SERVER); out("") end
    out("Contoh: http://192.168.1.100:3000")
    out("")
    local inp = ask("URL (kosong=batal)")
    if inp == "" then return end
    SERVER = inp:gsub("/$", "")
    save_file(SERVER_FILE, SERVER)
    out("[+] Server: " .. SERVER)
    sleep(1)
end

local function menu_set_device_id()
    cls()
    out("=== SET DEVICE ID ===")
    out("")
    if DEVICE_ID ~= "" then out("Saat ini: " .. DEVICE_ID); out("") end
    out("ID unik untuk device ini (misal: rf-01)")
    out("")
    local inp = ask("Device ID (kosong=batal)")
    if inp == "" then return end
    DEVICE_ID = inp
    save_file(DEVICE_ID_FILE, DEVICE_ID)
    out("[+] Device ID: " .. DEVICE_ID)

    -- Auto register if server configured
    if SERVER ~= "" then
        out("[*] Registering with backend...")
        api_register()
        out("[+] Registered.")
    end
    sleep(1)
end

-- ============================================
-- MAIN MENU
-- ============================================
local function main()
    PKG = read_file(PKG_FILE)
    DEVICE_ID = read_file(DEVICE_ID_FILE)
    SERVER    = read_file(SERVER_FILE)

    local hop_saved = read_file(HOP_FILE)
    local hop_val = tonumber(hop_saved)
    if hop_val and hop_val >= 0 then HOP_MIN = hop_val end

    -- Auto register on startup
    api_register()

    while true do
        cls()
        out("=== HOPPER v1.5 ===")
        out("")
        local cookie = read_file(COOKIE_FILE)
        local ps     = load_ps()
        out("Package : " .. (PKG ~= "" and PKG or "-"))

        -- Show account info if available, fallback to cookie prefix
        local acct = read_file(ACCOUNT_FILE)
        if acct ~= "" then
            local aname, aid = acct:match("^(.+):(%d+)$")
            if aname then
                out("Account : " .. aname .. " (" .. aid .. ")")
            else
                out("Account : " .. acct)
            end
        elseif cookie ~= "" then
            out("Cookie  : " .. cookie:sub(1,16) .. "...")
        else
            out("Cookie  : -")
        end

        out("PS      : " .. #ps)
        out("Hop     : " .. (HOP_MIN == 0 and "OFF" or HOP_MIN.."m"))
        if SERVER ~= "" then
            local ip_only = SERVER:match("//(.+):") or SERVER
            out("IP/URL  : " .. ip_only)
        else
            out("IP/URL  : -")
        end
        out("Device  : " .. (DEVICE_ID ~= "" and DEVICE_ID or "-"))

        -- Show resume info if available
        local saved_ptr = read_file(PTR_FILE)
        if saved_ptr ~= "" then
            out("Resume  : PS " .. saved_ptr)
        end

        out("")
        out("1. Set package")
        out("2. Set cookie")
        out("3. Kelola PS links")
        out("4. Set hop interval")
        out("5. START")
        out("6. Set server URL (advanced)")
        out("7. Set device ID")
        out("8. Set PC IP address (quick setup)")
        out("0. Keluar")
        out("")
        local ch = ask("Pilih")
        if     ch == "1" then menu_set_package()
        elseif ch == "2" then menu_set_cookie()
        elseif ch == "3" then menu_set_ps()
        elseif ch == "4" then menu_set_hop()
        elseif ch == "5" then run_hopper()
        elseif ch == "6" then menu_set_server()
        elseif ch == "7" then menu_set_device_id()
        elseif ch == "8" then menu_set_ip()
        elseif ch == "0" then cls(); out("Keluar."); break
        end
    end
end

-- ============================================
-- ENTRY
-- ============================================
cls()
main()
