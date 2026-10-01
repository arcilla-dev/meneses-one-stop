import { Calendar, Clock } from 'lucide-react';

const MainCenter = () => {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 flex flex-col xl:flex-row gap-6 bg-[#fcdced]">
      {/* Banner Section */}
      <div className="flex-1 h-[220px] rounded-xl relative overflow-hidden shadow-xl flex flex-col items-center justify-center border-2 border-[#543b59]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=1200")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent mix-blend-multiply" />

        <div className="relative z-10 text-white text-center w-full px-6 flex flex-col gap-2 drop-shadow-lg">
          <p className="text-sm md:text-base font-bold tracking-[0.2em] uppercase text-gray-200">
            Everything you need, in one place.
          </p>

          <h1 className="text-3xl md:text-5xl font-black tracking-wide text-white mt-1">
            GOOD MORNING,{' '}
            <span
              className="font-normal capitalize ml-1 text-pink-100"
              style={{ fontFamily: "'Brush Script MT', 'Dancing Script', cursive", fontSize: '1.2em' }}
            >
              Juan!
            </span>
          </h1>

          <p className="text-xs md:text-sm font-bold tracking-[0.15em] uppercase text-gray-300 mt-2">
            Welcome back to your dashboard
          </p>
        </div>
      </div>

      {/* Right Side Widgets (Date & Time) */}
      <div className="flex flex-col gap-4 w-full xl:w-[320px] shrink-0">
        <div className="bg-[#785b82] rounded-xl flex items-center p-4 shadow-lg border-2 border-[#624a6a]">
          <div className="bg-white/20 p-3 rounded-lg shrink-0">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col ml-6 text-right flex-1">
            <span className="text-white font-black text-[15px] tracking-widest drop-shadow-sm">TODAY'S DATE</span>
            <span className="text-white font-medium text-lg tracking-[0.15em] mt-1 drop-shadow-sm">
              202_ - __ - __
            </span>
          </div>
        </div>

        <div className="bg-[#785b82] rounded-xl flex items-center p-4 shadow-lg border-2 border-[#624a6a]">
          <div className="bg-white/20 p-3 rounded-lg shrink-0">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col ml-6 text-right flex-1">
            <span className="text-white font-black text-[15px] tracking-widest drop-shadow-sm">CURRENT TIME</span>
            <span className="text-white font-medium text-lg tracking-[0.1em] mt-1 drop-shadow-sm">
              __ : __ : __ AM
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainCenter;