import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-minang-hitam text-white flex flex-col items-center justify-center p-4">
      <div className="bg-minang-merah p-8 rounded-lg shadow-xl border-4 border-minang-emas max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-2 text-minang-emas">PORTAL MULOK</h1>
        <h2 className="text-xl mb-6">Keminangkabauan</h2>
        <p className="mb-8">SMAN 1 Payung Sekaki</p>
        
        <div className="flex flex-col gap-4">
          <Link href="/api/auth/signin" className="bg-minang-emas text-minang-hitam px-6 py-3 rounded font-bold hover:bg-yellow-500 transition">
            Login ke Portal
          </Link>
        </div>
      </div>
    </main>
  )
}