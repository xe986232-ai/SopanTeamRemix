import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
    import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
    import { getFirestore, collection, getDocs, limit, query } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
    // UPDATE: Import Database
    import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

    // UPDATE: Konfigurasi Firebase LabelMusic
    const firebaseConfig = {
        apiKey: "AIzaSyDQJ0dFT8ohAkwDODrdfDa2GEwzk0kZRm0",
        authDomain: "labelmusic-ee1b2.firebaseapp.com",
        databaseURL: "https://labelmusic-ee1b2-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "labelmusic-ee1b2",
        storageBucket: "labelmusic-ee1b2.firebasestorage.app",
        messagingSenderId: "634541524714",
        appId: "1:634541524714:web:a2fc9d47a91e37f44a7993",
        measurementId: "G-MMFG3N1VV9"
    };

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const rtdb = getDatabase(app); // Inisialisasi Real-time Database
    // Fungsi untuk mengacak array (Fisher-Yates Shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


    const userAvatar = document.getElementById('userAvatar');
    const sideSignUpBtn = document.getElementById('sideSignUpBtn');

    window.handleLogOut = () => { signOut(auth).then(() => { 
        document.getElementById('profileDropdown').classList.remove('active'); 
        window.location.reload();
    }); };

    // UPDATE: Logika pengecekan Status (Pending/Success)
    onAuthStateChanged(auth, async (user) => {
        const greetingElement = document.getElementById('userGreeting');
        if (user) {
            try {
                const userRef = ref(rtdb, 'users/' + user.uid);
                const snapshot = await get(userRef);

                if (snapshot.exists()) {
                    const userData = snapshot.val();
                    const name = userData.username || 'User';
                    const status = userData.status; // Ambil nilai status

                    if (status === "success") {
                        // Jika status success: Tampilkan foto dan sambutan normal
                        userAvatar.src = userData.profilePic || 'https://via.placeholder.com/150';
                        userAvatar.style.display = 'block';
                        if (greetingElement) { 
                            greetingElement.innerText = `Welcome, ${name}!`; 
                            greetingElement.style.opacity = '1'; 
                        }
                    } else {
                        // Jika status pending: Sembunyikan foto, ganti teks sambutan
                        userAvatar.style.display = 'none';
                        if (greetingElement) { 
                            greetingElement.innerText = `${name}, sedang ditinjau admin`; 
                            greetingElement.style.opacity = '1'; 
                        }
                    }
                }
            } catch (error) {
                console.error("Gagal memuat data:", error);
            }

            if(sideSignUpBtn) sideSignUpBtn.style.display = 'none';
        } else {
            userAvatar.style.display = 'none';
            if(sideSignUpBtn) sideSignUpBtn.style.display = 'block';
            if (greetingElement) { greetingElement.style.opacity = '0'; greetingElement.innerText = ''; }
        }
    });

    let allSongs = []; 
    let currentIndex = -1;
    let mainSwiper;
    let currentPlayingAudio = null;
    let currentPlayingBtn = null;
    let currentPlayingItem = null;
// PASANG KODE BARU DI SINI (Sebelum fetchPlaylist)
const musicOverlay = document.getElementById('musicOverlay');
const triggerArea = document.getElementById('triggerArea');
const btnMinimize = document.getElementById('btnMinimize');

if (triggerArea) {
    triggerArea.onclick = (e) => {
        // Jika yang diklik BUKAN tombol kontrol, maka perbesar
        if (!e.target.closest('.player-controls')) {
            musicOverlay.classList.add('expanded');
        }
    };
}

