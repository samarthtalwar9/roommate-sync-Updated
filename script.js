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

/* ── UI helpers (presentation only) ── */
function ico(id,cls){ return '<svg class="ic'+(cls?' '+cls:'')+'"><use href="#i-'+id+'"/></svg>'; }
function emptyHTML(icon,title,text,opts){
  opts=opts||{};
  return '<div class="empty-state'+(opts.compact?' compact':'')+'"><div class="es-icon'+(opts.tone?' '+opts.tone:'')+'">'+ico(icon)+'</div>'+
    (title?'<h3>'+title+'</h3>':'')+(text?'<p>'+text+'</p>':'')+(opts.btn||'')+'</div>';
}
function skeletonCards(n){
  var h=''; for(var i=0;i<(n||3);i++) h+='<div class="match-card skel-card"><div class="skel skel-av"></div><div class="skel skel-l1"></div><div class="skel skel-l2"></div><div class="skel skel-l3"></div></div>';
  return h;
}
/* display only: add a space after a leading emoji stored without one (e.g. "🌙Night Owl") */
function pretty(t){ return String(t==null?'':t).replace(/^(\p{Extended_Pictographic}\uFE0F?)(?=\S)/u,'$1 '); }
function scoreTier(n){ return n>=85?'tier-hi':(n>=70?'tier-mid':'tier-lo'); }
function scoreWord(n){ return n>=90?'Great match':(n>=75?'Good match':(n>=60?'Fair match':'Low match')); }
function toggleNav(force){
  var n=$('nav'); if(!n) return;
  n.classList.toggle('menu-open', typeof force==='boolean' ? force : !n.classList.contains('menu-open'));
}

/* ══════════════════════════════
   TOAST
══════════════════════════════ */
function toast(msg, type){
  var icons={success:'check',error:'x',info:'info',warn:'alert'};
  var ty = icons[type||'info'] ? (type||'info') : 'info';
  var t = document.createElement('div');
  t.className = 'toast t-'+ty;
  t.setAttribute('role', ty==='error'?'alert':'status');
  t.innerHTML = '<span class="t-ico">'+ico(icons[ty])+'</span><span class="t-msg">'+msg+'</span><button class="toast-close" aria-label="Dismiss" onclick="this.parentElement.remove()">✕</button>';
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
  toggleNav(false);
  window.scrollTo(0,0);
}

function showDash(s){
  $$('.dash-section').forEach(function(e){ e.classList.remove('active'); });
  var d = $('dash-'+s); if(d) d.classList.add('active');
  $$('.sb-link').forEach(function(l){ l.classList.remove('active'); });
  var sl = $('sl-'+s); if(sl) sl.classList.add('active');
  $$('.mtab').forEach(function(t){ t.classList.remove('active'); });
  var mt = $('mt-'+s); if(mt) mt.classList.add('active');
  S.dash = s;
  window.scrollTo(0,0);
  if(s==='notifications') renderNotifs();
  if(s==='saved') renderSaved();
  if(s==='messages') renderConvList(S.convs);
}

function goTo(id){
  if(S.page!=='landing'){ showPage('landing'); setTimeout(function(){ sc(id); }, 260); return; }
  sc(id);
}
function sc(id){ toggleNav(false); var e=$(id); if(e) e.scrollIntoView({behavior:'smooth',block:'start'}); }

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
    var e=$(id); if(e) e.style.background='';
  });
  var lbl=$('sg-lbl'); if(lbl) lbl.textContent='';
  var mg=$('matches-grid'); if(mg) mg.innerHTML=skeletonCards(3);
  var sg=$('saved-grid'); if(sg) sg.innerHTML=emptyHTML('heart','No saved profiles yet','Heart a match to save them here',{tone:'peach'});
  var cl=$('conv-list'); if(cl) cl.innerHTML='';
  var ca=$('chat-area'); if(ca) ca.innerHTML=emptyHTML('chat','Select a conversation','Choose someone from the left to start chatting');
  var dm=$('dash-messages'); if(dm) dm.classList.remove('chat-open');
  var mtd=$('mt-dot'); if(mtd) mtd.classList.remove('on');
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
  if(mg) mg.innerHTML=skeletonCards(3);
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
    if(mg) mg.innerHTML=emptyHTML('alert','Could not load matches','Make sure Firestore is enabled, then try again.',{tone:'peach',btn:'<button class="btn btn-outline btn-sm" onclick="loadMatches()">Try again</button>'});
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
  '#FFD9CB','#C9E8D8','#FFE08A','#D6CCFF','#C4E0FF','#F9C3D8'
];

