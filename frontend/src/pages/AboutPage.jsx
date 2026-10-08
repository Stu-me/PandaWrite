import { Link } from 'react-router-dom'
import pandaHero from '../assets/images.jpg'
import Icon from '../components/Icon'

const features = [
  { icon: 'folder', title: 'Focused workspaces', text: 'Keep pages, notes, and ideas grouped in clear personal workspaces.' },
  { icon: 'image', title: 'Image embeds', text: 'Paste an image link and see the visual directly beside your writing.' },
  { icon: 'mic', title: 'Voice notes', text: 'Record short audio notes without leaving the page you are working on.' },
  { icon: 'video', title: 'YouTube embeds', text: 'Bring useful tutorials, talks, and inspiration into your notes.' },
]

// Displays a product-story page that explains the real Pandawrite features available to users.
function AboutPage() {
  return <main className="min-h-screen overflow-hidden bg-[#0b1110] text-white">
    <section className="relative isolate min-h-[700px] overflow-hidden border-b border-white/10">
      <img src={pandaHero} alt="Kung Fu Panda inspired Pandawrite hero" className="absolute inset-0 -z-20 h-full w-full object-cover object-center opacity-35" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(5,10,9,.98)_0%,rgba(5,10,9,.78)_46%,rgba(5,10,9,.42)_100%)]" />
      <div className="absolute -left-32 top-40 -z-10 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
      <div className="mx-auto flex min-h-[700px] max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-5"><Link to="/about" className="flex items-center gap-3 font-bold"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-lg text-emerald-950">P</span><span className="text-lg tracking-tight">Pandawrite</span></Link><div className="flex items-center gap-3"><Link to="/dashboard" className="hidden text-sm font-semibold text-white/75 hover:text-white sm:block">Dashboard</Link><Link to="/login" className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:border-emerald-300 hover:bg-emerald-400 hover:text-emerald-950">Log in</Link></div></header>
        <div className="flex flex-1 items-center py-20"><div className="max-w-3xl"><p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[.2em] text-emerald-200"><span className="h-2 w-2 rounded-full bg-emerald-300" />A calmer way to create</p><h1 className="mt-7 text-5xl font-black leading-[.95] tracking-[-.045em] sm:text-7xl lg:text-8xl">Make space for<br /><span className="text-emerald-300">every idea.</span></h1><p className="mt-7 max-w-xl text-lg leading-8 text-white/75">Pandawrite is a focused workspace for your pages, images, voice notes, videos, and the thoughts worth returning to.</p><div className="mt-9 flex flex-wrap gap-3"><Link to="/register" className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-5 py-3 font-bold text-emerald-950 hover:-translate-y-0.5 hover:bg-emerald-300">Start writing <span aria-hidden="true">→</span></Link><Link to="/dashboard" className="rounded-lg border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/10">Open dashboard</Link></div></div></div>
        <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-center sm:max-w-xl"><div><p className="text-2xl font-black text-emerald-300">3</p><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/50">Workspaces free</p></div><div><p className="text-2xl font-black text-emerald-300">5</p><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/50">Pages each</p></div><div><p className="text-2xl font-black text-emerald-300">20</p><p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/50">Blocks per page</p></div></div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12 lg:py-28"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-bold uppercase tracking-[.22em] text-emerald-300">Built for your flow</p><h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">More than a blank page.</h2><p className="mt-5 text-base leading-7 text-white/60">Use simple blocks to capture information in the format that fits it best, without breaking your focus.</p></div><div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{features.map((feature) => <article key={feature.title} className="rounded-xl border border-white/10 bg-white/[.04] p-6 transition hover:-translate-y-1 hover:border-emerald-300/50 hover:bg-white/[.07]"><span className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-400/15 text-emerald-300"><Icon name={feature.icon} /></span><h3 className="mt-6 text-lg font-bold">{feature.title}</h3><p className="mt-3 text-sm leading-6 text-white/60">{feature.text}</p></article>)}</div></section>
    <section className="border-y border-white/10 bg-white/[.03]"><div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 md:grid-cols-2 lg:px-12"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-emerald-300">Simple by design</p><h2 className="mt-4 text-3xl font-black">Your work stays in your hands.</h2></div><div className="space-y-4 text-sm leading-7 text-white/65"><p>Create and organize pages, move blocks by dragging them, and return to a quiet dashboard built around your work—not distractions.</p><p>Start on the free plan. When your work grows, subscriptions give you room to keep building.</p></div></div></section>
    <footer className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-10 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><p><span className="font-semibold text-emerald-300">Pandawrite</span> · Make room for the ideas that move you.</p><div className="flex gap-5"><Link to="/about" className="hover:text-white">About</Link><Link to="/login" className="hover:text-white">Log in</Link><Link to="/register" className="hover:text-white">Create account</Link></div></footer>
  </main>
}

export default AboutPage
