    // Elements
    const lengthEl = document.getElementById('length');
    const lenVal = document.getElementById('lenVal');
    const lowerEl = document.getElementById('lower');
    const upperEl = document.getElementById('upper');
    const numbersEl = document.getElementById('numbers');
    const symbolsEl = document.getElementById('symbols');
    const generateBtn = document.getElementById('generate');
    const passwordEl = document.getElementById('password');
    const meterFill = document.getElementById('meterFill');
    const strengthLabel = document.getElementById('strengthLabel');
    const entropyLabel = document.getElementById('entropy');
    const suggestionsEl = document.getElementById('suggestions');
    const copyBtn = document.getElementById('copyBtn');
    const showBtn = document.getElementById('showBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const historyEl = document.getElementById('history');
    const saveBtn = document.getElementById('saveBtn');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const ruleLen = document.getElementById('ruleLen');
    const ruleSets = document.getElementById('ruleSets');

    // Character pools
    const POOLS = {
      lower: 'abcdefghijklmnopqrstuvwxyz',
      upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      numbers: '0123456789',
      symbols: '!@#$%^&*()-_=+[]{};:,.<>?'
    };

    // Helpers
    function buildPool(){
      let pool = '';
      if(lowerEl.checked) pool += POOLS.lower;
      if(upperEl.checked) pool += POOLS.upper;
      if(numbersEl.checked) pool += POOLS.numbers;
      if(symbolsEl.checked) pool += POOLS.symbols;
      return pool;
    }

    function generatePassword(len){
      const pool = buildPool();
      if(!pool.length) return '';
      // Ensure at least one from each chosen set for stronger guarantees
      const chosenSets = [];
      if(lowerEl.checked) chosenSets.push(POOLS.lower);
      if(upperEl.checked) chosenSets.push(POOLS.upper);
      if(numbersEl.checked) chosenSets.push(POOLS.numbers);
      if(symbolsEl.checked) chosenSets.push(POOLS.symbols);

      let pwdArr = [];
      // Guarantee inclusion
      for(let set of chosenSets){
        pwdArr.push(set[Math.floor(Math.random()*set.length)]);
      }
      // Fill the rest
      for(let i=pwdArr.length;i<len;i++){
        pwdArr.push(pool[Math.floor(Math.random()*pool.length)]);
      }
      // Shuffle
      for(let i=pwdArr.length-1;i>0;i--){
        const j = Math.floor(Math.random()*(i+1));
        [pwdArr[i], pwdArr[j]] = [pwdArr[j], pwdArr[i]];
      }
      return pwdArr.join('');
    }

    function calculateEntropy(length, poolSize){
      // entropy in bits: length * log2(poolSize)
      if(poolSize <= 1) return 0;
      return +(length * Math.log2(poolSize)).toFixed(2);
    }

    function evaluateStrength(pwd){
      const length = pwd.length;
      let poolSize = 0;
      if(/[a-z]/.test(pwd)) poolSize += POOLS.lower.length;
      if(/[A-Z]/.test(pwd)) poolSize += POOLS.upper.length;
      if(/[0-9]/.test(pwd)) poolSize += POOLS.numbers.length;
      if(/[^a-zA-Z0-9]/.test(pwd)) poolSize += POOLS.symbols.length;
      const entropy = calculateEntropy(length, poolSize || 1);

      // Simple scoring using entropy thresholds
      let score = 0; // 0-100
      // A heuristic: 0-35 weak, 36-60 fair, 61-80 good, 81-100 excellent
      if(entropy < 28) score = 18;
      else if(entropy < 40) score = 38;
      else if(entropy < 60) score = 62;
      else if(entropy < 80) score = 78;
      else score = 92;

      // Adjust for common patterns (very simple checks)
      const lowers = (pwd.match(/[a-z]/g) || []).length;
      const uppers = (pwd.match(/[A-Z]/g) || []).length;
      const nums = (pwd.match(/[0-9]/g) || []).length;
      const syms = (pwd.match(/[^a-zA-Z0-9]/g) || []).length;

      // Penalize if too many repeats
      const repeats = /(.)\1{2,}/.test(pwd); // 3+ repeated chars
      if(repeats) score -= 10;
      // Penalize sequential patterns like 1234 or abcd
      const seq = /(0123|1234|2345|3456|4567|5678|abcd|bcde|cdef|qrst|mnop)/i.test(pwd);
      if(seq) score -= 10;

      // Clamp
      score = Math.max(0, Math.min(100, score));

      // Category
      let category = '—';
      if(score < 30) category = 'Very weak';
      else if(score < 50) category = 'Weak';
      else if(score < 70) category = 'Fair';
      else if(score < 85) category = 'Strong';
      else category = 'Very strong';

      // Suggestions
      const suggestions = [];
      if(length < 12) suggestions.push('Make password longer (≥12 chars).');
      if(!/[A-Z]/.test(pwd)) suggestions.push('Add uppercase letters.');
      if(!/[a-z]/.test(pwd)) suggestions.push('Add lowercase letters.');
      if(!/[0-9]/.test(pwd)) suggestions.push('Include numbers.');
      if(!/[^a-zA-Z0-9]/.test(pwd)) suggestions.push('Include special symbols.');
      if(repeats) suggestions.push('Avoid repeated characters (aaa).');
      if(seq) suggestions.push('Avoid obvious sequences (1234, abcd).');

      return {score, category, entropy, suggestions, lowers, uppers, nums, syms};
    }

    function updateUI(pwd){
      passwordEl.value = pwd;
      const res = evaluateStrength(pwd);
      entropyLabel.textContent = `Entropy: ${res.entropy} bits`;
      strengthLabel.textContent = `Strength: ${res.category}`;
      const width = Math.round(res.score)+'%';
      meterFill.style.width = width;
      // color
      if(res.score < 40) meterFill.style.background = 'linear-gradient(90deg,var(--bad), #ef4444)';
      else if(res.score < 70) meterFill.style.background = 'linear-gradient(90deg,var(--warn), #f59e0b)';
      else meterFill.style.background = 'linear-gradient(90deg,var(--good), #16a34a)';

      // Suggestions
      suggestionsEl.innerHTML = '';
      if(res.suggestions.length){
        suggestionsEl.innerHTML = '<strong>Suggestions:</strong> ' + res.suggestions.join(' ');
      } else {
        suggestionsEl.innerHTML = '<strong>Good job!</strong> Password follows recommended rules.';
      }

      // Update rules preview
      ruleLen.textContent = lengthEl.value;
      const sets = [];
      if(lowerEl.checked) sets.push('lower');
      if(upperEl.checked) sets.push('upper');
      if(numbersEl.checked) sets.push('numbers');
      if(symbolsEl.checked) sets.push('symbols');
      ruleSets.textContent = sets.join(', ') || 'none';
    }

    // History management
    function loadHistory(){
      try{
        const raw = localStorage.getItem('pwgen_history');
        return raw ? JSON.parse(raw) : [];
      }catch(e){return []}
    }
    function saveHistory(arr){ localStorage.setItem('pwgen_history', JSON.stringify(arr)); }
    function renderHistory(){
      const arr = loadHistory();
      historyEl.innerHTML = '';
      if(!arr.length){ historyEl.innerHTML = '<div class="small" style="color:var(--muted)">No saved passwords yet.</div>'; return }
      arr.slice().reverse().forEach((entry,idx)=>{
        const div = document.createElement('div'); div.className='item';
        const left = document.createElement('div'); left.textContent = entry.pwd; left.style.wordBreak='break-all'; left.style.flex='1';
        const right = document.createElement('div'); right.style.display='flex'; right.style.gap='8px';
        const c = document.createElement('button'); c.textContent='Copy'; c.className='btn btn-ghost'; c.onclick=()=>{navigator.clipboard.writeText(entry.pwd)};
        const u = document.createElement('button'); u.textContent='Use'; u.className='btn btn-ghost'; u.onclick=()=>{updateUI(entry.pwd); passwordEl.focus();};
        const d = document.createElement('button'); d.textContent='Delete'; d.className='btn btn-ghost'; d.onclick=()=>{ if(confirm('Delete this saved password?')){ arr.splice(arr.length-1-idx,1); saveHistory(arr); renderHistory(); }};
        right.append(c,u,d);
        div.appendChild(left); div.appendChild(right);
        historyEl.appendChild(div);
      })
    }

    // Events
    lengthEl.addEventListener('input', ()=>{ lenVal.textContent = lengthEl.value; updateUI(passwordEl.value); });
    [lowerEl,upperEl,numbersEl,symbolsEl].forEach(el=>el.addEventListener('change', ()=>updateUI(passwordEl.value)));

    generateBtn.addEventListener('click', ()=>{
      const len = parseInt(lengthEl.value,10);
      const pwd = generatePassword(len);
      updateUI(pwd);
      passwordEl.focus();
      passwordEl.select();
    });

    shuffleBtn.addEventListener('click', ()=>{ generateBtn.click(); passwordEl.focus(); });

    copyBtn.addEventListener('click', async ()=>{
      if(!passwordEl.value) return alert('Nothing to copy!');
      try{ await navigator.clipboard.writeText(passwordEl.value); copyBtn.textContent='Copied'; setTimeout(()=>copyBtn.textContent='Copy',1200);}catch(e){ alert('Copy failed — your browser may block clipboard access.'); }
    });

    showBtn.addEventListener('click', ()=>{
      if(passwordEl.type === 'text'){ passwordEl.type='password'; showBtn.textContent='Show'; passwordEl.style.color='var(--muted)'; }
      else { passwordEl.type='text'; showBtn.textContent='Hide'; passwordEl.style.color='white'; }
    });

    saveBtn.addEventListener('click', ()=>{
      const val = passwordEl.value;
      if(!val) return alert('No password to save');
      const arr = loadHistory();
      arr.push({pwd: val, date: new Date().toISOString()});
      saveHistory(arr);
      renderHistory();
    });

    clearHistoryBtn.addEventListener('click', ()=>{ if(confirm('Clear saved password history?')){ localStorage.removeItem('pwgen_history'); renderHistory(); }});

    // Initialize with a generated password on load
    window.addEventListener('load', ()=>{
      lenVal.textContent = lengthEl.value;
      const p = generatePassword(parseInt(lengthEl.value,10));
      updateUI(p);
      renderHistory();
    });