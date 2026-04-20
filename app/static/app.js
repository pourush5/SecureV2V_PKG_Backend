document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const valP = document.getElementById('val-p');
    const valG = document.getElementById('val-g');
    const valPpub = document.getElementById('val-ppub');
    
    const inputVid = document.getElementById('vehicle-id');
    const inputPwd = document.getElementById('password');
    const btnRegister = document.getElementById('btn-register');
    const btnLogin = document.getElementById('btn-login');
    
    const mathDisplay = document.getElementById('math-display');
    const mathId = document.getElementById('math-id');
    const mathQid = document.getElementById('math-qid');
    const mathDid = document.getElementById('math-did');

    const termInput = document.getElementById('v2v-msg');
    const btnBroadcast = document.getElementById('btn-broadcast');
    const terminal = document.getElementById('terminal');

    // State
    let systemP = 1;
    let ws = null;

    // Toast Notification
    function showToast(message, isError = false) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${isError ? 'error' : ''}`;
        
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    }

    // Terminal Logging
    function logTerminal(message, direction = 'sys') {
        const p = document.createElement('p');
        const time = new Date().toLocaleTimeString([], { hour12: false });
        let dirSpan = '';
        
        if (direction === 'in') dirSpan = '<span class="direction-in">[RX]</span> ';
        else if (direction === 'out') dirSpan = '<span class="direction-out">[TX]</span> ';
        else dirSpan = '<span style="color:#fbbf24">[SYS]</span> ';

        p.innerHTML = `<span class="timestamp">${time}</span> ${dirSpan} ${message}`;
        terminal.appendChild(p);
        terminal.scrollTop = terminal.scrollHeight;
    }

    // Hash string to hex
    async function sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    // Phase 1: Fetch System Parameters
    async function initSystem() {
        try {
            const res = await fetch('/public-parameters');
            const data = await res.json();
            
            systemP = data.p;
            
            // Animate loading text out, values in
            valP.textContent = data.p;
            valG.textContent = data.g;
            valPpub.textContent = data.p_pub;
            
            // Reformat long string
            if(data.p_pub.toString().length > 20) {
                valPpub.title = data.p_pub;
                valPpub.textContent = data.p_pub.toString().substring(0, 15) + '...';
            }

            logTerminal("Received Group Parameters (P, g, P_pub) from PKG.");
            
            // Setup WebSocket
            setupWebSocket();

        } catch (err) {
            console.error(err);
            valP.textContent = "Error";
            valG.textContent = "Error";
            valPpub.textContent = "Error";
            showToast("Failed to connect to PKG Backend", true);
        }
    }

    // Phase 4: Setup WebSockets
    function setupWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/v2v-network`;
        
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            logTerminal("Subscribed to open V2V airwaves.");
        };
        
        ws.onmessage = (event) => {
            logTerminal(`Ciphertext broadcast received: ${event.data}`, 'in');
        };
        
        ws.onclose = () => {
            logTerminal("Connection lost. Reconnecting in 5s...");
            setTimeout(setupWebSocket, 5000);
        };
    }

    // Phase 4: Broadcast Message
    btnBroadcast.addEventListener('click', () => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            showToast("Airwaves not connected", true);
            return;
        }
        
        const msg = termInput.value.trim();
        if(!msg) return;

        // Simulate an encrypted packet
        const encryptedSim = `Enc(${msg.substring(0,4)}...)_ID`;
        ws.send(encryptedSim);
        logTerminal(`Broadcasting payload: ${encryptedSim}`, 'out');
        
        termInput.value = '';
    });

    // Enter to broadcast
    termInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') btnBroadcast.click();
    });

    // Phase 2: Registration
    btnRegister.addEventListener('click', async () => {
        const vid = inputVid.value.trim();
        const pwd = inputPwd.value.trim();
        
        if (!vid || !pwd) {
            showToast("Please enter License Plate and PIN", true);
            return;
        }
        
        try {
            const res = await fetch('/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vehicle_id: vid, password: pwd })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                showToast("Registered Successfully!");
                logTerminal(`Vehicle ${vid} registered with PKG.`);
            } else {
                showToast(data.detail || "Registration failed", true);
            }
        } catch (err) {
            showToast("Network Error", true);
        }
    });

    // Phase 3: Login & Key Generation
    btnLogin.addEventListener('click', async () => {
        const vid = inputVid.value.trim();
        const pwd = inputPwd.value.trim();
        
        if (!vid || !pwd) {
            showToast("Please enter License Plate and PIN", true);
            return;
        }

        // Hide math display initially
        mathDisplay.classList.remove('active');
        
        try {
            const res = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vehicle_id: vid, password: pwd })
            });
            
            const data = await res.json();
            
            if (res.ok) {
                showToast("Key Generated Securely!");
                
                // Show visualization
                mathId.textContent = vid.toUpperCase();
                
                // Approximate JS SHA256 for visual only
                const hashHex = await sha256(vid.toUpperCase());
                mathQid.textContent = "0x" + hashHex.substring(0, 16) + "...";
                
                mathDid.textContent = data.private_key;
                mathDisplay.classList.add('active');
                
                logTerminal(`Identity derived. $d_{ID}$ issued for ${vid}.`);

            } else {
                showToast(data.detail || "Authentication Failed", true);
            }
        } catch (err) {
            showToast("Network Error", true);
        }
    });

    // Boot
    initSystem();
});