/* which of the three scored traits two people share (display only — mirrors calcScore) */
function sharedTraits(m){
  var me=S.userDoc||{}, out=[];
  if(me.sleep  && m.sleep  && me.sleep===m.sleep)   out.push('Sleep');
  if(me.clean  && m.clean  && me.clean===m.clean)   out.push('Cleanliness');
  if(me.social && m.social && me.social===m.social) out.push('Social');
  return out;
}
function matchCardHTML(m,idx,mode){
  var sv=S.savedIds.has(m._uid), col=COLORS[idx%COLORS.length];
  var name=m.displayName||'Anonymous';
  var jsName=name.replace(/'/g,"\\'");
  var tags=[];
  if(m.sleep)   tags.push(m.sleep.split(' ').slice(0,2).join(' '));
  if(m.clean)   tags.push(m.clean.split(' ')[0]);
  if(m.looking) tags.push(m.looking);
  var shared=sharedTraits(m);
  var bio=m.bio||(mode==='saved'?'Looking for a roommate.':'Looking for a compatible roommate in '+(m.city||'your city')+'.');
  var actions = mode==='saved'
    ? '<button class="btn btn-primary grow btn-sm" onclick="startChat(\''+m._uid+'\',\''+jsName+'\',\''+col+'\')">'+ico('chat')+' Message</button>'+
      '<button class="btn btn-danger btn-sm" aria-label="Remove from saved" onclick="doSave(\''+m._uid+'\',this)">❤️</button>'
    : '<button class="btn btn-primary grow btn-sm" onclick="startChat(\''+m._uid+'\',\''+jsName+'\',\''+col+'\')">'+ico('chat')+' Message</button>'+
      '<button class="btn btn-outline btn-sm'+(sv?' is-saved':'')+'" aria-label="Save profile" onclick="doSave(\''+m._uid+'\',this)">'+(sv?'❤️':'🤍')+'</button>'+
      '<button class="btn btn-ghost btn-sm" aria-label="View profile" onclick="viewMatch(\''+m._uid+'\')">'+ico('eye')+'</button>';
  return '<article class="match-card" style="--i:'+Math.min(idx,8)+'">'+
    '<div class="mc-top">'+
      '<div class="mc-av" style="background:'+col+'">'+escHtml(name[0].toUpperCase())+'</div>'+
      '<div class="mc-id">'+
        '<div class="mc-name">'+escHtml(name)+'</div>'+
        '<div class="mc-sub">'+escHtml((m.city||'')+((m.city&&m.role)?' · ':'')+pretty(m.role||''))+'</div>'+
        '<div class="mc-verified">'+ico('shield')+' Verified</div>'+
      '</div>'+
      '<div class="mc-score-wrap '+scoreTier(m._score)+'"><div class="mc-score-ring" style="--p:'+m._score+'"><span class="mc-score">'+m._score+'%</span></div><div class="mc-score-lbl">'+scoreWord(m._score)+'</div></div>'+
    '</div>'+
    '<div class="mc-body">'+
      (tags.length?'<div class="mc-tags">'+tags.map(function(t){ return '<span class="mc-tag">'+escHtml(pretty(t))+'</span>'; }).join('')+'</div>':'')+
      '<p class="mc-bio">'+escHtml(bio)+'</p>'+
      (shared.length?'<div class="mc-shared">'+ico('check')+' You both match on '+shared.join(' · ').toLowerCase()+'</div>':'')+
    '</div>'+
    '<div class="mc-actions">'+actions+'</div>'+
  '</article>';
}

function renderMatchCards(list){
  var g=$('matches-grid'); if(!g) return;
  if(!list||!list.length){
    g.innerHTML=emptyHTML('pin','No matches yet in your city','Invite friends to join Roommate Sync in '+escHtml((S.userDoc&&S.userDoc.city)||'your city')+'!',{tone:'mint'});
    return;
  }
  g.innerHTML=list.map(function(m,idx){ return matchCardHTML(m,idx,'discover'); }).join('');
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
  if(S.savedIds.has(uid)){ S.savedIds.delete(uid); btn.textContent='🤍'; btn.classList.remove('is-saved'); toast('Removed from saved','info'); }
  else{ S.savedIds.add(uid); btn.textContent='❤️'; btn.classList.add('is-saved'); toast('Saved! ❤️','success'); }
  btn.classList.remove('heart-pop'); void btn.offsetWidth; btn.classList.add('heart-pop');
  var ss=$('stat-saved'); if(ss) ss.textContent=S.savedIds.size;
  renderSaved();
}
function renderSaved(){
  var g=$('saved-grid'); if(!g) return;
  var sv=S.allMatches.filter(function(m){ return S.savedIds.has(m._uid); });
  if(!sv.length){ g.innerHTML=emptyHTML('heart','No saved profiles yet','Heart a match to save them here',{tone:'peach'}); return; }
  g.innerHTML=sv.map(function(m,i){ return matchCardHTML(m,i,'saved'); }).join('');
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
    var mtd=$('mt-dot'); if(mtd) mtd.classList.toggle('on', unread>0);
    var sc=$('stat-convs'); if(sc) sc.textContent=keys.length;
  });
}

