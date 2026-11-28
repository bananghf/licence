# Catalog of Problems & Solutions

Source: Telegram export `ChatExport_2026-11-27` — chat **Platform launch Tomas**.
Period: 2026-09-29 … 2026-11-26 · Messages analyzed: 5250 · Entries: 54.

Participants: Alistair, Developer Itay, Developer JS, IT Arsen, IT-Alex Tradox, Jan Engelbrecht, Yotam.

Use this as a runbook index: match symptoms → apply the recorded fix → note prevention.

## Summary

| Status | Count |
| --- | ---: |
| mitigated | 22 |
| open | 7 |
| recurring | 2 |
| resolved | 23 |

| Category | Count |
| --- | ---: |
| Telephony/SIP | 12 |
| CRM/Product | 11 |
| Security/Auth | 7 |
| Recording | 5 |
| Network/VPN | 5 |
| WhatsApp | 4 |
| RDP/Infra | 3 |
| Storage/NFS | 2 |
| Performance | 2 |
| Reports | 2 |
| Data/Import | 1 |

## Quick lookup (by severity)

| Sev | Status | Category | Problem |
| --- | --- | --- | --- |
| critical | open | Telephony/SIP | [PBX ~94% CPU / freezes after too many extensions](#pbx-cpu-overload-extensions) |
| critical | mitigated | RDP/Infra | [RDP black screen / freezes from RdpIdd.dll crash + huge WER dumps](#rdp-rdpidd-crash-dumps) |
| critical | resolved | Recording | [Old recorder kept polling invalidated Remote Audio after RDP disconnect](#recording-wasapi-disconnect-hang) |
| critical | resolved | Security/Auth | [New security monitoring tool auto-blocks all RDP access](#security-monitor-blocks-rdp) |
| high | open | Network/VPN | [Wi-Fi drops from UniFi U6-Pro Ethernet/PoE link flaps](#unifi-ap-ethernet-flaps) |
| high | open | Telephony/SIP | [Intermittent robotic/choppy call audio (RDP stable)](#telephony-choppy-robotic-audio) |
| high | open | Telephony/SIP | [Telephony issue cleared when main PBX disconnected — clients still on main](#pbx-main-vs-backup-routing) |
| high | recurring | Security/Auth | [RDP/SIP access lost when office IP drops from whitelist](#office-ip-whitelist-churn) |
| high | recurring | Storage/NFS | [NFS export shows folders but access returns ENOENT (d?????????)](#nfs-export-ghost-folders) |
| high | mitigated | CRM/Product | [Concurrent affiliate lead POSTs reject one of the leads](#affiliate-concurrent-lead-race) |
| high | mitigated | Security/Auth | [CRM login rate limits lock whole desk IPs](#crm-login-rate-limit-desk-lockout) |
| high | mitigated | Security/Auth | [RDP exposed on public internet](#netbird-rdp-exposure) |
| high | mitigated | Storage/NFS | [Recording writes competing with OS/RDP on the system disk](#recordings-on-system-disk) |
| high | mitigated | Telephony/SIP | [Office IP banned by PBX after SIP auth failure loop](#sip-office-ip-fail2ban) |
| high | mitigated | Telephony/SIP | [Robotic/intermittent audio on distant Singapore RDP server](#singapore-rdp-audio-latency) |
| high | mitigated | Telephony/SIP | [Same SIP extension assigned to multiple CRM users → 500 / freezes](#duplicate-sip-extensions) |
| high | mitigated | WhatsApp | [WhatsApp WinUI/memory crash + failed package re-register on multi-user host](#whatsapp-package-crash-reregister) |
| high | mitigated | WhatsApp | [WhatsApp dial/call UI freeze (WebView2); process still «responding»](#whatsapp-webview2-call-freeze) |
| high | mitigated | WhatsApp | [WhatsApp freezes ~30–35 s during calls due to WMI process scan on UI thread](#whatsapp-wmi-process-scan-freeze) |
| high | resolved | Network/VPN | [Admin VPN would hijack default gateway and break other RDP users](#openvpn-split-tunnel-for-admin-rdp) |
| high | resolved | Network/VPN | [Very slow upload over WireGuard VPN (~6 Mbps)](#vpn-wireguard-mss-slow-upload) |
| high | resolved | Performance | [General RDP lag / noisy neighbor on multi-session hosts](#rds-hardening-fairshare-sessions) |
| high | resolved | RDP/Infra | [Daytime Windows Update causes mass RDP disconnect/freeze](#windows-update-daytime) |
| high | resolved | Recording | [Every incoming call froze the session for a few seconds](#recording-incoming-call-freeze) |
| high | resolved | Recording | [Recorder could not run for multiple users on one RDP host](#recording-multi-user-single-instance) |
| high | resolved | Telephony/SIP | [Dashboard shows ANSWERED / wrong billing from internal Asterisk CDR rows](#asterisk-cdr-multi-row-answered) |
| high | resolved | Telephony/SIP | [Incoming-call freezes from MicroSIP «Bring to Front» / outdated build](#microsip-bring-to-front-freeze) |
| high | resolved | Telephony/SIP | [Temporary MicroSIP registration failures from one public IP](#microsip-registration-blip) |
| medium | open | RDP/Infra | [Random user black screen suspected from stuck logon script](#logon-script-black-screen) |
| medium | open | Recording | [AUDCLNT_E_DEVICE_INVALIDATED (0x88890004) on Remote Audio](#recording-audio-device-invalidated) |
| medium | open | Telephony/SIP | [Client cannot hear agent for first ~10 seconds](#first-10s-one-way-audio) |
| medium | mitigated | CRM/Product | [CRM HTTP 500 when phone extension incompatible](#crm-500-incompatible-extension) |
| medium | mitigated | CRM/Product | [Request for multiple owners conflicts with multi-brand CRM ownership model](#multi-owner-vs-viewers) |
| medium | mitigated | Data/Import | [Lead CSV import fails on duplicate emails / opaque errors](#lead-import-duplicates) |
| medium | mitigated | Performance | [RDP freezes possibly worsened by single NIC RSS queue](#nic-rss-single-queue) |
| medium | mitigated | Recording | [Recordings written to C:\Documents instead of D: per-user path](#recorder-path-c-instead-of-d) |
| medium | mitigated | Security/Auth | [Stricter password policy rejects resets without clear UI errors](#password-policy-no-ui-guidance) |
| medium | mitigated | Telephony/SIP | [CRM call duration longer than recording (carrier marks answered on ring)](#call-duration-includes-ringing) |
| medium | mitigated | WhatsApp | [WhatsApp voice call fails (no camera; mic permission suspected)](#whatsapp-mic-permissions) |
| medium | resolved | CRM/Product | [Calendar times wrong for all users](#calendar-timezone-misconfig) |
| medium | resolved | CRM/Product | [Need percentage split of affiliate leads across multiple agents](#affiliate-lead-distribution) |
| medium | resolved | CRM/Product | [Unclear duplicate lead rejection rules across days / FTD](#duplicate-reject-policy) |
| medium | resolved | CRM/Product | [WebTrader/CRM P&L mismatch on long-lived sessions](#webtrader-stale-pnl) |
| medium | resolved | Network/VPN | [Agent cannot connect to RDP due to personal VPN exit country](#rdp-blocked-by-user-vpn-country) |
| medium | resolved | Network/VPN | [Agent connectivity issues blamed on VPN but caused by bad cable](#local-cable-not-vpn) |
| medium | resolved | Security/Auth | [Need write-only storage account for recording uploads](#storage-write-only-recording-user) |
| medium | resolved | Security/Auth | [Weak passwords accepted for clients/staff](#password-policy-hardening) |
| medium | resolved | Telephony/SIP | [Wrong SIP password → IP blocked](#sip-wrong-password-ip-block) |
| low | mitigated | CRM/Product | [Affiliate display name change not visible until service restart](#affiliate-rename-needs-restart) |
| low | mitigated | CRM/Product | [UI translated but month names not localized](#localization-months) |
| low | mitigated | CRM/Product | [Wallet balance source unclear (API vs webhook)](#wallet-balance-webhook-clarification) |
| low | resolved | CRM/Product | [TP/SL set as dollar amounts instead of prices](#tp-sl-price-vs-dollars) |
| low | resolved | Reports | [Confusion between Total FTD, day conversion, and QFTD ($250+)](#reports-ftd-vs-qftd) |
| low | resolved | Reports | [Reports show more FTDs than Clients list for a desk](#ftd-reports-vs-clients-owner) |

## Entries

### PBX ~94% CPU / freezes after too many extensions
<a id="pbx-cpu-overload-extensions"></a>

- **ID:** `pbx-cpu-overload-extensions`
- **Category:** Telephony/SIP
- **Severity:** critical
- **Status:** open
- **Period:** 2026-11-17 …

**Symptoms**
- PBX freezes; call quality issues independent of RDP overcrowding

**Root cause**

PBX overloaded after scaling extensions beyond original design capacity.

**Solution / remediation**
- Treat PBX capacity as separate workstream from RDP; reorganize/split before further growth

**Prevention**
- Capacity plan PBX separately; monitor CPU/extension counts

*Evidence messages: #6059*

---

### RDP black screen / freezes from RdpIdd.dll crash + huge WER dumps
<a id="rdp-rdpidd-crash-dumps"></a>

- **ID:** `rdp-rdpidd-crash-dumps`
- **Category:** RDP/Infra
- **Severity:** critical
- **Status:** mitigated
- **Period:** 2026-10-06 … recurring

**Symptoms**
- Black RDP screens, reconnect loops, slow logins
- Disk at 100%, 4 KB reads taking 30–70+ seconds
- Winlogon Event 4008; SessionEnv Disconnect/Reconnect delays of 77–303 seconds
- WUDFHost / DriverFrameworks-UserMode events 10111, 10120, 10121

**Root cause**

Windows RDP indirect display driver (RdpIdd.dll) becomes unstable; Windows Error Reporting writes very large dumps (≈61.5–196 GB under LocalService Temp and ProgramData\Microsoft\WDF), saturating the system disk and starving all sessions.

**Solution / remediation**
- Identify and delete/limit WER dump files after an incident
- Log off stuck sessions after disk recovers
- Limit WER dumps for WUDFHost (LocalDumps DumpType=1 or disable WDF heap dumps) so a driver crash cannot fill the disk again
- On Server 2019/2022: GPO «Use WDDM graphics display driver for Remote Desktop Connections» = Disabled (legacy XDDM). On Server 2025 this policy often has no effect — RdpIdd may still load; install latest cumulative updates instead
- Investigate interaction with call-recording software (see recording-* entries)

**Prevention**
- Cap or disable large WER/WDF dumps on session hosts
- Keep Server 2025 RDP stack patched
- Separate OS/user disk from dump/recording I/O where possible
- Monitor disk latency and WUDFHost/RdpIdd events

*Evidence messages: #1260, #1261, #1271, #2075, #2195, #2298, #2299, #2324, #2570, #2581, #5379*

---

### Old recorder kept polling invalidated Remote Audio after RDP disconnect
<a id="recording-wasapi-disconnect-hang"></a>

- **ID:** `recording-wasapi-disconnect-hang`
- **Category:** Recording
- **Severity:** critical
- **Status:** resolved
- **Period:** 2026-10-02 … 2026-10-20

**Symptoms**
- Long SessionEnv disconnect (≈300 s) then reconnect
- Possible abandoned RdpIdd swapchain / black screen after reconnect
- Huge per-user recorder.log (hundreds of thousands of lines)

**Root cause**

After RDP disconnect, recorder left in the disconnected session kept WASAPI loopback + session manager open on an invalidated Remote Audio endpoint and polled it ~2×/sec; calls hung 60–256 s in the same windows as SessionEnv 300 s delays.

**Solution / remediation**
- Upgrade recorder to ≥0.2.0 / 0.2.1 / 0.2.2: on disconnect release audio devices and signal port immediately; reopen lost devices with backoff; cap logs
- Remove old per-user installs under Documents\Recorder-package\ and Telegram Downloads
- Install once under C:\Program Files\Recorder\ and point HKCU Run «Recorder» there
- Verify disconnect/reconnect lines in %APPDATA%\Recorder\recorder.log

**Prevention**
- Single shared install path; inventory with Get-Process / Get-ChildItem before rollout
- Do not trust FileVersion «1.0.0.0» from old builds — use size (~72 MB single exe) and pNNN log tags
- A/B: disable recorder for 1–2 days when RDP instability returns

*Evidence messages: #641, #2195, #2298, #2324, #2570, #2581, #3067, #5172, #5233*

---

### New security monitoring tool auto-blocks all RDP access
<a id="security-monitor-blocks-rdp"></a>

- **ID:** `security-monitor-blocks-rdp`
- **Category:** Security/Auth
- **Severity:** critical
- **Status:** resolved
- **Period:** 2026-11

**Symptoms**
- All RDP access blocked after installing security monitoring

**Root cause**

Tool activated blocking mode automatically on install.

**Solution / remediation**
- Disable blocking mode / uninstall or whitelist; restore RDP access

**Prevention**
- Deploy security tools in monitor-only first; never enable auto-block on prod RDS without pilot

---

### Wi-Fi drops from UniFi U6-Pro Ethernet/PoE link flaps
<a id="unifi-ap-ethernet-flaps"></a>

- **ID:** `unifi-ap-ethernet-flaps`
- **Category:** Network/VPN
- **Severity:** high
- **Status:** open
- **Period:** 2026-11-13

**Symptoms**
- Wi-Fi disconnections; APs briefly offline

**Root cause**

Physical Ethernet link interruptions on MikroTik ports to U6-Pro APs (ports 9/10). Exact cause open (cables replaced; investigate PoE/injectors/shared infra). Firmware 6.8.2; no CRC errors.

**Solution / remediation**
- Investigate PoE power, injectors, connectors, shared infrastructure
- Monitor link flaps in switch logs

**Prevention**
- Stable PoE budget and cabling; alert on link flaps

*Evidence messages: #5714*

---

### Intermittent robotic/choppy call audio (RDP stable)
<a id="telephony-choppy-robotic-audio"></a>

- **ID:** `telephony-choppy-robotic-audio`
- **Category:** Telephony/SIP
- **Severity:** high
- **Status:** open
- **Period:** 2026-10-29 … 2026-11-13

**Symptoms**
- Agent heard intermittently/robotically on CRM click-to-call; multiple lines; RDP connection stable

**Root cause**

unknown/suspected: path between agent PC ↔ RDP ↔ PBX/provider (need isolation). Not always RDP.

**Solution / remediation**
- Enable mic monitoring in headphones: if own voice is already choppy inside RDP, fault is before MicroSIP/PBX
- Compare desks/servers; test provider vs local network
- QoS DSCP 46 for VoIP UDP on session hosts

**Prevention**
- Document isolation playbook: local loopback monitor → MicroSIP → trunk → provider

*Evidence messages: #5584, #5731, #5734, #3773, #3780, #3047*

---

### Telephony issue cleared when main PBX disconnected — clients still on main
<a id="pbx-main-vs-backup-routing"></a>

- **ID:** `pbx-main-vs-backup-routing`
- **Category:** Telephony/SIP
- **Severity:** high
- **Status:** open
- **Period:** 2026-11-17 … 2026-11-23

**Symptoms**
- Problems persist until main server disconnected; backup not actually primary

**Root cause**

Endpoints still registered/routed to main PBX; backup not configured as primary.

**Solution / remediation**
- Properly promote backup as main if that is intended; verify where clients are connected

**Prevention**
- Failover drills; confirm active registration target after cutover

*Evidence messages: #6449, #6059*

---

### RDP/SIP access lost when office IP drops from whitelist
<a id="office-ip-whitelist-churn"></a>

- **ID:** `office-ip-whitelist-churn`
- **Category:** Security/Auth
- **Severity:** high
- **Status:** recurring
- **Period:** 2026-11

**Symptoms**
- Sudden loss of RDP/SIP after IP change or inactivity

**Root cause**

Auto-expiry of unused whitelist IPs and/or VPN egress IP change; NetBird migration incomplete for some hosts.

**Solution / remediation**
- Re-add current egress IP; complete NetBird cutover so public whitelist is less critical

**Prevention**
- Prefer mesh VPN over mutable IP allowlists; alert on whitelist expiry

*Evidence messages: #5069*

---

### NFS export shows folders but access returns ENOENT (d?????????)
<a id="nfs-export-ghost-folders"></a>

- **ID:** `nfs-export-ghost-folders`
- **Category:** Storage/NFS
- **Severity:** high
- **Status:** recurring
- **Period:** 2026-11-04 … 2026-11-12

**Symptoms**
- Directory listing shows many folders; ls -la shows d?????????
- Access returns «No such file or directory»
- Recurred after a previous Nov 4 fix; by Nov 10 only ~21/76 folders readable

**Root cause**

NFS export on 85.206.172.48 losing/corrupting exported directory entries (exact server-side cause not fully documented in chat).

**Solution / remediation**
- Re-apply the same server-side fix used on Nov 4
- Longer-term: prefer SMB share for recorder folders if NFS keeps failing

**Prevention**
- Monitor NFS export health; consider SMB for multi-writer recorder storage

*Evidence messages: #5652*

---

### Concurrent affiliate lead POSTs reject one of the leads
<a id="affiliate-concurrent-lead-race"></a>

- **ID:** `affiliate-concurrent-lead-race`
- **Category:** CRM/Product
- **Severity:** high
- **Status:** mitigated
- **Period:** 2026-11-26

**Symptoms**
- Occasional lead rejected when affiliates send at the exact same moment

**Root cause**

Race/conflict under simultaneous affiliate API submissions.

**Solution / remediation**
- Implement server-side fix for concurrent lead creation conflict

**Prevention**
- Idempotency keys / transactional locking on lead create path

*Evidence messages: #6663*

---

### CRM login rate limits lock whole desk IPs
<a id="crm-login-rate-limit-desk-lockout"></a>

- **ID:** `crm-login-rate-limit-desk-lockout`
- **Category:** Security/Auth
- **Severity:** high
- **Status:** mitigated
- **Period:** 2026-11-20

**Symptoms**
- Entire desk cannot log in after several failed attempts

**Root cause**

Security hardening: e.g. 5 fails/15m per user+IP and 10 fails/15m per shared IP; agents retry weak/wrong passwords from one office egress.

**Solution / remediation**
- Unblock IP/users; communicate new limits; stagger retries; fix passwords

**Prevention**
- Tune shared-IP thresholds for office NAT; UI guidance on password policy

*Evidence messages: #6302*

---

### RDP exposed on public internet
<a id="netbird-rdp-exposure"></a>

- **ID:** `netbird-rdp-exposure`
- **Category:** Security/Auth
- **Severity:** high
- **Status:** mitigated
- **Period:** 2026-11-07

**Symptoms**
- RDP reachable from the public network

**Root cause**

Direct public exposure of RDP endpoints.

**Solution / remediation**
- Move access to NetBird (WireGuard-based) private network with strict access policies

**Prevention**
- Keep RDP off public IPs; access only via mesh VPN

*Evidence messages: #5069*

---

### Recording writes competing with OS/RDP on the system disk
<a id="recordings-on-system-disk"></a>

- **ID:** `recordings-on-system-disk`
- **Category:** Storage/NFS
- **Severity:** high
- **Status:** mitigated
- **Period:** 2026-10-06

**Symptoms**
- Disk saturation affects RDP users when recordings write heavily

**Root cause**

Recordings and user/OS I/O share the same disk.

**Solution / remediation**
- Add a dedicated disk (or volume) for recordings so 100% util on that disk does not starve RDP

**Prevention**
- Keep media/recording I/O off the OS volume

*Evidence messages: #1490*

---

### Office IP banned by PBX after SIP auth failure loop
<a id="sip-office-ip-fail2ban"></a>

- **ID:** `sip-office-ip-fail2ban`
- **Category:** Telephony/SIP
- **Severity:** high
- **Status:** mitigated
- **Period:** 2026-11-03 … recurring

**Symptoms**
- Whole office loses SIP/RDP-related access; mass extension failures

**Root cause**

One extension repeatedly fails authentication; PBX fail2ban bans the entire office public IP.

**Solution / remediation**
- Unban IP on PBX
- Fix the misconfigured extension password
- Verify registrations resume

**Prevention**
- Alert on per-extension auth failures before ban threshold; avoid sharing one egress IP without monitoring

*Evidence messages: #4185*

---

### Robotic/intermittent audio on distant Singapore RDP server
<a id="singapore-rdp-audio-latency"></a>

- **ID:** `singapore-rdp-audio-latency`
- **Category:** Telephony/SIP
- **Severity:** high
- **Status:** mitigated
- **Period:** 2026-11-12 …

**Symptoms**
- Robotic/choppy audio for users on Singapore RDP; some still dual-logged on old+new servers

**Root cause**

suspected: high latency Singapore RDP ↔ PBX path; VPN routing; dual sessions

**Solution / remediation**
- Move users to nearer hosts; ensure single active session; validate VPN path to PBX

**Prevention**
- Keep voice-critical agents on low-latency RDP↔PBX geography

*Evidence messages: #5584*

---

### Same SIP extension assigned to multiple CRM users → 500 / freezes
<a id="duplicate-sip-extensions"></a>

- **ID:** `duplicate-sip-extensions`
- **Category:** Telephony/SIP
- **Severity:** high
- **Status:** mitigated
- **Period:** 2026-11-06

**Symptoms**
- MicroSIP 500 errors; call freezes; incompatible extension messages

**Root cause**

Duplicate or incompatible SIP extension mapping in CRM (same extension on multiple users).

**Solution / remediation**
- Enumerate and unique-map extensions to users; align CRM extension config

**Prevention**
- Provisioning check: one extension ↔ one CRM user

*Evidence messages: #4814*

---

### WhatsApp WinUI/memory crash + failed package re-register on multi-user host
<a id="whatsapp-package-crash-reregister"></a>

- **ID:** `whatsapp-package-crash-reregister`
- **Category:** WhatsApp
- **Severity:** high
- **Status:** mitigated
- **Period:** 2026-10-08

**Symptoms**
- WhatsApp crashes; Windows repair of the package fails while other users still run it

**Root cause**

WhatsApp memory/WinUI crash; concurrent multi-user package state blocks clean re-register.

**Solution / remediation**
- Close WhatsApp for ALL users
- Repair/re-register the AppX package cleanly
- Then reopen; if needed update/replace WhatsApp version

**Prevention**
- Coordinate WhatsApp updates off-hours; avoid partial per-user repairs on RDS

*Evidence messages: #1856, #2186*

---

### WhatsApp dial/call UI freeze (WebView2); process still «responding»
<a id="whatsapp-webview2-call-freeze"></a>

- **ID:** `whatsapp-webview2-call-freeze`
- **Category:** WhatsApp
- **Severity:** high
- **Status:** mitigated
- **Period:** 2026-10-06 … 2026-10-13

**Symptoms**
- Outgoing call freezes UI; WhatsApp.Root.exe still shows responding; mass reports

**Root cause**

WhatsApp via Edge WebView2; frozen WebView process; outdated WebView2 Runtime.

**Solution / remediation**
- Restart WhatsApp WebView process to restore calls immediately
- Update WebView2 Runtime (e.g. 154.0.4258.62 → 155.0.4283.45)
- Do not close WhatsApp during freeze if capturing logs for RCA

**Prevention**
- Keep WebView2 Runtime current on session hosts; monitor after updates

*Evidence messages: #1228, #2415, #2524, #2527, #2614*

---

### WhatsApp freezes ~30–35 s during calls due to WMI process scan on UI thread
<a id="whatsapp-wmi-process-scan-freeze"></a>

- **ID:** `whatsapp-wmi-process-scan-freeze`
- **Category:** WhatsApp
- **Severity:** high
- **Status:** mitigated
- **Period:** 2026-10-14

**Symptoms**
- UI freezes during calls while audio continues; worse on heavily loaded hosts

**Root cause**

WhatsApp runs a WMI process scan on the main UI thread; with >5000 processes on the RDP server the scan takes ~30–35 s.

**Solution / remediation**
- Split users across additional RDP servers to reduce process count per host

**Prevention**
- Capacity-plan RDS hosts; avoid packing too many concurrent sessions/apps on one box

*Evidence messages: #2740*

---

### Admin VPN would hijack default gateway and break other RDP users
<a id="openvpn-split-tunnel-for-admin-rdp"></a>

- **ID:** `openvpn-split-tunnel-for-admin-rdp`
- **Category:** Network/VPN
- **Severity:** high
- **Status:** resolved
- **Period:** 2026-10-22 … 2026-11-02

**Symptoms**
- Need VPN path to a remote RDP server without changing server public routing

**Root cause**

Full-tunnel OpenVPN changes default gateway on the Windows server.

**Solution / remediation**
- Use stock RDP client + OpenVPN split tunnel
- Modify .ovpn: do not replace default gateway; add specific route to destination IP only

**Prevention**
- Never full-tunnel VPN on multi-user session hosts

*Evidence messages: #4155, #3367*

---

### Very slow upload over WireGuard VPN (~6 Mbps)
<a id="vpn-wireguard-mss-slow-upload"></a>

- **ID:** `vpn-wireguard-mss-slow-upload`
- **Category:** Network/VPN
- **Severity:** high
- **Status:** resolved
- **Period:** 2026-10-21

**Symptoms**
- Upload ≈6 Mbps over VPN despite better underlying capacity

**Root cause**

TCP packet sizing / MSS issues over WireGuard causing severe sensitivity to packet loss.

**Solution / remediation**
- Optimize TCP MSS settings — upload improved ≈6 → 47 Mbps

**Prevention**
- Tune MSS/MTU when deploying WireGuard for RDP/file transfer paths

*Evidence messages: #3260*

---

### General RDP lag / noisy neighbor on multi-session hosts
<a id="rds-hardening-fairshare-sessions"></a>

- **ID:** `rds-hardening-fairshare-sessions`
- **Category:** Performance
- **Severity:** high
- **Status:** resolved
- **Period:** 2026-10-20

**Symptoms**
- Slow sessions, contention between users, leftover profiles wasting disk

**Root cause**

Balanced power plan, Fair Share disabled for disk/network, unlimited idle/disconnected sessions, heavy Chrome/WhatsApp profiles, OS temp clutter.

**Solution / remediation**
- Power plan → High performance
- Re-enable disk/network Fair Share (CPU Fair Share already on)
- Session limits: idle 60 min disconnect; disconnected 60 min logoff
- Display max 1920×1080, no wallpaper; per-session Temp deleted at logoff
- QoS DSCP 46 on UDP for VoIP; fixed 32 GB pagefile on C:
- Chrome: Memory Saver, 256 MB cache, no HW accel, no background mode; allow web.whatsapp.com mic/notifications
- Default profile: best performance visual effects; disable tips/background apps; strip OneDrive first-run
- Logon script Optimize-CurrentUser.ps1; disable machine-wide non-Microsoft startups
- Delete unused Retention profiles; free disk

**Prevention**
- Apply via GPO; keep logon optimization; review Fair Share after major changes

*Evidence messages: #3047*

---

### Daytime Windows Update causes mass RDP disconnect/freeze
<a id="windows-update-daytime"></a>

- **ID:** `windows-update-daytime`
- **Category:** RDP/Infra
- **Severity:** high
- **Status:** resolved
- **Period:** 2026-09-30 … 2026-10-28

**Symptoms**
- Many users disconnect/reconnect at once; sessions freeze

**Root cause**

Windows Update consuming bandwidth/resources during business hours (correlated in RDP logs).

**Solution / remediation**
- Reschedule Windows Updates to night / maintenance window

**Prevention**
- WSUS/maintenance window policy; never allow interactive daytime CU installs on prod RDS

*Evidence messages: #258, #3580, #3592*

---

### Every incoming call froze the session for a few seconds
<a id="recording-incoming-call-freeze"></a>

- **ID:** `recording-incoming-call-freeze`
- **Category:** Recording
- **Severity:** high
- **Status:** resolved
- **Period:** 2026-11-16

**Symptoms**
- System freezes briefly on every incoming call

**Root cause**

suspected: older recorder build interaction with call audio path

**Solution / remediation**
- Install latest recorder + Lite version — freezes disappeared immediately

**Prevention**
- Keep recorder on current release; regression-test on incoming calls after upgrades

*Evidence messages: #5971*

---

### Recorder could not run for multiple users on one RDP host
<a id="recording-multi-user-single-instance"></a>

- **ID:** `recording-multi-user-single-instance`
- **Category:** Recording
- **Severity:** high
- **Status:** resolved
- **Period:** 2026-10-02

**Symptoms**
- Starting recorder under user A blocks launch under user B on the same server

**Root cause**

Application treated as single-instance across sessions on a multi-user RDS host.

**Solution / remediation**
- Ask vendor for multi-instance / multi-session support; deploy fixed build that allows concurrent per-session instances

**Prevention**
- Validate multi-session install before production rollout on RDS

*Evidence messages: #641, #643*

---

### Dashboard shows ANSWERED / wrong billing from internal Asterisk CDR rows
<a id="asterisk-cdr-multi-row-answered"></a>

- **ID:** `asterisk-cdr-multi-row-answered`
- **Category:** Telephony/SIP
- **Severity:** high
- **Status:** resolved
- **Period:** 2026-11-05

**Symptoms**
- Calls marked answered incorrectly; confusing uncharged call stats

**Root cause**

Asterisk creates multiple CDR rows per call; dashboard sometimes read an internal row as ANSWERED instead of provider/trunk result.

**Solution / remediation**
- Treat provider trunk CDR as source of truth; uncharged OK for internal/BUSY/NO ANSWER

**Prevention**
- Always filter CDR by trunk/provider leg for billing dashboards

*Evidence messages: #4654*

---

### Incoming-call freezes from MicroSIP «Bring to Front» / outdated build
<a id="microsip-bring-to-front-freeze"></a>

- **ID:** `microsip-bring-to-front-freeze`
- **Category:** Telephony/SIP
- **Severity:** high
- **Status:** resolved
- **Period:** 2026-11-16

**Symptoms**
- Session freezes on every incoming call

**Root cause**

MicroSIP setting «Bring to Front on Incoming Call» plus outdated MicroSIP builds interacting badly on RDS.

**Solution / remediation**
- Disable Bring to Front; install latest MicroSIP (+ Lite where applicable) — freezes stopped

**Prevention**
- Standardize MicroSIP settings via baseline image; block old builds

*Evidence messages: #5971*

---

### Temporary MicroSIP registration failures from one public IP
<a id="microsip-registration-blip"></a>

- **ID:** `microsip-registration-blip`
- **Category:** Telephony/SIP
- **Severity:** high
- **Status:** resolved
- **Period:** 2026-10-29

**Symptoms**
- Multiple extensions unavailable at once

**Root cause**

Several MicroSIP registrations from the same public IP stopped renewing briefly; Asterisk marked them unavailable. Not deleted extensions or permanent firewall block.

**Solution / remediation**
- Wait/restore registrations; they come back when renewals resume; confirm not a permanent IP ban

**Prevention**
- Monitor SIP registration renewals; alert on mass unavailability per IP

*Evidence messages: #3634*

---

### Random user black screen suspected from stuck logon script
<a id="logon-script-black-screen"></a>

- **ID:** `logon-script-black-screen`
- **Category:** RDP/Infra
- **Severity:** medium
- **Status:** open
- **Period:** 2026-10-20 …

**Symptoms**
- Daily random users get black screen at login

**Root cause**

unknown/suspected: Optimize-CurrentUser.ps1 / logon script hangs and blocks desktop load

**Solution / remediation**
- Check %TEMP%\RDSOptimize.log; run script async if needed; isolate affected profiles

**Prevention**
- Timeout logon scripts; make optimizations non-blocking

*Evidence messages: #3047*

---

### AUDCLNT_E_DEVICE_INVALIDATED (0x88890004) on Remote Audio
<a id="recording-audio-device-invalidated"></a>

- **ID:** `recording-audio-device-invalidated`
- **Category:** Recording
- **Severity:** medium
- **Status:** open
- **Period:** 2026-11-09 …

**Symptoms**
- Recorder logs device loss; MicroSIP loses mic/speaker at the same moment

**Root cause**

Windows invalidates the session audio endpoint (disconnect/reconnect, Audiosrv restart, or WUDFHost/RdpIdd crash). Recorder is a witness, not the cause.

**Solution / remediation**
- Recorder retries with backoff (5 s … 60 s)
- Collect correlating events: TerminalServices 24/25/40, Audiosrv, WUDFHost 10111, scheduled tasks around the timestamp

**Prevention**
- Stabilize RDP display/audio stack; avoid scheduled maintenance that restarts audio mid-shift

*Evidence messages: #5379*

---

### Client cannot hear agent for first ~10 seconds
<a id="first-10s-one-way-audio"></a>

- **ID:** `first-10s-one-way-audio`
- **Category:** Telephony/SIP
- **Severity:** medium
- **Status:** open
- **Period:** 2026-11

**Symptoms**
- One-way audio at call start (~10 s), then normal

**Root cause**

unknown/suspected: early media / RDP audio device readiness / media path setup delay

**Solution / remediation**
- Continue isolation with mic-monitor and provider early-media checks; correlate with audio device invalidation events

**Prevention**
- Ensure audio endpoint ready before dial; review early-media/ringback settings

---

### CRM HTTP 500 when phone extension incompatible
<a id="crm-500-incompatible-extension"></a>

- **ID:** `crm-500-incompatible-extension`
- **Category:** CRM/Product
- **Severity:** medium
- **Status:** mitigated
- **Period:** 2026-11-06

**Symptoms**
- 500 errors around click-to-call / phone features

**Root cause**

Extension not compatible with CRM phone integration.

**Solution / remediation**
- Align extension config with CRM expectations; fix mapping

**Prevention**
- Validate extension provisioning against CRM schema before assigning to agents

*Evidence messages: #4814*

---

### Request for multiple owners conflicts with multi-brand CRM ownership model
<a id="multi-owner-vs-viewers"></a>

- **ID:** `multi-owner-vs-viewers`
- **Category:** CRM/Product
- **Severity:** medium
- **Status:** mitigated
- **Period:** 2026-10-02 … 2026-10-12

**Symptoms**
- Business wants shared ownership; system has single owner semantics for deposits/chat/support

**Root cause**

Ownership is deep in multi-CRM/multi-brand design.

**Solution / remediation**
- Prefer «Viewers» field for extra access without changing owner/credit logic

**Prevention**
- Clarify access vs ownership in requirements before changing core assignment

*Evidence messages: #767, #2332*

---

### Lead CSV import fails on duplicate emails / opaque errors
<a id="lead-import-duplicates"></a>

- **ID:** `lead-import-duplicates`
- **Category:** Data/Import
- **Severity:** medium
- **Status:** mitigated
- **Period:** 2026-10-01

**Symptoms**
- Import errors; deleting rows yields new errors; desire to edit in-place without Excel round-trip

**Root cause**

Uploaded file contains duplicate email addresses; error messaging insufficiently actionable for operators.

**Solution / remediation**
- Deduplicate emails in source file; explain error = duplicate in upload; improve UX to edit/map without full re-upload where possible

**Prevention**
- Pre-validate CSV for unique email/phone; clearer row-level error messages

*Evidence messages: #469, #478, #479, #774*

---

### RDP freezes possibly worsened by single NIC RSS queue
<a id="nic-rss-single-queue"></a>

- **ID:** `nic-rss-single-queue`
- **Category:** Performance
- **Severity:** medium
- **Status:** mitigated
- **Period:** 2026-11-09

**Symptoms**
- Intermittent RDP freezes under network load

**Root cause**

Server NIC using only 1 RSS receive queue, concentrating network processing on few cores.

**Solution / remediation**
- Increase RSS receive queues to 8; monitor whether freezes continue

**Prevention**
- Validate NIC RSS/RSS queues on new session hosts

*Evidence messages: #5251*

---

### Recordings written to C:\Documents instead of D: per-user path
<a id="recorder-path-c-instead-of-d"></a>

- **ID:** `recorder-path-c-instead-of-d`
- **Category:** Recording
- **Severity:** medium
- **Status:** mitigated
- **Period:** 2026-10

**Symptoms**
- Recordings land on system disk / wrong folder

**Root cause**

Per-user recorder installs misconfigured; output left at Documents\Recorder instead of D:\username.

**Solution / remediation**
- Reconfigure output path; prefer shared Program Files install with correct storage target

**Prevention**
- Baseline config.json in deployment; verify path on first login

*Evidence messages: #2324, #2570*

---

### Stricter password policy rejects resets without clear UI errors
<a id="password-policy-no-ui-guidance"></a>

- **ID:** `password-policy-no-ui-guidance`
- **Category:** Security/Auth
- **Severity:** medium
- **Status:** mitigated
- **Period:** 2026-11-20

**Symptoms**
- Password reset fails with opaque error

**Root cause**

New rules deployed without tooltip/error explaining which rule failed.

**Solution / remediation**
- Document rules (length, blacklist, no numbers-only, no repeated chars, not email local-part); add UI guidance

**Prevention**
- Ship policy text with the enforcement

*Evidence messages: #6302*

---

### CRM call duration longer than recording (carrier marks answered on ring)
<a id="call-duration-includes-ringing"></a>

- **ID:** `call-duration-includes-ringing`
- **Category:** Telephony/SIP
- **Severity:** medium
- **Status:** mitigated
- **Period:** 2026-11-04

**Symptoms**
- e.g. duration 44 s vs recording 20 s

**Root cause**

Some carriers mark call answered when ringing starts; CRM took carrier duration including ring time; recording is talk-only.

**Solution / remediation**
- Prefer conversation-time duration in CRM; clarify with carrier; recording is authoritative for talk time

**Prevention**
- Document carrier answer semantics; use recording or bridged talk timer for duration

*Evidence messages: #4443, #4396*

---

### WhatsApp voice call fails (no camera; mic permission suspected)
<a id="whatsapp-mic-permissions"></a>

- **ID:** `whatsapp-mic-permissions`
- **Category:** WhatsApp
- **Severity:** medium
- **Status:** mitigated
- **Period:** 2026-10-07

**Symptoms**
- Cannot start regular call before switching to video; no camera on server

**Root cause**

suspected: WhatsApp missing microphone permission in the RDP session

**Solution / remediation**
- Grant mic permission; verify via AnyDesk on the affected session; start audio call then switch to video if needed

**Prevention**
- Pre-configure WhatsApp/Chrome mic permissions in default user profile / Chrome policy

*Evidence messages: #1609, #3047*

---

### Calendar times wrong for all users
<a id="calendar-timezone-misconfig"></a>

- **ID:** `calendar-timezone-misconfig`
- **Category:** CRM/Product
- **Severity:** medium
- **Status:** resolved
- **Period:** 2026-10-12

**Symptoms**
- Displayed calendar times offset from real

**Root cause**

Incorrect time configuration.

**Solution / remediation**
- Correct time settings going forward; bulk-shift existing calendar entries retroactively

**Prevention**
- Validate timezone on brand/CRM setup checklist

*Evidence messages: #2450, #2453*

---

### Need percentage split of affiliate leads across multiple agents
<a id="affiliate-lead-distribution"></a>

- **ID:** `affiliate-lead-distribution`
- **Category:** CRM/Product
- **Severity:** medium
- **Status:** resolved
- **Period:** 2026-10-02 … 2026-10-03

**Symptoms**
- Single fixed owner insufficient for 70/30 (etc.) desk splits

**Root cause**

Product gap (not a bug).

**Solution / remediation**
- Lead Distribution in Affiliate User settings: agents + percentages = 100%
- Sequential (not random) assignment; deactivate agent redistributes share
- Priority: API Owner > duplicate→original owner > distribution > default owner
- History/audit of changes

**Prevention**
- N/A — feature

*Evidence messages: #762, #938*

---

### Unclear duplicate lead rejection rules across days / FTD
<a id="duplicate-reject-policy"></a>

- **ID:** `duplicate-reject-policy`
- **Category:** CRM/Product
- **Severity:** medium
- **Status:** resolved
- **Period:** 2026-10-09

**Symptoms**
- Confusion when same phone/email can or cannot re-register

**Root cause**

Product rules needed clarification.

**Solution / remediation**
- Same phone/email same day → reject as duplicate
- Next day → allowed as new client
- If deposit ≥ $250 (FTD threshold) → treat as duplicate for 30 days
- Registration Links page for WT/Owner/duplicate policy

**Prevention**
- Document policy in CRM UI; registration-link level controls

*Evidence messages: #2104*

---

### WebTrader/CRM P&L mismatch on long-lived sessions
<a id="webtrader-stale-pnl"></a>

- **ID:** `webtrader-stale-pnl`
- **Category:** CRM/Product
- **Severity:** medium
- **Status:** resolved
- **Period:** 2026-11

**Symptoms**
- P&L differs between WebTrader and CRM after long open session

**Root cause**

Client left WebTrader open too long; stale UI state (auto-refresh insufficient after >1 hour).

**Solution / remediation**
- Refresh/reload WebTrader; educate users not to leave sessions open indefinitely

**Prevention**
- Stronger auto-refresh or session staleness warning

---

### Agent cannot connect to RDP due to personal VPN exit country
<a id="rdp-blocked-by-user-vpn-country"></a>

- **ID:** `rdp-blocked-by-user-vpn-country`
- **Category:** Network/VPN
- **Severity:** medium
- **Status:** resolved
- **Period:** 2026-11

**Symptoms**
- Single user cannot reach RDP while others can

**Root cause**

User VPN egress set to unexpected country (e.g. Netherlands) not matching allowlist/path.

**Solution / remediation**
- Disable personal VPN or switch exit; connect via approved path

**Prevention**
- Document allowed connectivity; prefer NetBird client

---

### Agent connectivity issues blamed on VPN but caused by bad cable
<a id="local-cable-not-vpn"></a>

- **ID:** `local-cable-not-vpn`
- **Category:** Network/VPN
- **Severity:** medium
- **Status:** resolved
- **Period:** 2026-10-28 … 2026-11-06

**Symptoms**
- Slow/unstable agent connection; switching VPN did not help

**Root cause**

Faulty physical network cable at the agent workstation.

**Solution / remediation**
- Replace cable; verify with continuous ping before blaming VPN/RDP

**Prevention**
- Isolate: office-wide vs single user; ping during incident; check layer-1 first

*Evidence messages: #3569, #4932*

---

### Need write-only storage account for recording uploads
<a id="storage-write-only-recording-user"></a>

- **ID:** `storage-write-only-recording-user`
- **Category:** Security/Auth
- **Severity:** medium
- **Status:** resolved
- **Period:** 2026-09-30

**Symptoms**
- Uploaders must push recordings without reading others' files

**Root cause**

Security design requirement for shared recording storage.

**Solution / remediation**
- Create restricted user with write/upload-only rights (no list/read of others)

**Prevention**
- Keep principle of least privilege on recording shares

*Evidence messages: #354*

---

### Weak passwords accepted for clients/staff
<a id="password-policy-hardening"></a>

- **ID:** `password-policy-hardening`
- **Category:** Security/Auth
- **Severity:** medium
- **Status:** resolved
- **Period:** 2026-11-20

**Symptoms**
- Need enforceable password rules

**Root cause**

Insufficient policy.

**Solution / remediation**
- Min 8 (10 for CRM employees/affiliates), max 128
- Blacklist ~50 common passwords; reject numbers-only and repeated single char
- Cannot match email/local-part; no forced complexity mix

**Prevention**
- Keep blacklist updated

*Evidence messages: #6302*

---

### Wrong SIP password → IP blocked
<a id="sip-wrong-password-ip-block"></a>

- **ID:** `sip-wrong-password-ip-block`
- **Category:** Telephony/SIP
- **Severity:** medium
- **Status:** resolved
- **Period:** 2026-10-05 … 2026-11-03

**Symptoms**
- Extension cannot register; IP appears blocked

**Root cause**

Extension repeatedly authenticates with incorrect password; fail2ban/firewall blocks the IP.

**Solution / remediation**
- Fix password; unblock IP; verify registration

**Prevention**
- Distribute credentials carefully; alert on auth failures before ban threshold

*Evidence messages: #4185, #1086, #1088*

---

### Affiliate display name change not visible until service restart
<a id="affiliate-rename-needs-restart"></a>

- **ID:** `affiliate-rename-needs-restart`
- **Category:** CRM/Product
- **Severity:** low
- **Status:** mitigated
- **Period:** 2026-11-11

**Symptoms**
- Renamed affiliate still shows old name externally

**Root cause**

Affiliate service caches names until restart.

**Solution / remediation**
- Restart affiliate service after name changes

**Prevention**
- Hot-reload or cache bust on rename

*Evidence messages: #5563*

---

### UI translated but month names not localized
<a id="localization-months"></a>

- **ID:** `localization-months`
- **Category:** CRM/Product
- **Severity:** low
- **Status:** mitigated
- **Period:** 2026-09-30

**Symptoms**
- Months remain in wrong language

**Root cause**

Incomplete localization of date formatting.

**Solution / remediation**
- Fix month name localization

**Prevention**
- Include date/month tokens in translation QA

*Evidence messages: #307*

---

### Wallet balance source unclear (API vs webhook)
<a id="wallet-balance-webhook-clarification"></a>

- **ID:** `wallet-balance-webhook-clarification`
- **Category:** CRM/Product
- **Severity:** low
- **Status:** mitigated
- **Period:** 2026-09-30

**Symptoms**
- Uncertainty how Balance should be maintained when webhook exists

**Root cause**

Integration design ambiguity (List/Generate/save wallet clear; Balance path unclear).

**Solution / remediation**
- If webhook delivers balance updates, do not also poll balance API — align on single source of truth

**Prevention**
- Document wallet integration contract before build

*Evidence messages: #369*

---

### TP/SL set as dollar amounts instead of prices
<a id="tp-sl-price-vs-dollars"></a>

- **ID:** `tp-sl-price-vs-dollars`
- **Category:** CRM/Product
- **Severity:** low
- **Status:** resolved
- **Period:** 2026-10

**Symptoms**
- Users enter profit dollars into TP/SL fields incorrectly

**Root cause**

UX misunderstanding: TP/SL are market prices, not profit dollar amounts.

**Solution / remediation**
- Clarify in UI/help that values are prices

**Prevention**
- Inline field hints / validation

---

### Confusion between Total FTD, day conversion, and QFTD ($250+)
<a id="reports-ftd-vs-qftd"></a>

- **ID:** `reports-ftd-vs-qftd`
- **Category:** Reports
- **Severity:** low
- **Status:** resolved
- **Period:** 2026-10-20 … 2026-10-27

**Symptoms**
- Numbers disagree across cards/screenshots

**Root cause**

Different definitions: day-to-day conversion vs all FTDs in period vs qualified FTD ≥ $250 single deposit.

**Solution / remediation**
- Ship Total FTD Conversion + Valid Leads / Valid Conversion cards
- Document: Total FTD = any amount; QFTD = ≥$250; Valid statuses configurable in Module Fields

**Prevention**
- Keep metric definitions visible in UI tooltips

*Evidence messages: #3107, #3551*

---

### Reports show more FTDs than Clients list for a desk
<a id="ftd-reports-vs-clients-owner"></a>

- **ID:** `ftd-reports-vs-clients-owner`
- **Category:** Reports
- **Severity:** low
- **Status:** resolved
- **Period:** 2026-10

**Symptoms**
- FTD counts in Reports disagree with filtered Clients list

**Root cause**

Reports credit FTD to desk/agent at deposit time; Clients filters by current owner/desk after moves.

**Solution / remediation**
- Explain timing vs current-owner semantics; use Reports for historical credit

**Prevention**
- UI note on credit-at-event vs current-owner filters

*Evidence messages: #3107, #3551*

---

## Operational playbooks distilled from the chat

### RDP «everything lags / black screen»
1. Check disk latency and free space; look for huge `.dmp` / `.mdmp` / `.hdmp` under `LocalService\...\Temp` and `ProgramData\Microsoft\WDF`.
2. Check Event Viewer: WUDFHost / RdpIdd 10111–10121, Winlogon 4008, SessionEnv long disconnects.
3. Delete or truncate dumps; log off stuck sessions after disk recovers.
4. Cap WER dumps; verify recorder version ≥ 0.2.x in `C:\Program Files\Recorder\` only.
5. If instability continues: A/B disable recorder 24–48h; patch Server 2025 RDP stack.

### WhatsApp freeze on call
1. Ask agent NOT to kill WhatsApp if capturing freeze logs.
2. Restart WhatsApp WebView2 process; confirm WebView2 Runtime is current.
3. If freezes are ~30s with audio still working: check process count — split users across hosts if thousands of processes.
4. Verify mic permissions; close other apps holding the mic.

### Choppy / robotic telephony with stable RDP
1. Mic-monitor in headphones inside the session — if already bad, fault is PC↔RDP, not PBX.
2. Continuous ping during incident; check cable/AP/PoE before VPN.
3. Check MicroSIP registration renewals and Asterisk bans for wrong passwords / duplicate extensions.
4. For billing/status bugs: use provider trunk CDR, not internal Asterisk rows.

### Network isolation order
Rule out one layer at a time: physical cable/AP → local LAN → VPN/MSS → RDP host → recorder → MicroSIP → PBX/trunk → provider.
