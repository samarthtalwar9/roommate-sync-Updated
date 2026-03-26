/* ══════════════════════════════
   STATE
══════════════════════════════ */
var S = {
  page:'landing', dash:'discover', authMode:'login',
  obStep:1, obTotal:7, obData:{},
  user:null, userDoc:null,
  convId:null,
  savedIds:new Set(), allMatches:[], filteredMatches:[],
  convs:{}
};

/* ══════════════════════════════
   UTILS
══════════════════════════════ */
function $(id){ return document.getElementById(id); }
function $$(sel){ return document.querySelectorAll(sel); }
function escHtml(t){ return (t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ══════════════════════════════
   TOAST
══════════════════════════════ */
function toast(msg, type){
  var icons={success:'✅',error:'❌',info:'ℹ️',warn:'⚠️'};
  var t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = (icons[type||'info']||'ℹ️') + ' ' + msg + '<button class="toast-close" onclick="this.parentElement.remove()">✕</button>';
  $('toasts').appendChild(t);
  setTimeout(function(){ t.classList.add('out'); setTimeout(function(){ if(t.parentNode) t.remove(); }, 300); }, 4500);
}

/* ══════════════════════════════
   PAGE SYSTEM
══════════════════════════════ */
function showPage(p){
  $$('.page,.page-flex').forEach(function(e){ e.classList.remove('active'); });
  var pg = $('page-'+p);
  if(pg) pg.classList.add('active');
  S.page = p;
  var auth = (p==='dash'||p==='onboard');
  $('nav-public').classList.toggle('hidden', auth);
  $('nav-private').classList.toggle('hidden', !auth||p==='onboard');
  $('nav-auth').classList.toggle('hidden', auth);
  $('nav-user').classList.toggle('hidden', !auth);
  window.scrollTo(0,0);
}

function showDash(s){
  $$('.dash-section').forEach(function(e){ e.classList.remove('active'); });
  var d = $('dash-'+s); if(d) d.classList.add('active');
  $$('.sb-link').forEach(function(l){ l.classList.remove('active'); });
  var sl = $('sl-'+s); if(sl) sl.classList.add('active');
  S.dash = s;
  if(s==='notifications') renderNotifs();
  if(s==='saved') renderSaved();
  if(s==='messages') renderConvList(S.convs);
}

function goTo(id){
  if(S.page!=='landing'){ showPage('landing'); setTimeout(function(){ sc(id); }, 260); return; }
  sc(id);
}
function sc(id){ var e=$(id); if(e) e.scrollIntoView({behavior:'smooth',block:'start'}); }

/* ══════════════════════════════
   RESET UI — called on logout
══════════════════════════════ */
function resetUI(){
  var na=$('nav-av'); if(na) na.textContent='';
  var sa=$('sb-av'); if(sa) sa.textContent='';
  var sn=$('sb-name'); if(sn) sn.textContent='';
  var pl=$('pr-letter'); if(pl) pl.textContent='';
  var pn=$('pr-name'); if(pn) pn.textContent='';
  var pm=$('pr-meta'); if(pm) pm.textContent='';
  var pr=$('pr-role'); if(pr) pr.textContent='—';
  var ps=$('pr-sleep'); if(ps) ps.textContent='—';
  var pc=$('pr-clean'); if(pc) pc.textContent='—';
  var pso=$('pr-social'); if(pso) pso.textContent='—';
  var pb=$('pr-budget'); if(pb) pb.textContent='—';
  var plo=$('pr-looking'); if(plo) plo.textContent='—';
  var pstr=$('pr-strength'); if(pstr) pstr.style.width='0%';
  var ptxt=$('pr-strength-txt'); if(ptxt) ptxt.textContent='Complete your profile';
  var sname=$('set-name'); if(sname) sname.value='';
  var semail=$('set-email'); if(semail) semail.value='';
  var le=$('l-email'); if(le) le.value='';
  var lp=$('l-pass'); if(lp) lp.value='';
  var sf=$('s-fname'); if(sf) sf.value='';
  var sl2=$('s-lname'); if(sl2) sl2.value='';
  var se=$('s-email'); if(se) se.value='';
  var sp=$('s-pass'); if(sp) sp.value='';
  var sc2=$('s-city'); if(sc2) sc2.value='';
  ['sg1','sg2','sg3','sg4'].forEach(function(id){
    var e=$(id); if(e) e.style.background='rgba(255,255,255,.08)';
  });
  var lbl=$('sg-lbl'); if(lbl) lbl.textContent='';
  var mg=$('matches-grid'); if(mg) mg.innerHTML='<div class="empty-state"><div class="icon">🔍</div><h3>Loading matches...</h3><p>Finding people in your city</p></div>';
  var sg=$('saved-grid'); if(sg) sg.innerHTML='<div class="empty-state"><div class="icon">❤️</div><h3>No saved profiles yet</h3><p>Heart a match to save them here</p></div>';
  var cl=$('conv-list'); if(cl) cl.innerHTML='';
  var ca=$('chat-area'); if(ca) ca.innerHTML='<div class="empty-state"><div class="icon">💬</div><h3>Select a conversation</h3><p>Choose someone from the left to start chatting</p></div>';
  var sm=$('stat-matches'); if(sm) sm.textContent='—';
  var sc3=$('stat-convs'); if(sc3) sc3.textContent='0';
  var ss=$('stat-saved'); if(ss) ss.textContent='0';
  var mb=$('msg-badge'); if(mb){ mb.textContent='0'; mb.style.display='none'; }
  setTab('login');
}

/* ══════════════════════════════
   SET UI
══════════════════════════════ */
function setUI(name, email){
  if(!name) return;
  S.user = { name:name, email:email||'' };
  var i = name[0].toUpperCase();
  var na=$('nav-av'); if(na) na.textContent=i;
  var sa=$('sb-av'); if(sa) sa.textContent=i;
  var sn=$('sb-name'); if(sn) sn.textContent=name.split(' ').slice(0,2).join(' ');
  var pl=$('pr-letter'); if(pl) pl.textContent=i;
  var pn=$('pr-name'); if(pn) pn.textContent=name;
  var pm=$('pr-meta'); if(pm) pm.textContent=(S.userDoc&&S.userDoc.city ? S.userDoc.city+' · ' : '')+'Free Plan';
  var sname=$('set-name'); if(sname) sname.value=name;
  var semail=$('set-email'); if(semail&&email) semail.value=email;
  if(S.userDoc){
    if(S.userDoc.role)    { var e=$('pr-role');    if(e) e.textContent=S.userDoc.role; }
    if(S.userDoc.sleep)   { var e=$('pr-sleep');   if(e) e.textContent=S.userDoc.sleep; }
    if(S.userDoc.clean)   { var e=$('pr-clean');   if(e) e.textContent=S.userDoc.clean; }
    if(S.userDoc.social)  { var e=$('pr-social');  if(e) e.textContent=S.userDoc.social; }
    if(S.userDoc.looking) { var e=$('pr-looking'); if(e) e.textContent=S.userDoc.looking; }
    var filled = ['role','sleep','clean','social','looking'].filter(function(k){ return S.userDoc[k]; }).length;
    var pct = Math.round((filled/5)*100);
    var pb=$('pr-strength'); if(pb) pb.style.width=pct+'%';
    var pt=$('pr-strength-txt'); if(pt) pt.textContent=pct+'% complete';
  }
}

/* ══════════════════════════════
   AUTH HANDLER
══════════════════════════════ */
function onUserLogin(u){
  fbDb.collection('users').doc(u.uid).get().then(function(doc){
    if(doc.exists){
      S.userDoc = doc.data();
      setUI(S.userDoc.displayName || u.displayName || u.email.split('@')[0], u.email);
      if(S.userDoc.onboarded){
        showPage('dash');
        loadMatches();
        loadConvList();
      } else {
        showPage('onboard');
      }
    } else {
      var name = u.displayName || u.email.split('@')[0];
      fbDb.collection('users').doc(u.uid).set({
        uid:u.uid, displayName:name, email:u.email,
        city:'', onboarded:false,
        createdAt:firebase.firestore.FieldValue.serverTimestamp()
      }).then(function(){ showPage('onboard'); });
    }
  }).catch(function(e){
    console.error('onUserLogin error:',e);
    showPage('landing');
  });
}

/* ══════════════════════════════
   AUTH FUNCTIONS
══════════════════════════════ */
function setTab(t){
  S.authMode = t;
  var tl=$('tab-login');  if(tl) tl.classList.toggle('active', t==='login');
  var ts=$('tab-signup'); if(ts) ts.classList.toggle('active', t==='signup');
  var lf=$('login-form');  if(lf) lf.classList.toggle('hidden', t!=='login');
  var sf=$('signup-form'); if(sf) sf.classList.toggle('hidden', t!=='signup');
  var at=$('auth-tag');      if(at)  at.textContent  = t==='login'?'Welcome back!':'Create your free account today';
  var ast=$('auth-sw-text'); if(ast) ast.textContent = t==='login'?"Don't have an account? ":'Already have an account? ';
  var asl=$('auth-sw-link'); if(asl) asl.textContent = t==='login'?'Sign up free':'Log in';
}
function toggleTab(){ setTab(S.authMode==='login'?'signup':'login'); }

function doLogin(){
  var emailEl=$('l-email'), passEl=$('l-pass');
  if(!emailEl||!passEl) return;
  var email=emailEl.value.trim(), pass=passEl.value;
  clearErrs(); var ok=true;
  if(!email||!email.includes('@')){ showErr('l-email-err','Enter a valid email'); ok=false; }
  if(!pass||pass.length<6){ showErr('l-pass-err','Password must be at least 6 characters'); ok=false; }
  if(!ok) return;
  var btn=$('btn-login'); btnLoad(btn,true);
  fbAuth.signInWithEmailAndPassword(email, pass)
    .then(function(){ toast('Welcome back! 🎉','success'); })
    .catch(function(e){ showErr('l-email-err', fbErr(e.code)); btnLoad(btn,false); });
}

function doSignup(){
  var fnameEl=$('s-fname'), lnameEl=$('s-lname');
  var emailEl=$('s-email'), passEl=$('s-pass'), cityEl=$('s-city');
  if(!fnameEl||!emailEl||!passEl||!cityEl) return;
  var fname=fnameEl.value.trim(), lname=lnameEl?lnameEl.value.trim():'';
  var email=emailEl.value.trim(), pass=passEl.value, city=cityEl.value;
  clearErrs(); var ok=true;
  if(!fname){ showErr('s-fname-err','Enter your first name'); ok=false; }
  if(!email||!email.includes('@')){ showErr('s-email-err','Enter a valid email'); ok=false; }
  if(!pass||pass.length<6){ showErr('s-pass-err','Password must be at least 6 characters'); ok=false; }
  if(!city){ showErr('s-city-err','Select your city'); ok=false; }
  if(!ok) return;
  var btn=$('btn-signup'); btnLoad(btn,true);
  var full=fname+(lname?' '+lname:'');
  fbAuth.createUserWithEmailAndPassword(email, pass)
    .then(function(c){
      return c.user.updateProfile({displayName:full}).then(function(){
        return fbDb.collection('users').doc(c.user.uid).set({
          uid:c.user.uid, displayName:full, email:email,
          city:city, onboarded:false,
          createdAt:firebase.firestore.FieldValue.serverTimestamp()
        });
      });
    })
    .then(function(){ toast('Account created! 🎉','success'); })
    .catch(function(e){ showErr('s-email-err', fbErr(e.code)); btnLoad(btn,false); });
}

function socialAuth(){
  var provider = new firebase.auth.GoogleAuthProvider();
  fbAuth.signInWithPopup(provider)
    .then(function(){ toast('Signed in! 🎉','success'); })
    .catch(function(e){ toast('Failed: '+fbErr(e.code),'error'); });
}

function tryDemo(){
  toast('Demo mode — sign up for real matching! 🚀','info');
  S.user    = { name:'Demo User', email:'demo@example.com' };
  S.userDoc = { city:'Nagpur', onboarded:true, displayName:'Demo User' };
  setUI('Demo User','demo@example.com');
  showPage('dash');
  S.allMatches = [
    {_uid:'d1',displayName:'Priya Mehta',city:'Nagpur',role:'MBA Student',_score:96,bio:'Quiet and studious, love cooking on weekends.',sleep:'Night Owl (1am–9am)',clean:'Tidy but relaxed'},
    {_uid:'d2',displayName:'Arjun Singh',city:'Nagpur',role:'Software Engineer',_score:91,bio:'WFH developer. Early mornings for gym.',sleep:'Regular (11pm–7am)',clean:'Spotless always'},
    {_uid:'d3',displayName:'Sneha Raut',city:'Nagpur',role:'MBBS Student',_score:88,bio:'Need someone responsible and quiet during exams.',sleep:'Early Bird (10pm–6am)',clean:'Tidy but relaxed'}
  ];
  S.filteredMatches = S.allMatches;
  var sm=$('stat-matches'); if(sm) sm.textContent=3;
  var ss=$('stat-matches-sub'); if(ss) ss.textContent='✓ In Nagpur (demo)';
  renderMatchCards(S.allMatches);
}

/* ══════════════════════════════
   LOGOUT
══════════════════════════════ */
function doLogout(){
  if(currentChatListener){ currentChatListener(); currentChatListener=null; }
  var uid = fbAuth.currentUser ? fbAuth.currentUser.uid : null;
  if(uid) fbRtdb.ref('userConvs/'+uid).off();
  fbAuth.signOut().then(function(){
    S.user=null; S.userDoc=null;
    S.allMatches=[]; S.filteredMatches=[];
    S.convs={}; S.convId=null;
    S.savedIds=new Set();
    S.obStep=1; S.obData={};
    resetUI();
    showPage('landing');
    toast('Logged out 👋','info');
  }).catch(function(){
    S.user=null; S.userDoc=null;
    S.allMatches=[]; S.filteredMatches=[];
    S.convs={}; S.convId=null;
    S.savedIds=new Set();
    resetUI();
    showPage('landing');
    toast('Logged out 👋','info');
  });
}

function fbErr(c){
  return {
    'auth/user-not-found':'No account with this email.',
    'auth/wrong-password':'Incorrect password.',
    'auth/email-already-in-use':'Email already registered.',
    'auth/weak-password':'Password must be at least 6 characters.',
    'auth/invalid-email':'Enter a valid email.',
    'auth/too-many-requests':'Too many attempts. Please wait.',
    'auth/invalid-credential':'Incorrect email or password.'
  }[c]||'Something went wrong. Try again.';
}

/* ══════════════════════════════
   MATCHES
══════════════════════════════ */
function loadMatches(){
  var uid = fbAuth.currentUser ? fbAuth.currentUser.uid : null;
  if(!uid) return;
  var city = (S.userDoc&&S.userDoc.city) ? S.userDoc.city : '';
  var mg=$('matches-grid');
  if(mg) mg.innerHTML='<div class="empty-state"><div class="icon">⏳</div><h3>Finding your matches...</h3><p>Looking for people in '+(city||'your city')+'</p></div>';
  var query = fbDb.collection('users').where('onboarded','==',true);
  if(city) query = query.where('city','==',city);
  query.limit(20).get().then(function(snap){
    var matches=[];
    snap.forEach(function(doc){
      if(doc.id!==uid){
        var d=doc.data(); d._uid=doc.id; d._score=calcScore(d);
        matches.push(d);
      }
    });
    matches.sort(function(a,b){ return b._score-a._score; });
    S.allMatches=matches; S.filteredMatches=matches;
    var sm=$('stat-matches'); if(sm) sm.textContent=matches.length;
    var ss=$('stat-matches-sub'); if(ss) ss.textContent=matches.length>0?'✓ In '+(city||'your city'):'Invite friends to join!';
    renderMatchCards(matches);
  }).catch(function(e){
    console.error(e);
    var mg=$('matches-grid');
    if(mg) mg.innerHTML='<div class="empty-state"><div class="icon">😕</div><h3>Could not load matches</h3><p>Make sure Firestore is enabled.</p></div>';
  });
}

function calcScore(other){
  var score=50, me=S.userDoc||{};
  if(me.sleep  && other.sleep  && me.sleep===other.sleep)   score+=20;
  if(me.clean  && other.clean  && me.clean===other.clean)   score+=15;
  if(me.social && other.social && me.social===other.social) score+=15;
  return Math.min(score,99);
}

var COLORS=[
  'linear-gradient(135deg,#7c3aed,#a855f7)',
  'linear-gradient(135deg,#06b6d4,#3b82f6)',
  'linear-gradient(135deg,#ec4899,#f59e0b)',
  'linear-gradient(135deg,#10b981,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)'
];

function renderMatchCards(list){
  var g=$('matches-grid'); if(!g) return;
  if(!list||!list.length){
    g.innerHTML='<div class="empty-state"><div class="icon">🏙️</div><h3>No matches yet in your city</h3><p>Invite friends to join Roommate Sync in '+((S.userDoc&&S.userDoc.city)||'your city')+'!</p></div>';
    return;
  }
  g.innerHTML=list.map(function(m,idx){
    var sv=S.savedIds.has(m._uid), col=COLORS[idx%COLORS.length];
    var name=m.displayName||'Anonymous';
    var tags=[];
    if(m.sleep)   tags.push(m.sleep.split(' ').slice(0,2).join(' '));
    if(m.clean)   tags.push(m.clean.split(' ')[0]);
    if(m.looking) tags.push(m.looking);
    return '<div class="match-card">'+
      '<div class="mc-top">'+
        '<div class="mc-av" style="background:'+col+'">'+name[0].toUpperCase()+'</div>'+
        '<div style="flex:1">'+
          '<div class="mc-name">'+name+'</div>'+
          '<div class="mc-sub">'+(m.city||'')+((m.city&&m.role)?' · ':'')+(m.role||'')+'</div>'+
          '<div class="mc-verified">✓ Verified</div>'+
        '</div>'+
        '<div class="mc-score-wrap"><div class="mc-score-ring"><span class="mc-score">'+m._score+'%</span><div class="mc-score-lbl">Match</div></div></div>'+
      '</div>'+
      '<div class="mc-body">'+
        '<div class="mc-tags">'+tags.map(function(t){ return '<span class="mc-tag">'+t+'</span>'; }).join('')+'</div>'+
        '<p class="mc-bio">'+(m.bio||'Looking for a compatible roommate in '+(m.city||'your city')+'.')+'</p>'+
      '</div>'+
      '<div class="mc-actions">'+
        '<button class="btn btn-primary grow btn-sm" onclick="startChat(\''+m._uid+'\',\''+name.replace(/'/g,"\\'")+'\',\''+col+'\')">💬 Message</button>'+
        '<button class="btn btn-outline btn-sm" onclick="doSave(\''+m._uid+'\',this)">'+(sv?'❤️':'🤍')+'</button>'+
        '<button class="btn btn-ghost btn-sm" onclick="viewMatch(\''+m._uid+'\')">👁</button>'+
      '</div>'+
    '</div>';
  }).join('');
}

function applyFilter(btn,type){
  $$('.chip').forEach(function(c){ c.classList.remove('active'); }); btn.classList.add('active');
  var f=S.allMatches.slice();
  if(type==='90plus')        f=f.filter(function(m){ return m._score>=90; });
  else if(type==='students') f=f.filter(function(m){ return (m.role||'').includes('Student'); });
  else if(type==='pros')     f=f.filter(function(m){ return !(m.role||'').includes('Student'); });
  S.filteredMatches=f; renderMatchCards(f);
}
function doSort(v){
  var s=S.filteredMatches.slice();
  if(v==='compat') s.sort(function(a,b){ return b._score-a._score; });
  S.filteredMatches=s; renderMatchCards(s);
}
function doSave(uid,btn){
  if(S.savedIds.has(uid)){ S.savedIds.delete(uid); btn.textContent='🤍'; toast('Removed from saved','info'); }
  else{ S.savedIds.add(uid); btn.textContent='❤️'; toast('Saved! ❤️','success'); }
  var ss=$('stat-saved'); if(ss) ss.textContent=S.savedIds.size;
  renderSaved();
}
function renderSaved(){
  var g=$('saved-grid'); if(!g) return;
  var sv=S.allMatches.filter(function(m){ return S.savedIds.has(m._uid); });
  if(!sv.length){ g.innerHTML='<div class="empty-state"><div class="icon">❤️</div><h3>No saved profiles yet</h3><p>Heart a match to save them here</p></div>'; return; }
  g.innerHTML=sv.map(function(m,i){
    var col=COLORS[i%COLORS.length];
    return '<div class="match-card"><div class="mc-top"><div class="mc-av" style="background:'+col+'">'+m.displayName[0]+'</div><div style="flex:1"><div class="mc-name">'+m.displayName+'</div><div class="mc-sub">'+(m.city||'')+'</div></div><div class="mc-score-wrap"><span class="mc-score">'+m._score+'%</span><div class="mc-score-lbl">Match</div></div></div><div class="mc-body"><p class="mc-bio">'+(m.bio||'Looking for a roommate.')+'</p></div><div class="mc-actions"><button class="btn btn-primary grow btn-sm" onclick="startChat(\''+m._uid+'\',\''+m.displayName.replace(/'/g,"\\'")+'\',\''+col+'\')">💬 Message</button><button class="btn btn-danger btn-sm" onclick="doSave(\''+m._uid+'\',this)">❤️</button></div></div>';
  }).join('');
}
function viewMatch(uid){
  var m=S.allMatches.find(function(x){ return x._uid===uid; });
  if(m) openModal('vp',m);
}

/* ══════════════════════════════
   REAL-TIME CHAT
══════════════════════════════ */
function getChatId(uid1,uid2){ return [uid1,uid2].sort().join('_'); }

function startChat(otherUid,otherName,otherColor){
  showDash('messages');
  setTimeout(function(){ openConv(otherUid,otherName,otherColor); },150);
}

/* ── FIX: loadConvList auto-repairs missing/wrong names ── */
function loadConvList(){
  var uid=fbAuth.currentUser?fbAuth.currentUser.uid:null;
  if(!uid) return;
  fbRtdb.ref('userConvs/'+uid).on('value',function(snap){
    var convs=snap.val()||{};

    /* fix any conv where name is missing, "Someone", or "User" */
    var keys=Object.keys(convs);
    keys.forEach(function(otherUid){
      var c=convs[otherUid];
      var badName=!c.name||c.name==='Someone'||c.name==='User'||c.name==='?';
      if(badName){
        fbDb.collection('users').doc(otherUid).get().then(function(doc){
          if(doc.exists){
            var realName=doc.data().displayName||doc.data().email||'User';
            fbRtdb.ref('userConvs/'+uid+'/'+otherUid+'/name').set(realName);
          }
        }).catch(function(){});
      }
    });

    S.convs=convs;
    renderConvList(convs);
    var unread=Object.values(convs).filter(function(c){ return c.unread; }).length;
    var mb=$('msg-badge');
    if(mb){ mb.textContent=unread; mb.style.display=unread>0?'inline-flex':'none'; }
    var sc=$('stat-convs'); if(sc) sc.textContent=keys.length;
  });
}

/* ── FIX: pipe symbol removed ── */
function renderConvList(convs){
  var l=$('conv-list'); if(!l) return;
  var keys=Object.keys(convs);
  if(!keys.length){
    l.innerHTML='<div class="empty-state" style="padding:30px 16px;"><div class="icon" style="font-size:32px;">💬</div><p style="font-size:12px;">Message a match to start chatting</p></div>';
    return;
  }
  l.innerHTML=keys.map(function(otherUid,i){
    var c=convs[otherUid];
    var sel=S.convId===otherUid?'sel':'';
    var col=c.color||COLORS[i%COLORS.length];
    var name=c.name||'User';
    return '<div class="conv-item '+sel+'" onclick="openConv(\''+otherUid+'\',\''+name.replace(/'/g,"\\'")+'\',\''+col+'\')">' +
      '<div class="conv-av" style="background:'+col+'">'+name[0].toUpperCase()+'</div>' +
      '<div style="flex:1;min-width:0;">'+
        '<div class="conv-name">'+name+'</div>'+
        '<div class="conv-preview">'+(c.lastMsg||'Start a conversation...')+'</div>'+
      '</div>'+
      '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0;">'+
        '<div class="conv-time">'+(c.time||'')+'</div>'+
        (c.unread?'<div class="unread-dot"></div>':'')+
      '</div>'+
    '</div>';
  }).join('');
}

var currentChatListener=null;

function openConv(otherUid,otherName,otherColor){
  S.convId=otherUid;
  var uid=fbAuth.currentUser?fbAuth.currentUser.uid:null;
  if(!uid) return;

  /* if name is still bad, look it up before opening */
  var badName=!otherName||otherName==='Someone'||otherName==='User'||otherName==='?';
  if(badName){
    fbDb.collection('users').doc(otherUid).get().then(function(doc){
      var realName=doc.exists?(doc.data().displayName||doc.data().email||'User'):'User';
      fbRtdb.ref('userConvs/'+uid+'/'+otherUid+'/name').set(realName);
      _openConv(otherUid,realName,otherColor,uid);
    }).catch(function(){ _openConv(otherUid,otherName,otherColor,uid); });
  } else {
    _openConv(otherUid,otherName,otherColor,uid);
  }
}

function _openConv(otherUid,otherName,otherColor,uid){
  var chatId=getChatId(uid,otherUid);
  var userInitial=S.user?S.user.name[0].toUpperCase():'?';
  var otherInit=(otherName||'?')[0].toUpperCase();
  var col=otherColor||COLORS[0];

  fbRtdb.ref('userConvs/'+uid+'/'+otherUid+'/unread').set(false);

  var ca=$('chat-area'); if(!ca) return;
  ca.innerHTML=
    '<div class="chat-hdr">'+
      '<div class="conv-av" style="background:'+col+';width:36px;height:36px;flex-shrink:0;">'+otherInit+'</div>'+
      '<div style="flex:1;">'+
        '<div class="chat-hdr-name">'+otherName+'</div>'+
        '<div class="chat-hdr-status">Online</div>'+
      '</div>'+
    '</div>'+
    '<div class="chat-msgs" id="chat-msgs"></div>'+
    '<div class="chat-inp-row">'+
      '<input class="chat-inp" id="cinp" placeholder="Type a message..." autocomplete="off"/>'+
      '<button class="btn btn-primary btn-sm" onclick="sendMsg(\''+otherUid+'\',\''+chatId+'\',\''+otherName.replace(/'/g,"\\'")+'\',\''+col+'\')">Send ➤</button>'+
    '</div>';

  var inp=$('cinp');
  if(inp){
    inp.addEventListener('keydown',function(e){
      if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendMsg(otherUid,chatId,otherName,col); }
    });
    setTimeout(function(){ inp.focus(); },100);
  }

  if(currentChatListener){ currentChatListener(); currentChatListener=null; }

  var ref=fbRtdb.ref('chats/'+chatId);
  var handler=ref.limitToLast(100).on('value',function(snap){
    var msgs=snap.val()||{};
    var msgArr=Object.keys(msgs).map(function(k){ return msgs[k]; });
    msgArr.sort(function(a,b){ return a.ts-b.ts; });
    var msgsEl=$('chat-msgs'); if(!msgsEl) return;
    if(!msgArr.length){
      msgsEl.innerHTML='<div class="empty-state" style="height:100%;"><div class="icon">👋</div><h3>Say hello to '+otherName+'!</h3><p>This is the start of your conversation.</p></div>';
      return;
    }
    msgsEl.innerHTML=msgArr.map(function(m){
      var isMine=m.uid===uid;
      return '<div class="msg-row '+(isMine?'mine':'')+'">' +
        (!isMine?'<div class="msg-av-sm" style="background:'+col+'">'+otherInit+'</div>':'')+
        '<div><div class="bubble '+(isMine?'bubble-out':'bubble-in')+'">'+escHtml(m.txt)+'</div><div class="msg-time">'+m.timeStr+'</div></div>'+
        (isMine?'<div class="msg-av-sm" style="background:linear-gradient(135deg,var(--accent),var(--accent2))">'+userInitial+'</div>':'')+
      '</div>';
    }).join('');
    msgsEl.scrollTop=msgsEl.scrollHeight;
  });

  currentChatListener=function(){ ref.off('value',handler); };
  renderConvList(S.convs);
}

/* ── FIX: always use real display name ── */
function sendMsg(otherUid,chatId,otherName,col){
  var inp=$('cinp'); if(!inp||!inp.value.trim()) return;
  var txt=inp.value.trim();
  var uid=fbAuth.currentUser?fbAuth.currentUser.uid:null; if(!uid) return;
  var now=new Date(), timeStr=now.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  inp.value='';
  fbRtdb.ref('chats/'+chatId).push({txt:txt,uid:uid,ts:Date.now(),timeStr:timeStr});

  /* always use real name — never "Someone" or "User" */
  var myName=(S.userDoc&&S.userDoc.displayName) ? S.userDoc.displayName :
             (S.user&&S.user.name&&S.user.name!=='?') ? S.user.name : 'User';
  var myColor='linear-gradient(135deg,var(--accent),var(--accent2))';

  fbRtdb.ref('userConvs/'+uid+'/'+otherUid).set({name:otherName,color:col,lastMsg:txt,time:timeStr,unread:false});
  fbRtdb.ref('userConvs/'+otherUid+'/'+uid).set({name:myName,color:myColor,lastMsg:txt,time:timeStr,unread:true});
}

/* ══════════════════════════════
   ONBOARDING
══════════════════════════════ */
function obNext(){
  if(S.obStep<S.obTotal){
    document.querySelector('.ob-step[data-step="'+S.obStep+'"]').classList.remove('active');
    S.obStep++;
    document.querySelector('.ob-step[data-step="'+S.obStep+'"]').classList.add('active');
    obProg();
  } else { finishOb(); }
}
function obBack(){
  if(S.obStep<=1) return;
  document.querySelector('.ob-step[data-step="'+S.obStep+'"]').classList.remove('active');
  S.obStep--;
  document.querySelector('.ob-step[data-step="'+S.obStep+'"]').classList.add('active');
  obProg();
}
function obProg(){
  var p=(S.obStep/S.obTotal)*100;
  var of=$('ob-fill'); if(of) of.style.width=p+'%';
  var ot=$('ob-txt'); if(ot) ot.textContent='Step '+S.obStep+' of '+S.obTotal;
  var oi=$('ob-info'); if(oi) oi.textContent='Step '+S.obStep+' of '+S.obTotal;
  var ob=$('ob-back'); if(ob) ob.style.visibility=S.obStep>1?'visible':'hidden';
  var on=$('ob-next'); if(on) on.textContent=S.obStep===S.obTotal?'Find My Matches →':'Continue →';
}
function pickOpt(btn,key){
  btn.closest('.ob-opts').querySelectorAll('.ob-opt').forEach(function(o){ o.classList.remove('sel'); });
  btn.classList.add('sel');
  S.obData[key]=btn.textContent.trim();
}
function finishOb(){
  var uid=fbAuth.currentUser?fbAuth.currentUser.uid:null;
  if(uid){
    var data=Object.assign({},S.obData,{onboarded:true,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
    fbDb.collection('users').doc(uid).set(data,{merge:true}).then(function(){
      S.userDoc=Object.assign(S.userDoc||{},data);
      if(S.obData.role)    { var e=$('pr-role');    if(e) e.textContent=S.obData.role; }
      if(S.obData.sleep)   { var e=$('pr-sleep');   if(e) e.textContent=S.obData.sleep; }
      if(S.obData.clean)   { var e=$('pr-clean');   if(e) e.textContent=S.obData.clean; }
      if(S.obData.social)  { var e=$('pr-social');  if(e) e.textContent=S.obData.social; }
      if(S.obData.looking) { var e=$('pr-looking'); if(e) e.textContent=S.obData.looking; }
      toast('Profile complete! Finding your matches... 🎯','success');
      showPage('dash');
      loadMatches();
      loadConvList();
    });
  }
}
function updateSlider(inp,lid,pre,suf,fmt){
  var v=parseInt(inp.value);
  var el=$(lid); if(el) el.textContent=fmt?pre+v.toLocaleString('en-IN'):pre+v+(suf||'');
  var p=((v-inp.min)/(inp.max-inp.min))*100;
  inp.style.background='linear-gradient(90deg,var(--accent) '+p+'%,rgba(255,255,255,.06) '+p+'%)';
}

/* ══════════════════════════════
   NOTIFICATIONS
══════════════════════════════ */
var NOTIFS=[
  {id:1,icon:'🎯',title:'Welcome to Roommate Sync!',text:'Complete your profile to start getting matched with compatible roommates in your city.',time:'Just now',unread:true,action:'Edit Profile'},
  {id:2,icon:'💬',title:'Real-Time Chat is Live',text:'Message anyone in your city instantly. No delays.',time:'Just now',unread:false,action:null}
];
function renderNotifs(){
  var l=$('notif-list'); if(!l) return;
  if(!NOTIFS.length){ l.innerHTML='<div class="empty-state"><div class="icon">🔔</div><h3>All caught up!</h3><p>No new notifications</p></div>'; return; }
  l.innerHTML=NOTIFS.map(function(n){
    return '<div class="notif-item '+(n.unread?'unread':'')+'">' +
      '<div class="notif-icon">'+n.icon+'</div>' +
      '<div class="notif-content"><h4>'+n.title+'</h4><p>'+n.text+'</p><div class="notif-time">'+n.time+'</div></div>' +
      (n.action?'<div class="notif-actions"><button class="btn btn-outline btn-sm" onclick="notifDo(\''+n.action+'\','+n.id+')">'+n.action+'</button></div>':'')+
    '</div>';
  }).join('');
}
function notifDo(a,id){
  if(a==='Edit Profile') showDash('profile');
  var n=NOTIFS.find(function(x){ return x.id===id; }); if(n){ n.unread=false; renderNotifs(); }
}
function markAllRead(){ NOTIFS.forEach(function(n){ n.unread=false; }); renderNotifs(); toast('All marked as read ✓','success'); }

/* ══════════════════════════════
   SETTINGS
══════════════════════════════ */
function showSettings(btn,sid){
  $$('.settings-sec').forEach(function(s){ s.classList.remove('active'); });
  $$('.settings-nav-item').forEach(function(s){ s.classList.remove('active'); });
  var s=$(sid); if(s) s.classList.add('active'); btn.classList.add('active');
}
function saveSettings(){
  var n=$('set-name');
  if(n&&n.value.trim()){
    setUI(n.value.trim(),S.user?S.user.email:'');
    var uid=fbAuth.currentUser?fbAuth.currentUser.uid:null;
    if(uid){
      fbAuth.currentUser.updateProfile({displayName:n.value.trim()}).catch(function(){});
      fbDb.collection('users').doc(uid).set({displayName:n.value.trim()},{merge:true}).catch(function(){});
    }
  }
  toast('Settings saved ✓','success');
}

/* ══════════════════════════════
   MODALS
══════════════════════════════ */
var MODS={
  forgot:'<h2>Reset Password</h2><p style="color:var(--text2);margin-bottom:16px;">We will email you a reset link.</p><div class="form-group"><label class="form-label">Email</label><input class="form-input" id="r-email" type="email" placeholder="you@example.com"/></div><button class="btn btn-primary btn-full mt16" onclick="doReset()">Send Reset Link</button>',
  upgrade:'<h2>✦ Upgrade to Pro</h2><p style="color:var(--text2);margin-bottom:16px;">Unlock unlimited matches.</p><div style="background:rgba(124,58,237,.1);border:1px solid rgba(124,58,237,.3);border-radius:12px;padding:20px;margin-bottom:20px;"><div style="font-family:Space Grotesk,sans-serif;font-size:38px;font-weight:700;">₹299<span style="font-size:14px;font-weight:400;color:var(--muted)">/month</span></div><ul style="list-style:none;margin-top:12px;display:flex;flex-direction:column;gap:8px;"><li style="font-size:13px;color:var(--text2);">✅ Unlimited matches</li><li style="font-size:13px;color:var(--text2);">✅ Full AI scoring</li><li style="font-size:13px;color:var(--text2);">✅ Advanced filters</li><li style="font-size:13px;color:var(--text2);">✅ Profile boost 2x/month</li><li style="font-size:13px;color:var(--text2);">✅ Priority support</li></ul></div><button class="btn btn-primary btn-full" onclick="toast(\'Payment gateway coming soon! 🚀\',\'info\');closeModal()">Start 7-Day Free Trial</button>',
  filters:'<h2>Filter Matches</h2><p style="color:var(--text2);margin-bottom:16px;">Narrow down your matches.</p><div style="display:flex;flex-direction:column;gap:14px;"><div class="form-group"><label class="form-label">Role</label><select class="form-select"><option>Any</option><option>Students Only</option><option>Professionals Only</option></select></div><div class="form-group"><label class="form-label">Sleep Schedule</label><select class="form-select"><option>Any</option><option>Night Owl</option><option>Early Bird</option></select></div><button class="btn btn-primary" onclick="toast(\'Filters applied!\',\'success\');closeModal()">Apply Filters</button></div>',
  editProfile:'<h2>Edit Profile</h2><div style="display:flex;flex-direction:column;gap:14px;margin-top:12px;"><div class="form-group"><label class="form-label">Display Name</label><input class="form-input" id="ep-n" value=""/></div><div class="form-group"><label class="form-label">Bio</label><textarea class="form-input" rows="3" placeholder="Tell roommates about yourself..."></textarea></div><button class="btn btn-primary" onclick="var n=document.getElementById(\'ep-n\');if(n&&n.value.trim()){setUI(n.value.trim(),S.user?S.user.email:\'\');}toast(\'Profile updated ✓\',\'success\');closeModal()">Save Profile</button></div>',
  deleteAcct:'<h2 style="color:#f87171;">Delete Account</h2><p style="color:var(--text2);margin-bottom:16px;">Cannot be undone.</p><div class="form-group"><label class="form-label">Type DELETE to confirm</label><input class="form-input" id="del-inp" placeholder="DELETE"/></div><button class="btn btn-danger btn-full mt16" onclick="doDelAcct()">Delete My Account Forever</button>',
  about:'<h2>About Roommate Sync</h2><p style="color:var(--text2);line-height:1.6;margin-top:12px;">AI-powered roommate matching platform. Founded 2024, Nagpur, India. Helping 50,000+ people find their ideal living situations.</p>',
  contact:'<h2>Contact Us</h2><div style="display:flex;flex-direction:column;gap:12px;margin-top:14px;"><div class="form-group"><label class="form-label">Name</label><input class="form-input" placeholder="Your name"/></div><div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" placeholder="you@example.com"/></div><div class="form-group"><label class="form-label">Message</label><textarea class="form-input" rows="4" placeholder="How can we help?"></textarea></div><button class="btn btn-primary" onclick="toast(\'Message sent!\',\'success\');closeModal()">Send Message</button></div>',
  privacy:'<h2>Privacy Policy</h2><p style="color:var(--text2);line-height:1.6;margin-top:12px;">We collect only data necessary for our matching service. We never sell your information. Data encrypted with AES-256.</p>',
  terms:'<h2>Terms of Service</h2><p style="color:var(--text2);line-height:1.6;margin-top:12px;">By using Roommate Sync you agree to use the platform honestly. Fake profiles lead to immediate termination. Users must be 18 or older.</p>',
  safety:'<h2>Safety Center</h2><p style="color:var(--text2);line-height:1.6;margin-top:12px;">Always meet in public first. Video call before sharing personal details. Report suspicious profiles immediately.</p>',
  careers:'<h2>Careers</h2><p style="color:var(--text2);line-height:1.6;margin-top:12px;">Hiring: Full-Stack Engineer, Product Designer, Growth Marketer. Send resume to careers@roommatesync.in</p>'
};

function openModal(key,data){
  var html;
  if(key==='vp'&&data){
    var col=COLORS[0];
    html=
      '<div style="display:flex;gap:14px;align-items:center;margin-bottom:20px;">'+
        '<div style="width:60px;height:60px;border-radius:50%;background:'+col+';display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;color:#fff;flex-shrink:0;">'+data.displayName[0]+'</div>'+
        '<div><h2 style="font-size:20px;">'+data.displayName+'</h2><p style="font-size:13px;color:var(--muted);">'+(data.city||'')+((data.city&&data.role)?' · ':'')+(data.role||'')+'</p></div>'+
        '<div style="margin-left:auto;text-align:center;"><div style="font-family:Space Grotesk,sans-serif;font-size:28px;font-weight:700;background:linear-gradient(135deg,var(--accent2),var(--accent3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;">'+data._score+'%</div><div style="font-size:10px;color:var(--muted);">Match</div></div>'+
      '</div>'+
      '<p style="font-size:14px;color:var(--text2);line-height:1.65;margin-bottom:16px;">'+(data.bio||'Looking for a compatible roommate.')+'</p>'+
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px;">'+
        (data.role?'<span class="badge badge-pu">'+data.role+'</span>':'')+
        (data.sleep?'<span class="badge badge-cy">'+data.sleep+'</span>':'')+
        (data.clean?'<span class="badge badge-gr">'+data.clean+'</span>':'')+
      '</div>'+
      '<div style="display:flex;gap:8px;"><button class="btn btn-primary grow" onclick="startChat(\''+data._uid+'\',\''+data.displayName.replace(/'/g,"\\'")+'\',\''+col+'\');closeModal()">💬 Message</button><button class="btn btn-outline" onclick="closeModal()">Close</button></div>';
  } else {
    html=MODS[key]||('<h2>'+key+'</h2><p style="color:var(--text2);">Coming soon.</p>');
    if(key==='editProfile'&&S.user) html=html.replace('value=""','value="'+(S.user.name||'')+'"');
  }
  $('modal-body').innerHTML=html;
  $('modal').classList.add('open');
}
function closeModal(){ $('modal').classList.remove('open'); }
function handleOverlay(e){ if(e.target===$('modal')) closeModal(); }
function doReset(){ var e=$('r-email'); if(!e||!e.value) return; fbAuth.sendPasswordResetEmail(e.value).catch(function(){}); toast('Reset link sent to '+e.value,'success'); closeModal(); }
function doDelAcct(){ var v=$('del-inp'); if(!v||v.value!=='DELETE'){toast('Type DELETE exactly','error');return;} fbAuth.currentUser.delete().catch(function(){}); toast('Account deleted 👋','info'); closeModal(); doLogout(); }

/* ══════════════════════════════
   PASSWORD & FORM HELPERS
══════════════════════════════ */
function togglePass(id,btn){ var i=$(id); i.type=i.type==='password'?'text':'password'; btn.textContent=i.type==='password'?'👁':'🙈'; }
function checkStrength(v){
  var s=0;
  if(v.length>=6) s++; if(/[A-Z]/.test(v)) s++; if(/[0-9]/.test(v)) s++; if(/[^A-Za-z0-9]/.test(v)) s++;
  var c=['#ef4444','#f59e0b','#10b981','#06b6d4'],l=['Weak','Fair','Strong','Very Strong'];
  ['sg1','sg2','sg3','sg4'].forEach(function(id,i){ var e=$(id); if(e) e.style.background=i<s?c[s-1]:'rgba(255,255,255,.08)'; });
  var lb=$('sg-lbl'); if(lb){ lb.textContent=v.length?(l[s-1]||''):''; lb.style.color=c[s-1]||'var(--muted)'; }
}
function showErr(id,msg){ var e=$(id); if(e){ e.textContent=msg; e.classList.remove('hidden'); } }
function clearErrs(){ $$('.err-text').forEach(function(e){ e.classList.add('hidden'); }); }
function btnLoad(btn,on){ if(on){ btn._orig=btn.innerHTML; btn.innerHTML='<div class="spinner"></div> Please wait...'; btn.disabled=true; } else { btn.innerHTML=btn._orig||'Submit'; btn.disabled=false; } }

/* ══════════════════════════════
   INIT
══════════════════════════════ */
document.addEventListener('DOMContentLoaded',function(){
  $$('input[type=range]').forEach(function(inp){
    var p=((inp.value-inp.min)/(inp.max-inp.min))*100;
    inp.style.background='linear-gradient(90deg,var(--accent) '+p+'%,rgba(255,255,255,.06) '+p+'%)';
  });
  renderNotifs();

  /* Enter key — login */
  var le=$('l-email'), lp=$('l-pass');
  if(le) le.addEventListener('keydown',function(e){ if(e.key==='Enter') doLogin(); });
  if(lp) lp.addEventListener('keydown',function(e){ if(e.key==='Enter') doLogin(); });

  /* Enter key — signup */
  var se=$('s-email'), sp=$('s-pass');
  if(se) se.addEventListener('keydown',function(e){ if(e.key==='Enter') doSignup(); });
  if(sp) sp.addEventListener('keydown',function(e){ if(e.key==='Enter') doSignup(); });
});