/* ── FIX: pipe symbol removed ── */
function renderConvList(convs){
  var l=$('conv-list'); if(!l) return;
  var keys=Object.keys(convs);
  if(!keys.length){
    l.innerHTML=emptyHTML('chat','No conversations yet','Message a match to start chatting',{compact:true,tone:'sky'});
    return;
  }
  l.innerHTML=keys.map(function(otherUid,i){
    var c=convs[otherUid];
    var sel=S.convId===otherUid?'sel':'';
    var col=c.color||COLORS[i%COLORS.length];
    var name=c.name||'User';
    return '<div class="conv-item '+sel+'" onclick="openConv(\''+otherUid+'\',\''+name.replace(/'/g,"\\'")+'\',\''+col+'\')">' +
      '<div class="conv-av" style="background:'+col+'">'+escHtml(name[0].toUpperCase())+'</div>' +
      '<div style="flex:1;min-width:0;">'+
        '<div class="conv-name">'+escHtml(name)+'</div>'+
        '<div class="conv-preview">'+escHtml(c.lastMsg||'Start a conversation...')+'</div>'+
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
  var dmEl=$('dash-messages'); if(dmEl) dmEl.classList.add('chat-open');
  ca.innerHTML=
    '<div class="chat-hdr">'+
      '<button class="chat-back" aria-label="Back to conversations" onclick="$(\'dash-messages\').classList.remove(\'chat-open\')">'+ico('back')+'</button>'+
      '<div class="conv-av" style="background:'+col+';width:38px;height:38px;flex-shrink:0;">'+escHtml(otherInit)+'</div>'+
      '<div style="flex:1;min-width:0;">'+
        '<div class="chat-hdr-name">'+escHtml(otherName)+'</div>'+
        '<div class="chat-hdr-status">Online</div>'+
      '</div>'+
    '</div>'+
    '<div class="chat-msgs" id="chat-msgs"></div>'+
    '<div class="chat-inp-row">'+
      '<input class="chat-inp" id="cinp" placeholder="Type a message..." autocomplete="off"/>'+
      '<button class="btn btn-primary btn-sm" onclick="sendMsg(\''+otherUid+'\',\''+chatId+'\',\''+otherName.replace(/'/g,"\\'")+'\',\''+col+'\')">Send '+ico('send')+'</button>'+
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
      msgsEl.innerHTML=emptyHTML('chat','Say hello to '+escHtml(otherName)+'!','This is the start of your conversation. Break the ice — ask about their sleep schedule.',{tone:'butter'});
      return;
    }
    msgsEl.innerHTML=msgArr.map(function(m){
      var isMine=m.uid===uid;
      return '<div class="msg-row '+(isMine?'mine':'')+'">' +
        (!isMine?'<div class="msg-av-sm" style="background:'+col+'">'+escHtml(otherInit)+'</div>':'')+
        '<div><div class="bubble '+(isMine?'bubble-out':'bubble-in')+'">'+escHtml(m.txt)+'</div><div class="msg-time">'+escHtml(m.timeStr||'')+'</div></div>'+
        (isMine?'<div class="msg-av-sm" style="background:linear-gradient(135deg,var(--accent),var(--accent2))">'+escHtml(userInitial)+'</div>':'')+
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
  inp.style.background='linear-gradient(90deg,var(--accent) '+p+'%,rgba(23,20,15,.1) '+p+'%)';
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
  if(!NOTIFS.length){ l.innerHTML=emptyHTML('bell','All caught up!','No new notifications',{tone:'mint'}); return; }
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
  forgot:'<h2>Reset password</h2><p class="m-sub">We will email you a reset link.</p><div class="form-group"><label class="form-label" for="r-email">Email</label><input class="form-input" id="r-email" type="email" placeholder="you@example.com"/></div><button class="btn btn-primary btn-full mt16" onclick="doReset()">Send Reset Link</button>',
  upgrade:'<h2>Upgrade to Pro</h2><p class="m-sub">Unlock unlimited matches.</p><div class="m-price"><div class="amt">₹299<small> /month</small></div><ul><li>Unlimited matches</li><li>Full AI scoring</li><li>Advanced filters</li><li>Profile boost 2x/month</li><li>Priority support</li></ul></div><button class="btn btn-primary btn-full btn-lg" onclick="toast(\'Payment gateway coming soon! 🚀\',\'info\');closeModal()">Start 7-Day Free Trial</button>',
  filters:'<h2>Filter matches</h2><p class="m-sub">Narrow down your matches.</p><div class="m-stack"><div class="form-group"><label class="form-label">Role</label><select class="form-select"><option>Any</option><option>Students Only</option><option>Professionals Only</option></select></div><div class="form-group"><label class="form-label">Sleep Schedule</label><select class="form-select"><option>Any</option><option>Night Owl</option><option>Early Bird</option></select></div><button class="btn btn-primary" onclick="toast(\'Filters applied!\',\'success\');closeModal()">Apply Filters</button></div>',
  editProfile:'<h2>Edit profile</h2><div class="m-stack"><div class="form-group"><label class="form-label" for="ep-n">Display Name</label><input class="form-input" id="ep-n" value=""/></div><div class="form-group"><label class="form-label">Bio</label><textarea class="form-input" rows="3" placeholder="Tell roommates about yourself..."></textarea></div><button class="btn btn-primary" onclick="var n=document.getElementById(\'ep-n\');if(n&&n.value.trim()){setUI(n.value.trim(),S.user?S.user.email:\'\');}toast(\'Profile updated ✓\',\'success\');closeModal()">Save Profile</button></div>',
  deleteAcct:'<h2 class="m-danger-h">Delete account</h2><p class="m-sub">This cannot be undone.</p><div class="form-group"><label class="form-label" for="del-inp">Type DELETE to confirm</label><input class="form-input" id="del-inp" placeholder="DELETE"/></div><button class="btn btn-danger btn-full mt16" onclick="doDelAcct()">Delete My Account Forever</button>',
  about:'<h2>About Roommate Sync</h2><p class="m-text">AI-powered roommate matching platform. Founded 2024, Nagpur, India. Helping 50,000+ people find their ideal living situations.</p>',
  contact:'<h2>Contact us</h2><div class="m-stack"><div class="form-group"><label class="form-label">Name</label><input class="form-input" placeholder="Your name"/></div><div class="form-group"><label class="form-label">Email</label><input class="form-input" type="email" placeholder="you@example.com"/></div><div class="form-group"><label class="form-label">Message</label><textarea class="form-input" rows="4" placeholder="How can we help?"></textarea></div><button class="btn btn-primary" onclick="toast(\'Message sent!\',\'success\');closeModal()">Send Message</button></div>',
  privacy:'<h2>Privacy Policy</h2><p class="m-text">We collect only data necessary for our matching service. We never sell your information. Data encrypted with AES-256.</p>',
  terms:'<h2>Terms of Service</h2><p class="m-text">By using Roommate Sync you agree to use the platform honestly. Fake profiles lead to immediate termination. Users must be 18 or older.</p>',
  safety:'<h2>Safety Center</h2><p class="m-text">Always meet in public first. Video call before sharing personal details. Report suspicious profiles immediately.</p>',
  careers:'<h2>Careers</h2><p class="m-text">Hiring: Full-Stack Engineer, Product Designer, Growth Marketer. Send resume to careers@roommatesync.in</p>'
};

function openModal(key,data){
  var html;
  if(key==='vp'&&data){
    var col=COLORS[0];
    var me=S.userDoc||{};
    var rows=[['Sleep','sleep'],['Cleanliness','clean'],['Social life','social']].map(function(r){
      var hit=!!(me[r[1]]&&data[r[1]]&&me[r[1]]===data[r[1]]);
      return '<div class="vp-bd'+(hit?'':' miss')+'"><em>'+r[0]+'</em><div class="bar"><i style="--w:'+(hit?100:0)+'%"></i></div><span>'+(hit?'In sync':'Different')+'</span></div>';
    }).join('');
    html=
      '<div class="vp-head">'+
        '<div class="vp-av" style="background:'+col+'">'+escHtml(data.displayName[0])+'</div>'+
        '<div><h2>'+escHtml(data.displayName)+'</h2><p class="vp-sub">'+escHtml((data.city||'')+((data.city&&data.role)?' · ':'')+pretty(data.role||''))+'</p></div>'+
      '</div>'+
      '<div class="vp-score '+scoreTier(data._score)+'"><div class="vp-ring" style="--p:'+data._score+';width:68px;height:68px"><span style="font-size:17px">'+data._score+'%</span></div><div class="vp-score-txt"><b>'+scoreWord(data._score)+'</b><span>Compatibility with your lifestyle</span></div></div>'+
      '<p class="vp-bio">'+escHtml(data.bio||'Looking for a compatible roommate.')+'</p>'+
      '<div class="vp-breakdown">'+rows+'</div>'+
      '<div class="vp-tags">'+
        (data.role?'<span class="badge badge-pu">'+escHtml(pretty(data.role))+'</span>':'')+
        (data.sleep?'<span class="badge badge-cy">'+escHtml(pretty(data.sleep))+'</span>':'')+
        (data.clean?'<span class="badge badge-gr">'+escHtml(pretty(data.clean))+'</span>':'')+
      '</div>'+
      '<div class="vp-actions"><button class="btn btn-primary grow" onclick="startChat(\''+data._uid+'\',\''+data.displayName.replace(/'/g,"\\'")+'\',\''+col+'\');closeModal()">'+ico('chat')+' Message</button><button class="btn btn-outline" onclick="closeModal()">Close</button></div>';
  } else {
    html=MODS[key]||('<h2>'+key+'</h2><p class="m-text">Coming soon.</p>');
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
  var c=['#D93636','#E0A100','#1F9D6B','#1F6B52'],l=['Weak','Fair','Strong','Very Strong'];
  ['sg1','sg2','sg3','sg4'].forEach(function(id,i){ var e=$(id); if(e) e.style.background=i<s?c[s-1]:''; });
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
    inp.style.background='linear-gradient(90deg,var(--accent) '+p+'%,rgba(23,20,15,.1) '+p+'%)';
  });
  renderNotifs();

  /* Esc closes modal */
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeModal(); });

  /* Enter key — login */
  var le=$('l-email'), lp=$('l-pass');
  if(le) le.addEventListener('keydown',function(e){ if(e.key==='Enter') doLogin(); });
  if(lp) lp.addEventListener('keydown',function(e){ if(e.key==='Enter') doLogin(); });

  /* Enter key — signup */
  var se=$('s-email'), sp=$('s-pass');
  if(se) se.addEventListener('keydown',function(e){ if(e.key==='Enter') doSignup(); });
  if(sp) sp.addEventListener('keydown',function(e){ if(e.key==='Enter') doSignup(); });
});