if (btnMinimize) {
    btnMinimize.onclick = (e) => {
        e.stopPropagation(); 
        musicOverlay.classList.remove('expanded');
    };
}
    async function fetchPlaylist() {
        const swiperContainer = document.getElementById('swiperPreviewContainer');
        const listContainer = document.getElementById('previewContainer');
        const section = document.getElementById('playlistSection');
        
        // Element Overlay
        const overlay = document.getElementById('musicOverlay');
        const ovPlay = document.getElementById('ovPlay');
        const ovProgress = document.getElementById('ovProgressBar');
        const ovProgressBox = document.getElementById('ovProgressBox');

        try {
            const q = query(collection(db, "products"), limit(20));
            const snap = await getDocs(q);
            if (snap.empty) return;

            let items = [];
            snap.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); });
            
            // Simpan ke array global untuk navigasi Next/Prev
            allSongs = shuffleArray(items).slice(0, 8);
            
            section.style.display = 'block';
            swiperContainer.innerHTML = '';
            listContainer.innerHTML = '';

            // Helper Format Waktu
            const formatTime = (secs) => {
                if(!secs) return "0:00";
                const m = Math.floor(secs / 60);
                const s = Math.floor(secs % 60);
                return `${m}:${s < 10 ? '0' + s : s}`;
            };

            allSongs.forEach((data, index) => {
                const swSlide = document.createElement('div');
                swSlide.className = 'swiper-slide';
                swSlide.innerHTML = `
                    <div class="playlist-card">
                        <img src="${data.avatar}" class="pl-cover">
                        <div class="pl-info">
                            <div class="pl-visualizer" style="display: flex; align-items: flex-end; gap: 3px; height: 15px; margin-bottom: 8px; opacity: 0; transition: 0.3s; justify-content: center;">
                                <div class="bar" style="width:3px; background:#23C55E; height:4px;"></div>
                                <div class="bar" style="width:3px; background:#23C55E; height:4px;"></div>
                                <div class="bar" style="width:3px; background:#23C55E; height:4px;"></div>
                                <div class="bar" style="width:3px; background:#23C55E; height:4px;"></div>
                            </div>
                            <h4>${data.judul}</h4>
                            <p>${data.artis}</p>
                            <div class="pl-controls">
                                <div class="pl-play-btn"><i class="fa-solid fa-play"></i></div>
                                <div class="pl-progress-box" style="flex: 1; cursor: pointer; position: relative;">
                                    <div class="pl-progress-bg" style="position: relative; overflow: visible;">
                                        <div class="pl-progress-bar" style="position: relative;">
                                            <div style="position: absolute; right: -5px; top: 50%; transform: translateY(-50%); width: 10px; height: 10px; background: #fff; border-radius: 50%; border: 2px solid #23C55E;"></div>
                                        </div>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; font-size: 10px; color: #636E7A; margin-top: 5px; font-family: monospace;">
                                        <span class="curr-time">0:00</span>
                                        <span class="total-time">0:00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                const listItem = document.createElement('div');
                listItem.className = 'preview-item';
                listItem.innerHTML = `
                    <img src="${data.avatar}" class="preview-avatar">
                    <div class="preview-info">
                        <div class="title-wrapper">
                            <h4>${data.judul}</h4>
                            <div class="spectrum">
                                <div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>
                            </div>
                        </div>
                        <p>${data.artis}</p>
                        <div class="progress-container"><div class="progress-bar"></div></div>
                    </div>
                    <div class="play-btn"><i class="fa-solid fa-play"></i></div>
                `;

                const audio = new Audio(data.audio);
                data.audioObj = audio; // Simpan objek audio ke dalam data

                const swBtn = swSlide.querySelector('.pl-play-btn');
                const swBar = swSlide.querySelector('.pl-progress-bar');
                const swProgressBox = swSlide.querySelector('.pl-progress-box');
                const swVisualizer = swSlide.querySelector('.pl-visualizer');
                const liBtn = listItem.querySelector('.play-btn');
                const liBar = listItem.querySelector('.progress-bar');

                audio.onloadedmetadata = () => {
                    swSlide.querySelector('.total-time').innerText = formatTime(audio.duration);
                };

const updateOverlayUI = () => {
    const ovTitle = document.getElementById('ovTitle');
    const ovArtist = document.getElementById('ovArtist');
    const ovCover = document.getElementById('ovCover');
    const infoContainer = ovTitle.parentElement;

    // 1. Set data dasar
    ovCover.src = data.avatar;
    ovTitle.innerText = data.judul;
    ovArtist.innerText = data.artis;
    overlay.classList.add('active');

    // 2. Reset animasi & teks setiap ganti lagu
    ovTitle.classList.remove('scroll-active');
    ovTitle.style.animation = 'none'; 

    // 3. Logika Cek Panjang Teks (Gunakan timeout kecil agar DOM selesai render)
    setTimeout(() => {
        // Jika lebar teks asli lebih besar dari lebar kotak penampungnya
        if (ovTitle.scrollWidth > infoContainer.offsetWidth) {
            // Duplikat teks hanya jika kepanjangan agar loop tidak putus
            ovTitle.innerHTML = `${data.judul} &nbsp;&nbsp;&nbsp;&nbsp; ${data.judul} &nbsp;&nbsp;&nbsp;&nbsp;`;
            ovTitle.classList.add('scroll-active');
            ovTitle.style.animation = ''; // Jalankan kembali animasi
        }
    }, 100);
};


                const handlePlay = (btn, bar, itemType) => {
                    if (currentPlayingAudio && currentPlayingAudio !== audio) {
                        currentPlayingAudio.pause();
                        // Reset all icons
                        document.querySelectorAll('.pl-play-btn, .play-btn').forEach(b => b.innerHTML = '<i class="fa-solid fa-play"></i>');
                        document.querySelectorAll('.pl-visualizer, .spectrum').forEach(v => v.style.opacity = "0");
                        document.querySelectorAll('.preview-item, .swiper-slide').forEach(i => i.classList.remove('playing'));
                    }

                    if (audio.paused) {
                        audio.play();
                        btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                        ovPlay.innerHTML = '<i class="fa-solid fa-pause"></i>';
                        swVisualizer.style.opacity = "1";
                        updateOverlayUI();
                        currentIndex = index;

                        if (mainSwiper && mainSwiper.autoplay) mainSwiper.autoplay.stop();
                        if(itemType === 'list') listItem.classList.add('playing');
                        else swSlide.classList.add('playing');

                        currentPlayingAudio = audio; 
                        currentPlayingBtn = btn; 
                        currentPlayingItem = (itemType === 'list' ? listItem : swSlide);
                    } else {
                        audio.pause();
                        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
                        ovPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
                        swVisualizer.style.opacity = "0";
                        if (mainSwiper && mainSwiper.autoplay) mainSwiper.autoplay.start();
                    }
                };

                audio.ontimeupdate = () => {
                    if (audio.duration) {
                        const prog = (audio.currentTime / audio.duration) * 100;
                        swBar.style.width = prog + "%";
                        liBar.style.width = prog + "%";
                        ovProgress.style.width = prog + "%";
                        swSlide.querySelector('.curr-time').innerText = formatTime(audio.currentTime);
                        document.getElementById('ovCurrent').innerText = formatTime(audio.currentTime);
                        document.getElementById('ovTotal').innerText = formatTime(audio.duration);
                    }
                };

                swProgressBox.onclick = (e) => {
                    const rect = swSlide.querySelector('.pl-progress-bg').getBoundingClientRect();
                    audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
                };

                audio.onended = () => { playNext(); };

                swBtn.onclick = () => handlePlay(swBtn, swBar, 'swiper');
                liBtn.onclick = () => handlePlay(liBtn, liBar, 'list');

                swiperContainer.appendChild(swSlide);
                listContainer.appendChild(listItem);
            });

            // Logika Global Kontrol Overlay
            ovPlay.onclick = () => {
                if(currentPlayingAudio) {
                    if(currentPlayingAudio.paused) {
                        currentPlayingAudio.play();
                        ovPlay.innerHTML = '<i class="fa-solid fa-pause"></i>';
                        if(currentPlayingBtn) currentPlayingBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                    } else {
                        currentPlayingAudio.pause();
                        ovPlay.innerHTML = '<i class="fa-solid fa-play"></i>';
                        if(currentPlayingBtn) currentPlayingBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
                    }
                }
            };

            ovProgressBox.onclick = (e) => {
                if(currentPlayingAudio) {
                    const rect = ovProgressBox.getBoundingClientRect();
                    currentPlayingAudio.currentTime = ((e.clientX - rect.left) / rect.width) * currentPlayingAudio.duration;
                }
            };

            const playNext = () => {
                let nextIdx = (currentIndex + 1) % allSongs.length;
                // Trigger click pada tombol play slide berikutnya
                swiperContainer.children[nextIdx].querySelector('.pl-play-btn').click();
                if(mainSwiper) mainSwiper.slideToLoop(nextIdx);
            };

            const playPrev = () => {
                let prevIdx = (currentIndex - 1 + allSongs.length) % allSongs.length;
                swiperContainer.children[prevIdx].querySelector('.pl-play-btn').click();
                if(mainSwiper) mainSwiper.slideToLoop(prevIdx);
            };

            document.getElementById('ovNext').onclick = playNext;
            document.getElementById('ovPrev').onclick = playPrev;

            mainSwiper = new Swiper(".mySwiper", {
                effect: "coverflow",
                grabCursor: true,
                centeredSlides: true,
                slidesPerView: "auto",
                speed: 700,
                coverflowEffect: { rotate: 0, stretch: 15, depth: 120, modifier: 1.4, slideShadows: false },
                loop: true,
                autoplay: { delay: 4000, disableOnInteraction: false }
            });

        } catch (e) { console.error("Error loading playlist:", e); }
    }
fetchPlaylist();
