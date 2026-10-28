import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { BookOpen, Users, LayoutDashboard, FileText, CheckCircle, AlertTriangle, LogOut, ChevronRight, Image as ImageIcon } from 'lucide-react';

// --- DATA AWAL (MOCK DATA) ---
const INITIAL_STUDENTS = [
  "ALVIN JULIANDI", "AFRIGAMA FAJAR", "ALVEMB RIZKY", "AULIA PUTRI YENTI", 
  "BIAN PUTRA PRATAMA", "DAVIT AROHMAN DANI", "M. DAFA RAMADHAN", "ELSA DELVA NOVRIANI", 
  "ERLAND PRATAMA", "FAIZAH ALMUKHNI", "FARRA AULIA PUTRI", "HAFIS MAULANA", 
  "HANIFA PUTRI ENNAS", "IKHWAN RAMADHAN", "LATIFA NUR AINI", "M. AIDIL PUTRA", 
  "M.MARVEL RAMADHAN", "MUSTABILILLAH", "NACUA EKA PRATIWI", "NAILA GHANI SYAFITRI", 
  "RIFKI RAMADANI", "SILVI WINDA", "SYNDI MARTALETA", "VIRGINIA PUTRI ANDRIESTA", 
  "ZAHWA NAQILA", "ZHORIF BARO'AH"
].map((name, index) => ({
  id: `S${index + 1}`,
  name: name,
  kehadiran: { H: 0, S: 0, I: 0, A: 0 },
  nilai: { catatan: 0, ulangan: 0, sikap: 100 }, // Sikap modal awal 100
  raport: 0
}));

const MATERI_LIST = [
  { id: 1, title: "Tungku Tigo Sajarangan", desc: "Mempelajari peran Ninik Mamak, Alim Ulama, dan Cerdik Pandai dalam sistem masyarakat Minangkabau." },
  { id: 2, title: "Tau Di Nan Ampek", desc: "Memahami Kato Mandaki, Kato Manurun, Kato Mandata, dan Kato Melereng dalam komunikasi sehari-hari." },
  { id: 3, title: "Pakaian Adat Minangkabau", desc: "Mengenal Baju Kurung Basiba, Pakaian Bundo Kanduang, Pakaian Penghulu, dan makna filosofisnya." }
];

const UKIRAN_MINANG = [
  { name: "Rajo Tigo Selo", makna: "Melambangkan tiga raja di Minangkabau (Raja Alam, Raja Adat, Raja Ibadat).", filosofi: "Kekuasaan yang terbagi secara adil dan berimbang." },
  { name: "Tupai Managun", makna: "Menggambarkan tupai yang sedang diam/tertegun.", filosofi: "Sikap waspada, hati-hati, dan memikirkan matang-matang sebelum bertindak." },
  { name: "Ayam Mancotok", makna: "Ayam yang sedang mematuk makanan.", filosofi: "Rezeki yang dicari dengan tekun dan sabar." },
  { name: "Saluak Laka", makna: "Anyaman dari rotan/lidi pelindung periuk.", filosofi: "Kekerabatan yang erat dan saling melindungi dalam kaum." }
];

const SOAL_KUIS = [
  { id: 1, q: "Siapakah yang termasuk dalam 'Tungku Tigo Sajarangan'?", options: ["Raja, Menteri, Hulubalang", "Ninik Mamak, Alim Ulama, Cerdik Pandai", "Bundo Kanduang, Penghulu, Manti", "Malim, Dubalang, Pandito"], ans: 1 },
  { id: 2, q: "Cara berbicara dengan orang yang lebih tua atau dihormati disebut...", options: ["Kato Mandata", "Kato Melereng", "Kato Manurun", "Kato Mandaki"], ans: 3 },
  { id: 3, q: "Pakaian kebesaran wanita Minangkabau sering disebut...", options: ["Bundo Kanduang", "Baju Kurung Basiba", "Suntiang", "Tingkuluak"], ans: 0 },
];

const BAD_WORDS = ["kasar", "sumpah", "bodoh", "jelek", "anjing", "babi", "gila", "pantek"];

// --- KOMPONEN UTAMA ---
export default function PortalMulokMinang() {
  const [user, setUser] = useState(null);
  const [db, setDb] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  
  const [view, setView] = useState('login'); // login, guru, siswa
  const [siswaId, setSiswaId] = useState('');
  
  const [classData, setClassData] = useState({ students: INITIAL_STUDENTS });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const appId = typeof __app_id !== 'undefined' ? __app_id : 'portal-mulok-minang';

  // Inisialisasi Firebase
  useEffect(() => {
    try {
      const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const auth = getAuth(app);
      setDb(firestore);

      const initAuth = async () => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      };
      
      initAuth();
      const unsubscribe = onAuthStateChanged(auth, setAuthUser);
      return () => unsubscribe();
    } catch (error) {
      console.error("Firebase init error", error);
      setLoading(false);
    }
  }, []);

  // Fetch Data Kelas
  useEffect(() => {
    if (!authUser || !db) return;
    
    setLoading(true);
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'classData', 'XIF1');
    
    const unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setClassData(docSnap.data());
        } else {
          // Initialize DB if empty
          setDoc(docRef, { students: INITIAL_STUDENTS });
          setClassData({ students: INITIAL_STUDENTS });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Fetch error", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [authUser, db, appId]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleUpdateStudent = async (updatedStudents) => {
    if (!db) return;
    const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'classData', 'XIF1');
    await setDoc(docRef, { students: updatedStudents });
  };

  const calculateRaport = (student) => {
    const { kehadiran, nilai } = student;
    const totalPertemuan = 24; // Asumsi 24 pertemuan
    const persenHadir = Math.min(((kehadiran.H || 0) / totalPertemuan) * 100, 100);
    
    const nilaiHadir = persenHadir * 0.25;
    const nilaiCatatan = (nilai.catatan || 0) * 0.25;
    const nilaiUlangan = (nilai.ulangan || 0) * 0.35;
    const nilaiSikap = (nilai.sikap || 0) * 0.15;
    
    return Math.round(nilaiHadir + nilaiCatatan + nilaiUlangan + nilaiSikap);
  };

  const handleLogin = (role) => {
    if (role === 'guru') {
      setUser({ role: 'guru', name: 'SURYADI, S.Pd' });
      setView('guru_dashboard');
    } else {
      if (!siswaId) {
        showToast("Pilih nama Anda terlebih dahulu!");
        return;
      }
      const student = classData.students.find(s => s.id === siswaId);
      setUser({ role: 'siswa', ...student });
      setView('siswa_dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setSiswaId('');
    setView('login');
  };

  // --- RENDERERS ---

  if (loading) return <div className="flex h-screen items-center justify-center bg-red-900 text-yellow-500">Memuat Portal Mulok...</div>;

  return (
    <div className="min-h-screen font-sans bg-gray-50 text-gray-900 selection:bg-yellow-500 selection:text-black">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-black text-yellow-400 px-6 py-3 rounded-lg border border-yellow-500 shadow-xl flex items-center gap-2">
          <AlertTriangle size={18} />
          {toast}
        </div>
      )}

      {/* Header */}
      {view !== 'login' && (
        <header className="bg-red-900 text-white border-b-4 border-yellow-500 shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-500 p-2 rounded-full">
                <BookOpen size={24} className="text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-wider">PORTAL MULOK MINANG</h1>
                <p className="text-sm text-yellow-400 font-medium">SMAN 1 Payung Sekaki</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold">{user?.name}</p>
                <p className="text-xs text-yellow-300 uppercase">{user?.role}</p>
              </div>
              <button onClick={handleLogout} className="p-2 hover:bg-red-800 rounded-lg transition text-yellow-100">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="">
        {view === 'login' && (
          <LoginScreen 
            onLogin={handleLogin} 
            siswaId={siswaId} 
            setSiswaId={setSiswaId} 
            students={classData.students} 
          />
        )}
        {view === 'guru_dashboard' && (
          <GuruDashboard 
            students={classData.students} 
            onUpdate={handleUpdateStudent} 
            calculateRaport={calculateRaport}
            showToast={showToast}
          />
        )}
        {view === 'siswa_dashboard' && (
          <SiswaDashboard 
            student={classData.students.find(s => s.id === user.id)}
            students={classData.students}
            onUpdate={handleUpdateStudent}
            showToast={showToast}
          />
        )}
      </main>
    </div>
  );
}

// ==========================================
// VIEW: LOGIN SCREEN
// ==========================================
function LoginScreen({ onLogin, siswaId, setSiswaId, students }) {
  return (
    <div className="min-h-screen bg-red-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#F59E0B 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
      
      <div className="bg-black border-2 border-yellow-500 rounded-2xl shadow-2xl p-8 max-w-md w-full z-10 text-center">
        <div className="mx-auto bg-yellow-500 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/20">
          <BookOpen size={40} className="text-red-900" />
        </div>
        <h1 className="text-3xl font-bold text-yellow-500 mb-2 uppercase tracking-widest">Portal Mulok</h1>
        <p className="text-red-200 mb-8 font-medium">Keminangkabauan SMAN 1 Payung Sekaki</p>

        <div className="space-y-6">
          <div className="bg-red-950 p-4 rounded-xl border border-red-800">
            <h2 className="text-yellow-400 font-semibold mb-4 text-sm uppercase">Masuk Sebagai Guru</h2>
            <button 
              onClick={() => onLogin('guru')}
              className="w-full bg-red-700 hover:bg-red-600 text-white py-3 rounded-lg font-bold transition shadow-md border border-red-500"
            >
              Login Guru (Suryadi, S.Pd)
            </button>
          </div>

          <div className="bg-red-950 p-4 rounded-xl border border-red-800">
            <h2 className="text-yellow-400 font-semibold mb-4 text-sm uppercase">Masuk Sebagai Siswa</h2>
            <select 
              value={siswaId}
              onChange={(e) => setSiswaId(e.target.value)}
              className="w-full bg-black text-yellow-100 border border-red-700 rounded-lg p-3 mb-4 focus:outline-none focus:border-yellow-500"
            >
              <option value="">-- Pilih Nama Siswa --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} (XI F1)</option>
              ))}
            </select>
            <button 
              onClick={() => onLogin('siswa')}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-black py-3 rounded-lg font-bold transition shadow-md"
            >
              Login Siswa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// VIEW: GURU DASHBOARD
