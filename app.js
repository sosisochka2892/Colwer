import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAGKICEmDSoeXUBjBCWCyJuqdk2GAQEv8c",
  authDomain: "colwer.firebaseapp.com",
  projectId: "colwer",
  storageBucket: "colwer.firebasestorage.app",
  messagingSenderId: "985156759901",
  appId: "1:985156759901:web:38bac3f84bae632d9138b4"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentUser = null, currentChatId = null, unsubMsgs = null;

onAuthStateChanged(auth, user => {
  if (!user) { signInAnonymously(auth); return; }
  currentUser = user;
  getDoc(doc(db, "profiles", user.uid)).then(snap => {
    if (snap.exists()) {
      document.getElementById('gate').style.display = 'none';
      document.getElementById('app').style.display = 'flex';
      loadChats();
    }
  });
});

document.getElementById('regBtn').onclick = async () => {
  const name = document.getElementById('regName').value.trim();
  if(!name) return alert('Введите имя!');
  await setDoc(doc(db, "profiles", currentUser.uid), { nick: name, at: Date.now() });
  document.getElementById('gate').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  loadChats();
};

function loadChats() {
  onSnapshot(collection(db, "profiles"), snap => {
    const list = document.getElementById('list'); list.innerHTML = '';
    snap.docs.forEach(d => {
      if(d.id === currentUser.uid) return;
      const b = document.createElement('button'); b.className = 'item';
      b.innerHTML = `<div class="item-body"><div class="item-top"><div class="title">${d.data().nick}</div></div><div class="item-bot"><div class="preview">Начать чат</div></div></div>`;
      b.onclick = () => openChat(d.id, d.data().nick);
      list.appendChild(b);
    });
  });
}

function openChat(uid, name) {
  currentChatId = [currentUser.uid, uid].sort().join('_');
  document.getElementById('conv').style.display = 'flex';
  document.getElementById('empty').style.display = 'none';
  document.getElementById('convTitle').innerText = name;
  if(unsubMsgs) unsubMsgs();
  unsubMsgs = onSnapshot(collection(db, "chats", currentChatId, "messages"), snap => {
    const box = document.getElementById('msgs'); box.innerHTML = '';
    snap.forEach(d => {
      const msg = d.data(), isMine = msg.sender === currentUser.uid;
      box.innerHTML += `<div class="row ${isMine ? 'mine' : 'their'}"><div class="bubble"><div class="txt">${msg.text}</div><span class="meta">${new Date(msg.at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div></div>`;
    });
    box.scrollTop = box.scrollHeight;
  });
}

document.getElementById('composer').onsubmit = async (e) => {
  e.preventDefault();
  const txt = document.getElementById('input').value.trim();
  if(!txt || !currentChatId) return;
  document.getElementById('input').value = '';
  await addDoc(collection(db, "chats", currentChatId, "messages"), { text: txt, sender: currentUser.uid, at: Date.now() });
};