// ==========================================
function GuruDashboard({ students, onUpdate, calculateRaport, showToast }) {
  const [activeTab, setActiveTab] = useState('absensi'); // absensi, nilai
  
  const handleAbsensiChange = (id, type, increment) => {
    const updated = students.map(s => {
      if (s.id === id) {
        return {
          ...s,
          kehadiran: {
            ...s.kehadiran,
            [type]: Math.max(0, s.kehadiran[type] + increment)
          }
        };
      }
      return s;
    });
    
    // Auto-update raport
    const withRaport = updated.map(s => ({ ...s, raport: calculateRaport(s) }));
    onUpdate(withRaport);
  };

  const handleNilaiChange = (id, field, value) => {
    const numValue = Number(value) || 0;
    const updated = students.map(s => {
      if (s.id === id) {
        return {
          ...s,
          nilai: {
            ...s.nilai,
            [field]: numValue
          }
        };
      }
      return s;
    });
    const withRaport = updated.map(s => ({ ...s, raport: calculateRaport(s) }));
    onUpdate(withRaport);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab('absensi')}
          className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition ${activeTab === 'absensi' ? 'bg-black text-yellow-400 border-t-4 border-yellow-500 shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}
        >
          <Users size={20} /> Jurnal Absensi
        </button>
        <button 
          onClick={() => setActiveTab('nilai')}
          className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition ${activeTab === 'nilai' ? 'bg-black text-yellow-400 border-t-4 border-yellow-500 shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'}`}
        >
          <FileText size={20} /> Rekap Nilai
        </button>
      </div>

      <div className="bg-white rounded-b-xl rounded-tr-xl shadow-xl border border-gray-200 overflow-hidden">
        {activeTab === 'absensi' && (
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-red-900 text-yellow-500 uppercase">
                <tr>
                  <th className="p-4">No</th>
                  <th className="p-4">Nama Siswa (XI F1)</th>
                  <th className="p-4 text-center">Hadir (H)</th>
                  <th className="p-4 text-center">Sakit (S)</th>
                  <th className="p-4 text-center">Izin (I)</th>
                  <th className="p-4 text-center">Alpa (A)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-red-50 transition">
                    <td className="p-4 font-bold text-gray-500">{idx + 1}</td>
                    <td className="p-4 font-semibold text-gray-800">{s.name}</td>
                    {['H', 'S', 'I', 'A'].map(type => (
                      <td key={type} className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleAbsensiChange(s.id, type, -1)} className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600 font-bold">-</button>
                          <span className="w-8 text-lg font-bold">{s.kehadiran[type]}</span>
                          <button onClick={() => handleAbsensiChange(s.id, type, 1)} className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-700 font-bold">+</button>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'nilai' && (
          <div className="p-0 overflow-x-auto">
            <div className="p-4 bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-sm flex items-center gap-2">
              <AlertTriangle size={16} /> 
              Rumus Rapor: Kehadiran (25%) + Catatan (25%) + Ulangan (35%) + Sikap (15%). Nilai Sikap otomatis terupdate dari kuis siswa.
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-black text-yellow-500 uppercase">
                <tr>
                  <th className="p-4">No</th>
                  <th className="p-4">Nama Siswa</th>
                  <th className="p-4 text-center" title="Berdasarkan 24 Pertemuan">Hadir (%)</th>
                  <th className="p-4 text-center">Catatan (0-100)</th>
                  <th className="p-4 text-center">Ulangan (0-100)</th>
                  <th className="p-4 text-center">Sikap (Poin)</th>
                  <th className="p-4 text-center font-black">NILAI AKHIR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-bold text-gray-500">{idx + 1}</td>
                    <td className="p-4 font-semibold text-gray-800">{s.name}</td>
                    <td className="p-4 text-center font-bold text-blue-600">
                      {Math.round(((s.kehadiran.H || 0) / 24) * 100)}%
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        min="0" max="100"
                        value={s.nilai.catatan}
                        onChange={(e) => handleNilaiChange(s.id, 'catatan', e.target.value)}
                        className="w-20 p-2 border border-gray-300 rounded text-center focus:outline-none focus:border-yellow-500"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        min="0" max="100"
                        value={s.nilai.ulangan}
                        onChange={(e) => handleNilaiChange(s.id, 'ulangan', e.target.value)}
                        className="w-20 p-2 border border-gray-300 rounded text-center focus:outline-none focus:border-yellow-500"
                      />
                    </td>
                    <td className="p-4 text-center font-bold text-green-600">
                      {s.nilai.sikap}
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-3 py-1 rounded-full font-black ${s.raport >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {s.raport}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// VIEW: SISWA DASHBOARD
// ==========================================
function SiswaDashboard({ student, students, onUpdate, showToast }) {
  const [activeTab, setActiveTab] = useState('materi'); // materi, kuis, ensiklopedia, rapor
  const [quizAnswers, setQuizAnswers] = useState({});
  const [reflection, setReflection] = useState('');
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  const handleSubmitQuiz = () => {
    let score = 0;
    let sikapPoints = 0;
    
    // Periksa Jawaban Pilihan Ganda
    SOAL_KUIS.forEach(q => {
      if (quizAnswers[q.id] === q.ans) {
        score += (100 / SOAL_KUIS.length);
        sikapPoints += 2; // Benar +2
      } else if (quizAnswers[q.id] !== undefined) {
        sikapPoints += 1; // Salah +1
      }
    });

    // Periksa Refleksi untuk kata tidak senonoh
    const reflectionLower = reflection.toLowerCase();
    let hasBadWords = false;
    BAD_WORDS.forEach(word => {
      if (reflectionLower.includes(word)) {
        hasBadWords = true;
      }
    });

    if (hasBadWords) {
      sikapPoints -= 2;
      showToast("Peringatan: Terdeteksi kata tidak senonoh. Poin sikap dikurangi!");
    }

    setQuizScore(Math.round(score));
    setQuizSubmitted(true);
    showToast("Tugas berhasil dikumpulkan!");

    // Update to Firebase
    const updatedStudents = students.map(s => {
      if (s.id === student.id) {
        const newUlangan = Math.round(((s.nilai.ulangan || 0) + score) / (s.nilai.ulangan ? 2 : 1)); // Rata-rata sederhana
        return {
          ...s,
          nilai: {
            ...s.nilai,
            ulangan: newUlangan,
            sikap: (s.nilai.sikap || 0) + sikapPoints
          }
        };
      }
      return s;
    });

    // Re-calculate raport
    const withRaport = updatedStudents.map(s => {
      const totalPertemuan = 24;
      const persenHadir = Math.min(((s.kehadiran.H || 0) / totalPertemuan) * 100, 100);
      const nilaiHadir = persenHadir * 0.25;
      const nilaiCatatan = (s.nilai.catatan || 0) * 0.25;
      const nilaiUlangan = (s.nilai.ulangan || 0) * 0.35;
      const nilaiSikap = (s.nilai.sikap || 0) * 0.15;
      return { ...s, raport: Math.round(nilaiHadir + nilaiCatatan + nilaiUlangan + nilaiSikap) };
    });

    onUpdate(withRaport);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      
      {/* Tab Navigation Siswa */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
        {[
          { id: 'materi', label: 'Materi Ajar', icon: BookOpen },
          { id: 'ensiklopedia', label: 'Ukiran Minang', icon: ImageIcon },
          { id: 'kuis', label: 'Tugas & Kuis', icon: FileText },
          { id: 'rapor', label: 'Rapor Saya', icon: CheckCircle }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center p-4 rounded-xl font-bold transition shadow-sm border ${activeTab === tab.id ? 'bg-red-900 text-yellow-500 border-red-900 scale-105 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
          >
            <tab.icon size={28} className="mb-2" />
            <span className="text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Konten Materi */}
      {activeTab === 'materi' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-red-900 border-b-2 border-yellow-500 pb-2 inline-block">Materi Semester Ini</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {MATERI_LIST.map(m => (
              <div key={m.id} className="bg-white p-6 rounded-2xl shadow-sm border-l-8 border-yellow-500 hover:shadow-md transition">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{m.title}</h3>
                <p className="text-gray-600">{m.desc}</p>
                <button className="mt-4 flex items-center text-red-700 font-semibold text-sm hover:text-red-900 transition">
                  Pelajari Lebih Lanjut <ChevronRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ensiklopedia */}
      {activeTab === 'ensiklopedia' && (
        <div className="space-y-6">
          <div className="bg-black p-6 rounded-2xl border border-yellow-500 shadow-xl text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#F59E0B 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
            <h2 className="text-2xl font-black text-yellow-500 relative z-10 uppercase tracking-widest">Ensiklopedia Ukiran Minangkabau</h2>
            <p className="text-yellow-100/80 relative z-10 mt-2">Mengenal ragam hias dan filosofi luhur masyarakat Minangkabau</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {UKIRAN_MINANG.map((u, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition">
                <div className="bg-red-900 text-yellow-500 p-4 font-bold text-lg">{u.name}</div>
                <div className="p-4 space-y-3">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase">Makna</span>
                    <p className="text-gray-800 font-medium">{u.makna}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                    <span className="text-xs font-bold text-yellow-700 uppercase">Filosofi</span>
                    <p className="text-yellow-900 italic">"{u.filosofi}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tugas & Kuis */}
      {activeTab === 'kuis' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 md:p-8">
          <div className="flex justify-between items-center mb-8 border-b-2 border-red-900 pb-4">
            <h2 className="text-2xl font-black text-gray-900">Ulangan Harian & Refleksi</h2>
            {quizSubmitted && (
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-bold shadow-sm border border-green-200">
                Nilai Anda: {quizScore} / 100
              </div>
            )}
          </div>

          <div className="space-y-8">
            {SOAL_KUIS.map((q, idx) => (
              <div key={q.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="font-bold text-lg text-gray-800 mb-4">{idx + 1}. {q.q}</p>
                <div className="space-y-3">
                  {q.options.map((opt, oIdx) => (
                    <label key={oIdx} className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${quizAnswers[q.id] === oIdx ? 'bg-red-50 border-red-500 text-red-900' : 'bg-white border-gray-200 hover:bg-gray-100'}`}>
                      <input 
                        type="radio" 
                        name={`q-${q.id}`} 
                        disabled={quizSubmitted}
                        checked={quizAnswers[q.id] === oIdx}
                        onChange={() => setQuizAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                        className="mr-3 w-4 h-4 text-red-600 focus:ring-red-500"
                      />
                      <span className="font-medium">{opt}</span>
                    </label>
                  ))}
                </div>
                {quizSubmitted && (
                  <div className="mt-3 text-sm font-bold">
                    {quizAnswers[q.id] === q.ans ? 
                      <span className="text-green-600 flex items-center gap-1"><CheckCircle size={16}/> Jawaban Benar (+2 Poin Sikap)</span> : 
                      <span className="text-red-600 flex items-center gap-1"><AlertTriangle size={16}/> Jawaban Salah. Kunci: {q.options[q.ans]} (+1 Poin Sikap)</span>
                    }
                  </div>
                )}
              </div>
            ))}

            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <h3 className="font-bold text-yellow-900 mb-2">Soal Refleksi / Essay</h3>
              <p className="text-sm text-yellow-800 mb-4">Tuliskan pemahaman Anda tentang pentingnya menjaga adat Minangkabau di era modern. (Peringatan: Menggunakan kata tidak senonoh akan mengurangi nilai sikap -2 poin).</p>
              <textarea 
                rows="4" 
                disabled={quizSubmitted}
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Ketik jawaban Anda di sini..."
                className="w-full p-3 border border-yellow-300 rounded-lg focus:outline-none focus:border-red-900 disabled:bg-gray-100"
              ></textarea>
            </div>

            {!quizSubmitted && (
              <button 
                onClick={handleSubmitQuiz}
                className="w-full bg-red-900 hover:bg-red-800 text-yellow-500 font-black py-4 rounded-xl shadow-lg transition text-lg"
              >
                KUMPULKAN TUGAS
              </button>
            )}
          </div>
        </div>
      )}

      {/* Rapor */}
      {activeTab === 'rapor' && (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-black text-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#F59E0B 1.5px, transparent 1.5px)', backgroundSize: '20px 20px' }}></div>
            <h2 className="text-3xl font-black text-yellow-500 relative z-10">RAPOR SEMENTARA</h2>
            <p className="text-gray-300 mt-2 font-medium relative z-10">{student.name} - Kelas XI F1</p>
          </div>
          
          <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="font-bold text-lg border-b pb-2 text-gray-700">Komponen Penilaian</h3>
              
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                  <p className="font-bold text-gray-800">Kehadiran (25%)</p>
                  <p className="text-sm text-gray-500">{student.kehadiran.H} dari 24 Pertemuan</p>
                </div>
                <div className="text-2xl font-black text-blue-600">
                  {Math.round(((student.kehadiran.H || 0) / 24) * 100)}
                </div>
              </div>

              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                  <p className="font-bold text-gray-800">Buku Catatan (25%)</p>
                  <p className="text-sm text-gray-500">Sub Total SA, RT, PB, NS</p>
                </div>
                <div className="text-2xl font-black text-purple-600">
                  {student.nilai.catatan}
                </div>
              </div>

              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div>
                  <p className="font-bold text-gray-800">Ulangan BAB (35%)</p>
                  <p className="text-sm text-gray-500">Rata-rata Tes</p>
                </div>
                <div className="text-2xl font-black text-orange-600">
                  {student.nilai.ulangan}
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div>
                  <p className="font-bold text-yellow-900">Nilai Sikap (15%)</p>
                  <p className="text-sm text-yellow-700">Akumulasi Poin Keaktifan & Kesopanan</p>
                </div>
                <div className="text-2xl font-black text-yellow-600">
                  {student.nilai.sikap}
                </div>
              </div>

            </div>

            <div className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-4 border-gray-100 p-8">
              <h3 className="font-bold text-gray-500 uppercase tracking-widest mb-4">NILAI AKHIR</h3>
              <div className={`text-7xl font-black ${student.raport >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                {student.raport}
              </div>
              <p className="mt-6 text-center font-medium text-gray-600">
                Status: {student.raport >= 75 ? <span className="text-green-600 font-bold">LULUS (TUNTAS)</span> : <span className="text-red-600 font-bold">BELUM TUNTAS</span>}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}